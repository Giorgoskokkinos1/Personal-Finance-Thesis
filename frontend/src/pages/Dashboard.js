// src/pages/Dashboard.js
import React from "react";

function Dashboard({
  totalIncome,
  totalExpenses,
  balance,
  currentMonthExpenses,
  monthlyBudget,
  setMonthlyBudget,
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

  return (
    <div className="mt-4">
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

      {/* BODY TEXT */}
      <div className="card border-0 shadow-sm p-4">
        <p className="fs-5 text-secondary mb-0">
          Welcome to your Personal Finance Tracker. Use the navigation menu
          above to manage your transactions, review detailed charts, or upload
          data from CSV files. The dashboard summarises your overall position
          and highlights if you are close to your monthly budget.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
