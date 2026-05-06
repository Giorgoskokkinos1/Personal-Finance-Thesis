// src/pages/Categories.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/categories";

function CategoriesPage({ onCategoriesChanged }) {
  const [form, setForm] = useState({ type: "", name: "" });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("type");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchCategories = () => {
    setLoading(true);
    axios
      .get(API_URL, {
        params: {
          search,
          sortBy,
          sortDir,
          page,
        },
      })
      .then((res) => {
        setCategories(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Could not load categories");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortBy, sortDir, page]);

  const validateForm = () => {
    const type = form.type.trim();
    const name = form.name.trim();

    if (!type) return "Category type is required";
    if (name.length < 4) return "Category name must be at least 4 letters";
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    axios
      .post(API_URL, {
        type: form.type,
        name: form.name.trim(),
      })
      .then(() => {
        setMessage("Category added successfully");
        setForm((prev) => ({ ...prev, name: "" }));
        setPage(1);
        fetchCategories();
        if (onCategoriesChanged) onCategoriesChanged();
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Could not add category");
      });
  };

  const handleSort = (nextSortBy) => {
    if (sortBy === nextSortBy) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(nextSortBy);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleDelete = (category) => {
    const confirmed = window.confirm(
      `Delete ${category.type.toLowerCase()} category "${category.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    axios
      .delete(`${API_URL}/${category.id}`)
      .then(() => {
        setMessage("Category deleted successfully");
        fetchCategories();
        if (onCategoriesChanged) onCategoriesChanged();
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Could not delete category");
      });
  };

  const sortIndicator = (column) => {
    if (sortBy !== column) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="page-shell categories-page">
      <div className="page-header">
        <p className="section-kicker mb-1">Setup</p>
        <h1 className="page-title">Categories</h1>
        <p className="page-subtitle">
          Define income and expense categories, then manage the list used by
          your finance tracker.
        </p>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="mb-3">Add Category</h4>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                  required
                >
                  <option value="">Select type</option>
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>

              <div className="col-md-5">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Groceries"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  minLength="4"
                  required
                />
              </div>

              <div className="col-md-3 d-flex align-items-end">
                <button type="submit" className="btn btn-primary w-100">
                  Add Category
                </button>
              </div>
            </div>
          </form>

          {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
          {message && (
            <div className="alert alert-success mt-3 mb-0">{message}</div>
          )}
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
            <div>
              <h4 className="mb-1">Category List</h4>
              <p className="text-muted mb-0">
                {total} {total === 1 ? "category" : "categories"} found
              </p>
            </div>

            <div className="category-search">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search type or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped align-middle mb-0">
              <thead>
                <tr>
                  <th>
                    <button
                      type="button"
                      className="table-sort-button"
                      onClick={() => handleSort("type")}
                    >
                      Type{sortIndicator("type")}
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className="table-sort-button"
                      onClick={() => handleSort("name")}
                    >
                      Name{sortIndicator("name")}
                    </button>
                  </th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3" className="text-muted">
                      Loading categories...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-muted">
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <span
                          className={
                            category.type === "INCOME"
                              ? "category-pill category-pill-income"
                              : "category-pill category-pill-expense"
                          }
                        >
                          {category.type}
                        </span>
                      </td>
                      <td>{category.name}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="icon-button icon-button-danger"
                          aria-label={`Delete ${category.name}`}
                          title="Delete category"
                          onClick={() => handleDelete(category)}
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                          >
                            <path
                              d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2l1 11h4l1-11h2l-1.2 13H8.2L7 9Z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-3">
            <span className="text-muted small">
              Page {page} of {totalPages}
            </span>

            <div className="btn-group">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(current + 1, totalPages))
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoriesPage;
