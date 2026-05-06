// api/src/server.js

const express = require("express");
const cors = require("cors");

// db.js is in the same folder (api/src/db.js)
const db = require("./db");

const app = express();

// -------------------------------------------------------
// Middleware
// -------------------------------------------------------
app.use(cors());
app.use(express.json());

const CATEGORY_TYPES = ["INCOME", "EXPENSE"];
const TRANSACTION_TYPES = ["INCOME", "EXPENSE", "TRANSFER", "WITHDRAW"];
const TARGET_TYPES = ["SAVINGS", "TRAVEL", "INVESTMENT", "OTHER"];

const normalizeCategoryType = (type) => String(type || "").trim().toUpperCase();

const normalizeCategoryName = (name) => String(name || "").trim();

const getOwnerEmail = (req) =>
  String(req.get("x-user-email") || "demo@local").trim().toLowerCase();

const addOwnerColumn = async (tableName) => {
  try {
    await db.query(`
      ALTER TABLE ${tableName}
      ADD COLUMN owner_email VARCHAR(255) NULL
    `);
  } catch (err) {
    if (err.code !== "ER_DUP_FIELDNAME") {
      console.error(`Could not add owner_email to ${tableName}:`, err);
    }
  }
};

const ensureAccountScoping = async () => {
  await addOwnerColumn("transactions");
  await addOwnerColumn("categories");
  await addOwnerColumn("financial_targets");
  await addOwnerColumn("monthly_budgets");

  try {
    await db.query("ALTER TABLE categories DROP INDEX unique_category_type_name");
  } catch (err) {
    if (err.code !== "ER_CANT_DROP_FIELD_OR_KEY") {
      console.error("Could not drop old category unique index:", err);
    }
  }

  try {
    await db.query(
      "ALTER TABLE categories ADD UNIQUE KEY unique_owner_category_type_name (owner_email, type, name)"
    );
  } catch (err) {
    if (err.code !== "ER_DUP_KEYNAME") {
      console.error("Could not add owner category unique index:", err);
    }
  }

  try {
    await db.query("ALTER TABLE monthly_budgets DROP INDEX month_key");
  } catch (err) {
    if (err.code !== "ER_CANT_DROP_FIELD_OR_KEY") {
      console.error("Could not drop old monthly budget unique index:", err);
    }
  }

  try {
    await db.query(
      "ALTER TABLE monthly_budgets ADD UNIQUE KEY unique_owner_month_budget (owner_email, month_key)"
    );
  } catch (err) {
    if (err.code !== "ER_DUP_KEYNAME") {
      console.error("Could not add owner month budget unique index:", err);
    }
  }
};

const claimUnownedData = async (ownerEmail) => {
  if (!ownerEmail || ownerEmail === "demo@local") return;

  await db.query(
    "UPDATE financial_targets SET owner_email = ? WHERE owner_email IS NULL",
    [ownerEmail]
  );
  await db.query(
    "UPDATE monthly_budgets SET owner_email = ? WHERE owner_email IS NULL",
    [ownerEmail]
  );
  await db.query(
    "UPDATE transactions SET owner_email = ? WHERE owner_email IS NULL",
    [ownerEmail]
  );

  await db.query(
    `
      INSERT IGNORE INTO categories (owner_email, type, name)
      SELECT DISTINCT ?, type, category
      FROM transactions
      WHERE owner_email = ?
        AND type IN ('INCOME', 'EXPENSE')
        AND category IS NOT NULL
        AND TRIM(category) <> ''
        AND CHAR_LENGTH(TRIM(category)) >= 4
    `,
    [ownerEmail, ownerEmail]
  );
};

