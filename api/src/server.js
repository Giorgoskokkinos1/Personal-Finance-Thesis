require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('../db'); // connects to MySQL

const app = express();

// -------------------- MIDDLEWARES --------------------
app.use(cors());
app.use(express.json());

// -------------------- HEALTH CHECK --------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// -------------------- TRANSACTIONS --------------------

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM transactions ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Get one transaction by ID
app.get('/api/transactions/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const [rows] = await db.query('SELECT * FROM transactions WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Create a new transaction
app.post('/api/transactions', async (req, res) => {
  const { date, type, category, amount, description } = req.body;

  if (!date || !type || !category || !amount) {
    return res.status(400).json({ error: 'date, type, category and amount are required' });
  }

  if (type !== 'EXPENSE' && type !== 'INCOME') {
    return res.status(400).json({ error: 'type must be EXPENSE or INCOME' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO transactions (date, type, category, amount, description) VALUES (?, ?, ?, ?, ?)',
      [date, type, category, amount, description || '']
    );

    const newTransaction = {
      id: result.insertId,
      date,
      type,
      category,
      amount,
      description: description || ''
    };

    res.status(201).json(newTransaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

// Update a transaction
app.put('/api/transactions/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { date, type, category, amount, description } = req.body;

  if (!date || !type || !category || !amount) {
    return res.status(400).json({ error: 'date, type, category and amount are required' });
  }

  try {
    const [result] = await db.query(
      'UPDATE transactions SET date=?, type=?, category=?, amount=?, description=? WHERE id=?',
      [date, type, category, amount, description || '', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

// Delete a transaction
app.delete('/api/transactions/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const [result] = await db.query('DELETE FROM transactions WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database delete failed' });
  }
});

// -------------------- SUMMARY ENDPOINTS --------------------

// Overview summary: totals and balance
app.get('/api/summary/overview', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        SUM(CASE WHEN type='INCOME' THEN amount ELSE 0 END) AS totalIncome,
        SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END) AS totalExpenses,
        COUNT(CASE WHEN type='INCOME' THEN 1 END) AS incomeCount,
        COUNT(CASE WHEN type='EXPENSE' THEN 1 END) AS expenseCount
      FROM transactions
    `);

    const { totalIncome, totalExpenses, incomeCount, expenseCount } = rows[0];
    res.json({
      totalIncome: totalIncome || 0,
      totalExpenses: totalExpenses || 0,
      balance: (totalIncome || 0) - (totalExpenses || 0),
      incomeCount: incomeCount || 0,
      expenseCount: expenseCount || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database summary failed' });
  }
});

// Summary by category
app.get('/api/summary/by-category', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        category,
        SUM(CASE WHEN type='INCOME' THEN amount ELSE 0 END) AS totalIncome,
        SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END) AS totalExpenses
      FROM transactions
      GROUP BY category
    `);

    const result = rows.map(item => ({
      ...item,
      net: item.totalIncome - item.totalExpenses
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database summary by category failed' });
  }
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ API server listening on port ${PORT}`);
});
