// api/src/db.js
const mysql = require("mysql2");
const path = require("path");

// Load .env from the api folder (one level above src)
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

// Just to sanity-check (will print once when server starts)
// console.log("DB_USER from env:", process.env.DB_USER);

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "finance_db",
});

const db = pool.promise();

module.exports = db;
