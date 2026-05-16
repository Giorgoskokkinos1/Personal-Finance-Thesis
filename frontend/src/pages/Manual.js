// src/pages/Manual.js
import React, { useState } from "react";
import { Link } from "react-router-dom";

const manualSections = [
  {
    id: "first-steps",
    title: "First steps",
    summary: "Set up the account before entering daily records.",
    steps: [
      "Sign in or create an account. Each email opens its own private workspace.",
      "Open Setup, then Categories, and create the income and expense categories you want to use.",
      "Open Goals if you want to track savings, travel, investment, or other financial targets.",
      "Open Budget and create the current monthly budget before reviewing budget guidance.",
    ],
  },
  {
    id: "transactions",
    title: "Transactions",
    summary: "Record the movements that affect your balance and reports.",
    steps: [
      "Use Income for money received, such as salary or refunds.",
      "Use Expense for money spent, such as rent, transport, food, or shopping.",
      "Use Transfer when moving money from cash into a financial goal. This reduces available cash.",
      "Use Withdrawal when moving money back from a goal into cash. This increases available cash.",
      "Use the repeat option for monthly subscriptions such as gym, phone plans, or streaming services.",
    ],
  },
  {
    id: "categories",
    title: "Categories",
    summary: "Keep categories clean so reports stay accurate.",
    steps: [
      "Categories are created from the Setup area, not typed directly inside a transaction.",
      "Choose whether each category is Income or Expense, then give it a clear name.",
      "The app prevents duplicate categories for the same type.",
      "Categories already used by transactions cannot be deleted, which protects historical records.",
    ],
  },
  {
    id: "budget",
    title: "Budget",
    summary: "Understand how monthly budget status is calculated.",
    steps: [
      "Budget remaining equals budget amount plus income and withdrawals, minus expenses and transfers.",
      "Expenses and transfers reduce the available monthly budget.",
      "Income and withdrawals increase the available monthly budget.",
      "If the month goes over budget, dashboard warning areas turn red and the app shows the amount exceeded.",
    ],
  },
  {
    id: "goals",
    title: "Goals",
    summary: "Track progress toward financial targets.",
    steps: [
      "Create a goal by choosing a type, target amount, and expected date.",
      "Transfer money into a goal from the Transactions page.",
      "Withdraw money from a goal only when money should return to cash.",
      "The Target Trend chart shows monthly and cumulative goal movement over time.",
    ],
  },
  {
    id: "csv",
    title: "CSV import and export",
    summary: "Move transactions in and out of the app safely.",
    steps: [
      "Use Upload CSV to import transaction rows from a file.",
      "Required columns are date, type, category, and amount. Description is optional.",
      "Supported transaction types are INCOME, EXPENSE, TRANSFER, and WITHDRAW.",
      "Use Export CSV from Transactions to export the currently filtered list across all pages.",
    ],
  },
  {
    id: "insights",
    title: "Insights and charts",
    summary: "Use the dashboard and charts to understand behaviour.",
    steps: [
      "Home shows balance, budget pressure, monthly trend, alerts, and financial guidance.",
      "Insights shows cashflow, target progress, category spending, and daily spending patterns.",
      "Use filters to review a specific year, month, category, target, or date range.",
      "Treat guidance as decision support. The user remains responsible for final financial decisions.",
    ],
  },
];

function ManualPage() {
  const [activeSection, setActiveSection] = useState(manualSections[0].id);
  const selectedSection =
    manualSections.find((section) => section.id === activeSection) ||
    manualSections[0];

  return (
    <div className="page-shell manual-page">
      <div className="page-header">
        <p className="section-kicker mb-1">Help center</p>
        <h1 className="page-title">User Manual</h1>
        <p className="page-subtitle">
          A practical guide for using the finance tracker correctly, from setup
          to daily records, budgets, goals, CSV files, and insights.
        </p>
      </div>

      <div className="manual-quick-grid">
        <Link to="/setup/categories" className="manual-quick-card">
          <span>1</span>
          <strong>Start with categories</strong>
          <small>Prepare clean income and expense choices.</small>
        </Link>
        <Link to="/transactions" className="manual-quick-card">
          <span>2</span>
          <strong>Add transactions</strong>
          <small>Record income, expenses, transfers, and withdrawals.</small>
        </Link>
        <Link to="/budget" className="manual-quick-card">
          <span>3</span>
          <strong>Review budget</strong>
          <small>Track monthly remaining amount and warnings.</small>
        </Link>
        <Link to="/insights" className="manual-quick-card">
          <span>4</span>
          <strong>Read insights</strong>
          <small>Use charts and guidance to understand spending.</small>
        </Link>
      </div>

      <div className="manual-layout">
        <aside className="manual-nav" aria-label="Manual sections">
          {manualSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={section.id === activeSection ? "active" : ""}
              onClick={() => setActiveSection(section.id)}
            >
              <span>{section.title}</span>
              <small>{section.summary}</small>
            </button>
          ))}
        </aside>

        <section className="manual-content-card">
          <p className="section-kicker mb-2">How to use</p>
          <h2>{selectedSection.title}</h2>
          <p className="manual-summary">{selectedSection.summary}</p>

          <ol className="manual-step-list">
            {selectedSection.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

export default ManualPage;
