# Personal Finance Thesis

Full-stack personal finance tracking web application developed as part of an undergraduate thesis.
The system allows users to record income and expenses, categorize spending, set a monthly budget, import/export CSV files, and view dashboard insights through charts.

## Tech Stack

**Frontend**

- React
- React Router
- Axios
- Chart.js / react-chartjs-2
- Bootstrap 5
- PapaParse

**Backend**

- Node.js
- Express
- MySQL via mysql2
- REST API with JSON responses
- dotenv and CORS

## Project Structure

- `api/` - Express API, database connection, backend package scripts, and REST request examples.
- `api/src/server.js` - API routes for health checks, transactions, bulk upload, and summaries.
- `api/src/db.js` - MySQL connection pool configured from environment variables.
- `frontend/` - React single-page app.
- `frontend/src/App.js` - main app state, routing, filters, API calls, CSV import, and budget logic.
- `frontend/src/pages/` - page-level React components for Dashboard, Transactions, Charts, and Upload.
- `portfolio/` - thesis portfolio document and related notes.

## Local Setup

### 1. Configure MySQL

Create a local MySQL database. The app defaults to `finance_db`.

```sql
CREATE DATABASE IF NOT EXISTS finance_db;

USE finance_db;

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  type ENUM('INCOME', 'EXPENSE') NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description VARCHAR(255) DEFAULT ''
);
```

### 2. Configure API Environment

Copy the example file and adjust the values for your local MySQL installation.

```powershell
cd api
copy .env.example .env
```

Expected variables:

```text
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=finance_db
```

### 3. Install Dependencies

Run this once in each app folder:

```powershell
cd api
npm install

cd ..\frontend
npm install
```

### 4. Run Locally

Use two terminals.

Terminal 1 - backend API:

```powershell
cd api
npm run dev
```

The API runs at `http://localhost:5000`.

Terminal 2 - frontend:

```powershell
cd frontend
npm start
```

The React app runs at `http://localhost:3000`.

## Useful Checks

Frontend test runner:

```powershell
cd frontend
npm test
```

One-time frontend test run:

```powershell
cd frontend
$env:CI="true"; npm test -- --watchAll=false
```

Frontend production build:

```powershell
cd frontend
npm run build
```

Backend health check after starting the API:

```text
GET http://localhost:5000/api/health
```

More example API requests are in `api/test.http`.

## Key Features

- Add, update, delete, filter, and search transactions.
- Track income, expenses, and balance.
- Set a local monthly budget and see progress against it.
- Import CSV transactions with `date, type, category, amount, description`.
- Export filtered transactions to CSV.
- View income vs expenses, spending by category, and monthly trends.

## Thesis Context

This project is part of the TV-25-13 Personal Finance Tracker thesis and is used to demonstrate:

- A complete web-based personal finance management system.
- Separation between UI, API, and database layers.
- REST API design and database-backed CRUD operations.
- Data visualization for spending behavior and budget awareness.

## Roadmap / Future Enhancements

- User authentication and per-user data isolation.
- Deployment to cloud hosting such as Render or Vercel.
- More advanced reporting with monthly/yearly summaries.
- PDF or Excel export.
- Predictive analytics and basic spending insights.

## Contact

**Developer:** Giorgos Kokkinos  
**Email:** georgioskokkinos97@gmail.com  
**GitHub:** [Giorgoskokkinos1](https://github.com/Giorgoskokkinos1)