const getTodayISO = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const isValidDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const ensureCategoriesTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type ENUM('INCOME', 'EXPENSE') NOT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_category_type_name (type, name)
    )
  `);
};

const ensureFinancialTargetsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS financial_targets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type ENUM('SAVINGS', 'TRAVEL', 'INVESTMENT', 'OTHER') NOT NULL,
      name VARCHAR(100) NOT NULL,
      target_amount DECIMAL(10, 2) NOT NULL,
      expected_date DATE NOT NULL,
      status ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await db.query(`
      ALTER TABLE financial_targets
      ADD COLUMN status ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE'
    `);
  } catch (err) {
    if (err.code !== "ER_DUP_FIELDNAME") {
      console.error("Could not add target status column:", err);
    }
  }
};

const ensureTransactionTargetSupport = async () => {
  try {
    await db.query(`
      ALTER TABLE transactions
      MODIFY type ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'WITHDRAW') NOT NULL
    `);
  } catch (err) {
    console.error("Could not update transaction type enum:", err);
  }

  try {
    await db.query("ALTER TABLE transactions ADD COLUMN target_id INT NULL");
  } catch (err) {
    if (err.code !== "ER_DUP_FIELDNAME") {
      console.error("Could not add transaction target_id column:", err);
    }
  }
};

const ensureMonthlyBudgetsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS monthly_budgets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      month_key CHAR(7) NOT NULL UNIQUE,
      amount DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

const isValidMonthKey = (value) => /^\d{4}-\d{2}$/.test(value);

const getCurrentMonthKey = () => getTodayISO().slice(0, 7);

const migrateCategoriesFromTransactions = async () => {
  const [rows] = await db.query(`
    SELECT DISTINCT type, category
    FROM transactions
    WHERE type IN ('INCOME', 'EXPENSE')
      AND category IS NOT NULL
      AND TRIM(category) <> ''
  `);

  for (const row of rows) {
    const type = normalizeCategoryType(row.type);
    const name = normalizeCategoryName(row.category);

    if (!CATEGORY_TYPES.includes(type) || name.length < 4) {
      continue;
    }

    await db.query(
      "INSERT IGNORE INTO categories (type, name) VALUES (?, ?)",
      [type, name]
    );
  }
};

const syncTransactionsToManagedCategories = async () => {
  const [rows] = await db.query("SELECT type, name FROM categories");

  for (const row of rows) {
    await db.query(
      `
        UPDATE transactions
        SET category = ?
        WHERE type = ?
          AND LOWER(category) = LOWER(?)
          AND BINARY category <> ?
      `,
      [row.name, row.type, row.name, row.name]
    );
  }
};

// -------------------------------------------------------
// Health check
// -------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", async (req, res, next) => {
  try {
    if (String(req.get("x-claim-legacy") || "").toLowerCase() === "true") {
      await claimUnownedData(getOwnerEmail(req));
    }
    next();
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------
// Category endpoints
// -------------------------------------------------------

app.get("/api/categories", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  const search = String(req.query.search || "").trim();
  const returnAll = String(req.query.all || "").toLowerCase() === "true";
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  const sortBy = ["type", "name"].includes(req.query.sortBy)
    ? req.query.sortBy
    : "type";
  const sortDir =
    String(req.query.sortDir || "asc").toLowerCase() === "desc"
      ? "DESC"
      : "ASC";

  const whereParts = ["owner_email = ?"];
  const params = [ownerEmail];

  if (search) {
    whereParts.push("(LOWER(type) LIKE ? OR LOWER(name) LIKE ?)");
    params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

  try {
    if (returnAll) {
      const [rows] = await db.query(
        `SELECT id, type, name
         FROM categories
         ${whereSql}
         ORDER BY type ASC, name ASC`,
        params
      );

      return res.json({
        data: rows,
        page: 1,
        pageSize: rows.length,
        total: rows.length,
        totalPages: 1,
      });
    }

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM categories ${whereSql}`,
      params
    );
    const total = countRows[0].total || 0;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    const [rows] = await db.query(
      `SELECT id, type, name
       FROM categories
       ${whereSql}
       ORDER BY ${sortBy} ${sortDir}, name ASC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      data: rows,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Database category query failed" });
  }
});

app.post("/api/categories", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  const type = normalizeCategoryType(req.body.type);
  const name = normalizeCategoryName(req.body.name);

  if (!CATEGORY_TYPES.includes(type)) {
    return res.status(400).json({ error: "Category type is required" });
  }

  if (name.length < 4) {
    return res
      .status(400)
      .json({ error: "Category name must be at least 4 letters" });
  }

  try {
    const [existingRows] = await db.query(
      "SELECT id FROM categories WHERE owner_email = ? AND type = ? AND LOWER(name) = LOWER(?)",
      [ownerEmail, type, name]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        error: "This category already exists for the selected type",
      });
    }

    const [result] = await db.query(
      "INSERT INTO categories (owner_email, type, name) VALUES (?, ?, ?)",
      [ownerEmail, type, name]
    );

    res.status(201).json({
      id: result.insertId,
      type,
      name,
    });
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ error: "Database category insert failed" });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid category id" });
  }

  try {
    const [categoryRows] = await db.query(
      "SELECT id, type, name FROM categories WHERE id = ? AND owner_email = ?",
      [id, ownerEmail]
    );

    if (categoryRows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    const category = categoryRows[0];
    const [transactionRows] = await db.query(
      "SELECT COUNT(*) AS total FROM transactions WHERE owner_email = ? AND type = ? AND LOWER(category) = LOWER(?)",
      [ownerEmail, category.type, category.name]
    );

    if ((transactionRows[0].total || 0) > 0) {
      return res.status(409).json({
        error:
          "Category cannot be deleted because related transactions already exist",
      });
    }

    await db.query("DELETE FROM categories WHERE id = ? AND owner_email = ?", [
      id,
      ownerEmail,
    ]);
    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ error: "Database category delete failed" });
  }
});

// -------------------------------------------------------
// Financial target endpoints
// -------------------------------------------------------

app.get("/api/targets", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  try {
    const [rows] = await db.query(`
      SELECT
        ft.id,
        ft.type,
        ft.name,
        ft.target_amount AS targetAmount,
        ft.expected_date AS expectedDate,
        ft.status,
        COALESCE(SUM(
          CASE
            WHEN t.type = 'TRANSFER' THEN t.amount
            WHEN t.type = 'WITHDRAW' THEN -t.amount
            ELSE 0
          END
        ), 0) AS currentAmount
      FROM financial_targets ft
      LEFT JOIN transactions t ON t.target_id = ft.id AND t.owner_email = ft.owner_email
      WHERE ft.owner_email = ?
      GROUP BY ft.id, ft.type, ft.name, ft.target_amount, ft.expected_date, ft.status
      ORDER BY CASE WHEN ft.status = 'ACTIVE' THEN 0 ELSE 1 END,
               ft.expected_date ASC,
               ft.name ASC
    `, [ownerEmail]);

    res.json(rows);
  } catch (err) {
    console.error("Error fetching targets:", err);
    res.status(500).json({ error: "Database target query failed" });
  }
});

app.post("/api/targets", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  const type = String(req.body.type || "").trim().toUpperCase();
  const name = String(req.body.name || "").trim();
  const targetAmount = Number(req.body.targetAmount);
  const expectedDate = String(req.body.expectedDate || "").trim();

  if (!TARGET_TYPES.includes(type)) {
    return res.status(400).json({ error: "Target type is required" });
  }

  if (name.length < 4) {
    return res
      .status(400)
      .json({ error: "Target name must be at least 4 letters" });
  }

  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    return res
      .status(400)
      .json({ error: "Target amount must be greater than zero" });
  }

  if (!expectedDate) {
    return res.status(400).json({ error: "Expected date is required" });
  }

  if (!isValidDateString(expectedDate)) {
    return res.status(400).json({ error: "Expected date is invalid" });
  }

  if (expectedDate < getTodayISO()) {
    return res
      .status(400)
      .json({ error: "Expected date cannot be before today" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO financial_targets (owner_email, type, name, target_amount, expected_date) VALUES (?, ?, ?, ?, ?)",
      [ownerEmail, type, name, targetAmount, expectedDate]
    );

    res.status(201).json({
      id: result.insertId,
      type,
      name,
      targetAmount,
      expectedDate,
      status: "ACTIVE",
      currentAmount: 0,
    });
  } catch (err) {
    console.error("Error creating target:", err);
    res.status(500).json({ error: "Database target insert failed" });
  }
});

app.put("/api/targets/:id", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  const id = parseInt(req.params.id, 10);
  const targetAmount = Number(req.body.targetAmount);
  const expectedDate = String(req.body.expectedDate || "").trim();

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid target id" });
  }

  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    return res
      .status(400)
      .json({ error: "Target amount must be greater than zero" });
  }

  if (!isValidDateString(expectedDate)) {
    return res.status(400).json({ error: "Expected date is invalid" });
  }

  if (expectedDate < getTodayISO()) {
    return res
      .status(400)
      .json({ error: "Expected date cannot be before today" });
  }

  try {
    const [targetRows] = await db.query(
      `
        SELECT
          ft.id,
          COALESCE(SUM(
            CASE
              WHEN t.type = 'TRANSFER' THEN t.amount
              WHEN t.type = 'WITHDRAW' THEN -t.amount
              ELSE 0
            END
          ), 0) AS currentAmount
        FROM financial_targets ft
        LEFT JOIN transactions t ON t.target_id = ft.id AND t.owner_email = ft.owner_email
        WHERE ft.id = ? AND ft.owner_email = ?
        GROUP BY ft.id
      `,
      [id, ownerEmail]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ error: "Target not found" });
    }

    const currentAmount = Number(targetRows[0].currentAmount || 0);
    if (targetAmount < currentAmount) {
      return res.status(400).json({
        error: "Target amount cannot be less than the amount already collected",
      });
    }

    await db.query(
      "UPDATE financial_targets SET target_amount = ?, expected_date = ? WHERE id = ? AND owner_email = ?",
      [targetAmount, expectedDate, id, ownerEmail]
    );

    res.json({ message: "Target updated" });
  } catch (err) {
    console.error("Error updating target:", err);
    res.status(500).json({ error: "Database target update failed" });
  }
});

app.post("/api/targets/:id/disable", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid target id" });
  }

  try {
    const [targetRows] = await db.query(
      `
        SELECT
          ft.id,
          COALESCE(SUM(
            CASE
              WHEN t.type = 'TRANSFER' THEN t.amount
              WHEN t.type = 'WITHDRAW' THEN -t.amount
              ELSE 0
            END
          ), 0) AS currentAmount
        FROM financial_targets ft
        LEFT JOIN transactions t ON t.target_id = ft.id AND t.owner_email = ft.owner_email
        WHERE ft.id = ? AND ft.owner_email = ?
        GROUP BY ft.id
      `,
      [id, ownerEmail]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ error: "Target not found" });
    }

    if (Number(targetRows[0].currentAmount || 0) > 0) {
      return res.status(409).json({
        error: "Target cannot be disabled because it has collected amount",
      });
    }

    await db.query(
      "UPDATE financial_targets SET status = 'DISABLED' WHERE id = ? AND owner_email = ?",
      [id, ownerEmail]
    );

    res.json({ message: "Target disabled" });
  } catch (err) {
    console.error("Error disabling target:", err);
    res.status(500).json({ error: "Database target disable failed" });
  }
});

app.post("/api/targets/:id/enable", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  const id = parseInt(req.params.id, 10);
  const targetAmount = Number(req.body.targetAmount);
  const expectedDate = String(req.body.expectedDate || "").trim();

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid target id" });
  }

  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    return res
      .status(400)
      .json({ error: "Target amount must be greater than zero" });
  }

  if (!isValidDateString(expectedDate)) {
    return res.status(400).json({ error: "Expected date is invalid" });
  }

  if (expectedDate <= getTodayISO()) {
    return res
      .status(400)
      .json({ error: "Expected date must be in the future" });
  }

  try {
    const [result] = await db.query(
      `
        UPDATE financial_targets
        SET status = 'ACTIVE', target_amount = ?, expected_date = ?
        WHERE id = ? AND owner_email = ?
      `,
      [targetAmount, expectedDate, id, ownerEmail]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Target not found" });
    }

    res.json({ message: "Target enabled" });
  } catch (err) {
    console.error("Error enabling target:", err);
    res.status(500).json({ error: "Database target enable failed" });
  }
});

// -------------------------------------------------------
// Monthly budget endpoints
// -------------------------------------------------------

app.get("/api/budgets", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        month_key AS monthKey,
        amount,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM monthly_budgets
      WHERE owner_email = ?
      ORDER BY month_key DESC
    `, [ownerEmail]);

    res.json(rows);
  } catch (err) {
    console.error("Error fetching budgets:", err);
    res.status(500).json({ error: "Database budget query failed" });
  }
});

