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
  // Income vs Expenses (pie)
  const incomeVsExpenseData = {
    labels: ["Income", "Expenses"],
    datasets: [
      {
        label: "Amount (€)",
        data: [totalIncome || 0, totalExpenses || 0],
        backgroundColor: ["#16a34a", "#dc2626"],
        borderWidth: 0,
      },
    ],
  };

  const incomeVsExpenseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: false,
      },
    },
  };

  // Spending by Category (expenses only)
  const categoryData = {
    labels: expenseCategories,
    datasets: [
      {
        label: "Expenses (€)",
        data: expenseTotals,
        backgroundColor: "#f97373",
        borderWidth: 0,
      },
    ],
  };

  const categoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount (€)",
        },
      },
    },
  };

  // Monthly Income vs Expenses (grouped bar)
  const monthlyData = {
    labels: months,
    datasets: [
      {
        label: "Income (€)",
        data: incomeByMonth,
        backgroundColor: "#22c55e",
        borderWidth: 0,
      },
      {
        label: "Expenses (€)",
        data: expensesByMonth,
        backgroundColor: "#ef4444",
        borderWidth: 0,
      },
    ],
  };

  const monthlyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Month",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount (€)",
        },
      },
    },
  };

  return (
    <div className="mt-4">
      {/* PIE CHART CARD */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="mb-3">Income vs Expenses</h4>
          <div style={{ height: "340px" }}>
            <Pie data={incomeVsExpenseData} options={incomeVsExpenseOptions} />
          </div>
        </div>
      </div>

      {/* CATEGORY BAR CHART */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h4 className="mb-3">Spending by Category</h4>
          {expenseCategories.length === 0 ? (
            <p className="text-muted mb-0">No expense data available.</p>
          ) : (
            <div style={{ height: "360px" }}>
              <Bar data={categoryData} options={categoryOptions} />
            </div>
          )}
        </div>
      </div>

      {/* MONTHLY BAR CHART */}
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <h4 className="mb-3">Monthly Income vs Expenses</h4>
          {months.length === 0 ? (
            <p className="text-muted mb-0">No monthly data available.</p>
          ) : (
            <div style={{ height: "380px" }}>
              <Bar data={monthlyData} options={monthlyOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChartsPage;
