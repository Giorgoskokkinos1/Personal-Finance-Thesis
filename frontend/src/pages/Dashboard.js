// src/pages/Dashboard.js
import React, { useState } from "react";

function Dashboard({
  totalIncome,
  totalExpenses,
  balance,
  currentMonthExpenses,
  monthlyBudget,
  setMonthlyBudget,
  transactions,
  monthsForTrend,
}) {
  const incomeNumber = Number(totalIncome || 0);
  const expenseNumber = Number(totalExpenses || 0);
  const balanceNumber = Number(balance || 0);

  const balanceClass = balanceNumber >= 0 ? "text-success" : "text-danger";

  const MONTHLY_BUDGET = Number(monthlyBudget || 0);

  const budgetUsed = currentMonthExpenses || 0;
  const budgetRemaining = MONTHLY_BUDGET - budgetUsed;

  const usagePercent =
    MONTHLY_BUDGET > 0 ? (budgetUsed / MONTHLY_BUDGET) * 100 : 0;

  let budgetStatusText = "On track";
  let progressBarClass = "bg-success";

  if (usagePercent >= 80 && usagePercent < 100) {
    budgetStatusText = "Close to limit";
    progressBarClass = "bg-warning";
  } else if (usagePercent >= 100) {
    budgetStatusText = "Over budget";
    progressBarClass = "bg-danger";
  }

  const safePercent = Math.min(Math.max(usagePercent, 0), 120);

  const handleBudgetChange = (e) => {
    const value = Number(e.target.value);
    if (Number.isNaN(value)) {
      setMonthlyBudget(0);
    } else {
      setMonthlyBudget(value);
    }
  };

  // -----------------------------------
  // Monthly Trend: selectable months
  // -----------------------------------
  const defaultCurrentKey =
    monthsForTrend.length > 0
      ? monthsForTrend[monthsForTrend.length - 1].key
      : "";
  const defaultPreviousKey =
    monthsForTrend.length > 1
      ? monthsForTrend[monthsForTrend.length - 2].key
      : "";

  const [selectedCurrentMonth, setSelectedCurrentMonth] =
    useState(defaultCurrentKey);
  const [selectedPreviousMonth, setSelectedPreviousMonth] =
    useState(defaultPreviousKey);

  const getTotalsForMonthKey = (monthKey) => {
    if (!monthKey) return { income: 0, expenses: 0 };

    const [yearStr, monthStr] = monthKey.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;

    const monthTransactions = transactions.filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date);
      if (Number.isNaN(d.getTime())) return false;
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    });

    const income = monthTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expenses = monthTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return { income, expenses };
  };

  const currentTotals = getTotalsForMonthKey(selectedCurrentMonth);
  const previousTotals = getTotalsForMonthKey(selectedPreviousMonth);

  const trendCurrentIncome = currentTotals.income;
  const trendCurrentExpenses = currentTotals.expenses;
  const trendPreviousIncome = previousTotals.income;
  const trendPreviousExpenses = previousTotals.expenses;

  const currentMonthLabel =
    monthsForTrend.find((m) => m.key === selectedCurrentMonth)?.label || "n/a";
  const previousMonthLabel =
    monthsForTrend.find((m) => m.key === selectedPreviousMonth)?.label ||
    "n/a";

  const expenseDelta = trendCurrentExpenses - (trendPreviousExpenses || 0);
  const expenseDeltaPercent =
    (trendPreviousExpenses || 0) > 0
      ? (expenseDelta / trendPreviousExpenses) * 100
      : null;

  const incomeDelta = trendCurrentIncome - (trendPreviousIncome || 0);
  const incomeDeltaPercent =
    (trendPreviousIncome || 0) > 0
      ? (incomeDelta / trendPreviousIncome) * 100
      : null;

  const expenseTrendClass =
    expenseDelta > 0 ? "text-danger" : expenseDelta < 0 ? "text-success" : "";
  const incomeTrendClass =
    incomeDelta > 0 ? "text-success" : incomeDelta < 0 ? "text-danger" : "";

  const formatChange = (value) => {
    if (value === null) return "n/a";
    const rounded = value.toFixed(1);
    return `${rounded}%`;
  };

  // -----------------------------------
  // Insights & Alerts (current month)
  // -----------------------------------
  const now = new Date();
  const insightYear = now.getFullYear();
  const insightMonthIndex = now.getMonth();

  const currentMonthExpenseTransactions = transactions.filter((t) => {
    if (!t.date) return false;
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) return false;
    return (
      d.getFullYear() === insightYear &&
      d.getMonth() === insightMonthIndex &&
      t.type === "EXPENSE"
    );
  });

  const categoryTotals = currentMonthExpenseTransactions.reduce(
    (acc, t) => {
      const key = t.category || "Uncategorized";
      const amount = Number(t.amount || 0);
      acc[key] = (acc[key] || 0) + amount;
      return acc;
    },
    {}
  );

  let topCategory = null;
  let topCategoryAmount = 0;

  Object.entries(categoryTotals).forEach(([cat, total]) => {
    if (total > topCategoryAmount) {
      topCategory = cat;
      topCategoryAmount = total;
    }
  });

  const insights = [];

  if (MONTHLY_BUDGET > 0) {
    if (usagePercent >= 100) {
      const over = budgetUsed - MONTHLY_BUDGET;
      insights.push(
        `You have exceeded your monthly budget by €${over.toFixed(2)}.`
      );
    } else if (usagePercent >= 80) {
      insights.push(
        `You have used ${usagePercent.toFixed(
          0
        )}% of your monthly budget and the remaining amount is €${budgetRemaining.toFixed(
          2
        )}.`
      );
    } else {
      insights.push(
        `You have used ${usagePercent.toFixed(
          0
        )}% of your monthly budget and still have €${budgetRemaining.toFixed(
          2
        )} available.`
      );
    }
  }

  if (currentMonthExpenseTransactions.length === 0) {
    insights.push("No expenses have been recorded for the current month yet.");
  } else if (topCategory) {
    insights.push(
      `The highest expense category this month is "${topCategory}" with a total of €${topCategoryAmount.toFixed(
        2
      )}.`
    );
  }

  return (
    <div className="mt-4">
      {/* HERO / WELCOME CARD */}
      <div className="card hero-card border-0 shadow-sm mb-4">
        <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between">
          <div className="hero-text">
            <h1 className="hero-title mb-1">Welcome to your Finance Tracker</h1>
            <p className="hero-subtitle mb-0">
              Review your overall position, monitor your monthly budget and see
              how your spending changes over time.
            </p>
          </div>
          <div className="hero-highlight mt-3 mt-md-0 text-md-end">
            <div className="hero-highlight-label text-muted">
              Current balance
            </div>
            <div className={`hero-highlight-value ${balanceClass}`}>
              €{balanceNumber.toFixed(2)}
            </div>
            <div className="hero-highlight-caption text-muted">
              Total income minus expenses
            </div>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="row g-4 mb-4">
        {/* Income */}
        <div className="col-md-4">
          <div className="card kpi-card shadow-sm border-0">
            <div className="card-body">
              <div className="kpi-label">Total Income</div>
              <div className="kpi-value text-success">
                €{incomeNumber.toFixed(2)}
              </div>
              <div className="kpi-subtitle text-muted">
                All recorded income
              </div>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="col-md-4">
          <div className="card kpi-card shadow-sm border-0">
            <div className="card-body">
              <div className="kpi-label">Total Expenses</div>
              <div className="kpi-value text-danger">
                €{expenseNumber.toFixed(2)}
              </div>
              <div className="kpi-subtitle text-muted">
                All recorded expenses
              </div>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="col-md-4">
          <div className="card kpi-card shadow-sm border-0">
            <div className="card-body">
              <div className="kpi-label">Balance</div>
              <div className={`kpi-value ${balanceClass}`}>
                €{balanceNumber.toFixed(2)}
              </div>
              <div className="kpi-subtitle text-muted">
                Income minus expenses
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BUDGET STATUS CARD */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h4 className="mb-1">Monthly Budget Status</h4>
              <p className="text-muted mb-0">
                Expenses for the current calendar month compared to your
                budget.
              </p>
            </div>

            <div style={{ maxWidth: "220px" }}>
              <label className="form-label mb-1 small">
                Monthly budget (€)
              </label>
              <input
                type="number"
                className="form-control form-control-sm"
                value={Number.isNaN(MONTHLY_BUDGET) ? "" : MONTHLY_BUDGET}
                onChange={handleBudgetChange}
                min="0"
              />
            </div>
          </div>

          <div className="row g-3 align-items-center mb-3">
            <div className="col-md-4">
              <div className="metric-title">Monthly Budget</div>
              <div className="metric-value mb-0">
                €{MONTHLY_BUDGET.toFixed(2)}
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-title">Current Month Expenses</div>
              <div className="metric-value text-danger mb-0">
                €{budgetUsed.toFixed(2)}
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-title">Remaining</div>
              <div
                className={`metric-value mb-0 ${
                  budgetRemaining >= 0 ? "text-success" : "text-danger"
                }`}
              >
                €{budgetRemaining.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mb-2 d-flex justify-content-between">
            <span className="text-muted small">
              Used {Math.max(0, usagePercent).toFixed(0)}% of budget
            </span>
            <span className="small fw-semibold">{budgetStatusText}</span>
          </div>

          <div className="progress" style={{ height: "10px" }}>
            <div
              className={`progress-bar ${progressBarClass}`}
              role="progressbar"
              style={{ width: `${Math.min(safePercent, 100)}%` }}
              aria-valuenow={Math.min(safePercent, 100)}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>

      {/* MONTHLY TREND CARD */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="mb-3">Monthly Trend</h4>
          <p className="text-muted">
            Compare income and expenses between two selected months.
          </p>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small">Previous month</label>
              <select
                className="form-select form-select-sm"
                value={selectedPreviousMonth}
                onChange={(e) => setSelectedPreviousMonth(e.target.value)}
              >
                <option value="">-- None --</option>
                {monthsForTrend.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small">Current month</label>
              <select
                className="form-select form-select-sm"
                value={selectedCurrentMonth}
                onChange={(e) => setSelectedCurrentMonth(e.target.value)}
              >
                <option value="">-- None --</option>
                {monthsForTrend.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th></th>
                  <th>{previousMonthLabel}</th>
                  <th>{currentMonthLabel}</th>
                  <th>Change (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw-semibold">Income</td>
                  <td>€{(trendPreviousIncome || 0).toFixed(2)}</td>
                  <td>€{(trendCurrentIncome || 0).toFixed(2)}</td>
                  <td className={incomeTrendClass}>
                    {formatChange(incomeDeltaPercent)}
                  </td>
                </tr>
                <tr>
                  <td className="fw-semibold">Expenses</td>
                  <td>€{(trendPreviousExpenses || 0).toFixed(2)}</td>
                  <td>€{(trendCurrentExpenses || 0).toFixed(2)}</td>
                  <td className={expenseTrendClass}>
                    {formatChange(expenseDeltaPercent)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* INSIGHTS & ALERTS */}
      <div
        id="dashboard-insights"
        className="card shadow-sm border-0 mb-4"
      >
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <h4 className="mb-1">Insights & Alerts</h4>
              <p className="text-muted mb-0 small">
                Automatic observations based on the current month and your
                budget.
              </p>
            </div>
          </div>

          {insights.length === 0 ? (
            <p className="mb-0 text-secondary">
              No insights available yet. Start by recording some transactions.
            </p>
          ) : (
            <ul className="mb-0">
              {insights.map((text, index) => (
                <li key={index} className="mb-1">
                  {text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
