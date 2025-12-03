// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import Papa from "papaparse";
import "bootstrap/dist/css/bootstrap.min.css";

// Page components
import Dashboard from "./pages/Dashboard";
import TransactionsPage from "./pages/Transactions";
import ChartsPage from "./pages/Charts";
import UploadPage from "./pages/Upload";

function App() {
  // --------------------------
  // Application State
  // --------------------------
  const [transactions, setTransactions] = useState([]);

  const [newTransaction, setNewTransaction] = useState({
    date: "",
    type: "INCOME",
    category: "",
    amount: "",
    description: "",
  });

  const [filter, setFilter] = useState({
    month: "ALL",
    type: "ALL",
    category: "ALL",
    search: "",
  });

  // --------------------------
  // Fetch Transactions on Load
  // --------------------------
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = () => {
    axios
      .get("http://localhost:5000/api/transactions")
      .then((res) => setTransactions(res.data))
      .catch((err) => console.error("Error fetching:", err));
  };

  // --------------------------
  // Transaction Input Handlers
  // --------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .post("http://localhost:5000/api/transactions", newTransaction)
      .then(() => {
        fetchTransactions();
        setNewTransaction({
          date: "",
          type: "INCOME",
          category: "",
          amount: "",
          description: "",
        });
      })
      .catch((err) => console.error("Add error:", err));
  };

  // --------------------------
  // CSV Upload
  // --------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.map((row) => ({
          date: row.date || "",
          type: row.type?.toUpperCase() || "EXPENSE",
          category: row.category || "Misc",
          amount: row.amount || 0,
          description: row.description || "",
        }));

        axios
          .post("http://localhost:5000/api/transactions/bulk", rows)
          .then(() => fetchTransactions())
          .catch((err) => console.error("CSV upload error:", err));
      },
    });
  };

  // --------------------------
  // Filter Logic
  // --------------------------
  const filteredTransactions = transactions.filter((t) => {
    const month = t.date.slice(5, 7);

    const matchMonth = filter.month === "ALL" || month === filter.month;
    const matchType = filter.type === "ALL" || t.type === filter.type;
    const matchCategory =
      filter.category === "ALL" || t.category === filter.category;
    const matchSearch =
      filter.search === "" ||
      t.description?.toLowerCase().includes(filter.search.toLowerCase()) ||
      t.category?.toLowerCase().includes(filter.search.toLowerCase());

    return matchMonth && matchType && matchCategory && matchSearch;
  });

  // --------------------------
  // Computed Summary Values
  // --------------------------
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const balance = (totalIncome - totalExpenses).toFixed(2);

  // Category chart data
  const expenseCategories = [
    ...new Set(
      filteredTransactions
        .filter((t) => t.type === "EXPENSE")
        .map((t) => t.category)
    ),
  ];

  const expenseTotals = expenseCategories.map((cat) =>
    filteredTransactions
      .filter((t) => t.type === "EXPENSE" && t.category === cat)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  );

  // Monthly overview
  const months = [
    ...new Set(
      filteredTransactions.map((t) => {
        const d = new Date(t.date);
        return d.toLocaleString("default", { month: "short", year: "numeric" });
      })
    ),
  ];

  const incomeByMonth = months.map((m) =>
    filteredTransactions
      .filter(
        (t) =>
          t.type === "INCOME" &&
          new Date(t.date).toLocaleString("default", {
            month: "short",
            year: "numeric",
          }) === m
      )
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  );

  const expensesByMonth = months.map((m) =>
    filteredTransactions
      .filter(
        (t) =>
          t.type === "EXPENSE" &&
          new Date(t.date).toLocaleString("default", {
            month: "short",
            year: "numeric",
          }) === m
      )
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  );

  // --------------------------
  // UI Rendering
  // --------------------------
  return (
    <Router>
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" to="/">
            Finance Tracker
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navMenu"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navMenu">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">Dashboard</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/transactions">Transactions</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/charts">Charts</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/upload">Upload CSV</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <div className="container mt-4">

        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                balance={balance}
              />
            }
          />

          <Route
            path="/transactions"
            element={
              <TransactionsPage
                transactions={transactions}
                filteredTransactions={filteredTransactions}
                newTransaction={newTransaction}
                onChange={handleChange}
                onSubmit={handleSubmit}
                filter={filter}
                setFilter={setFilter}
              />
            }
          />

          <Route
            path="/charts"
            element={
              <ChartsPage
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                expenseCategories={expenseCategories}
                expenseTotals={expenseTotals}
                months={months}
                incomeByMonth={incomeByMonth}
                expensesByMonth={expensesByMonth}
              />
            }
          />

          <Route
            path="/upload"
            element={<UploadPage onFileUpload={handleFileUpload} />}
          />

          <Route
            path="*"
            element={
              <div className="text-center mt-5">
                <h2>404 - Page Not Found</h2>
                <p>This page does not exist.</p>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
