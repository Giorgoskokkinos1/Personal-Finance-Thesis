// src/App.js
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  NavLink,
} from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./App.css";

import Dashboard from "./pages/Dashboard";
import TransactionsPage from "./pages/Transactions";
import ChartsPage from "./pages/Charts";
import UploadPage from "./pages/Upload";
import CategoriesPage from "./pages/Categories";
import TargetsPage from "./pages/Targets";
import BudgetPage from "./pages/Budget";
import LoginPage from "./pages/Login";
import SetupPage from "./pages/Setup";
import { apiUrl } from "./config/api";
import {
  rememberCategoryChoice,
  suggestTransactionCategory,
} from "./utils/smartCategorization";
import {
  formatCurrencyAmount,
  formatDateByPreference,
} from "./utils/formatters";

function App() {
  const [transactions, setTransactions] = useState([]);

  const [newTransaction, setNewTransaction] = useState({
    date: "",
    type: "INCOME",
    category: "",
    amount: "",
    description: "",
    repeatMonths: "0", // how many months to repeat (as string from select)
    targetId: "",
    smartCategory: null,
    categoryTouched: false,
  });

  const [filter, setFilter] = useState({
    month: "ALL",
    type: "ALL",
    category: "ALL",
    search: "",
  });

  const [chartRange, setChartRange] = useState({
    from: "",
    to: "",
  });
  const [targets, setTargets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [logoRolling, setLogoRolling] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    currency: "EUR",
    dateFormat: "dd/mm/yyyy",
    theme: "Calm",
  });
  const [appSettings, setAppSettings] = useState(() => {
    if (typeof window === "undefined") {
      return {
        currency: "EUR",
        dateFormat: "dd/mm/yyyy",
        theme: "Calm",
      };
    }

    try {
      const saved = window.localStorage.getItem("financeTrackerSettings");
      return saved
        ? JSON.parse(saved)
        : {
            currency: "EUR",
            dateFormat: "dd/mm/yyyy",
            theme: "Calm",
          };
    } catch (err) {
      return {
        currency: "EUR",
        dateFormat: "dd/mm/yyyy",
        theme: "Calm",
      };
    }
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState("");

  // -----------------------------------
  // Load transactions on startup
  // -----------------------------------
  const setAxiosUserHeader = (email, token = "") => {
    if (!axios.defaults) axios.defaults = {};
    if (!axios.defaults.headers) axios.defaults.headers = {};
    if (!axios.defaults.headers.common) axios.defaults.headers.common = {};
    if (email) {
      axios.defaults.headers.common["X-User-Email"] = email;
      if (token) {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
      if (!window.localStorage.getItem("financeTrackerLegacyClaimed")) {
        axios.defaults.headers.common["X-Claim-Legacy"] = "true";
      }
    } else {
      delete axios.defaults.headers.common["X-User-Email"];
      delete axios.defaults.headers.common["X-Claim-Legacy"];
      delete axios.defaults.headers.common.Authorization;
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    setAxiosUserHeader(currentUser.email, authToken);
    Promise.all([
      fetchTransactions(),
      fetchTargets(),
      fetchCategories(),
      fetchBudgets(),
    ]).finally(() => {
      window.localStorage.setItem("financeTrackerLegacyClaimed", "true");
      delete axios.defaults.headers.common["X-Claim-Legacy"];
    });
  }, [currentUser, authToken]);

  const handleLogin = async ({ mode, email, name, password }) => {
    const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
    const response = await axios.post(apiUrl(endpoint), {
      email,
      name,
      password,
    });
    const { user, token } = response.data;

    clearWorkspaceData();
    setProfileMenuOpen(false);
    setProfileModalOpen(false);
    setAuthToken(token);
    setAxiosUserHeader(user.email, token);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    axios.post(apiUrl("/api/auth/logout")).catch((err) => {
      console.error("Logout request failed:", err);
    });
    clearWorkspaceData();
    setAuthToken("");
    setCurrentUser(null);
    setProfileMenuOpen(false);
    setProfileModalOpen(false);
    setAxiosUserHeader(null);
    window.localStorage.removeItem("financeTrackerUser");
    window.sessionStorage.removeItem("financeTrackerUser");
  };

  const persistUser = (user) => {
    setCurrentUser(user);
  };

  const clearWorkspaceData = () => {
    setTransactions([]);
    setTargets([]);
    setCategories([]);
    setBudgets([]);
    setFilter({
      month: "ALL",
      type: "ALL",
      category: "ALL",
      search: "",
    });
    setChartRange({
      from: "",
      to: "",
    });
    setNewTransaction((prev) => ({
      ...prev,
      date: "",
      category: "",
      amount: "",
      description: "",
      targetId: "",
      smartCategory: null,
      categoryTouched: false,
    }));
  };

  const openProfileSettings = () => {
    setProfileForm({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      currency: appSettings.currency || "EUR",
      dateFormat: appSettings.dateFormat || "dd/mm/yyyy",
      theme: appSettings.theme || "Calm",
    });
    setProfileMenuOpen(false);
    setProfileModalOpen(true);
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    let updatedUser = currentUser;
    const updatedSettings = {
      currency: profileForm.currency,
      dateFormat: profileForm.dateFormat,
      theme: profileForm.theme,
    };

    try {
      const response = await axios.put(apiUrl("/api/auth/profile"), {
        name: profileForm.name.trim() || "User",
      });
      updatedUser = response.data.user;
    } catch (err) {
      console.error("Profile update failed:", err);
      updatedUser = {
        ...currentUser,
        name: profileForm.name.trim() || "User",
        email: currentUser.email,
      };
    }

    setCurrentUser(updatedUser);
    setAppSettings(updatedSettings);
    persistUser(updatedUser);
    window.localStorage.setItem(
      "financeTrackerSettings",
      JSON.stringify(updatedSettings)
    );
    setProfileModalOpen(false);
  };

  const rollLogo = () => {
    setLogoRolling(false);
    window.setTimeout(() => setLogoRolling(true), 0);
    window.setTimeout(() => setLogoRolling(false), 900);
  };

  const fetchTransactions = () => {
    return axios
      .get(apiUrl("/api/transactions"))
      .then((res) => setTransactions(res.data))
      .catch((err) => console.error("Error fetching:", err));
  };

  const fetchTargets = () => {
    return axios
      .get(apiUrl("/api/targets"))
      .then((res) => setTargets(res.data))
      .catch((err) => console.error("Error fetching targets:", err));
  };

  const fetchCategories = () => {
    return axios
      .get(apiUrl("/api/categories"), {
        params: { all: "true" },
      })
      .then((res) => setCategories(res.data.data || []))
      .catch((err) => console.error("Error fetching categories:", err));
  };

  const fetchBudgets = () => {
    return axios
      .get(apiUrl("/api/budgets"))
      .then((res) => setBudgets(res.data))
      .catch((err) => console.error("Error fetching budgets:", err));
  };

  const handleAddBudget = (payload) =>
    axios.post(apiUrl("/api/budgets"), payload).then(() => {
      fetchBudgets();
    });

  const handleUpdateBudget = (id, payload) =>
    axios.put(apiUrl(`/api/budgets/${id}`), payload).then(() => {
      fetchBudgets();
    });

  const handleAddTarget = (payload) =>
    axios.post(apiUrl("/api/targets"), payload).then(() => {
      fetchTargets();
    });

  const handleUpdateTarget = (id, payload) =>
    axios.put(apiUrl(`/api/targets/${id}`), payload).then(() => {
      fetchTargets();
    });

  const refreshWorkspaceData = () =>
    Promise.all([
      fetchTransactions(),
      fetchTargets(),
      fetchCategories(),
      fetchBudgets(),
    ]);

  const handleLoadDemoData = () =>
    axios.post(apiUrl("/api/demo-data")).then(() => refreshWorkspaceData());

  const handleResetWorkspace = () =>
    axios.delete(apiUrl("/api/workspace")).then(() => {
      clearWorkspaceData();
      return refreshWorkspaceData();
    });

  // -----------------------------------
  // Add transaction (single or recurring)
  // -----------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction((prev) => {
      if (name === "type") {
        const isTargetType = value === "TRANSFER" || value === "WITHDRAW";
        const suggestion = suggestTransactionCategory({
          type: value,
          description: prev.description,
          categories,
        });

        return {
          ...prev,
          type: value,
          category: isTargetType ? "" : suggestion?.category || "",
          targetId: isTargetType ? prev.targetId : "",
          smartCategory: isTargetType ? null : suggestion,
          categoryTouched: false,
        };
      }

      if (name === "description") {
        const suggestion = suggestTransactionCategory({
          type: prev.type,
          description: value,
          categories,
        });

        return {
          ...prev,
          description: value,
          category:
            suggestion && suggestion.autoApply !== false && !prev.categoryTouched
              ? suggestion.category
              : prev.category,
          smartCategory: suggestion,
        };
      }

      if (name === "category") {
        return {
          ...prev,
          category: value,
          categoryTouched: true,
          smartCategory:
            prev.smartCategory?.category === value ? prev.smartCategory : null,
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const repeatMonths = parseInt(newTransaction.repeatMonths || "0", 10);

    // Helper to add months to a yyyy-mm-dd date string
    const addMonthsToDate = (dateString, monthsToAdd) => {
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) {
        return dateString;
      }
      d.setMonth(d.getMonth() + monthsToAdd);
      return d.toISOString().slice(0, 10); // yyyy-mm-dd
    };

    // Reset function to keep things tidy
    const resetForm = () => {
      setNewTransaction({
        date: "",
        type: "INCOME",
        category: "",
        amount: "",
        description: "",
        repeatMonths: "0",
        targetId: "",
        smartCategory: null,
        categoryTouched: false,
      });
    };

    // Case 1: no repeat -> single POST
    if (!repeatMonths || repeatMonths <= 0) {
      const payload = {
        date: newTransaction.date,
        type: newTransaction.type,
        category: newTransaction.category,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description || "",
        targetId: newTransaction.targetId || null,
      };

      axios
        .post(apiUrl("/api/transactions"), payload)
        .then(() => {
          rememberCategoryChoice({
            type: newTransaction.type,
            description: newTransaction.description,
            category: newTransaction.category,
          });
          fetchTransactions();
          fetchTargets();
          resetForm();
        })
        .catch((err) => console.error("Add error:", err));
      return;
    }

    // Case 2: repeat monthly -> build an array and use /bulk
    const baseDate = newTransaction.date;
    const rows = [];

    for (let i = 0; i < repeatMonths; i += 1) {
      const newDate = addMonthsToDate(baseDate, i);

      rows.push({
        date: newDate,
        type: newTransaction.type,
          category: newTransaction.category,
          amount: parseFloat(newTransaction.amount),
          description: newTransaction.description || "",
          targetId: newTransaction.targetId || null,
        });
      }

    axios
      .post(apiUrl("/api/transactions/bulk"), rows)
      .then(() => {
        rememberCategoryChoice({
          type: newTransaction.type,
          description: newTransaction.description,
          category: newTransaction.category,
        });
        fetchTransactions();
        fetchTargets();
        resetForm();
      })
      .catch((err) => console.error("Add error (bulk):", err));
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
      .delete(apiUrl(`/api/transactions/${id}`))
      .then(() => {
        fetchTransactions();
        fetchTargets();
      })
      .catch((err) => console.error("Delete error:", err));
  };

  // -----------------------------------
  // Update transaction (EDIT)
  // -----------------------------------
  const handleUpdateTransaction = (updatedTx) => {
    axios
      .put(
        apiUrl(`/api/transactions/${updatedTx.id}`),
        updatedTx
      )
      .then(() => {
        rememberCategoryChoice({
          type: updatedTx.type,
          description: updatedTx.description,
          category: updatedTx.category,
        });
        fetchTransactions();
        fetchTargets();
      })
      .catch((err) => console.error("Update error:", err));
  };

  // -----------------------------------
  // CSV upload
  // -----------------------------------
  const handleImportTransactions = (rows) =>
    axios
      .post(apiUrl("/api/transactions/bulk"), rows)
      .then((res) => {
        fetchTransactions();
        fetchTargets();
        fetchCategories();
        return res.data;
      });

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

  const totalTransfers = filteredTransactions
    .filter((t) => t.type === "TRANSFER")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalWithdrawals = filteredTransactions
    .filter((t) => t.type === "WITHDRAW")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const balanceNumber =
    totalIncome - totalExpenses - totalTransfers + totalWithdrawals;
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

  const currentMonthKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(
    2,
    "0"
  )}`;
  const currentBudget = budgets.find(
    (budget) => budget.monthKey === currentMonthKey
  );
  const currentBudgetAmount = Number(currentBudget?.amount || 0);
  const currentMonthBudgetImpact = transactions
    .filter((t) => {
      if (!t.date) return false;
      return String(t.date).slice(0, 7) === currentMonthKey;
    })
    .reduce((sum, t) => {
      const amount = Number(t.amount || 0);
      if (t.type === "INCOME" || t.type === "WITHDRAW") return sum + amount;
      if (t.type === "EXPENSE" || t.type === "TRANSFER") return sum - amount;
      return sum;
    }, currentBudgetAmount);
  const hasBudgetAlert =
    currentBudgetAmount > 0 && currentMonthBudgetImpact < currentBudgetAmount * 0.2;

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
  const getMonthKey = (dateValue) => {
    if (!dateValue) return null;
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const chartMonthOptions = monthsForTrend;

  const chartTransactions = filteredTransactions.filter((t) => {
    const key = getMonthKey(t.date);
    if (!key) return false;
    if (chartRange.from && key < chartRange.from) return false;
    if (chartRange.to && key > chartRange.to) return false;
    return true;
  });

  const activeTargets = targets.filter((target) => target.status !== "DISABLED");
  const selectedCurrency = appSettings.currency || "EUR";
  const selectedDateFormat = appSettings.dateFormat || "dd/mm/yyyy";
  const formatCurrency = (amount) =>
    formatCurrencyAmount(amount, selectedCurrency);
  const formatDisplayDate = (dateValue) =>
    formatDateByPreference(dateValue, selectedDateFormat);
  const expenseTransactions = transactions.filter((t) => t.type === "EXPENSE");
  const biggestExpense = expenseTransactions.reduce((max, transaction) => {
    const amount = Number(transaction.amount || 0);
    return amount > Number(max?.amount || 0) ? transaction : max;
  }, null);
  const averageExpense =
    expenseTransactions.length > 0
      ? expenseTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0) /
        expenseTransactions.length
      : 0;
  const mostUsedCategory =
    Object.entries(
      expenseTransactions.reduce((acc, transaction) => {
        const category = transaction.category || "Uncategorized";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || "No expenses yet";
  const budgetStatus =
    currentBudgetAmount <= 0
      ? "No budget set"
      : currentMonthBudgetImpact < 0
      ? "Over budget"
      : currentMonthBudgetImpact < currentBudgetAmount * 0.3
      ? "Warning"
      : "On track";
  const memberSince = currentUser?.signedInAt
    ? formatDisplayDate(currentUser.signedInAt)
    : "Today";
  const displayName = currentUser?.name || "User";
  const displayInitial = displayName.slice(0, 1).toUpperCase();
  const profileStats = [
    { label: "Transactions", value: transactions.length },
    {
      label: "Average expense",
      value: formatCurrency(averageExpense),
    },
    {
      label: "Biggest expense",
      value: biggestExpense
        ? formatCurrency(Number(biggestExpense.amount || 0))
        : formatCurrency(0),
    },
    { label: "Most used category", value: mostUsedCategory },
    { label: "Active targets", value: activeTargets.length },
    { label: "Budget status", value: budgetStatus },
  ];

  const monthlyCashflowTransactions = chartTransactions
    .filter((t) => t.type === "INCOME" || t.type === "EXPENSE")
    .map((t) => ({
      id: String(t.id),
      type: t.type === "INCOME" ? "income" : "expense",
      amount: Number(t.amount || 0),
      category: t.category || "",
      date: t.date,
      note: t.description || "",
    }));

  const targetTrendTransactions = chartTransactions
    .filter((t) => t.type === "TRANSFER" || t.type === "WITHDRAW")
    .map((t) => ({
      id: String(t.id),
      type: t.type === "TRANSFER" ? "transfer" : "withdraw",
      amount: Number(t.amount || 0),
      category: t.category || "",
      date: t.date,
      targetId: t.target_id ? String(t.target_id) : undefined,
    }));

  const targetOptions = activeTargets.map((target) => ({
    id: String(target.id),
    name: target.name,
    type: target.type,
    targetAmount: Number(target.targetAmount || 0),
  }));

  // -----------------------------------
  // Category + monthly data for charts (uses filtered set + chart range)
  // -----------------------------------
  const expenseCategories = [
    ...new Set(
      chartTransactions
        .filter((t) => t.type === "EXPENSE")
        .map((t) => t.category)
    ),
  ];

  const expenseTotals = expenseCategories.map((cat) =>
    chartTransactions
      .filter((t) => t.type === "EXPENSE" && t.category === cat)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  );

  const months = [
    ...new Set(
      chartTransactions.map((t) => {
        const d = new Date(t.date);
        if (Number.isNaN(d.getTime())) return "Unknown";
        return d.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
      })
    ),
  ].filter((m) => m !== "Unknown");

  const incomeByMonth = months.map((m) =>
    chartTransactions
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
    chartTransactions
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
      {!currentUser ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
      <div className="app-root">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark app-navbar">
          <div className="container">
            <Link className="navbar-brand fw-semibold" to="/" onClick={rollLogo}>
              <span
                className={`app-logo-mark ${logoRolling ? "app-logo-roll" : ""}`}
                aria-hidden="true"
              >
                <span>FT</span>
              </span>
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
                  <NavLink className="nav-link" to="/">
                    Home
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/transactions">
                    Transactions
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/budget">
                    Budget
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/goals">
                    Goals
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/insights">
                    Insights
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/setup">
                    Setup
                  </NavLink>
                </li>
              </ul>

              {/* Bell on the right, visible on every page */}
              <ul className="navbar-nav ms-auto">
                <li className="nav-item profile-menu-wrap">
                  <button
                    type="button"
                    className="nav-user-chip"
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    aria-expanded={profileMenuOpen}
                    aria-haspopup="menu"
                  >
                    <span>{displayInitial}</span>
                    {displayName}
                  </button>

                  {profileMenuOpen && (
                    <div className="profile-menu" role="menu">
                      <div className="profile-menu-header">
                        <span>{displayInitial}</span>
                        <div>
                          <strong>{displayName}</strong>
                          <small>{currentUser.email}</small>
                        </div>
                      </div>

                      <button type="button" onClick={openProfileSettings}>
                        Account settings
                      </button>
                      <button type="button" onClick={openProfileSettings}>
                        Finance statistics
                      </button>
                      <button type="button" className="danger" onClick={handleLogout}>
                        Logout
                      </button>
                    </div>
                  )}
                </li>
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
                    currentBudget={currentBudget}
                    transactions={transactions}
                    monthsForTrend={monthsForTrend}
                    budgets={budgets}
                    targets={targets}
                    formatCurrency={formatCurrency}
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
                    totalTransfers={totalTransfers}
                    totalWithdrawals={totalWithdrawals}
                    balance={balance}
                    targets={activeTargets}
                    categories={categories}
                    categorySuggestion={newTransaction.smartCategory}
                    currency={selectedCurrency}
                    formatCurrency={formatCurrency}
                    formatDate={formatDisplayDate}
                  />
                }
              />

              <Route
                path="/insights"
                element={
                  <ChartsPage
                    totalIncome={totalIncome}
                    totalExpenses={totalExpenses}
                    expenseCategories={expenseCategories}
                    expenseTotals={expenseTotals}
                    months={months}
                    incomeByMonth={incomeByMonth}
                    expensesByMonth={expensesByMonth}
                    chartRange={chartRange}
                    setChartRange={setChartRange}
                    chartMonthOptions={chartMonthOptions}
                    cashflowTransactions={monthlyCashflowTransactions}
                    targetTrendTransactions={targetTrendTransactions}
                    targets={targetOptions}
                    currency={selectedCurrency}
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
                    chartRange={chartRange}
                    setChartRange={setChartRange}
                    chartMonthOptions={chartMonthOptions}
                    cashflowTransactions={monthlyCashflowTransactions}
                    targetTrendTransactions={targetTrendTransactions}
                    targets={targetOptions}
                    currency={selectedCurrency}
                  />
                }
              />

              <Route
                path="/setup/upload"
                element={
                  <UploadPage
                    onImportTransactions={handleImportTransactions}
                    categories={categories}
                    targets={targets}
                  />
                }
              />

              <Route
                path="/upload"
                element={
                  <UploadPage
                    onImportTransactions={handleImportTransactions}
                    categories={categories}
                    targets={targets}
                  />
                }
              />

              <Route
                path="/setup/categories"
                element={<CategoriesPage onCategoriesChanged={fetchCategories} />}
              />

              <Route
                path="/categories"
                element={<CategoriesPage onCategoriesChanged={fetchCategories} />}
              />

              <Route
                path="/goals"
                element={
                  <TargetsPage
                    targets={targets}
                    onAddTarget={handleAddTarget}
                    onUpdateTarget={handleUpdateTarget}
                    currency={selectedCurrency}
                    formatCurrency={formatCurrency}
                    formatDate={formatDisplayDate}
                  />
                }
              />

              <Route
                path="/targets"
                element={
                  <TargetsPage
                    targets={targets}
                    onAddTarget={handleAddTarget}
                    onUpdateTarget={handleUpdateTarget}
                    currency={selectedCurrency}
                    formatCurrency={formatCurrency}
                    formatDate={formatDisplayDate}
                  />
                }
              />

              <Route
                path="/budget"
                element={
                  <BudgetPage
                    budgets={budgets}
                    transactions={transactions}
                    onAddBudget={handleAddBudget}
                    onUpdateBudget={handleUpdateBudget}
                    currency={selectedCurrency}
                    formatCurrency={formatCurrency}
                  />
                }
              />

              <Route
                path="/setup"
                element={
                  <SetupPage
                    onOpenProfileSettings={openProfileSettings}
                    onLoadDemoData={handleLoadDemoData}
                    onResetWorkspace={handleResetWorkspace}
                  />
                }
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

        {profileModalOpen && (
          <div className="profile-modal-backdrop" role="presentation">
            <section
              className="profile-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Profile and settings"
            >
              <div className="profile-modal-header">
                <div className="profile-avatar-large">
                  {profileForm.name.slice(0, 1).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="section-kicker mb-1">Account center</p>
                  <h2>Account & Preferences</h2>
                  <p>Member since {memberSince}</p>
                </div>
                <button
                  type="button"
                  className="profile-close-button"
                  onClick={() => setProfileModalOpen(false)}
                  aria-label="Close profile settings"
                >
                  x
                </button>
              </div>

              <div className="profile-modal-grid">
                <form className="profile-settings-form" onSubmit={handleSaveProfile}>
                  <div>
                    <label className="form-label">Display name</label>
                    <input
                      className="form-control"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileFormChange}
                      minLength="2"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Email</label>
                    <input
                      className="form-control"
                      name="email"
                      type="email"
                      value={profileForm.email}
                      readOnly
                      required
                    />
                    <div className="form-text identity-helper-text">
                      This email is the account identity used to keep your
                      financial records separate and secure.
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Currency</label>
                      <select
                        className="form-select"
                        name="currency"
                        value={profileForm.currency}
                        onChange={handleProfileFormChange}
                      >
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Date format</label>
                      <select
                        className="form-select"
                        name="dateFormat"
                        value={profileForm.dateFormat}
                        onChange={handleProfileFormChange}
                      >
                        <option value="dd/mm/yyyy">dd/mm/yyyy</option>
                        <option value="yyyy-mm-dd">yyyy-mm-dd</option>
                        <option value="mm/dd/yyyy">mm/dd/yyyy</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Theme mood</label>
                      <select
                        className="form-select"
                        name="theme"
                        value={profileForm.theme}
                        onChange={handleProfileFormChange}
                      >
                        <option value="Calm">Calm</option>
                        <option value="Colorful">Colorful</option>
                        <option value="Compact">Compact</option>
                      </select>
                    </div>
                  </div>

                  <div className="profile-actions">
                    <button type="submit" className="btn btn-primary">
                      Save settings
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setProfileModalOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>

                <aside className="profile-stats-panel">
                  <p className="section-kicker mb-2">Your finance stats</p>
                  <div className="profile-stat-grid">
                    {profileStats.map((stat) => (
                      <div key={stat.label}>
                        <span>{stat.label}</span>
                        <strong>{stat.value}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="profile-insight-card">
                    <strong>{budgetStatus}</strong>
                    <p>
                      {budgetStatus === "On track"
                        ? "Your current month is holding its shape."
                        : budgetStatus === "Warning"
                        ? "Spending is getting close to the budget line."
                        : budgetStatus === "Over budget"
                        ? "This month has moved beyond the set budget."
                        : "Set this month budget to unlock better guidance."}
                    </p>
                  </div>
                </aside>
              </div>
            </section>
          </div>
        )}
      </div>
      )}
    </Router>
  );
}

export default App;
