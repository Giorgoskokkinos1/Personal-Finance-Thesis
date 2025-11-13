require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Temporary in-memory data (no database yet)
let transactions = [
  {
    id: 1,
    date: '2025-11-01',
    type: 'EXPENSE',
    category: 'Groceries',
    amount: 45.9,
    description: 'Supermarket'
  },
  {
    id: 2,
    date: '2025-11-03',
    type: 'INCOME',
    category: 'Salary',
    amount: 1200,
    description: 'Monthly salary'
  }
];

let nextTransactionId = 3;

// Health check endpoint (for testing)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Get all transactions
app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

// Create a new transaction
app.post('/api/transactions', (req, res) => {
  const { date, type, category, amount, description } = req.body;

  // Basic validation
  if (!date || !type || !category || !amount) {
    return res.status(400).json({
      error: 'date, type, category and amount are required'
    });
  }

  if (type !== 'EXPENSE' && type !== 'INCOME') {
    return res.status(400).json({
      error: 'type must be EXPENSE or INCOME'
    });
  }

  const newTransaction = {
    id: nextTransactionId++,
    date,
    type,
    category,
    amount,
    description: description || ''
  };

  transactions.push(newTransaction);

  res.status(201).json(newTransaction);
});

// Port from .env or default 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
