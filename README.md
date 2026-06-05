# Personal Finance Tracker Thesis

A full-stack personal finance tracking web application developed as an undergraduate thesis project.

The application helps users record income, expenses, transfers, and withdrawals; manage categories; create monthly budgets; track financial goals; import and export CSV files; and understand financial activity through dashboards, charts, insights, and an in-app user manual.

This repository contains both parts of the system:

- `frontend/` - React single-page application.
- `api/` - Node.js/Express REST API connected to MySQL.

---

## Project Overview

Personal finance applications can become difficult to use when they require too much manual work or display too much information at once. This project focuses on a practical finance tracker that supports everyday money management while keeping the interface clear and structured.

The application is designed around the main user workflows:

- Sign up or sign in to a personal workspace.
- Create income and expense categories.
- Add, edit, delete, filter, paginate, and export transactions.
- Create monthly budgets and monitor remaining money.
- Create financial goals and move money to or from those goals.
- Import transaction data from CSV files.
- View financial summaries, charts, warnings, and spending insights.
- Use an in-app manual for guidance.

The final navigation structure is intentionally simple:

```text
Home
Transactions
Budget
Goals
Insights
Setup
```

Less frequent actions, such as category management, CSV upload, profile settings, demo data, reset tools, thesis information, and the manual, are grouped under Setup.

---

## Current Status

The project is in final thesis/demo-ready local version.

Implemented areas include:

- Database-backed sign-up and login.
- Password strength guidance during sign-up.
- Salted PBKDF2 password hashing.
- Session token generation and hashed session-token storage.
- Protected API requests using bearer tokens.
- Per-user data separation.
- Login page shown on every fresh application opening.
- Transactions for income, expense, transfer, and withdrawal.
- Category management with validation, duplicate checks, search, sorting, pagination, and deletion protection.
- Monthly budget management with current-month summary, progress indicators, warning/over-budget states, suggestions, and optional carry-over logic.
- Financial goals for savings, travel, investment, and other targets.
- CSV import with row validation and preview.
- CSV export for filtered transaction lists.
- Dashboard summaries and financial insight cards.
- Chart-based analysis, including cashflow, spending by category, spending heatmap, and goal trend charts.
- Profile and settings screen.
- In-app user manual.
- Demo data loading and workspace reset tools for presentation and testing.

The current version is suitable for local thesis demonstration. A public production version would require additional hardening, such as email verification, production password recovery, HTTPS deployment, rate limiting, and monitoring.

---

## Tech Stack

### Frontend

- React
- React Router
- Axios
- Bootstrap 5
- Chart.js
- react-chartjs-2
- PapaParse
- TypeScript utility/component files for chart data transformations
- Custom CSS in `frontend/src/App.css`

### Backend

- Node.js
- Express
- MySQL
- mysql2
- dotenv
- CORS
- REST API with JSON responses

### Database

The backend uses MySQL and creates or updates the required tables during startup.

Main database areas include:

- `users`
- `user_sessions`
- `transactions`
- `categories`
- `financial_targets`
- `monthly_budgets`

---

## Main Features

### 1. Account Access And User Separation

The application includes a database-backed account flow.

Users can:

- Sign up.
- Sign in.
- Log out.
- Access a separate personal workspace.
- View profile information and basic financial statistics.

Passwords are not stored as plain text. The backend stores salted PBKDF2 password hashes. When a user signs in, the backend validates the credentials and returns a session token. The frontend sends this token with protected API requests:

```text
Authorization: Bearer <session-token>
```

The backend uses the authenticated user identity to separate financial records between users. This prevents one account from seeing another account's transactions, categories, budgets, or goals.

The app always starts on the login/sign-up page when opened or refreshed, which makes the account flow clear for demonstration and avoids accidentally opening a previous user's workspace.

---

### 2. Transactions

The Transactions page is the main ledger of the application.

Users can:

- Add transactions.
- Edit transactions.
- Delete transactions.
- Search and filter transactions.
- View transactions in pages of 10 rows.
- Export the filtered transaction list to CSV.
- Create recurring monthly transactions.

