const TRANSACTION_TYPES = ["INCOME", "EXPENSE", "TRANSFER", "WITHDRAW"];

const HEADER_ALIASES = {
  date: ["date", "transactiondate", "transaction_date", "day"],
  type: ["type", "transactiontype", "transaction_type"],
  category: ["category", "categoryname", "category_name"],
  amount: ["amount", "value", "total"],
  description: ["description", "note", "notes", "memo"],
  targetId: ["targetid", "target_id"],
  target: ["target", "targetname", "target_name"],
};

const normalizeKey = (key) =>
  String(key || "")
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[^a-z0-9_]/g, "");

const normalizeText = (value) => String(value || "").trim();

const getByAlias = (row, field) => {
  const aliases = HEADER_ALIASES[field];
  const match = Object.entries(row).find(([key]) =>
    aliases.includes(normalizeKey(key))
  );
  return match ? match[1] : "";
};

export const normalizeTransactionType = (value) => {
  const clean = normalizeText(value).toUpperCase();
  if (clean === "WITHDRAWAL") return "WITHDRAW";
  return clean;
};

export const parseCsvAmount = (value) => {
  const raw = normalizeText(value);
  if (!raw) return NaN;

  const negative = /^\(.*\)$/.test(raw) || raw.startsWith("-");
  let clean = raw
    .replace(/[^\d,.-]/g, "")
    .replace(/^-/, "")
    .replace(/,/g, ",");

  const lastComma = clean.lastIndexOf(",");
  const lastDot = clean.lastIndexOf(".");

  if (lastComma > -1 && lastDot > -1) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    clean = clean
      .replace(new RegExp(`\\${thousandsSeparator}`, "g"), "")
      .replace(decimalSeparator, ".");
  } else if (lastComma > -1) {
    clean = clean.replace(/\./g, "").replace(",", ".");
  } else {
    const dotParts = clean.split(".");
    if (dotParts.length > 2) {
      const decimals = dotParts.pop();
      clean = `${dotParts.join("")}.${decimals}`;
    }
  }

  const amount = Number(clean);
  return negative ? -amount : amount;
};

export const parseCsvDate = (value) => {
  const raw = normalizeText(value);
  if (!raw) return "";

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const slashMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    const [, first, second, yearPart] = slashMatch;
    const year =
      yearPart.length === 2 ? `20${yearPart}` : yearPart.padStart(4, "0");
    const day = first.padStart(2, "0");
    const month = second.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
};

export const isValidISODate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

const buildLookup = (items, getName) =>
  new Map(
    items
      .map((item) => [normalizeText(getName(item)).toLowerCase(), item])
      .filter(([name]) => Boolean(name))
  );

export const buildCsvTransactions = ({ rows, categories = [], targets = [] }) => {
  const categoryLookup = new Set(
    categories.map((category) =>
      `${normalizeText(category.type).toUpperCase()}::${normalizeText(
        category.name
      ).toLowerCase()}`
    )
  );
  const activeTargets = targets.filter((target) => target.status !== "DISABLED");
  const targetByName = buildLookup(activeTargets, (target) => target.name);
  const targetById = new Map(activeTargets.map((target) => [String(target.id), target]));

  const parsedRows = [];
  const errors = [];
  const warnings = [];

  rows.forEach((row, index) => {
    const line = index + 2;
    const date = parseCsvDate(getByAlias(row, "date"));
    const type = normalizeTransactionType(getByAlias(row, "type"));
    const category = normalizeText(getByAlias(row, "category"));
    const description = normalizeText(getByAlias(row, "description"));
    const amount = parseCsvAmount(getByAlias(row, "amount"));

    if (!date || !isValidISODate(date)) {
      errors.push({ line, message: "Invalid or missing date." });
    }

    if (!TRANSACTION_TYPES.includes(type)) {
      errors.push({
        line,
        message: "Type must be INCOME, EXPENSE, TRANSFER, or WITHDRAW.",
      });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push({ line, message: "Amount must be a positive number." });
    }

    const parsed = {
      date,
      type,
      category,
      amount: Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0,
      description,
      targetId: null,
    };

    if (type === "INCOME" || type === "EXPENSE") {
      if (!category) {
        errors.push({ line, message: "Category is required." });
      } else if (!categoryLookup.has(`${type}::${category.toLowerCase()}`)) {
        warnings.push({
          line,
          message: `"${category}" is not in Categories yet; it will still be imported.`,
        });
      }
    }

    if (type === "TRANSFER" || type === "WITHDRAW") {
      const csvTargetId = normalizeText(getByAlias(row, "targetId"));
      const targetName = normalizeText(getByAlias(row, "target")) || category;
      const target = csvTargetId
        ? targetById.get(csvTargetId)
        : targetByName.get(targetName.toLowerCase());

      if (!target) {
        errors.push({
          line,
          message:
            "Transfer/withdraw rows must reference an active target by targetId, target, or category.",
        });
      } else {
        parsed.targetId = target.id;
        parsed.category = target.name;
      }
    }

    parsedRows.push({ line, transaction: parsed });
  });

  return {
    validRows: errors.length === 0 ? parsedRows.map((row) => row.transaction) : [],
    previewRows: parsedRows.slice(0, 8),
    errors,
    warnings,
    rowCount: rows.length,
  };
};
