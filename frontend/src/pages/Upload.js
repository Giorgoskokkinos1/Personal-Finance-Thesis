// src/pages/Upload.js
import React, { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { buildCsvTransactions } from "../utils/csvTransactions";

function UploadPage({ onImportTransactions, categories, targets }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [importState, setImportState] = useState({
    status: "idle",
    message: "",
    errors: [],
    warnings: [],
    previewRows: [],
    validRows: [],
    rowCount: 0,
  });

  const activeTargetCount = useMemo(
    () => targets.filter((target) => target.status !== "DISABLED").length,
    [targets]
  );

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportState({
      status: "parsing",
      message: "Reading CSV file...",
      errors: [],
      warnings: [],
      previewRows: [],
      validRows: [],
      rowCount: 0,
    });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors?.length) {
          setImportState({
            status: "error",
            message: "The CSV file could not be parsed.",
            errors: results.errors.map((error) => ({
              line: error.row ? error.row + 1 : "-",
              message: error.message,
            })),
            warnings: [],
            previewRows: [],
            validRows: [],
            rowCount: 0,
          });
          return;
        }

        const parsed = buildCsvTransactions({
          rows: results.data,
          categories,
          targets,
        });

        setImportState({
          status: parsed.errors.length ? "error" : "ready",
          message: parsed.errors.length
            ? "Fix the rows below and choose the file again."
            : `${parsed.validRows.length} transactions are ready to import.`,
          ...parsed,
        });
      },
      error: (error) => {
        setImportState({
          status: "error",
          message: error.message || "The CSV file could not be read.",
          errors: [],
          warnings: [],
          previewRows: [],
          validRows: [],
          rowCount: 0,
        });
      },
    });
  };

  const handleImport = async () => {
    if (!importState.validRows.length) return;

    setImportState((prev) => ({
      ...prev,
      status: "importing",
      message: "Importing transactions...",
    }));

    try {
      const result = await onImportTransactions(importState.validRows);
      setImportState((prev) => ({
        ...prev,
        status: "success",
        message: result?.message || `Imported ${prev.validRows.length} transactions.`,
      }));
      resetInput();
    } catch (error) {
      setImportState((prev) => ({
        ...prev,
        status: "error",
        message:
          error.response?.data?.error ||
          "The import failed. Please check the CSV and try again.",
      }));
    }
  };

  return (
    <div className="page-shell upload-page">
      <div className="page-header">
        <p className="section-kicker mb-1">Import</p>
        <h1 className="page-title">Upload CSV</h1>
        <p className="page-subtitle">
          Import transaction rows from a CSV file. Semicolon or comma separated
          files are supported, including exported files from this app.
        </p>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <div className="upload-dropzone">
                <div className="upload-icon" aria-hidden="true">
                  CSV
                </div>
                <h3 className="mb-2">Choose a transaction file</h3>
                <p className="upload-helper-text">
                  Required columns are date, type, category, and amount.
                  Description is optional.
                </p>

                <label
                  htmlFor="csv-input"
                  className="btn btn-primary px-4 py-2 mb-3"
                  style={{ cursor: "pointer" }}
                >
                  Choose CSV File
                </label>

                <input
                  ref={inputRef}
                  id="csv-input"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                {fileName && <p className="upload-file-name mb-0">{fileName}</p>}
              </div>

              {importState.message && (
                <div
                  className={`alert mt-4 ${
                    importState.status === "error"
                      ? "alert-danger"
                      : importState.status === "success"
                      ? "alert-success"
                      : "alert-info"
                  }`}
                >
                  {importState.message}
                </div>
              )}

              {importState.errors.length > 0 && (
                <div className="upload-issue-list">
                  <h4>Rows that need attention</h4>
                  <ul>
                    {importState.errors.slice(0, 12).map((error, index) => (
                      <li key={`${error.line}-${index}`}>
                        Line {error.line}: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importState.warnings.length > 0 && (
                <div className="upload-issue-list upload-warning-list">
                  <h4>Warnings</h4>
                  <ul>
                    {importState.warnings.slice(0, 8).map((warning, index) => (
                      <li key={`${warning.line}-${index}`}>
                        Line {warning.line}: {warning.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                className="btn btn-success mt-3"
                disabled={
                  importState.status !== "ready" || importState.validRows.length === 0
                }
                onClick={handleImport}
              >
                Import {importState.validRows.length || ""} Transactions
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <p className="section-kicker mb-2">CSV Rules</p>
              <ul className="upload-rules">
                <li>Types: INCOME, EXPENSE, TRANSFER, WITHDRAW.</li>
                <li>Dates: yyyy-mm-dd or dd/mm/yyyy.</li>
                <li>Amounts: system comma or dot decimals are accepted.</li>
                <li>
                  Transfer and withdraw rows must include an active target by
                  target, targetId, or category name.
                </li>
              </ul>

              <div className="upload-stats">
                <div>
                  <span>Categories</span>
                  <strong>{categories.length}</strong>
                </div>
                <div>
                  <span>Active targets</span>
                  <strong>{activeTargetCount}</strong>
                </div>
                <div>
                  <span>Rows read</span>
                  <strong>{importState.rowCount}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {importState.previewRows.length > 0 && (
        <div className="card shadow-sm border-0 mt-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="mb-0">Preview</h3>
              <span className="text-muted small">First 8 rows</span>
            </div>
            <div className="table-responsive">
              <table className="table align-middle upload-preview-table">
                <thead>
                  <tr>
                    <th>Line</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category / Target</th>
                    <th className="text-end">Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {importState.previewRows.map(({ line, transaction }) => (
                    <tr key={line}>
                      <td>{line}</td>
                      <td>{transaction.date || "-"}</td>
                      <td>{transaction.type || "-"}</td>
                      <td>{transaction.category || "-"}</td>
                      <td className="text-end">
                        {transaction.amount
                          ? transaction.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "-"}
                      </td>
                      <td>{transaction.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadPage;