app.post("/api/budgets", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  const monthKey = String(req.body.monthKey || "").trim();
  const amount = Number(req.body.amount);

  if (!isValidMonthKey(monthKey)) {
    return res.status(400).json({ error: "Month is required" });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Budget amount must be positive" });
  }

  try {
    const [existingRows] = await db.query(
      "SELECT id FROM monthly_budgets WHERE owner_email = ? AND month_key = ?",
      [ownerEmail, monthKey]
    );

    if (existingRows.length > 0) {
      return res
        .status(409)
        .json({ error: "A budget already exists for this month" });
    }

    const [result] = await db.query(
      "INSERT INTO monthly_budgets (owner_email, month_key, amount) VALUES (?, ?, ?)",
      [ownerEmail, monthKey, amount]
    );

    res.status(201).json({
      id: result.insertId,
      monthKey,
      amount,
    });
  } catch (err) {
    console.error("Error creating budget:", err);
    res.status(500).json({ error: "Database budget insert failed" });
  }
});

app.put("/api/budgets/:id", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  const id = parseInt(req.params.id, 10);
  const amount = Number(req.body.amount);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid budget id" });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Budget amount must be positive" });
  }

  try {
    const [budgetRows] = await db.query(
      "SELECT id, month_key AS monthKey FROM monthly_budgets WHERE id = ? AND owner_email = ?",
      [id, ownerEmail]
    );

    if (budgetRows.length === 0) {
      return res.status(404).json({ error: "Budget not found" });
    }

    if (budgetRows[0].monthKey < getCurrentMonthKey()) {
      return res
        .status(409)
        .json({ error: "Past budgets cannot be edited" });
    }

    await db.query("UPDATE monthly_budgets SET amount = ? WHERE id = ? AND owner_email = ?", [
      amount,
      id,
      ownerEmail,
    ]);

    res.json({ message: "Budget updated" });
  } catch (err) {
    console.error("Error updating budget:", err);
    res.status(500).json({ error: "Database budget update failed" });
  }
});

