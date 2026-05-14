// src/pages/Budget.js
import React, { useMemo, useState } from "react";

const getLocalMonthKey = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 7);
};

const addMonths = (monthKey, offset) => {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

function BudgetPage({
  budgets,
  transactions,
  onAddBudget,
  onUpdateBudget,
  currency = "EUR",
  formatCurrency = (amount) => `EUR ${Number(amount || 0).toFixed(2)}`,
}) {
  const currentMonthKey = useMemo(() => getLocalMonthKey(), []);
  const [form, setForm] = useState({ monthKey: currentMonthKey, amount: "" });
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [budgetSettings, setBudgetSettings] = useState(() => {
    if (typeof window === "undefined") {
      return { defaultAmount: "", carryOver: true };
    }
    try {
      const saved = window.localStorage.getItem("financeTrackerBudgetSettings");
      return saved ? JSON.parse(saved) : { defaultAmount: "", carryOver: true };
    } catch (err) {
      return { defaultAmount: "", carryOver: true };
    }
  });

  const sortedBudgets = useMemo(
    () => [...budgets].sort((a, b) => b.monthKey.localeCompare(a.monthKey)),
    [budgets]
  );

  const usedMonthKeys = useMemo(
    () => new Set(budgets.map((budget) => budget.monthKey)),
    [budgets]
  );

  const daysLeftInMonth = useMemo(() => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return Math.max(lastDay.getDate() - today.getDate(), 0);
  }, []);

  const getApiError = (err, fallback) => err.response?.data?.error || fallback;

  const formatMonth = (monthKey) => {
    if (!monthKey) return "";
    const [year, month] = monthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const getBudgetStatus = (budget) => {
    const monthTransactions = transactions.filter((transaction) => {
      if (!transaction.date) return false;
      return String(transaction.date).slice(0, 7) === budget.monthKey;
    });

    const positiveAmount = monthTransactions
      .filter((transaction) => ["INCOME", "WITHDRAW"].includes(transaction.type))
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const negativeAmount = monthTransactions
      .filter((transaction) => ["EXPENSE", "TRANSFER"].includes(transaction.type))
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const amountSet = Number(budget.amount || 0);
    const remainingAmount = amountSet + positiveAmount - negativeAmount;
    const netUsed = Math.max(negativeAmount - positiveAmount, 0);
    const usedPercent =
      amountSet > 0 ? Math.min((netUsed / amountSet) * 100, 100) : 0;
    const remainingPercent =
      amountSet > 0 ? (remainingAmount / amountSet) * 100 : 0;
    const statusText =
      remainingAmount < 0
        ? "Over budget"
        : remainingPercent < 30
        ? "Warning"
        : "On track";
    const progressClass =
      remainingAmount < 0
        ? "bg-danger"
        : remainingPercent < 30
        ? "bg-warning"
        : "bg-success";

    return {
      amountSet,
      positiveAmount,
      negativeAmount,
      remainingAmount,
      netUsed,
      usedPercent,
      statusText,
      progressClass,
      isHealthy: remainingAmount >= 0,
    };
  };

  const currentBudget = budgets.find(
    (budget) => budget.monthKey === currentMonthKey
  );
  const currentStatus = currentBudget
    ? getBudgetStatus(currentBudget)
    : {
        amountSet: 0,
        positiveAmount: 0,
        negativeAmount: 0,
        remainingAmount: 0,
        netUsed: 0,
        usedPercent: 0,
        statusText: "No budget set",
        progressClass: "bg-success",
        isHealthy: true,
      };

  const previousMonthKey = addMonths(form.monthKey || currentMonthKey, -1);
  const previousBudget = budgets.find(
    (budget) => budget.monthKey === previousMonthKey
  );
  const previousStatus = previousBudget ? getBudgetStatus(previousBudget) : null;

  const lastThreeExpenseMonths = useMemo(() => {
    const monthlyTotals = transactions
      .filter((transaction) =>
        ["EXPENSE", "TRANSFER"].includes(transaction.type)
      )
      .reduce((acc, transaction) => {
        if (!transaction.date) return acc;
        const key = String(transaction.date).slice(0, 7);
        acc[key] = (acc[key] || 0) + Number(transaction.amount || 0);
        return acc;
      }, {});

    return Object.entries(monthlyTotals)
      .filter(([monthKey]) => monthKey < currentMonthKey)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 3)
      .map(([, amount]) => amount);
  }, [transactions, currentMonthKey]);

  const suggestedBudgetAmount = useMemo(() => {
    if (lastThreeExpenseMonths.length === 0) {
      return Number(budgetSettings.defaultAmount || previousBudget?.amount || 0);
    }
    const average =
      lastThreeExpenseMonths.reduce((sum, amount) => sum + amount, 0) /
      lastThreeExpenseMonths.length;
    return Math.ceil((average * 1.08) / 10) * 10;
  }, [lastThreeExpenseMonths, budgetSettings.defaultAmount, previousBudget]);

  const carryOverAmount =
    budgetSettings.carryOver && previousStatus
      ? Number(previousStatus.remainingAmount || 0)
      : 0;

  const calculatedQuickAmount = Math.max(
    Number(budgetSettings.defaultAmount || 0) + carryOverAmount,
    0
  );

  const saveBudgetSettings = (nextSettings) => {
    setBudgetSettings(nextSettings);
    window.localStorage.setItem(
      "financeTrackerBudgetSettings",
      JSON.stringify(nextSettings)
    );
  };

  const handleDefaultAmountChange = (value) => {
    saveBudgetSettings({ ...budgetSettings, defaultAmount: value });
  };

  const handleCarryOverChange = (checked) => {
    saveBudgetSettings({ ...budgetSettings, carryOver: checked });
  };

  const setAmountFromSuggestion = (amount) => {
    setForm((prev) => ({
      ...prev,
      amount: Number(amount || 0).toFixed(2),
    }));
  };

  const createBudget = (monthKey, amount, successMessage) => {
    setError("");
    setMessage("");

    if (!monthKey) {
      setError("Month is required");
      return Promise.resolve();
    }

    if (usedMonthKeys.has(monthKey)) {
      setError("A budget already exists for this month. Use Edit in the list below.");
      return Promise.resolve();
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Budget amount must be positive");
      return Promise.resolve();
    }

    return onAddBudget({ monthKey, amount })
      .then(() => {
        setMessage(successMessage || "Budget added successfully");
        setForm({ monthKey: currentMonthKey, amount: "" });
      })
      .catch((err) => setError(getApiError(err, "Could not add budget")));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createBudget(form.monthKey, Number(form.amount));
  };

  const handleCopyPrevious = () => {
    if (!previousBudget) {
      setError("No previous month budget exists to copy");
      return;
    }
    setAmountFromSuggestion(Number(previousBudget.amount || 0) + carryOverAmount);
    setMessage(
      budgetSettings.carryOver && previousStatus
        ? "Copied previous month and applied carry-over"
        : "Copied previous month amount"
    );
    setError("");
  };

  const startEdit = (budget) => {
    setError("");
    setMessage("");
    setEditingId(budget.id);
    setEditAmount(Number(budget.amount || 0).toFixed(2));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
  };

  const saveEdit = (budget) => {
    const amount = Number(editAmount);
    setError("");
    setMessage("");

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Budget amount must be positive");
      return;
    }

    onUpdateBudget(budget.id, { amount })
      .then(() => {
        setMessage("Budget updated successfully");
        cancelEdit();
      })
      .catch((err) => setError(getApiError(err, "Could not update budget")));
  };

  const getSummaryBadgeClass = () => {
    if (currentStatus.statusText === "Over budget") {
      return "budget-status-badge budget-status-badge-danger";
    }
    if (currentStatus.statusText === "Warning") {
      return "budget-status-badge budget-status-badge-warning";
    }
    return "budget-status-badge budget-status-badge-success";
  };

  return (
    <div className="page-shell budget-page">
      <div className="page-header">
        <p className="section-kicker mb-1">Planning</p>
        <h1 className="page-title">Monthly Budgets</h1>
        <p className="page-subtitle">
          Set a budget once, reuse it month after month, and let carry-over keep
          the next month honest.
        </p>
      </div>

      <div className="card shadow-sm border-0 mb-4 budget-current-card">
        <div className="card-body">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
            <div>
              <h4 className="mb-1">Current Month Summary</h4>
              <p className="text-muted mb-0">
                Income and withdrawals increase available budget; expenses and
                transfers reduce it.
              </p>
            </div>
            <span className={getSummaryBadgeClass()}>
              {currentStatus.statusText}
            </span>
          </div>

          <div className="row g-3">
            <div className="col-md-3">
              <div className="metric-title">Budget set</div>
              <div className="metric-value mb-0">
                {formatCurrency(currentStatus.amountSet)}
              </div>
            </div>
            <div className="col-md-3">
              <div className="metric-title">Net used</div>
              <div className="metric-value text-danger mb-0">
                {formatCurrency(currentStatus.netUsed)}
              </div>
            </div>
            <div className="col-md-3">
              <div className="metric-title">Remaining</div>
              <div
                className={
                  currentStatus.remainingAmount >= 0
                    ? "metric-value text-success mb-0"
                    : "metric-value text-danger mb-0"
                }
              >
                {formatCurrency(currentStatus.remainingAmount)}
              </div>
            </div>
            <div className="col-md-3">
              <div className="metric-title">Days left</div>
              <div className="metric-value mb-0">{daysLeftInMonth}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
            <div>
              <p className="section-kicker mb-2">Monthly setup</p>
              <h4 className="mb-1">Create one budget for a month</h4>
              <p className="text-muted mb-0">
                Pick the month, use a suggestion if helpful, then save one clear
                budget amount.
              </p>
            </div>
            <div className="budget-suggestion-compact">
              <span>Suggested</span>
              <strong>{formatCurrency(suggestedBudgetAmount)}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-end">
              <div className="col-lg-3 col-md-6">
                <label className="form-label">Month</label>
                <input
                  type="month"
                  className="form-control"
                  value={form.monthKey}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, monthKey: e.target.value }))
                  }
                  required
                />
                {usedMonthKeys.has(form.monthKey) && (
                  <div className="form-text text-danger">
                    A budget already exists for this month.
                  </div>
                )}
              </div>
              <div className="col-lg-3 col-md-6">
                <label className="form-label">Budget Amount ({currency})</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div className="col-lg-3 col-md-6">
                <label className="form-label">Default amount</label>
                <input
                  type="number"
                  className="form-control"
                  value={budgetSettings.defaultAmount}
                  onChange={(e) => handleDefaultAmountChange(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                />
              </div>
              <div className="col-lg-3 col-md-6">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={usedMonthKeys.has(form.monthKey)}
                >
                  Add Budget
                </button>
              </div>
            </div>
          </form>

          <div className="budget-helper-row">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setAmountFromSuggestion(suggestedBudgetAmount)}
            >
              Use smart suggestion
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setAmountFromSuggestion(calculatedQuickAmount)}
              disabled={calculatedQuickAmount <= 0}
            >
              Use default
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleCopyPrevious}
              disabled={!previousBudget}
            >
              Copy previous month
            </button>
            <label className="budget-toggle mb-0">
              <input
                type="checkbox"
                checked={budgetSettings.carryOver}
                onChange={(e) => handleCarryOverChange(e.target.checked)}
              />
              Include carry-over
            </label>
          </div>

          {budgetSettings.carryOver && previousStatus && (
            <p className="budget-carryover-note mb-0">
              Previous month carry-over for {formatMonth(previousMonthKey)}:
              {" "}
              <strong>{formatCurrency(carryOverAmount)}</strong>
            </p>
          )}

          {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
          {message && (
            <div className="alert alert-success mt-3 mb-0">{message}</div>
          )}
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <h4 className="mb-2">Budget Status</h4>
          <p className="text-muted">
            Formula: budget + income + withdrawals - expenses - transfers.
          </p>

          {sortedBudgets.length === 0 ? (
            <p className="text-muted mb-0">No budgets have been inserted yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Month</th>
                    <th>Amount Set</th>
                    <th>Income + Withdraws</th>
                    <th>Expense + Transfer</th>
                    <th>Remain Amount</th>
                    <th>Progress</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBudgets.map((budget) => {
                    const status = getBudgetStatus(budget);
                    const canEdit = budget.monthKey >= currentMonthKey;
                    const isEditing = editingId === budget.id;

                    return (
                      <tr key={budget.id}>
                        <td>
                          <span
                            className={
                              status.isHealthy
                                ? "budget-status-icon budget-status-success"
                                : "budget-status-icon budget-status-failure"
                            }
                            title={status.statusText}
                          >
                            {status.isHealthy ? "✓" : "!"}
                          </span>
                        </td>
                        <td className="fw-semibold">
                          {formatMonth(budget.monthKey)}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              className="form-control form-control-sm budget-edit-input"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              min="0.01"
                              step="0.01"
                            />
                          ) : (
                            <>{formatCurrency(status.amountSet)}</>
                          )}
                        </td>
                        <td className="text-success">
                          {formatCurrency(status.positiveAmount)}
                        </td>
                        <td className="text-danger">
                          {formatCurrency(status.negativeAmount)}
                        </td>
                        <td
                          className={
                            status.remainingAmount >= 0
                              ? "text-success fw-bold"
                              : "text-danger fw-bold"
                          }
                        >
                          {formatCurrency(status.remainingAmount)}
                        </td>
                        <td style={{ minWidth: "150px" }}>
                          <div className="progress budget-progress">
                            <div
                              className={`progress-bar ${status.progressClass}`}
                              role="progressbar"
                              style={{ width: `${status.usedPercent}%` }}
                              aria-valuenow={status.usedPercent}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                          <div className="text-muted small mt-1">
                            {status.statusText}
                          </div>
                        </td>
                        <td className="text-end">
                          {isEditing ? (
                            <div className="d-inline-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => saveEdit(budget)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              disabled={!canEdit}
                              title={
                                canEdit
                                  ? "Edit budget"
                                  : "Past budgets cannot be edited"
                              }
                              onClick={() => startEdit(budget)}
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BudgetPage;
