# Personal Finance Thesis
# Personal Finance Tracker Thesis

A full-stack personal finance management web application developed as part of an undergraduate thesis project.

The application helps users record transactions, organize categories, manage monthly budgets, set financial goals, import and export CSV files, and understand their money behavior through dashboards, charts, and basic smart insights.

This repository contains both the React frontend and the Node.js/Express backend API.

---

## Project Overview

Personal finance applications often fail when they require too much manual effort or present too much information at once. This project focuses on building a practical finance tracker that is:

- Easy to use for everyday transaction recording.
- Structured around clear user workflows.
- Useful for budgeting and goal tracking.
- Capable of turning raw transactions into visual insights.
- Designed as a complete full-stack system with frontend, backend, database, and API layers.

Full-stack personal finance tracking web application developed as part of an undergraduate thesis.
The system allows users to record income and expenses, categorize spending, set a monthly budget, import/export CSV files, and view dashboard insights through charts.
The app is organized around the main actions a user needs:

- **Home** - overall financial position and quick insights.
- **Transactions** - add, edit, filter, search, paginate, export, and manage money movements.
- **Budget** - monthly budget setup, status tracking, smart suggestions, and carry-over support.
- **Goals** - financial goals for savings, travel, investment, or other plans.
- **Insights** - charts and visual analysis.
- **Setup** - categories, CSV upload, and profile settings.

---

## Current Status

The project is close to final thesis/demo readiness.

Implemented areas include:

- Full transaction CRUD.
- Income, expense, transfer, and withdraw transaction types.
- Category management.
- Financial goal management.
- Monthly budget management.
- Dashboard insights.
- Chart-based analytics.
- CSV import and export.
- Demo login/sign-up flow.
- Per-user data separation using signed-in email headers.
- Smart category suggestion support.
- Password strength guidance on sign-up.

The authentication layer is still considered demo-level and can be improved later with real password hashing, sessions, or JWT-based authentication.

---

## Tech Stack

**Frontend**
### Frontend

- React
- React Router
- Axios
- Chart.js / react-chartjs-2
- Bootstrap 5
- Chart.js
- react-chartjs-2
- PapaParse
- TypeScript utility/component files for chart transformations
- CSS custom styling in `App.css`

**Backend**
### Backend

- Node.js
- Express
- MySQL via mysql2
- MySQL
- mysql2
- REST API with JSON responses
- dotenv and CORS
- dotenv
- CORS

### Database

- MySQL database
- Tables are created and migrated by the backend bootstrap logic
- Main data areas:
  - Transactions
  - Categories
  - Financial goals
  - Monthly budgets
  - Per-user ownership fields

---

## Main Features

### 1. Demo Login and Sign-Up

The application includes a local/demo account access flow.

Users can:

- Sign in.
- Sign up.
- Use remember-me behavior.
- Access forgot-password placeholder flow.
- View and update profile information.
- View basic personal statistics.

Sign-up includes a password strength indicator that encourages stronger passwords by requiring:

- Letters.
- Numbers.
- Minimum password length.
- Avoidance of weak common codes such as `1234`.

> Note: The current login is designed for thesis demonstration and local use. It separates data by email but does not yet implement production-grade authentication.

---

### 2. Per-User Data Separation

The backend supports account-scoped data using the signed-in email sent from the frontend.

Each user has separate:

- Transactions
- Categories
- Financial goals
- Monthly budgets

This means that if another person signs in with a different email, they start with their own empty financial workspace instead of seeing another user's records.

The implementation uses request headers for demo scoping:

```text
X-User-Email: user@example.com
```

For a production deployment, this should be replaced or strengthened with a real authentication system.

---

### 3. Transactions

The Transactions tab is the main ledger of the application.

Users can:

- Add transactions.
- Edit transactions.
- Delete transactions.
- Search transactions.
- Filter by month, type, category, and text.
- View transactions in pages of 10 rows.
- Export filtered transactions to CSV.
- Use recurring monthly transaction creation.

Supported transaction types:

- `INCOME`
- `EXPENSE`
- `TRANSFER`
- `WITHDRAW`

Transaction behavior:

- Income increases available balance.
- Expenses reduce balance.
- Transfers move cash into a financial goal and reduce cash balance.
- Withdraws move money back from a goal into cash and increase cash balance.

---

### 4. Smart Category Suggestions

The app includes a simple smart categorization helper.

When the user types a description such as:

```text
pizza
```

the app can suggest a relevant category such as food, if such a category exists.

The suggestion system uses:

- Keyword rules.
- Existing user categories.
- Optional learned choices from previous transactions.

The app avoids blindly applying learned mistakes. If the user previously chose a wrong category, learned suggestions are shown as review-level suggestions and can be forgotten.

This keeps data entry faster without making the app too risky or frustrating.

---

### 5. Categories

The Categories section is available under Setup.

Users can:

- Create income or expense categories.
- Validate category type and name.
- Prevent duplicates for the same type.
- Search categories while typing.
- Sort by table headers.
- View categories in pages of 10.
- Delete categories only when no related transactions exist.

