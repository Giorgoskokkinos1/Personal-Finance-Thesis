// src/pages/Dashboard.js
import React, { useState } from "react";

function Dashboard({
  totalIncome,
  totalExpenses,
  balance,
  currentBudget,
  transactions,
  monthsForTrend,
  budgets = [],
  targets = [],
  formatCurrency = (amount) => `EUR ${Number(amount || 0).toFixed(2)}`,
}) {
  const incomeNumber = Number(totalIncome || 0);
  const expenseNumber = Number(totalExpenses || 0);
  const balanceNumber = Number(balance || 0);
  const balanceClass = balanceNumber >= 0 ? "text-success" : "text-danger";

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
  const [coachFocus, setCoachFocus] = useState("overview");

  const getTotalsForMonthKey = (monthKey) => {
    if (!monthKey) return { income: 0, expenses: 0 };

    const monthTransactions = transactions.filter((transaction) => {
      if (!transaction.date) return false;
      return String(transaction.date).slice(0, 7) === monthKey;
    });

    const income = monthTransactions
      .filter((transaction) => transaction.type === "INCOME")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const expenses = monthTransactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    return { income, expenses };
  };

  const currentTotals = getTotalsForMonthKey(selectedCurrentMonth);
  const previousTotals = getTotalsForMonthKey(selectedPreviousMonth);

  const currentMonthLabel =
    monthsForTrend.find((month) => month.key === selectedCurrentMonth)?.label ||
    "n/a";
  const previousMonthLabel =
    monthsForTrend.find((month) => month.key === selectedPreviousMonth)?.label ||
    "n/a";

  const expenseDelta = currentTotals.expenses - (previousTotals.expenses || 0);
  const expenseDeltaPercent =
    (previousTotals.expenses || 0) > 0
      ? (expenseDelta / previousTotals.expenses) * 100
      : null;

  const incomeDelta = currentTotals.income - (previousTotals.income || 0);
  const incomeDeltaPercent =
    (previousTotals.income || 0) > 0
      ? (incomeDelta / previousTotals.income) * 100
      : null;

  const expenseTrendClass =
    expenseDelta > 0 ? "text-danger" : expenseDelta < 0 ? "text-success" : "";
  const incomeTrendClass =
    incomeDelta > 0 ? "text-success" : incomeDelta < 0 ? "text-danger" : "";

  const formatChange = (value) => {
    if (value === null) return "n/a";
    return `${value.toFixed(1)}%`;
  };

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(daysInMonth - dayOfMonth, 0);
  const monthProgressPercent = (dayOfMonth / daysInMonth) * 100;

  const currentMonthTransactions = transactions.filter(
    (transaction) =>
      transaction.date &&
      String(transaction.date).slice(0, 7) === currentMonthKey
  );

  const currentMonthExpenseTransactions = currentMonthTransactions.filter(
    (transaction) => transaction.type === "EXPENSE"
  );

  const currentMonthNegative = currentMonthTransactions
    .filter((transaction) =>
      ["EXPENSE", "TRANSFER"].includes(transaction.type)
    )
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const currentMonthPositive = currentMonthTransactions
    .filter((transaction) =>
      ["INCOME", "WITHDRAW"].includes(transaction.type)
    )
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const budgetAmount = Number(currentBudget?.amount || 0);
  const budgetRemaining =
    budgetAmount + currentMonthPositive - currentMonthNegative;
  const isOverMonthlyBudget = budgetAmount > 0 && budgetRemaining < 0;
  const budgetUsedNet = Math.max(currentMonthNegative - currentMonthPositive, 0);
  const budgetUsedPercent =
    budgetAmount > 0 ? Math.min((budgetUsedNet / budgetAmount) * 100, 140) : 0;
  const dailyAverageSpend = dayOfMonth > 0 ? currentMonthNegative / dayOfMonth : 0;
  const projectedMonthSpend = dailyAverageSpend * daysInMonth;
  const projectedRemaining =
    budgetAmount + currentMonthPositive - projectedMonthSpend;
  const safeToSpendDaily =
    daysLeft > 0 ? Math.max(budgetRemaining / daysLeft, 0) : Math.max(budgetRemaining, 0);

  const budgetPaceText =
    budgetAmount <= 0
      ? "Set budget"
      : budgetUsedPercent > monthProgressPercent + 15
      ? "High usage"
      : budgetUsedPercent > monthProgressPercent
      ? "Monitor pace"
      : "Controlled";

  const healthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        72 +
          (balanceNumber >= 0 ? 8 : -18) +
          (budgetAmount > 0 && budgetRemaining >= 0 ? 10 : budgetAmount > 0 ? -20 : -8) +
          (projectedRemaining >= 0 ? 6 : -12) +
          (currentMonthExpenseTransactions.length > 0 ? 4 : -2)
      )
    )
  );
  const healthLabel =
    healthScore >= 82
      ? "Strong"
      : healthScore >= 65
      ? "Stable"
      : healthScore >= 45
      ? "Needs attention"
      : "Critical";

  const categoryTotals = currentMonthExpenseTransactions.reduce(
    (acc, transaction) => {
      const key = transaction.category || "Uncategorized";
      acc[key] = (acc[key] || 0) + Number(transaction.amount || 0);
      return acc;
    },
    {}
  );

  let topCategory = null;
  let topCategoryAmount = 0;

  Object.entries(categoryTotals).forEach(([category, total]) => {
    if (total > topCategoryAmount) {
      topCategory = category;
      topCategoryAmount = total;
    }
  });

  const insights = [];

  if (currentBudget) {
    insights.push(
      `A monthly budget of ${formatCurrency(
        currentBudget.amount
      )} is set for this month. Open the Budget tab for the full status.`
    );
  } else {
    insights.push("No budget is set for the current month yet.");
  }

  const pulseCards = [
    {
      label: "Budget usage",
      value:
        budgetAmount > 0
          ? `${Math.min(budgetUsedPercent, 999).toFixed(0)}%`
          : "No budget",
      detail: `${monthProgressPercent.toFixed(0)}% of month passed`,
      tone:
        budgetAmount > 0 && budgetUsedPercent > monthProgressPercent + 15
          ? "danger"
          : budgetAmount > 0 && budgetUsedPercent > monthProgressPercent
          ? "warning"
          : "success",
    },
    {
      label: "Daily allowance",
      value: formatCurrency(safeToSpendDaily),
      detail: daysLeft > 0 ? `per day for ${daysLeft} days` : "month ends today",
      tone: safeToSpendDaily > 0 ? "success" : "danger",
    },
    {
      label: "Forecast",
      value: formatCurrency(projectedRemaining),
      detail: "projected remaining",
      tone: projectedRemaining >= 0 ? "success" : "danger",
    },
  ];

  const smartInsights = [
    budgetAmount <= 0
      ? {
          title: "Budget not set",
          text: "Set this month's budget to activate usage, forecast, and daily allowance guidance.",
          tone: "warning",
        }
      : {
          title: budgetPaceText,
          text: `You have used ${budgetUsedPercent.toFixed(
            0
          )}% of budget while ${monthProgressPercent.toFixed(0)}% of the month has passed.`,
          tone:
            budgetUsedPercent > monthProgressPercent + 15
              ? "danger"
              : budgetUsedPercent > monthProgressPercent
              ? "warning"
              : "success",
        },
    topCategory
      ? {
          title: "Largest spend category",
          text: `${topCategory} is leading this month at ${formatCurrency(topCategoryAmount)}.`,
          tone: "neutral",
        }
      : {
          title: "No category concentration",
          text: "No expense category is currently dominating this month's activity.",
          tone: "success",
        },
    {
      title: projectedRemaining >= 0 ? "Forecast within plan" : "Forecast risk",
      text:
        projectedRemaining >= 0
          ? `At the current pace, you may finish with ${formatCurrency(projectedRemaining)} remaining.`
          : `At the current pace, you may exceed budget by ${formatCurrency(Math.abs(projectedRemaining))}.`,
      tone: projectedRemaining >= 0 ? "success" : "danger",
    },
  ];

  const previousMonthKey =
    monthsForTrend.length > 1
      ? monthsForTrend[monthsForTrend.length - 2].key
      : "";
  const previousMonthTransactions = transactions.filter(
    (transaction) =>
      transaction.date && String(transaction.date).slice(0, 7) === previousMonthKey
  );
  const previousMonthNegative = previousMonthTransactions
    .filter((transaction) =>
      ["EXPENSE", "TRANSFER"].includes(transaction.type)
    )
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const monthSpendDelta =
    previousMonthNegative > 0
      ? ((currentMonthNegative - previousMonthNegative) / previousMonthNegative) *
        100
      : null;

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const activeTargets = targets.filter((target) => target.status !== "DISABLED");
  const targetAtRisk = activeTargets.find((target) => {
    const targetAmount = Number(target.targetAmount || 0);
    const currentAmount = Number(target.currentAmount || 0);
    if (!targetAmount || currentAmount >= targetAmount) return false;

    const expectedDate = new Date(target.expectedDate);
    if (Number.isNaN(expectedDate.getTime())) return false;

    const totalWindow = Math.max(
      expectedDate.getTime() - new Date(now.getFullYear(), 0, 1).getTime(),
      1
    );
    const elapsedWindow = Math.max(
      now.getTime() - new Date(now.getFullYear(), 0, 1).getTime(),
      1
    );
    const expectedProgress = Math.min(elapsedWindow / totalWindow, 1);
    const actualProgress = currentAmount / targetAmount;
    return actualProgress + 0.12 < expectedProgress;
  });

  const coachCards = [
    {
      focus: "overview",
      title:
        healthScore >= 70 ? "Financial position is stable" : "Reduce monthly pressure",
      text:
        healthScore >= 70
          ? "Your balance remains positive, but budget pace should continue to be monitored."
          : "Current activity is placing pressure on the month. Prioritise reducing flexible expenses and protecting cash balance.",
      action:
        projectedRemaining >= 0
          ? `Maintain daily spending near ${formatCurrency(safeToSpendDaily)}.`
          : `Reduce planned spending by approximately ${formatCurrency(Math.abs(projectedRemaining))} before month end.`,
      tone: healthScore >= 70 ? "success" : "danger",
    },
    {
      focus: "budget",
      title:
        budgetAmount <= 0
          ? "Add a budget"
          : budgetUsedPercent > monthProgressPercent
          ? "Budget usage is ahead of schedule"
          : "Budget usage is controlled",
      text:
        budgetAmount <= 0
          ? "A current-month budget unlocks usage, forecast, and daily allowance guidance."
          : `Budget used is ${budgetUsedPercent.toFixed(
              0
            )}% while the month is ${monthProgressPercent.toFixed(0)}% complete.`,
      action:
        budgetAmount <= 0
          ? "Create this month's budget in the Budget tab."
          : `Remaining budget is ${formatCurrency(budgetRemaining)}.`,
      tone:
        budgetAmount <= 0
          ? "warning"
          : budgetUsedPercent > monthProgressPercent + 15
          ? "danger"
          : budgetUsedPercent > monthProgressPercent
          ? "warning"
          : "success",
    },
    {
      focus: "categories",
      title: topCategory
        ? `${topCategory} requires attention`
        : "No category concentration",
      text: topCategory
        ? `${topCategory} is the largest expense area this month at ${formatCurrency(topCategoryAmount)}.`
        : "There is not enough expense activity this month to identify a top category.",
      action:
        sortedCategories.length > 1
          ? `Next biggest: ${sortedCategories
              .slice(1)
              .map(([name]) => name)
              .join(", ")}.`
          : "Add more transactions to get category coaching.",
      tone: topCategory ? "neutral" : "success",
    },
    {
      focus: "targets",
      title: targetAtRisk ? "A target may be behind pace" : "Target progress is on track",
      text: targetAtRisk
        ? `${targetAtRisk.name} appears behind its expected progress for the selected date.`
        : activeTargets.length > 0
        ? "No active target appears clearly behind pace based on current progress."
        : "Create a savings, travel, investment, or other target to activate target coaching.",
      action: targetAtRisk
        ? "Consider a smaller extra transfer this month if budget allows."
        : "Keep target transfers consistent.",
      tone: targetAtRisk ? "warning" : "success",
    },
  ];

  const selectedCoachCards =
    coachFocus === "overview"
      ? coachCards
      : coachCards.filter((card) => card.focus === coachFocus);

  const coachHeadline =
    projectedRemaining < 0
      ? "Spending pace is above plan; reduce flexible costs before month end."
      : budgetAmount <= 0
      ? "Create a monthly budget to activate tailored guidance."
      : monthSpendDelta !== null && monthSpendDelta > 25
      ? "Spending is increasing compared with last month."
      : "Current spending pace is within plan.";

  if (currentMonthExpenseTransactions.length === 0) {
    insights.push("No expenses have been recorded for the current month yet.");
  } else if (topCategory) {
    insights.push(
      `The highest expense category this month is "${topCategory}" with a total of ${formatCurrency(
        topCategoryAmount
      )}.`
    );
  }

  return (
    <div className="page-shell dashboard-page">
      <div
        className={`card hero-card border-0 shadow-sm mb-4 ${
          isOverMonthlyBudget ? "hero-card-danger" : ""
        }`}
      >
        <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between">
          <div className="hero-text">
            <h1 className="hero-title mb-1">Welcome to your Finance Tracker</h1>
            <p className="hero-subtitle mb-0">
              Monitor cashflow, budget pressure, and goal progress from one
              secure financial workspace.
            </p>
          </div>
          <div className="hero-highlight mt-3 mt-md-0 text-md-end">
            <div className="hero-highlight-label text-muted">
              Current balance
            </div>
            <div className={`hero-highlight-value ${balanceClass}`}>
              {formatCurrency(balanceNumber)}
            </div>
            <div className="hero-highlight-caption text-muted">
              Income minus expenses, transfers, and withdrawals
            </div>
            {isOverMonthlyBudget && (
              <div className="budget-alert-chip">
                Over monthly budget by {formatCurrency(Math.abs(budgetRemaining))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card kpi-card shadow-sm border-0">
            <div className="card-body">
              <div className="kpi-label">Total Income</div>
              <div className="kpi-value text-success">
                {formatCurrency(incomeNumber)}
              </div>
              <div className="kpi-subtitle text-muted">
                All recorded income
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card kpi-card shadow-sm border-0">
            <div className="card-body">
              <div className="kpi-label">Total Expenses</div>
              <div className="kpi-value text-danger">
                {formatCurrency(expenseNumber)}
              </div>
              <div className="kpi-subtitle text-muted">
                All recorded expenses
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card kpi-card shadow-sm border-0">
            <div className="card-body">
              <div className="kpi-label">Balance</div>
              <div className={`kpi-value ${balanceClass}`}>
                {formatCurrency(balanceNumber)}
              </div>
              <div className="kpi-subtitle text-muted">
                Net filtered movement
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`card financial-pulse-card shadow-sm border-0 mb-4 ${
          isOverMonthlyBudget ? "financial-pulse-card-danger" : ""
        }`}
      >
        <div className="card-body">
          <div className="d-flex flex-column flex-xl-row justify-content-between gap-4">
            <div className="pulse-score-panel">
              <p className="section-kicker mb-3">Financial Pulse</p>
              <div className="pulse-score-ring">
                <div>
                  <strong>{healthScore}</strong>
                  <span>{healthLabel}</span>
                </div>
              </div>
              <p className="text-muted mb-0">
                Tracks budget pace, month-end forecast, and available spending
                capacity.
              </p>
            </div>

            <div className="pulse-content">
              <div className="pulse-meter-row">
                <div>
                  <div className="metric-title">Budget usage meter</div>
                  <div className="pulse-meter-caption">
                    Budget used versus month elapsed
                  </div>
                </div>
                <div className="pulse-meter-values">
                  <span>{budgetUsedPercent.toFixed(0)}% used</span>
                  <span>{monthProgressPercent.toFixed(0)}% month</span>
                </div>
              </div>
              <div className="pulse-meter">
                <div
                  className="pulse-meter-budget"
                  style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
                ></div>
                <span
                  className="pulse-meter-today"
                  style={{ left: `${Math.min(monthProgressPercent, 100)}%` }}
                ></span>
              </div>

              <div className="pulse-card-grid">
                {pulseCards.map((card) => (
                  <div className={`pulse-mini-card pulse-${card.tone}`} key={card.label}>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <small>{card.detail}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="smart-insight-grid mt-4">
            {smartInsights.map((item) => (
              <div className={`smart-insight smart-insight-${item.tone}`} key={item.title}>
                <span></span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card money-coach-card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
            <div>
              <p className="section-kicker mb-3">Money Coach</p>
              <h4 className="mb-2">Financial guidance for this month</h4>
              <p className="text-muted mb-0">
                {coachHeadline}
              </p>
            </div>

            <div className="coach-focus-tabs" aria-label="Money coach focus">
              {[
                ["overview", "Overview"],
                ["budget", "Budget"],
                ["categories", "Categories"],
                ["targets", "Targets"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={coachFocus === key ? "active" : ""}
                  onClick={() => setCoachFocus(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="coach-body-grid">
            <div className="coach-command-panel">
              <div className="metric-title">Recommended next action</div>
              <strong>
                {projectedRemaining < 0
                  ? "Reduce discretionary spending"
                  : budgetAmount <= 0
                  ? "Create monthly budget"
                  : targetAtRisk
                  ? "Review target funding"
                  : "Maintain current plan"}
              </strong>
              <p>
                {projectedRemaining < 0
                  ? `Your current pace may exceed budget by ${formatCurrency(
                      Math.abs(projectedRemaining)
                    )}.`
                  : budgetAmount <= 0
                  ? "A budget provides the baseline needed for reliable guidance."
                  : targetAtRisk
                  ? `${targetAtRisk.name} may require an adjusted funding plan.`
                  : `Safe daily spend is around ${formatCurrency(
                      safeToSpendDaily
                    )}.`}
              </p>
            </div>

            <div className="coach-card-grid">
              {selectedCoachCards.map((card) => (
                <article
                  className={`coach-card coach-card-${card.tone}`}
                  key={card.title}
                >
                  <span>{card.focus}</span>
                  <h5>{card.title}</h5>
                  <p>{card.text}</p>
                  <strong>{card.action}</strong>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

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
                {monthsForTrend.map((month) => (
                  <option key={month.key} value={month.key}>
                    {month.label}
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
                {monthsForTrend.map((month) => (
                  <option key={month.key} value={month.key}>
                    {month.label}
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
                  <td>{formatCurrency(previousTotals.income || 0)}</td>
                  <td>{formatCurrency(currentTotals.income || 0)}</td>
                  <td className={incomeTrendClass}>
                    {formatChange(incomeDeltaPercent)}
                  </td>
                </tr>
                <tr>
                  <td className="fw-semibold">Expenses</td>
                  <td>{formatCurrency(previousTotals.expenses || 0)}</td>
                  <td>{formatCurrency(currentTotals.expenses || 0)}</td>
                  <td className={expenseTrendClass}>
                    {formatChange(expenseDeltaPercent)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="dashboard-insights" className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="mb-1">Insights & Alerts</h4>
          <p className="text-muted mb-3 small">
            Automatic observations based on the current month.
          </p>
          <ul className="mb-0">
            {insights.map((text, index) => (
              <li key={index} className="mb-1">
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
