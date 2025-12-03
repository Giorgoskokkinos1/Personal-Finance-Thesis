// src/pages/Transactions.js
import React from "react";

function TransactionsPage({
  transactions,
  filteredTransactions,
  newTransaction,
  onChange,
  onSubmit,
  filter,
  setFilter,
}) {
  const allCategories = Array.from(new Set(transactions.map((t) => t.category)));

  return (
    <div className="mt-4">

      {/* FILTER PANEL */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="mb-3">Filters</h4>

          <div className="row g-3">

            {/* Month Filter */}
            <div className="col-md-3">
              <label className="form-label">Month</label>
              <select
                className="form-select"
                value={filter.month}
                onChange={(e) => setFilter({ ...filter, month: e.target.value })}
              >
                <option value="ALL">All</option>
                {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="col-md-3">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              >
                <option value="ALL">All</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="col-md-3">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              >
                <option value="ALL">All</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Filter */}
            <div className="col-md-3">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Description or category..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              />
            </div>

          </div>
        </div>
      </div>

      {/* ADD TRANSACTION */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="mb-3">Add Transaction</h4>

          <form onSubmit={onSubmit}>

            <div className="row g-3">

              {/* Date */}
              <div className="col-md-3">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="date"
                  value={newTransaction.date}
                  onChange={onChange}
                  required
                />
              </div>

              {/* Type */}
              <div className="col-md-3">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  name="type"
                  value={newTransaction.type}
                  onChange={onChange}
                >
                  <option value="INCOME">INCOME</option>
                  <option value="EXPENSE">EXPENSE</option>
                </select>
              </div>

              {/* Category */}
              <div className="col-md-3">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-control"
                  name="category"
                  placeholder="e.g. Groceries"
                  value={newTransaction.category}
                  onChange={onChange}
                  required
                />
              </div>

              {/* Amount */}
              <div className="col-md-3">
                <label className="form-label">Amount (€)</label>
                <input
                  type="number"
                  className="form-control"
                  name="amount"
                  placeholder="0.00"
                  value={newTransaction.amount}
                  onChange={onChange}
                  required
                />
              </div>

              {/* Description */}
              <div className="col-md-12">
                <label className="form-label">Description (optional)</label>
                <input
                  type="text"
                  className="form-control"
                  name="description"
                  placeholder="Short note..."
                  value={newTransaction.description}
                  onChange={onChange}
                />
              </div>

            </div>

            <button type="submit" className="btn btn-primary mt-3">
              Add Transaction
            </button>
          </form>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <h4 className="mb-3">All Transactions</h4>

          {filteredTransactions.length === 0 ? (
            <p>No transactions found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Amount (€)</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td className={t.type === "EXPENSE" ? "text-danger fw-bold" : "text-success fw-bold"}>
                        {t.type}
                      </td>
                      <td>{t.category}</td>
                      <td>{parseFloat(t.amount).toFixed(2)}</td>
                      <td>{t.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default TransactionsPage;