Category validation:

- Type is required.
- Name is required.
- Name must be at least 4 characters.
- Duplicate category names are blocked per type.

---

### 6. Monthly Budget

The Budget tab helps the user plan and monitor monthly spending.

Users can:

- Create one budget per month.
- Edit current or future budgets.
- View budget status history.
- See current month summary.
- Use smart budget suggestions.
- Copy the previous month budget.
- Set a default monthly budget.
- Optionally include carry-over from the previous month.

Budget formula:

```text
remaining = budget + income + withdraws - expenses - transfers
```

The table shows:

- Month
- Amount set
- Income + withdraws
- Expense + transfer
- Remaining amount
- Progress bar
- Status indicator

Status examples:

- On track
- Warning
- Over budget

---

### 7. Financial Goals

The Goals tab manages longer-term financial targets.

Goal types:

- Savings
- Travel
- Investment
- Other

Users can:

- Create a goal.
- Set a target amount.
- Set an expected completion date.
- Track progress.
- Edit target amount and date.
- Disable goals when they have no collected amount.
- Re-enable disabled goals.

Goal money movement is handled through transaction types:

- `TRANSFER` - moves cash into a goal.
- `WITHDRAW` - moves money from a goal back to cash.

Disabled goals cannot be used for new transfers or withdraws.

---

### 8. CSV Import

The Upload CSV feature is available under Setup.

The importer supports:

- Semicolon-separated CSV files.
- Comma-separated CSV files.
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

For transfer and withdraw rows, the category/target value must match an active goal name or include a target reference.

---

### 9. CSV Export

The Transactions tab includes CSV export.

Export behavior:

- Exports all transactions currently matching the active filters.
- Exports all filtered pages, not only the visible page.
- Uses semicolon as delimiter.
- Uses system number formatting for decimal places.
- Supports the browser file-save dialog where available.

---

### 10. Dashboard and Insights

The Home tab gives a high-level view of the user's finances.

The Insights tab contains chart-based analysis.

Implemented charts include:

- Monthly cashflow chart.
- Spending by category chart.
- Calendar spending heatmap.
- Goal trend chart.

Chart features include:

- Responsive layouts.
- Tooltips.
- Empty states.
- Date filtering.
- Year filtering.
- Category filtering where relevant.
- Separate utility functions for testable data transformations.

---

## Application Navigation

The final navigation structure is intentionally simplified:

```text
Home
Transactions
Budget
Goals
Insights
Setup
```

This structure was chosen to avoid overwhelming the user.

The most common daily actions are visible directly, while less frequent actions such as category management and CSV upload are grouped under Setup.

---

## Project Structure

- `api/` - Express API, database connection, backend package scripts, and REST request examples.
- `api/src/server.js` - API routes for health checks, transactions, bulk upload, and summaries.
- `api/src/db.js` - MySQL connection pool configured from environment variables.
- `frontend/` - React single-page app.
- `frontend/src/App.js` - main app state, routing, filters, API calls, CSV import, and budget logic.
- `frontend/src/pages/` - page-level React components for Dashboard, Transactions, Charts, and Upload.
- `portfolio/` - thesis portfolio document and related notes.
```text
FinTst2/
├── api/
│   ├── src/
│   │   ├── db.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── test.http
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CategorySpendingRangeChart.tsx
│   │   │   ├── MonthlyCashflowChart.tsx
│   │   │   ├── SpendingCalendarHeatmap.tsx
│   │   │   └── TargetTrendChart.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Budget.js
│   │   │   ├── Categories.js
│   │   │   ├── Charts.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Login.js
│   │   │   ├── Setup.js
│   │   │   ├── Targets.js
│   │   │   ├── Transactions.js
│   │   │   └── Upload.js
│   │   │
│   │   ├── utils/
│   │   │   ├── categorySpending.ts
│   │   │   ├── csvTransactions.js
│   │   │   ├── monthlyCashflow.ts
│   │   │   ├── smartCategorization.js
│   │   │   ├── spendingHeatmap.ts
│   │   │   └── targetTrend.ts
│   │   │
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   │
│   └── package.json
│
├── portfolio/
├── README.md
└── test_transactions_upload.csv
```

---

## Backend API Summary

The Express API exposes endpoints for:

### Health

```text
GET /api/health
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

## Local Setup
### Categories

### 1. Configure MySQL
```text
GET    /api/categories
POST   /api/categories
DELETE /api/categories/:id
```

Create a local MySQL database. The app defaults to `finance_db`.
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

### Summaries

```text
GET /api/summary/overview
GET /api/summary/by-category
```

More example requests are available in:

```text
api/test.http
```

---

## Database Setup

The application uses MySQL.

Create the database manually:

```sql
CREATE DATABASE IF NOT EXISTS finance_db;
```

The backend creates and updates the required tables during startup.

The main tables are:

- `transactions`
- `categories`
- `financial_targets`
- `monthly_budgets`

The backend also performs lightweight schema updates, such as:

- Adding transfer and withdraw support.
- Adding goal references to transactions.
- Adding account ownership fields.
- Creating budget and category uniqueness rules.

USE finance_db;
---

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  type ENUM('INCOME', 'EXPENSE') NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description VARCHAR(255) DEFAULT ''
);
```
## Environment Variables

