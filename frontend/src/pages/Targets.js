// src/pages/Targets.js
import React, { useMemo, useState } from "react";

function TargetsPage({
  targets,
  onAddTarget,
  onUpdateTarget,
  currency = "EUR",
  formatCurrency = (amount) => `EUR ${Number(amount || 0).toFixed(2)}`,
  formatDate,
}) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [form, setForm] = useState({
    type: "",
    name: "",
    targetAmount: "",
    expectedDate: "",
  });
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    targetAmount: "",
    expectedDate: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modalError, setModalError] = useState("");

  const activeTargets = targets.filter((target) => target.status !== "DISABLED");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return String(dateValue).slice(0, 10);
    return d.toISOString().slice(0, 10);
  };

  const defaultFormatDate = (dateValue) => {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return dateValue;
    return d.toLocaleDateString("en-GB");
  };
  const displayDate = formatDate || defaultFormatDate;

  const getApiError = (err, fallback) => err.response?.data?.error || fallback;

  const validateTargetValues = ({
    targetAmount,
    expectedDate,
    currentAmount = 0,
    requireFutureDate = false,
  }) => {
    const amount = Number(targetAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return "Target amount must be greater than zero";
    }

    if (amount < Number(currentAmount || 0)) {
      return "Target amount cannot be less than the amount already collected";
    }

    if (!expectedDate) {
      return "Expected date is required";
    }

    if (requireFutureDate ? expectedDate <= today : expectedDate < today) {
      return requireFutureDate
        ? "Expected date must be in the future"
        : "Expected date cannot be before today";
    }

    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.type) {
      setError("Target type is required");
      return;
    }

    if (form.name.trim().length < 4) {
      setError("Target name must be at least 4 letters");
      return;
    }

    const validationError = validateTargetValues(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    onAddTarget({
      type: form.type,
      name: form.name.trim(),
      targetAmount: Number(form.targetAmount),
      expectedDate: form.expectedDate,
    })
      .then(() => {
        setMessage("Financial target added successfully");
        setForm({
          type: "",
          name: "",
          targetAmount: "",
          expectedDate: "",
        });
      })
      .catch((err) => {
        setError(getApiError(err, "Could not add target"));
      });
  };

  const openEditModal = (target) => {
    setMessage("");
    setError("");
    setModalError("");
    setEditTarget(target);
    setEditForm({
      targetAmount: Number(target.targetAmount || 0).toFixed(2),
      expectedDate: formatDateForInput(target.expectedDate),
    });
  };

  const closeEditModal = () => {
    setEditTarget(null);
    setModalError("");
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    if (!editTarget) return;

    const validationError = validateTargetValues({
      ...editForm,
      currentAmount: editTarget.currentAmount,
    });
    if (validationError) {
      setModalError(validationError);
      return;
    }

    onUpdateTarget(editTarget.id, {
      targetAmount: Number(editForm.targetAmount),
      expectedDate: editForm.expectedDate,
    })
      .then(() => {
        setMessage("Target updated successfully");
        closeEditModal();
      })
      .catch((err) => {
        setModalError(getApiError(err, "Could not update target"));
      });
  };

  const renderTargetCard = (target) => {
    const targetAmount = Number(target.targetAmount || 0);
    const currentAmount = Number(target.currentAmount || 0);
    const progress =
      targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;

    return (
      <div className="col-md-6" key={target.id}>
        <div className="target-card">
          <div className="d-flex justify-content-between gap-3 mb-2">
            <div>
              <span className="category-pill category-pill-income">
                {target.type}
              </span>
              <h5 className="mt-2 mb-1">{target.name}</h5>
              <p className="text-muted mb-0 small">
                Expected by {displayDate(target.expectedDate)}
              </p>
            </div>
            <div className="text-end">
              <div className="metric-title">Progress</div>
              <div className="target-amount">
                {formatCurrency(currentAmount)}
              </div>
              <div className="text-muted small">
                of {formatCurrency(targetAmount)}
              </div>
            </div>
          </div>

          <div className="progress" style={{ height: "10px" }}>
            <div
              className="progress-bar bg-success"
              role="progressbar"
              style={{ width: `${progress}%` }}
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => openEditModal(target)}
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-shell targets-page">
      <div className="page-header">
        <p className="section-kicker mb-1">Goals</p>
        <h1 className="page-title">Financial Goals</h1>
        <p className="page-subtitle">
          Create savings, travel, investment, or other goals, then move money
          to and from them using transfers and withdrawals.
        </p>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="mb-3">Add Financial Goal</h4>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select type</option>
                  <option value="SAVINGS">Savings</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="INVESTMENT">Investment</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  placeholder="e.g. Summer trip"
                  value={form.name}
                  onChange={handleChange}
                  minLength="4"
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Target Amount ({currency})</label>
                <input
                  type="number"
                  className="form-control"
                  name="targetAmount"
                  placeholder="0.00"
                  value={form.targetAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Expected Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="expectedDate"
                  value={form.expectedDate}
                  onChange={handleChange}
                  min={today}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary mt-3">
              Add Target
            </button>
          </form>

          {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
          {message && (
            <div className="alert alert-success mt-3 mb-0">{message}</div>
          )}
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="mb-3">Active Targets</h4>

          {activeTargets.length === 0 ? (
            <div className="empty-state-box">
              <strong>No financial goals yet</strong>
              <p>
                Add a savings, travel, investment, or other goal above. Once you
                transfer money into a goal, progress appears here.
              </p>
            </div>
          ) : (
            <div className="row g-3">{activeTargets.map(renderTargetCard)}</div>
          )}
        </div>
      </div>

      {editTarget && (
        <div className="target-modal-backdrop" role="presentation">
          <div
            className="target-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editTargetTitle"
          >
            <form onSubmit={handleEditSave}>
              <div className="d-flex justify-content-between gap-3 mb-3">
                <div>
                  <p className="section-kicker mb-1">Edit target</p>
                  <h4 id="editTargetTitle" className="mb-0">
                    {editTarget.name}
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeEditModal}
                ></button>
              </div>

              <div className="mb-3">
                <label className="form-label">Target Amount ({currency})</label>
                <input
                  type="number"
                  className="form-control"
                  value={editForm.targetAmount}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      targetAmount: e.target.value,
                    }))
                  }
                  min={Number(editTarget.currentAmount || 0)}
                  step="0.01"
                  required
                />
                <div className="form-text">
                  Collected: {formatCurrency(editTarget.currentAmount)}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Expected Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={editForm.expectedDate}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      expectedDate: e.target.value,
                    }))
                  }
                  min={today}
                  required
                />
              </div>

              {modalError && (
                <div className="alert alert-danger">{modalError}</div>
              )}

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default TargetsPage;