Supported transaction types:

- `INCOME`
- `EXPENSE`
- `TRANSFER`
- `WITHDRAW`

Transaction behavior:

- Income increases cash balance.
- Expenses reduce cash balance.
- Transfers move money from cash into a financial goal.
- Withdrawals move money from a financial goal back into cash.

---

### 3. Categories

Categories are managed from the Setup area.

Users can:

- Create income categories.
- Create expense categories.
- Search categories while typing.
- Sort by table headers.
- View categories in pages of 10.
- Delete categories when they are not used by transactions.

Validation rules:

- Category type is required.
- Category name is required.
- Category name must contain at least 4 characters.
- Duplicate category names are blocked for the same type.
- Categories used by transactions cannot be deleted.

---

### 4. Smart Category Suggestions

The app includes a simple smart categorization helper.

When the user enters a transaction description, the app can suggest a matching category based on:

- Keyword rules.
- Existing user categories.
- Previous user choices.

The app avoids blindly applying learned mistakes. Learned suggestions can be reviewed and forgotten, which keeps entry faster without making wrong categorization permanent.

---

### 5. Monthly Budgets

The Budget page helps users plan and monitor monthly spending.

Users can:

- Create one budget per month.
- Edit current or future budgets.
- View budget history.
- View a current-month summary card.
- See budget progress bars and status indicators.
- Use budget suggestions.
- Copy the previous month budget.
- Set a default monthly budget.
- Optionally include carry-over from the previous month.

Budget formula:

```text
remaining = budget + income + withdrawals - expenses - transfers
```

Budget status examples:

- On track
- Warning
- Over budget

When the monthly budget is exceeded, the interface highlights the risk state visually so the user can notice the issue quickly.

---

### 6. Financial Goals

The Goals page manages longer-term financial targets.

Goal types:

- Savings
- Travel
- Investment
- Other

Users can:

- Create a goal.
- Set a target amount.
- Set an expected completion date.
- Track collected amount and progress.
- Edit goal amount and date where allowed.
- Use active goals in transfer and withdrawal transactions.

Transfers increase goal progress and reduce cash balance. Withdrawals reduce goal progress and increase cash balance.

---

### 7. CSV Import

The Upload CSV screen is available from Setup.

The importer supports:

- Semicolon-separated files.
- Comma-separated files.
- CSV files exported from the app.
- Decimal comma and decimal dot amounts.
- Row preview before import.
- Row-level validation.
- Clear error messages.

Expected columns:

```text
date;type;category;amount;description
```

Example:

```csv
date;type;category;amount;description
2026-05-01;INCOME;Salary;2500,00;Monthly salary
2026-05-02;EXPENSE;Food;18,50;Pizza night
2026-05-03;EXPENSE;Transport;42,00;Fuel
```

For transfer and withdrawal rows, the category or target value must match an active goal name or include a target reference.

---

### 8. CSV Export

The Transactions page includes CSV export.

Export behavior:

- Exports all transactions matching the active filters.
- Exports all filtered pages, not only the visible page.
- Uses semicolon as the delimiter.
- Uses the browser file-save flow where supported.

---

### 9. Dashboard, Charts, And Insights

The Home page gives a high-level view of the user's financial position.

The Insights page provides visual analysis and guidance.

Implemented chart/insight features include:

- Monthly cashflow chart.
- Spending by category chart.
- Calendar spending heatmap.
- Goal trend chart.
- Budget burn meter.
- Smart monthly guidance cards.
- Responsive chart layouts.
- Tooltips.
- Empty states.
- Date, year, target, and category filters where relevant.

Several chart calculations are kept in utility functions to make the transformation logic clearer and easier to test.

---

### 10. Profile, Settings, And Manual

The Profile and Settings screen allows the user to view account details, update display name, and configure display preferences such as currency, date format, and theme mood.

The application also includes an in-app user manual. The manual explains the main workflows, including:

