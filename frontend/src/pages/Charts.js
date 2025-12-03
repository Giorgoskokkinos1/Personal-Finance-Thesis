// src/pages/Charts.js
import React from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";

// Register chart components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

function ChartsPage({
  totalIncome,
  totalExpenses,
  expenseCategories,
  expenseTotals,
  months,
  incomeByMonth,
  expensesByMonth,
}) {
  return (
    <div className="container mt-4">

      {/* ===== PIE CHART ===== */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body text-center">
          <h4 className="mb-4">Income vs Expenses</h4>
          <div className="chart-container mx-auto" style={{ maxWidth: "450px" }}>
            <Pie
              data={{
                labels: ["Income", "Expenses"],
                datasets: [
                  {
                    data: [totalIncome, totalExpenses],
                    backgroundColor: ["#4CAF50", "#F44336"],
                  },
                ],
              }}
              options={{
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>
        </div>
      </div>

      {/* ===== CATEGORY BAR CHART ===== */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="text-center mb-4">Spending by Category</h4>
          <div className="chart-container" style={{ height: "400px" }}>
            <Bar
              data={{
                labels: expenseCategories,
                datasets: [
                  {
                    label: "Expenses (€)",
                    data: expenseTotals,
                    backgroundColor: "#FF6384",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  x: {
                    title: { display: true, text: "Category" },
                  },
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "Amount (€)" },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* ===== MONTHLY BAR CHART ===== */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="text-center mb-4">Monthly Income vs Expenses</h4>
          <div className="chart-container" style={{ height: "450px" }}>
            <Bar
              data={{
                labels: months,
                datasets: [
                  {
                    label: "Income (€)",
                    backgroundColor: "#4CAF50",
                    data: incomeByMonth,
                  },
                  {
                    label: "Expenses (€)",
                    backgroundColor: "#F44336",
                    data: expensesByMonth,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "bottom" },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "Amount (€)" },
                  },
                  x: {
                    title: { display: true, text: "Month" },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

    </div>
  );
}

export default ChartsPage;
