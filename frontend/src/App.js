// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import Papa from "papaparse";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./App.css";

import Dashboard from "./pages/Dashboard";
import TransactionsPage from "./pages/Transactions";
import ChartsPage from "./pages/Charts";
import UploadPage from "./pages/Upload";

function App() {
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

  // User-configurable monthly budget (saved in localStorage)
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    if (typeof window === "undefined") return 1500;
    const saved = window.localStorage.getItem("monthlyBudget");
    if (!saved) return 1500;
    const num = Number(saved);
    return Number.isNaN(num) ? 1500 : num;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("monthlyBudget", monthlyBudget.toString());
    } catch (err) {
      console.error("Could not save budget to localStorage:", err);
    }
  }, [monthlyBudget]);

  // -----------------------------------
  // Load transactions on startup
  // -----------------------------------
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = () => {
    axios
      .get("http://localhost:5000/api/transactions")
      .then((res) => setTransactions(res.data))
      .catch((err) => console.error("Error fetching:", err));
  };

  // -----------------------------------
  // Add transaction
  // -----------------------------------
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

  // -----------------------------------
  // Delete transaction
  // -----------------------------------
  const handleDeleteTransaction = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );
    if (!confirmed) return;

    axios
      .delete(`http://localhost:5000/api/transactions/${id}`)
      .then(() => {
        fetchTransactions();
      })
      .catch((err) => console.error("Delete error:", err));
  };

  // -----------------------------------
  // Update transaction (EDIT)
  // -----------------------------------
  const handleUpdateTransaction = (updatedTx) => {
    axios
      .put(
        `http://localhost:5000/api/transactions/${updatedTx.id}`,
        updatedTx
      )
      .then(() => {
        fetchTransactions();
      })
      .catch((err) => console.error("Update error:", err));
  };

  // -----------------------------------
  // CSV upload
  // -----------------------------------
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

  // -----------------------------------
  // Filters (for Transactions + Charts)
  // -----------------------------------
  const filteredTransactions = transactions.filter((t) => {
    const month = t.date ? t.date.slice(5, 7) : "";

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

  // -----------------------------------
  // Summary values (for filtered list)
  // -----------------------------------
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const balanceNumber = totalIncome - totalExpenses;
  const balance = balanceNumber.toFixed(2);

  // -----------------------------------
  // Current month totals (for budget card)
  // -----------------------------------
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth(); // 0-11

  const getMonthTotals = (year, monthIndex) => {
    const monthTransactions = transactions.filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date);
      if (Number.isNaN(d.getTime())) return false;
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    });

    const income = monthTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = monthTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return { income, expenses };
  };

  const { expenses: currentMonthExpenses } = getMonthTotals(
    currentYear,
    currentMonthIndex
  );

  // Percentage of budget used and alert flag
  const budgetUsagePercent =
    monthlyBudget > 0 ? (currentMonthExpenses / monthlyBudget) * 100 : 0;

  const hasBudgetAlert =
    monthlyBudget > 0 && budgetUsagePercent >= 80;

  // -----------------------------------
  // Months list for Monthly Trend dropdowns
  // -----------------------------------
  const monthKeys = [
    ...new Set(
      transactions
        .filter((t) => t.date)
        .map((t) => {
          const d = new Date(t.date);
          if (Number.isNaN(d.getTime())) return null;
          const key = `${d.getFullYear()}-${String(
            d.getMonth() + 1
          ).padStart(2, "0")}`;
          return key;
        })
        .filter(Boolean)
    ),
  ];

  const monthsForTrend = monthKeys
    .map((key) => {
      const [yearStr, monthStr] = key.split("-");
      const d = new Date(Number(yearStr), Number(monthStr) - 1, 1);
      return {
        key,
        label: d.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  // -----------------------------------
  // Category + monthly data for charts (uses filtered set)
  // -----------------------------------
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

  const months = [
    ...new Set(
      filteredTransactions.map((t) => {
        const d = new Date(t.date);
        if (Number.isNaN(d.getTime())) return "Unknown";
        return d.toLocaleString("default", { month: "short", year: "numeric" });
      })
    ),
  ].filter((m) => m !== "Unknown");

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

  // -----------------------------------
  // Render
  // -----------------------------------
  return (
    <Router>
      <div className="app-root">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark app-navbar">
          <div className="container">
            <Link className="navbar-brand fw-semibold" to="/">
              Finance Tracker
            </Link>

            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navMenu"
              aria-controls="navMenu"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navMenu">
              <ul className="navbar-nav me-auto">
                <li className="nav-item">
                  <Link className="nav-link" to="/">
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/transactions">
                    Transactions
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/charts">
                    Charts
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/upload">
                    Upload CSV
                  </Link>
                </li>
              </ul>

              {/* Bell on the right, visible on every page */}
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <Link
                    to="/"
                    className="nav-link nav-bell-link"
                    title="View budget alerts"
                    onClick={() => {
                      setTimeout(() => {
                        const el = document.getElementById(
                          "dashboard-insights"
                        );
                        if (el) {
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                      }, 100);
                    }}
                  >
                    <span
                      className={
                        "nav-bell" + (hasBudgetAlert ? " nav-bell-alert" : "")
                      }
                    >
                      &#128276;
                    </span>
                    {hasBudgetAlert && <span className="nav-bell-badge" />}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <main className="app-main">
          <div className="container">
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    totalIncome={totalIncome}
                    totalExpenses={totalExpenses}
                    balance={balance}
                    currentMonthExpenses={currentMonthExpenses}
                    monthlyBudget={monthlyBudget}
                    setMonthlyBudget={setMonthlyBudget}
                    transactions={transactions}
                    monthsForTrend={monthsForTrend}
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
                    onDeleteTransaction={handleDeleteTransaction}
                    onUpdateTransaction={handleUpdateTransaction}
                    totalIncome={totalIncome}
                    totalExpenses={totalExpenses}
                    balance={balance}
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
        </main>
      </div>
    </Router>
  );
}

export default App;
