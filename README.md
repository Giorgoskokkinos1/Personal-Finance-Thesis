# Personal-Finance-Thesis

Full-stack personal finance tracking web application developed as part of an undergraduate thesis.  
The system allows users to record income and expenses, categorize their spending, set a monthly budget and obtain clear visual insights through interactive dashboards and charts.

---

## Objectives

- Provide a simple but complete personal finance management tool (API, UI, DB).
- Demonstrate a modern web architecture (React + Node.js + MySQL) in a real use case.
- Enable users to understand their spending behaviour and budget adherence through data-driven visualizations.

---

## Tech Stack

**Frontend**
- React.js
- React Router
- Axios
- Chart.js / react-chartjs-2
- Bootstrap 5

**Backend**
- Node.js (Express)
- MySQL (mysql2)
- REST API (JSON)
- dotenv, CORS

**Structure**
- `/api` – backend (Express API + DB access)
- `/frontend` – React SPA (UI, charts, routing)

---

## Key Features

- **Transaction management**
  - Add, update and delete income and expense records
  - Custom categories and free-text descriptions
  - Filtering by month, type, category and search term

- **Budgeting**
  - User-defined monthly expense budget
  - Current month expenses vs budget
  - Visual budget status (on track / close to limit / over budget)

- **Data import & export**
  - CSV import (fields: `date, type, category, amount, description`)
  - Bulk insertion into the database
  - CSV export of the currently filtered transactions (Excel-friendly)

- **Analytics & dashboards**
  - Total income, total expenses and overall balance
  - Income vs Expenses (pie chart)
  - Spending by category (bar chart)
  - Monthly income vs expenses (grouped bar chart)

---

## Thesis Context

This project is part of the **TV-25-13 Personal Finance Tracker** thesis and is used to:

- Implement a complete web-based personal finance management system.
- Analyse how users can monitor and improve their financial behaviour using digital tools.
- Showcase best practices in separation of concerns (UI, API, DB), REST design and data visualisation.

---

## Roadmap / Future Enhancements

- User authentication and per-user data isolation
- Deployment to cloud hosting (e.g. Render / Vercel)
- More advanced reporting (monthly / yearly summaries, PDF/Excel exports)
- Predictive analytics and basic AI-driven spending insights

---

## Contact

**Developer:** Giorgos Kokkinos  
**Email:** georgioskokkinos97@gmail.com
💻 GitHub: [Giorgoskokkinos1](https://github.com/Giorgoskokkinos1)