### 2. Configure API Environment
Create an `.env` file inside the `api/` folder.

Copy the example file and adjust the values for your local MySQL installation.
You can start from:

```powershell
cd api
copy .env.example .env
```

Expected variables:
Expected values:

```text
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=finance_db
PORT=5000
```

### 3. Install Dependencies
Adjust these values for your local MySQL installation.

---

## Local Installation

Run this once in each app folder:
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

### 4. Run Locally
---

## Running the Application Locally

Use two terminals.

Terminal 1 - backend API:
### Terminal 1 - Backend API

```powershell
cd api
npm run dev
```

The API runs at `http://localhost:5000`.
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

Terminal 2 - frontend:
### Terminal 2 - Frontend

```powershell
cd frontend
npm start
```

The React app runs at `http://localhost:3000`.
The React app runs at:

## Useful Checks
```text
http://localhost:3000
```

Frontend test runner:
---

## Useful Commands

### Frontend Tests

Interactive test runner:

```powershell
cd frontend
npm test
```

One-time frontend test run:
One-time test run:

```powershell
cd frontend
$env:CI="true"; npm test -- --watchAll=false
```

Frontend production build:
### Frontend Production Build

```powershell
cd frontend
npm run build
```

Backend health check after starting the API:
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

## Example CSV File

A ready-to-test file is included in the repository:

```text
GET http://localhost:5000/api/health
test_transactions_upload.csv
```

More example API requests are in `api/test.http`.
Example content:

## Key Features
```csv
date;type;category;amount;description
2026-05-01;INCOME;Salary;2500,00;Monthly salary
2026-05-02;EXPENSE;Food;18,50;Pizza night
2026-05-03;EXPENSE;Transport;42,00;Fuel
2026-05-04;EXPENSE;Bills;120,75;Electricity bill
2026-05-05;INCOME;Freelance;300,00;Small project payment
```

- Add, update, delete, filter, and search transactions.
- Track income, expenses, and balance.
- Set a local monthly budget and see progress against it.
- Import CSV transactions with `date, type, category, amount, description`.
- Export filtered transactions to CSV.
- View income vs expenses, spending by category, and monthly trends.
---

## Thesis Context

This project is part of the TV-25-13 Personal Finance Tracker thesis and is used to demonstrate:
This project was developed as part of the **TV-25-13 Personal Finance Tracker thesis**.

- A complete web-based personal finance management system.
- Separation between UI, API, and database layers.
- REST API design and database-backed CRUD operations.
- Data visualization for spending behavior and budget awareness.
The project demonstrates:

## Roadmap / Future Enhancements
- Full-stack web application development.
- Client-side state management with React.
- REST API design with Express.
- MySQL database integration.
- CRUD operations across multiple business entities.
- CSV import/export handling.
- Data visualization and transformation.
- Budget tracking and financial goal management.
- Basic account-based data separation.
- User-centered interface restructuring to reduce complexity.

- User authentication and per-user data isolation.
- Deployment to cloud hosting such as Render or Vercel.
- More advanced reporting with monthly/yearly summaries.
- PDF or Excel export.
- Predictive analytics and basic spending insights.
The application is intended to show both technical implementation and practical usability for personal financial management.

---

## Design and Usability Goals

The app was designed with the following usability goals:

- Keep daily actions easy to find.
- Avoid overwhelming the user with too many top-level screens.
- Group occasional setup actions separately.
- Show useful financial information without forcing the user to read large tables.
- Make transaction entry faster through smart suggestions.
- Use charts to explain spending behavior visually.
- Support CSV workflows for real-world data entry and backup.

The current navigation structure reflects these goals:

```text
Home -> daily overview
Transactions -> money movement
Budget -> monthly planning
Goals -> long-term planning
Insights -> analysis and charts
Setup -> occasional configuration
```

---

## Security Notes

The current account system is suitable for local thesis demonstration.

Implemented:

- Demo sign-in and sign-up.
- Password strength guidance.
- Per-user data separation by signed-in email.

Not yet production-ready:

- Password hashing.
- Secure sessions.
- JWT authentication.
- Server-side user table.
- Email verification.
- Password reset delivery.

For a production version, the next step would be to replace the local/demo login with a backend authentication system.

---

## Future Enhancements

Possible future improvements include:

- Production authentication with hashed passwords.
- Cloud deployment.
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

## Contact
## Known Limitations

- Authentication is currently demo-level.
- The app is configured for local development.
- The backend assumes a MySQL database is available.
- Some preferences are stored locally in the browser.
- The project is optimized for thesis demonstration rather than production deployment.

---

## Developer

**Developer:** Giorgos Kokkinos  
**Email:** georgioskokkinos97@gmail.com  
**GitHub:** [Giorgoskokkinos1](https://github.com/Giorgoskokkinos1)

---

## License

This project was created for academic thesis purposes.
