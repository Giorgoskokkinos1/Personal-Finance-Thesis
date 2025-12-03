// src/pages/Dashboard.js
import React from "react";

function Dashboard({ totalIncome, totalExpenses, balance }) {
  return (
    <div className="mt-4">

      {/* SUMMARY CARDS */}
      <div className="row text-center mb-4">

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title text-success">Total Income</h5>
              <p className="card-text fs-4 fw-bold">
                €{totalIncome.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title text-danger">Total Expenses</h5>
              <p className="card-text fs-4 fw-bold">
                €{totalExpenses.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title text-primary">Balance</h5>
              <p className="card-text fs-4 fw-bold">
                €{balance}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* BODY TEXT */}
      <div className="card border-0 shadow-sm p-4">
        <p className="fs-5 text-secondary">
          Welcome to your Personal Finance Tracker.  
          Use the navigation menu above to manage your transactions, view 
          detailed charts, or upload data from CSV files.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
