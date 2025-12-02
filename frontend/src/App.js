// Imports
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';

// Register chart components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function App() {
  // Application state
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    date: '',
    type: 'INCOME',
    category: '',
    amount: '',
    description: ''
  });

  // Fetch data when component mounts
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Fetch all transactions from the backend
  const fetchTransactions = () => {
    axios.get('http://localhost:5000/api/transactions')
      .then(response => setTransactions(response.data))
      .catch(error => console.error('Error fetching transactions:', error));
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle manual transaction submission
  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/transactions', newTransaction)
      .then(() => {
        fetchTransactions();
        setNewTransaction({ date: '', type: 'INCOME', category: '', amount: '', description: '' });
      })
      .catch(error => console.error('Error adding transaction:', error));
  };

  // Handle CSV upload and parsing
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const newData = results.data.map(row => ({
          date: row.date || '',
          type: row.type?.toUpperCase() || 'EXPENSE',
          category: row.category || 'Misc',
          amount: row.amount || 0,
          description: row.description || ''
        }));

        axios.post('http://localhost:5000/api/transactions/bulk', newData)
          .then(() => fetchTransactions())
          .catch(err => console.error('Error uploading CSV:', err));
      }
    });
  };

  // Totals for summary section
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const balance = (totalIncome - totalExpenses).toFixed(2);

  // Category breakdown for category chart
  const expenseCategories = [...new Set(
    transactions.filter(t => t.type === 'EXPENSE').map(t => t.category)
  )];

  const expenseTotals = expenseCategories.map(cat =>
    transactions
      .filter(t => t.type === 'EXPENSE' && t.category === cat)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  );

  // Monthly summary data
  const months = [...new Set(
    transactions.map(t => {
      const d = new Date(t.date);
      return d.toLocaleString('default', { month: 'short', year: 'numeric' });
    })
  )];

  const incomeByMonth = months.map(month =>
    transactions
      .filter(t =>
        t.type === 'INCOME' &&
        new Date(t.date).toLocaleString('default', { month: 'short', year: 'numeric' }) === month
      )
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  );

  const expensesByMonth = months.map(month =>
    transactions
      .filter(t =>
        t.type === 'EXPENSE' &&
        new Date(t.date).toLocaleString('default', { month: 'short', year: 'numeric' }) === month
      )
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  );

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: 'auto' }}>
      <h1>Personal Finance Tracker</h1>

      {/* Summary section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        backgroundColor: '#f4f4f4',
        padding: '10px 15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div><strong>Total Income:</strong> €{totalIncome.toFixed(2)}</div>
        <div><strong>Total Expenses:</strong> €{totalExpenses.toFixed(2)}</div>
        <div><strong>Balance:</strong> €{balance}</div>
      </div>

      {/* Manual transaction form */}
      <form onSubmit={handleSubmit} style={{
        marginBottom: '20px',
        backgroundColor: '#fafafa',
        padding: '15px',
        borderRadius: '8px'
      }}>
        <h3>Add Transaction</h3>
        <input
          type="date"
          name="date"
          value={newTransaction.date}
          onChange={handleChange}
          required
        /><br /><br />

        <select name="type" value={newTransaction.type} onChange={handleChange}>
          <option value="INCOME">INCOME</option>
          <option value="EXPENSE">EXPENSE</option>
        </select><br /><br />

        <input
          type="text"
          name="category"
          placeholder="Category"
          value={newTransaction.category}
          onChange={handleChange}
          required
        /><br /><br />

        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={newTransaction.amount}
          onChange={handleChange}
          required
        /><br /><br />

        <input
          type="text"
          name="description"
          placeholder="Description"
          value={newTransaction.description}
          onChange={handleChange}
        /><br /><br />

        <button type="submit" style={{
          padding: '8px 15px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}>
          Add Transaction
        </button>
      </form>

      {/* CSV upload */}
      <div style={{
        marginTop: '30px',
        backgroundColor: '#f8f8f8',
        padding: '15px',
        borderRadius: '8px'
      }}>
        <h3>Upload CSV Transactions</h3>
        <input type="file" accept=".csv" onChange={handleFileUpload} />
        <p style={{ fontSize: '13px', color: 'gray' }}>
          Format: date,type,category,amount,description
        </p>
      </div>

      {/* Income vs Expenses Pie chart */}
      <div
        style={{
          width: '400px',
          margin: '20px auto',
          backgroundColor: '#fafafa',
          borderRadius: '8px',
          padding: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h3>Income vs Expenses</h3>
        <Pie
          data={{
            labels: ['Income', 'Expenses'],
            datasets: [
              {
                data: [totalIncome, totalExpenses],
                backgroundColor: ['#4CAF50', '#F44336'],
                borderColor: ['#388E3C', '#D32F2F'],
                borderWidth: 1,
              },
            ],
          }}
          options={{
            plugins: { legend: { position: 'bottom' } },
          }}
        />
      </div>

      {/* Category breakdown Bar chart */}
      <div
        style={{
          width: '600px',
          margin: '40px auto',
          backgroundColor: '#fafafa',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h3>Spending by Category</h3>
        <Bar
          data={{
            labels: expenseCategories,
            datasets: [
              {
                label: 'Expenses (€)',
                data: expenseTotals,
                backgroundColor: '#FF6384',
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Expenses by Category (€)' },
            },
            scales: {
              x: { title: { display: true, text: 'Category' } },
              y: { beginAtZero: true, title: { display: true, text: 'Amount (€)' } },
            },
          }}
        />
      </div>

      {/* Monthly Income vs Expenses Bar chart */}
      <div
        style={{
          width: '700px',
          margin: '40px auto',
          backgroundColor: '#fafafa',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h3>Monthly Income vs Expenses</h3>
        <Bar
          data={{
            labels: months,
            datasets: [
              { label: 'Income (€)', backgroundColor: '#4CAF50', data: incomeByMonth },
              { label: 'Expenses (€)', backgroundColor: '#F44336', data: expensesByMonth },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              title: { display: true, text: 'Monthly Overview (€)' },
            },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Amount (€)' } },
              x: { title: { display: true, text: 'Month' } },
            },
          }}
        />
      </div>

      {/* Transaction list */}
      <h3>All Transactions</h3>
      {transactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <ul>
          {transactions.map(t => (
            <li key={t.id} style={{ color: t.type === 'EXPENSE' ? 'red' : 'green' }}>
              <strong>{t.type}</strong> — {t.category}: {parseFloat(t.amount).toFixed(2)}€ ({t.date})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