- Signing in and signing up.
- Creating categories.
- Adding transactions.
- Understanding income, expense, transfer, and withdrawal types.
- Creating budgets.
- Creating goals.
- Importing CSV files.
- Reading dashboards, charts, and insights.
- Using setup and reset tools.

This manual was added to make the application easier to understand during both normal use and thesis demonstration.

---

### 11. Final Presentation Tools

The Setup area includes tools that support testing and final presentation:

- Load demo data.
- Reset workspace.
- Open CSV upload.
- Manage categories.
- Open profile settings.
- Open thesis/about information.
- Open the in-app manual.

These tools allow the evaluator to see the system working with realistic data without needing to manually create a full dataset before every demonstration.

---

## Project Structure

```text
Personal-Finance-Thesis/
|-- api/
|   |-- src/
|   |   |-- db.js
|   |   `-- server.js
|   |-- .env.example
|   |-- package.json
|   `-- test.http
|
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |   |-- CategorySpendingRangeChart.tsx
|   |   |   |-- MoneyCashFlowChart.tsx
|   |   |   |-- MonthlyCashflowChart.tsx
|   |   |   |-- SpendingCalendarHeatmap.tsx
|   |   |   `-- TargetTrendChart.tsx
|   |   |
|   |   |-- pages/
|   |   |   |-- Budget.js
|   |   |   |-- Categories.js
|   |   |   |-- Charts.js
|   |   |   |-- Dashboard.js
|   |   |   |-- Login.js
|   |   |   |-- Manual.js
|   |   |   |-- Setup.js
|   |   |   |-- Targets.js
|   |   |   |-- Transactions.js
|   |   |   `-- Upload.js
|   |   |
|   |   |-- utils/
|   |   |   |-- categorySpending.ts
|   |   |   |-- csvTransactions.js
|   |   |   |-- formatters.js
|   |   |   |-- monthlyCashflow.ts
|   |   |   |-- smartCategorization.js
|   |   |   |-- spendingHeatmap.ts
|   |   |   `-- targetTrend.ts
|   |   |
|   |   |-- App.js
|   |   |-- App.css
|   |   `-- index.js
|   |
|   `-- package.json
|
|-- portfolio/
|-- README.md
`-- test_transactions_upload.csv
```

---

## Backend API Summary

### Health

```text
GET /api/health
```

### Authentication And Profile

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PUT  /api/auth/profile
```

### Transactions

```text
GET    /api/transactions
GET    /api/transactions/:id
POST   /api/transactions
POST   /api/transactions/bulk
PUT    /api/transactions/:id
DELETE /api/transactions/:id
```

### Categories

```text
GET    /api/categories
POST   /api/categories
DELETE /api/categories/:id
```

### Financial Goals

```text
GET  /api/targets
POST /api/targets
PUT  /api/targets/:id
POST /api/targets/:id/disable
POST /api/targets/:id/enable
```

### Budgets

```text
GET  /api/budgets
POST /api/budgets
PUT  /api/budgets/:id
```

### Summaries And Workspace Tools

```text
GET    /api/summary/overview
GET    /api/summary/by-category
POST   /api/demo-data
DELETE /api/workspace
```

More example requests are available in:

```text
api/test.http
```

---

## Database Setup

The application uses MySQL.

Create the database manually before starting the backend:

```sql
CREATE DATABASE IF NOT EXISTS finance_db;
```

The backend creates and updates the required tables during startup.

Create an `.env` file inside the `api/` folder. You can start from the example file:

```powershell
cd api
copy .env.example .env
```

Expected values:

```text
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=finance_db
PORT=5000
```

Adjust these values for your local MySQL installation.

---

## Frontend Environment

Create an optional `.env` file inside the `frontend/` folder if you need to override the API URL:

```powershell
cd frontend
copy .env.example .env
```

Local value:

```text
REACT_APP_API_URL=http://localhost:5000
```

For the current thesis version, the application is intended to run locally.

---

## Local Installation

Install backend dependencies:

```powershell
cd api
npm install
```

Install frontend dependencies:

```powershell
cd ..\frontend
npm install
```

---

## Running The Application Locally

Use two terminals.

### Terminal 1 - Backend API

```powershell
cd api
npm run dev
```

The API runs at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "OK",
  "message": "API is running"
}
```

