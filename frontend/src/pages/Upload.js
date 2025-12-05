// src/pages/Upload.js
import React from "react";

function UploadPage({ onFileUpload }) {
  return (
    <div className="mt-4">
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <h3 className="text-center mb-4">Upload CSV File</h3>

          <div className="d-flex flex-column align-items-center">
            <label
              htmlFor="csv-input"
              className="btn btn-primary px-4 py-2 mb-3"
              style={{ cursor: "pointer" }}
            >
              Choose CSV File
            </label>

            <input
              id="csv-input"
              type="file"
              accept=".csv"
              onChange={onFileUpload}
              style={{ display: "none" }}
            />

            <p className="text-muted mt-2" style={{ fontSize: "14px" }}>
              Required columns:
              <br />
              <strong>date, type, category, amount, description</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;

