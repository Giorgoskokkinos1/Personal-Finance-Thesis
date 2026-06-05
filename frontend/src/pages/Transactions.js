// src/pages/Transactions.js
import React, { useState } from "react";
import {
  forgetCategoryChoice,
  suggestTransactionCategory,
} from "../utils/smartCategorization";

function TransactionsPage({
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
  totalTransfers,
  totalWithdrawals,
  balance,
  targets,
  categories,
  categorySuggestion,
  currency = "EUR",
  formatCurrency = (amount) => `€${Number(amount || 0).toFixed(2)}`,
  formatDate = (dateValue) => dateValue,
}) {
  const allCategories = categories || [];
  const newTransactionCategories = allCategories.filter(
    (cat) => cat.type === newTransaction.type
  );

  const balanceNumber = parseFloat(balance || 0);
  const balanceClass =
    balanceNumber >= 0 ? "balance-positive" : "balance-negative";

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    id: null,
    date: "",
    type: "INCOME",
    category: "",
    amount: "",
    description: "",
    targetId: "",
    categoryTouched: false,
  });
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;
  const totalPages = Math.max(
    Math.ceil(filteredTransactions.length / pageSize),
    1
  );
  const firstRowIndex = (currentPage - 1) * pageSize;
  const pagedTransactions = filteredTransactions.slice(
    firstRowIndex,
    firstRowIndex + pageSize
  );

  const isTargetTransaction =
    newTransaction.type === "TRANSFER" || newTransaction.type === "WITHDRAW";

  const updateFilter = (nextFilter) => {
    setFilter(nextFilter);
    // Filter changes can shrink the result set, so return to the first page.
    setCurrentPage(1);
  };

  const startEdit = (tx) => {
    let dateValue = "";
    if (tx.date) {
      const d = new Date(tx.date);
      if (!Number.isNaN(d.getTime())) {
        dateValue = d.toISOString().slice(0, 10);
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
      targetId: tx.target_id || "",
      categoryTouched: true,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => {
      if (name === "type") {
        const isTargetType = value === "TRANSFER" || value === "WITHDRAW";
        const suggestion = suggestTransactionCategory({
          type: value,
          description: prev.description,
          categories: allCategories,
        });

        return {
          ...prev,
          type: value,
          category: isTargetType ? "" : suggestion?.category || "",
          targetId: isTargetType ? prev.targetId : "",
          categoryTouched: false,
        };
      }

      if (name === "description") {
        const suggestion = suggestTransactionCategory({
          type: prev.type,
          description: value,
          categories: allCategories,
        });

        return {
          ...prev,
          description: value,
          category:
            suggestion && suggestion.autoApply !== false && !prev.categoryTouched
              ? suggestion.category
              : prev.category,
        };
      }

      if (name === "category") {
        return { ...prev, category: value, categoryTouched: true };
      }

      return { ...prev, [name]: value };
    });
  };

  const editSuggestion = suggestTransactionCategory({
    type: editForm.type,
    description: editForm.description,
    categories: allCategories,
  });

  const forgetNewSuggestion = () => {
    forgetCategoryChoice({
      type: newTransaction.type,
      description: newTransaction.description,
    });
    onChange({
      target: {
        name: "description",
        value: newTransaction.description,
      },
    });
  };

  const forgetEditSuggestion = () => {
    forgetCategoryChoice({
      type: editForm.type,
      description: editForm.description,
    });
    setEditForm((prev) => ({
      ...prev,
      category:
        editSuggestion?.category === prev.category && !prev.categoryTouched
          ? ""
          : prev.category,
    }));
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    if (!editForm.id) return;

    onUpdateTransaction({
      ...editForm,
      amount: parseFloat(editForm.amount),
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleExportCsv = async () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      alert("There are no transactions to export.");
      return;
    }

    // Semicolon delimiter matches the app import flow and common European CSV exports.
    const delimiter = ";";
    const headers = ["date", "type", "category", "amount", "description"];
    const numberFormatter = new Intl.NumberFormat(undefined, {
      useGrouping: false,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const escapeValue = (value) => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (/[;"\r\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredTransactions.map((t) => {
      let csvDate = "";
      if (t.date) {
        const d = new Date(t.date);
        csvDate = Number.isNaN(d.getTime()) ? t.date : d.toISOString().slice(0, 10);
      }

      return [
        escapeValue(csvDate),
        escapeValue(t.type),
        escapeValue(t.category),
        escapeValue(numberFormatter.format(parseFloat(t.amount) || 0)),
        escapeValue(t.description),
      ].join(delimiter);
    });

    const csvContent = [headers.join(delimiter), ...rows].join("\r\n");
    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    if ("showSaveFilePicker" in window) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: "transactions_export.csv",
          types: [
            {
              description: "CSV file",
              accept: { "text/csv": [".csv"] },
            },
          ],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch (error) {
        if (error.name !== "AbortError") {
          alert("The CSV file could not be saved. Please try again.");
        }
      }
      return;
    }

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "transactions_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderPagination = () => {
    if (filteredTransactions.length === 0) return null;

    return (
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-3">
        <span className="text-muted small">
          Showing {firstRowIndex + 1}-
          {Math.min(firstRowIndex + pageSize, filteredTransactions.length)} of{" "}
          {filteredTransactions.length} transactions
        </span>

        <div className="btn-group">
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={currentPage >= totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(page + 1, totalPages))
            }
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page-shell transactions-page">
      <div className="page-header">
        <p className="section-kicker mb-1">Ledger</p>
        <h1 className="page-title">Transactions</h1>
        <p className="page-subtitle">
          Add, filter, edit, and export your income and expense records.
        </p>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="mb-3">Add Transaction</h4>

          <form onSubmit={onSubmit}>
            <div className="row g-3">
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
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="WITHDRAW">WITHDRAW</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Category</label>
                {isTargetTransaction ? (
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Filled from selected target"
                    value=""
                    disabled
                  />
                ) : (
                  <select
                    className="form-select"
                    name="category"
                    value={newTransaction.category}
                    onChange={onChange}
                    required
                  >
                    <option value="">Select category</option>
                    {newTransactionCategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
                {!isTargetTransaction && categorySuggestion && (
                  <div className="smart-category-hint mt-2">
                    <span>Smart suggestion</span>
                    <strong>{categorySuggestion.category}</strong>
                    <small>
                      {categorySuggestion.confidence} confidence,{" "}
                      {categorySuggestion.reason}
                    </small>
                    {categorySuggestion.autoApply === false && (
                      <button
                        type="button"
                        className="smart-category-forget"
                        onClick={forgetNewSuggestion}
                      >
                        Forget this
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="col-md-3">
                <label className="form-label">Amount ({currency})</label>
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

              {isTargetTransaction && (
                <div className="col-md-6">
                  <label className="form-label">Target</label>
                  <select
                    className="form-select"
                    name="targetId"
                    value={newTransaction.targetId || ""}
                    onChange={onChange}
                    required
                  >
                    <option value="">Select target</option>
                    {targets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.name} ({target.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              <div className="col-md-6">
                <label className="form-label">
                  Repeat monthly (subscriptions)
                </label>
                <select
                  className="form-select"
                  name="repeatMonths"
                  value={newTransaction.repeatMonths || "0"}
                  onChange={onChange}
                >
                  <option value="0">Do not repeat</option>
                  <option value="3">Every month for 3 months</option>
                  <option value="6">Every month for 6 months</option>
                  <option value="12">Every month for 12 months</option>
                </select>
              </div>
              <div className="col-md-6 d-flex align-items-end">
                <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                  Use this for things like Spotify, Netflix, gym, phone plan.
                  The app will create one transaction per month.
                </p>
              </div>
            </div>

            <button type="submit" className="btn btn-primary mt-3">
              Add Transaction
            </button>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="mb-3">Filters</h4>

          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Month</label>
              <select
                className="form-select"
                value={filter.month}
                onChange={(e) =>
                  updateFilter({ ...filter, month: e.target.value })
                }
              >
                <option value="ALL">All</option>
                {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={filter.type}
                onChange={(e) =>
                  updateFilter({ ...filter, type: e.target.value })
                }
              >
                <option value="ALL">All</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
                <option value="TRANSFER">Transfer</option>
                <option value="WITHDRAW">Withdraw</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={filter.category}
                onChange={(e) =>
                  updateFilter({ ...filter, category: e.target.value })
                }
              >
                <option value="ALL">All</option>
                {allCategories.map((cat) => (
                  <option key={`${cat.type}-${cat.name}`} value={cat.name}>
                    {cat.name} ({cat.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Description or category..."
                value={filter.search}
                onChange={(e) =>
                  updateFilter({ ...filter, search: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>

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
            <>
              <div className="table-responsive">
                <table className="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Amount ({currency})</th>
                      <th>Description</th>
                      <th style={{ width: "150px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedTransactions.map((t) => {
                      let formattedDate = t.date;
                      if (t.date) {
                        const d = new Date(t.date);
                        if (!Number.isNaN(d.getTime())) {
                          formattedDate = formatDate(t.date);
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
                                <option value="TRANSFER">TRANSFER</option>
                                <option value="WITHDRAW">WITHDRAW</option>
                              </select>
                            </td>
                            <td>
                              {editForm.type === "TRANSFER" ||
                              editForm.type === "WITHDRAW" ? (
                                <select
                                  className="form-select form-select-sm"
                                  name="targetId"
                                  value={editForm.targetId || ""}
                                  onChange={handleEditChange}
                                >
                                  <option value="">Select target</option>
                                  {targets.map((target) => (
                                    <option key={target.id} value={target.id}>
                                      {target.name} ({target.type})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <select
                                  className="form-select form-select-sm"
                                  name="category"
                                  value={editForm.category}
                                  onChange={handleEditChange}
                                >
                                  <option value="">Select category</option>
                                  {allCategories
                                    .filter((cat) => cat.type === editForm.type)
                                    .map((cat) => (
                                      <option key={cat.id} value={cat.name}>
                                        {cat.name}
                                      </option>
                                    ))}
                                </select>
                              )}
                              {editForm.type !== "TRANSFER" &&
                                editForm.type !== "WITHDRAW" &&
                                editSuggestion &&
                                editSuggestion.category === editForm.category && (
                                  <div className="smart-category-hint smart-category-hint-sm mt-2">
                                    <span>Suggested</span>
                                    <strong>{editSuggestion.category}</strong>
                                    {editSuggestion.autoApply === false && (
                                      <button
                                        type="button"
                                        className="smart-category-forget"
                                        onClick={forgetEditSuggestion}
                                      >
                                        Forget
                                      </button>
                                    )}
                                  </div>
                                )}
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
                                : t.type === "INCOME"
                                ? "text-success fw-bold"
                                : t.type === "WITHDRAW"
                                ? "text-withdraw fw-bold"
                                : "text-primary fw-bold"
                            }
                          >
                            {t.type}
                          </td>
                          <td>{t.category}</td>
                          <td>{formatCurrency(t.amount)}</td>
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
              {renderPagination()}
            </>
          )}
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4 col-lg">
              <div>
                <div className="metric-title">Income (filtered)</div>
                <div className="metric-value text-success mb-0">
                  {formatCurrency(totalIncome)}
                </div>
              </div>
            </div>
            <div className="col-md-4 col-lg">
              <div>
                <div className="metric-title">Expenses (filtered)</div>
                <div className="metric-value text-danger mb-0">
                  {formatCurrency(totalExpenses)}
                </div>
              </div>
            </div>
            <div className="col-md-4 col-lg">
              <div>
                <div className="metric-title">Transfers (filtered)</div>
                <div className="metric-value text-primary mb-0">
                  {formatCurrency(totalTransfers)}
                </div>
              </div>
            </div>
            <div className="col-md-4 col-lg">
              <div>
                <div className="metric-title">Withdrawals (filtered)</div>
                <div className="metric-value text-withdraw mb-0">
                  {formatCurrency(totalWithdrawals)}
                </div>
              </div>
            </div>
            <div className="col-md-4 col-lg">
              <div>
                <div className="metric-title">Balance (filtered)</div>
                <div className={`metric-value mb-0 ${balanceClass}`}>
                  {formatCurrency(Number.isNaN(balanceNumber) ? 0 : balanceNumber)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionsPage;