// -------------------------------------------------------
// Transaction endpoints
// -------------------------------------------------------

// Get all transactions
app.get("/api/transactions", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  try {
    const [rows] = await db.query(
      "SELECT * FROM transactions WHERE owner_email = ? ORDER BY date DESC",
      [ownerEmail]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Get a single transaction by ID
app.get("/api/transactions/:id", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  const id = parseInt(req.params.id, 10);

  try {
    const [rows] = await db.query("SELECT * FROM transactions WHERE id = ? AND owner_email = ?", [
      id,
      ownerEmail,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching transaction by ID:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Create a single transaction
app.post("/api/transactions", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  const { date, category, amount, description } = req.body;
  const type = String(req.body.type || "").trim().toUpperCase();
  const targetId = req.body.targetId || req.body.target_id || null;

  if (!date || !type || !amount) {
    return res
      .status(400)
      .json({ error: "date, type and amount are required" });
  }

  if (!TRANSACTION_TYPES.includes(type)) {
    return res.status(400).json({
      error: "type must be INCOME, EXPENSE, TRANSFER or WITHDRAW",
    });
  }

  if ((type === "INCOME" || type === "EXPENSE") && !category) {
    return res.status(400).json({ error: "category is required" });
  }

  if ((type === "TRANSFER" || type === "WITHDRAW") && !targetId) {
    return res.status(400).json({ error: "target is required" });
  }

  try {
    let finalCategory = category;
    let finalTargetId = targetId;

    if (type === "TRANSFER" || type === "WITHDRAW") {
      const [targetRows] = await db.query(
        "SELECT id, name, status FROM financial_targets WHERE id = ? AND owner_email = ?",
        [targetId, ownerEmail]
      );

      if (targetRows.length === 0) {
        return res.status(404).json({ error: "Target not found" });
      }

      if (targetRows[0].status !== "ACTIVE") {
        return res
          .status(409)
          .json({ error: "Disabled targets cannot be used for transactions" });
      }

      finalCategory = targetRows[0].name;
      finalTargetId = targetRows[0].id;
    }

    const [result] = await db.query(
      "INSERT INTO transactions (owner_email, date, type, category, amount, description, target_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [ownerEmail, date, type, finalCategory, amount, description || "", finalTargetId]
    );

    const newTransaction = {
      id: result.insertId,
      date,
      type,
      category: finalCategory,
      amount,
      description: description || "",
      target_id: finalTargetId,
    };

    res.status(201).json(newTransaction);
  } catch (err) {
    console.error("Error inserting transaction:", err);
    res.status(500).json({ error: "Database insert failed" });
  }
});

// Bulk insert (CSV upload + recurring subscriptions)
app.post("/api/transactions/bulk", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  try {
    const rows = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Request body must be a non-empty array" });
    }

    const values = [];

    for (const t of rows) {
      const type = String(t.type || "").toUpperCase();
      const targetId = t.targetId || t.target_id || null;
      const amount = Number(t.amount);

      if (!t.date || !type || t.amount == null) {
        throw new Error(
          "Each transaction must include date, type and amount"
        );
      }

      if (!isValidDateString(t.date)) {
        throw new Error("Each transaction date must use yyyy-mm-dd format");
      }

      if (!TRANSACTION_TYPES.includes(type)) {
        throw new Error(
          "Each transaction type must be INCOME, EXPENSE, TRANSFER or WITHDRAW"
        );
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Each transaction amount must be a positive number");
      }

      if ((type === "INCOME" || type === "EXPENSE") && !t.category) {
        throw new Error("Each income or expense transaction must include category");
      }

      let finalCategory = t.category;
      let finalTargetId = targetId;

      if (type === "TRANSFER" || type === "WITHDRAW") {
        if (!targetId) {
          throw new Error("Each transfer or withdraw transaction must include target");
        }

        const [targetRows] = await db.query(
          "SELECT id, name, status FROM financial_targets WHERE id = ? AND owner_email = ?",
          [targetId, ownerEmail]
        );

        if (targetRows.length === 0) {
          throw new Error("Target not found");
        }

        if (targetRows[0].status !== "ACTIVE") {
          throw new Error("Disabled targets cannot be used for transactions");
        }

        finalCategory = targetRows[0].name;
        finalTargetId = targetRows[0].id;
      }

      values.push([
        ownerEmail,
        t.date,
        type,
        finalCategory,
        amount,
        t.description || "",
        finalTargetId,
      ]);
    }

    await db.query(
      "INSERT INTO transactions (owner_email, date, type, category, amount, description, target_id) VALUES ?",
      [values]
    );

    console.log(`Bulk insert: ${rows.length} rows added.`);
    res.status(201).json({ message: `Inserted ${rows.length} transactions.` });
  } catch (err) {
    console.error("Error during bulk insert:", err);
    res.status(400).json({ error: err.message || "Database bulk insert failed" });
  }
});

// Update transaction
app.put("/api/transactions/:id", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  const id = parseInt(req.params.id, 10);
  const { date, category, amount, description } = req.body;
  const type = String(req.body.type || "").trim().toUpperCase();
  const targetId = req.body.targetId || req.body.target_id || null;

  if (!date || !type || !amount) {
    return res
      .status(400)
      .json({ error: "date, type and amount are required" });
  }

  if (!TRANSACTION_TYPES.includes(type)) {
    return res.status(400).json({
      error: "type must be INCOME, EXPENSE, TRANSFER or WITHDRAW",
    });
  }

  if ((type === "INCOME" || type === "EXPENSE") && !category) {
    return res.status(400).json({ error: "category is required" });
  }

  if ((type === "TRANSFER" || type === "WITHDRAW") && !targetId) {
    return res.status(400).json({ error: "target is required" });
  }

  try {
    let finalCategory = category;
    let finalTargetId = null;

    if (type === "TRANSFER" || type === "WITHDRAW") {
      const [targetRows] = await db.query(
        "SELECT id, name, status FROM financial_targets WHERE id = ? AND owner_email = ?",
        [targetId, ownerEmail]
      );

      if (targetRows.length === 0) {
        return res.status(404).json({ error: "Target not found" });
      }

      if (targetRows[0].status !== "ACTIVE") {
        return res
          .status(409)
          .json({ error: "Disabled targets cannot be used for transactions" });
      }

      finalCategory = targetRows[0].name;
      finalTargetId = targetRows[0].id;
    }

    const [result] = await db.query(
      "UPDATE transactions SET date=?, type=?, category=?, amount=?, description=?, target_id=? WHERE id=? AND owner_email = ?",
      [date, type, finalCategory, amount, description || "", finalTargetId, id, ownerEmail]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ message: "Transaction updated" });
  } catch (err) {
    console.error("Error updating transaction:", err);
    res.status(500).json({ error: "Database update failed" });
  }
});

// Delete transaction
app.delete("/api/transactions/:id", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  const id = parseInt(req.params.id, 10);

  try {
    const [result] = await db.query("DELETE FROM transactions WHERE id = ? AND owner_email = ?", [
      id,
      ownerEmail,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted" });
  } catch (err) {
    console.error("Error deleting transaction:", err);
    res.status(500).json({ error: "Database delete failed" });
  }
});

// -------------------------------------------------------
// Summary endpoints
// -------------------------------------------------------

// Overview: totals and balance
app.get("/api/summary/overview", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  try {
    const [rows] = await db.query(`
      SELECT 
        SUM(CASE WHEN type='INCOME' THEN amount ELSE 0 END) AS totalIncome,
        SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END) AS totalExpenses,
        COUNT(CASE WHEN type='INCOME' THEN 1 END) AS incomeCount,
        COUNT(CASE WHEN type='EXPENSE' THEN 1 END) AS expenseCount
      FROM transactions
      WHERE owner_email = ?
    `, [ownerEmail]);

    const { totalIncome, totalExpenses, incomeCount, expenseCount } = rows[0];

    res.json({
      totalIncome: totalIncome || 0,
      totalExpenses: totalExpenses || 0,
      balance: (totalIncome || 0) - (totalExpenses || 0),
      incomeCount: incomeCount || 0,
      expenseCount: expenseCount || 0,
    });
  } catch (err) {
    console.error("Error generating overview summary:", err);
    res.status(500).json({ error: "Database summary failed" });
  }
});

// Summary grouped by category
app.get("/api/summary/by-category", async (req, res) => {
  const ownerEmail = getOwnerEmail(req);
  try {
    const [rows] = await db.query(`
      SELECT 
        category,
        SUM(CASE WHEN type='INCOME' THEN amount ELSE 0 END) AS totalIncome,
        SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END) AS totalExpenses
      FROM transactions
      WHERE owner_email = ?
      GROUP BY category
    `, [ownerEmail]);

    const result = rows.map((item) => ({
      ...item,
      net: item.totalIncome - item.totalExpenses,
    }));

    res.json(result);
  } catch (err) {
    console.error("Error generating summary by category:", err);
    res.status(500).json({ error: "Database summary by category failed" });
  }
});

// -------------------------------------------------------
// Start server
// -------------------------------------------------------
const PORT = 5000;

const bootstrapDatabase = async () => {
  await ensureCategoriesTable();
  await ensureFinancialTargetsTable();
  await ensureTransactionTargetSupport();
  await ensureMonthlyBudgetsTable();
  await ensureAccountScoping();
  await migrateCategoriesFromTransactions();
  await syncTransactionsToManagedCategories();
};

bootstrapDatabase().catch((err) => {
  console.error("Could not bootstrap database:", err);
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
