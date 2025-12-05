// src/pages/Transactions.js
import React, { useState } from "react";

function TransactionsPage({
  transactions,
  filteredTransactions,
  newTransaction,
  onChange,
  onSubmit,
  filter,
  setFilter,
  onDeleteTransaction,
  onUpdateTransaction,
  totalIncome,
  totalExpenses,
  balance,
}) {
  const allCategories = Array.from(new Set(transactions.map((t) => t.category)));

  const balanceNumber = parseFloat(balance || 0);
  const balanceClass =
    balanceNumber >= 0 ? "balance-positive" : "balance-negative";

  // Local state for edit mode
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    id: null,
    date: "",
    type: "INCOME",
    category: "",
    amount: "",
    description: "",
  });

  const startEdit = (tx) => {
    let dateValue = "";
    if (tx.date) {
      const d = new Date(tx.date);
      if (!Number.isNaN(d.getTime())) {
        dateValue = d.toISOString().slice(0, 10); // yyyy-mm-dd
      }
    }

    setEditingId(tx.id);
    setEditForm({
      id: tx.id,
      date: dateValue,
      type: tx.type,
      category: tx.category || "",
      amount: tx.amount,
      description: tx.description || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    if (!editForm.id) return;

    const payload = {
      ...editForm,
      amount: parseFloat(editForm.amount),
    };

    onUpdateTransaction(payload);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // ---------------------------------------
  // Export filtered transactions to CSV
  // ---------------------------------------
  const handleExportCsv = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      alert("There are no transactions to export.");
      return;
    }

    const headers = ["date", "type", "category", "amount", "description"];

    const escapeValue = (value) => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredTransactions.map((t) => {
      let csvDate = "";
      if (t.date) {
        const d = new Date(t.date);
        if (!Number.isNaN(d.getTime())) {
          // use yyyy-mm-dd for Excel-friendliness
          csvDate = d.toISOString().slice(0, 10);
        } else {
          csvDate = t.date;
        }
      }

      return [
        escapeValue(csvDate),
        escapeValue(t.type),
        escapeValue(t.category),
        escapeValue(parseFloat(t.amount).toFixed(2)),
        escapeValue(t.description),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "transactions_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-4">
      {/* FILTER PANEL */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="mb-3">Filters</h4>

          <div className="row g-3">
            {/* Month */}
            <div className="col-md-3">
              <label className="form-label">Month</label>
              <select
                className="form-select"
                value={filter.month}
                onChange={(e) =>
                  setFilter({ ...filter, month: e.target.value })
                }
              >
                <option value="ALL">All</option>
                {[
                  "01",
                  "02",
                  "03",
                  "04",
                  "05",
                  "06",
                  "07",
                  "08",
                  "09",
                  "10",
                  "11",
                  "12",
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="col-md-3">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={filter.type}
                onChange={(e) =>
                  setFilter({ ...filter, type: e.target.value })
                }
              >
                <option value="ALL">All</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>

            {/* Category */}
            <div className="col-md-3">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={filter.category}
                onChange={(e) =>
                  setFilter({ ...filter, category: e.target.value })
                }
              >
                <option value="ALL">All</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="col-md-3">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Description or category..."
                value={filter.search}
                onChange={(e) =>
                  setFilter({ ...filter, search: e.target.value })
                }
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

      {/* SUMMARY STRIP FOR FILTERED LIST */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div>
                <div className="metric-title">Income (filtered)</div>
                <div className="metric-value text-success mb-0">
                  €{totalIncome.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div>
                <div className="metric-title">Expenses (filtered)</div>
                <div className="metric-value text-danger mb-0">
                  €{totalExpenses.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div>
                <div className="metric-title">Balance (filtered)</div>
                <div className={`metric-value mb-0 ${balanceClass}`}>
                  €{Number.isNaN(balanceNumber) ? "0.00" : balanceNumber.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">All Transactions</h4>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={handleExportCsv}
            >
              Export CSV
            </button>
          </div>

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
                    <th style={{ width: "150px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => {
                    let formattedDate = t.date;
                    if (t.date) {
                      const d = new Date(t.date);
                      if (!Number.isNaN(d.getTime())) {
                        formattedDate = d.toLocaleDateString("en-GB");
                      }
                    }

                    const isEditing = editingId === t.id;

                    if (isEditing) {
                      return (
                        <tr key={t.id}>
                          <td>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              name="date"
                              value={editForm.date}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              name="type"
                              value={editForm.type}
                              onChange={handleEditChange}
                            >
                              <option value="INCOME">INCOME</option>
                              <option value="EXPENSE">EXPENSE</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              name="category"
                              value={editForm.category}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              name="amount"
                              value={editForm.amount}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              name="description"
                              value={editForm.description}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary me-2"
                              onClick={handleEditSave}
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
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={t.id}>
                        <td>{formattedDate}</td>
                        <td
                          className={
                            t.type === "EXPENSE"
                              ? "text-danger fw-bold"
                              : "text-success fw-bold"
                          }
                        >
                          {t.type}
                        </td>
                        <td>{t.category}</td>
                        <td>{parseFloat(t.amount).toFixed(2)}</td>
                        <td>{t.description}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary me-2"
                            onClick={() => startEdit(t)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => onDeleteTransaction(t.id)}
                          >
                            Delete
                          </button>
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

export default TransactionsPage;
