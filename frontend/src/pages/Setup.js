// src/pages/Setup.js
import React, { useState } from "react";
import { Link } from "react-router-dom";

function SetupPage({
  onOpenProfileSettings,
  onLoadDemoData,
  onResetWorkspace,
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const runSetupAction = (action, successMessage) => {
    setMessage("");
    setError("");
    setIsWorking(true);

    action()
      .then(() => setMessage(successMessage))
      .catch((err) =>
        setError(err.response?.data?.error || "Action could not be completed")
      )
      .finally(() => setIsWorking(false));
  };

  const handleLoadDemoData = () => {
    const confirmed = window.confirm(
      "Load sample data? This will replace the current account data for this signed-in email."
    );
    if (!confirmed) return;

    runSetupAction(
      onLoadDemoData,
      "Sample workspace loaded. You can now review dashboards, budgets, goals, and charts immediately."
    );
  };

  const handleResetWorkspace = () => {
    const confirmed = window.confirm(
      "Reset this account workspace? This permanently removes transactions, categories, goals, and budgets for this signed-in email."
    );
    if (!confirmed) return;

    runSetupAction(
      onResetWorkspace,
      "Account workspace reset. You can start fresh or load sample data again."
    );
  };

  return (
    <div className="page-shell setup-page">
      <div className="page-header">
        <p className="section-kicker mb-1">Setup</p>
        <h1 className="page-title">App Setup</h1>
        <p className="page-subtitle">
          Manage the things you do occasionally, so the main app stays focused
          on daily money decisions.
        </p>
      </div>

      <div className="setup-final-panel">
        <div>
          <p className="section-kicker mb-1">Workspace tools</p>
          <h3>Prepare account data in seconds</h3>
          <p>
            Load realistic sample records for review, or reset the signed-in
            account when you want a clean start.
          </p>
        </div>
        <div className="setup-final-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleLoadDemoData}
            disabled={isWorking}
          >
            Load sample data
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleResetWorkspace}
            disabled={isWorking}
          >
            Reset workspace
          </button>
        </div>
      </div>

      {message && <div className="alert alert-success mb-0">{message}</div>}
      {error && <div className="alert alert-danger mb-0">{error}</div>}

      <div className="setup-grid">
        <Link className="setup-card" to="/setup/categories">
          <span>C</span>
          <div>
            <h3>Categories</h3>
            <p>Manage income and expense categories used in transactions.</p>
          </div>
        </Link>

        <Link className="setup-card" to="/setup/upload">
          <span>U</span>
          <div>
            <h3>Upload CSV</h3>
            <p>Import transaction files and review rows before saving them.</p>
          </div>
        </Link>

        <button
          type="button"
          className="setup-card"
          onClick={onOpenProfileSettings}
        >
          <span>P</span>
          <div>
            <h3>Account Settings</h3>
            <p>Manage display name, preferences, and account statistics.</p>
          </div>
        </button>

        <button
          type="button"
          className="setup-card"
          onClick={() => setAboutOpen(true)}
        >
          <span>A</span>
          <div>
            <h3>About Project</h3>
            <p>Review the project purpose, technology stack, and security model.</p>
          </div>
        </button>
      </div>

      {aboutOpen && (
        <div className="about-modal-backdrop" role="presentation">
          <section
            className="about-modal"
            role="dialog"
            aria-modal="true"
            aria-label="About Finance Tracker thesis project"
          >
            <div className="d-flex justify-content-between gap-3 mb-3">
              <div>
                <p className="section-kicker mb-1">Project overview</p>
                <h2>Personal Finance Tracker Thesis</h2>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close about project"
                onClick={() => setAboutOpen(false)}
              ></button>
            </div>

            <p>
              A full-stack personal finance web application for recording
              income, expenses, transfers, withdrawals, budgets, goals, CSV
              imports/exports, and visual spending insights.
            </p>

            <div className="about-modal-grid">
              <div>
                <h4>Built With</h4>
                <p>React, Bootstrap, Chart.js, Axios, Node.js, Express, MySQL.</p>
              </div>
              <div>
                <h4>Thesis Focus</h4>
                <p>
                  Practical money tracking, clear workflows, dashboard insights,
                  and secure database-backed REST API design.
                </p>
              </div>
              <div>
                <h4>Authentication</h4>
                <p>
                  User accounts are stored in MySQL with salted password hashes
                  and session tokens. Each account opens a separate workspace.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default SetupPage;
