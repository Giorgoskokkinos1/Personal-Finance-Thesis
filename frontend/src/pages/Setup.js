// src/pages/Setup.js
import React from "react";
import { Link } from "react-router-dom";

function SetupPage({ onOpenProfileSettings }) {
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
            <h3>Profile Settings</h3>
            <p>Change your display name, email, preferences, and quick stats.</p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default SetupPage;