### Terminal 2 - Frontend

```powershell
cd frontend
npm start
```

The React app runs at:

```text
http://localhost:3000
```

---

## Useful Commands

### Frontend Tests

Interactive test runner:

```powershell
cd frontend
npm test
```

One-time test run:

```powershell
cd frontend
$env:CI="true"; npm test -- --watchAll=false
```

### Frontend Production Build

```powershell
cd frontend
npm run build
```

### Backend Development Server

```powershell
cd api
npm run dev
```

### Backend Production-Style Start

```powershell
cd api
npm start
```

---

## Deployment Status

This thesis version has not been deployed to Railway, Vercel, Render, or another public hosting provider.

The application is currently intended to be run locally using:

- a local MySQL database
- the Express API at `http://localhost:5000`
- the React frontend at `http://localhost:3000`

Public deployment is listed as future work.

---

## Example CSV File

A ready-to-test CSV file is included:

```text
test_transactions_upload.csv
```

Example content:

```csv
date;type;category;amount;description
2026-05-01;INCOME;Salary;2500,00;Monthly salary
2026-05-02;EXPENSE;Food;18,50;Pizza night
2026-05-03;EXPENSE;Transport;42,00;Fuel
2026-05-04;EXPENSE;Bills;120,75;Electricity bill
2026-05-05;INCOME;Freelance;300,00;Small project payment
```

---

## Thesis Context

This project was developed as part of the TV-25-13 Personal Finance Tracker thesis.

The project demonstrates:

- Full-stack web application development.
- Client-side application development with React.
- REST API design with Express.
- MySQL database integration.
- Authentication and session-based user separation.
- CRUD operations across multiple business entities.
- CSV import and export.
- Data visualization and transformation.
- Budget tracking and financial goal management.
- User-centered interface restructuring to reduce complexity.
- In-app guidance through a manual page.

The application is intended to show both technical implementation and practical usability for personal financial management.

---

## Design And Usability Goals

The app was designed with the following usability goals:

- Keep daily actions easy to find.
- Avoid overwhelming the user with too many top-level screens.
- Group occasional setup actions separately.
- Show useful financial information without forcing the user to read large tables.
- Make transaction entry faster through smart suggestions.
- Use charts to explain spending behavior visually.
- Support CSV workflows for real-world data entry and backup.
- Provide an in-app manual so users can understand the system without external instructions.

---

## Security Notes

Implemented:

- User sign-up and login.
- `users` table for registered accounts.
- `user_sessions` table for active sessions.
- Password hashing with a random salt.
- Session token generation.
- Hashed session tokens stored in the database.
- Protected API requests using `Authorization: Bearer <token>`.
- Password strength guidance.
- Per-user data separation by authenticated identity.

Not yet production-ready:

- Email verification.
- Two-factor authentication.
- Production password reset delivery.
- Rate limiting and monitoring.
- Public HTTPS deployment.

---

## Known Limitations

- The app has not been deployed to a public hosting provider.
- The app is configured for local development.
- The backend assumes a MySQL database is available.
- Some display preferences are stored locally in the browser.
- Forgot password is currently a placeholder flow.
- The project is optimized for thesis demonstration rather than public production use.

---

## Future Enhancements

Possible future improvements include:

- Cloud deployment.
- Email verification and production password reset.
- Rate limiting and monitoring.
- PDF export.
- Excel export.
- More advanced predictive analytics.
- Personalized spending recommendations.
- Category-level budgets.
- Recurring income and bill detection.
- Mobile-first layout refinements.
- Accessibility audit.
- Unit tests for backend API routes.
- End-to-end tests for the main user flows.

---

## Developer

**Developer:** Giorgos Kokkinos  
**Email:** georgioskokkinos97@gmail.com  
**GitHub:** [Giorgoskokkinos1](https://github.com/Giorgoskokkinos1)

---

## License

This project was created for academic thesis purposes.
