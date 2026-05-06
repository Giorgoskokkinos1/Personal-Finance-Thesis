import React, { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import type { ChartOptions, TooltipItem } from "chart.js";
import {
  buildMonthlyCashflow,
  getAvailableCashflowYears,
  type Transaction,
} from "../utils/monthlyCashflow";

type MonthlyCashflowChartProps = {
  transactions: Transaction[];
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

function MonthlyCashflowChart({ transactions }: MonthlyCashflowChartProps) {
  const years = useMemo(
    () => getAvailableCashflowYears(transactions),
    [transactions]
  );
  const [selectedYear, setSelectedYear] = useState<string>("ALL");

  const selectedYearNumber =
    selectedYear === "ALL" ? undefined : Number(selectedYear);

  const monthlyCashflow = useMemo(
    () => buildMonthlyCashflow(transactions, selectedYearNumber),
    [transactions, selectedYearNumber]
  );

  const chartData = {
    labels: monthlyCashflow.map((item) => item.monthLabel),
    datasets: [
      {
        label: "Income",
        data: monthlyCashflow.map((item) => item.totalIncome),
        backgroundColor: "#059669",
        hoverBackgroundColor: "#047857",
        borderRadius: 6,
        borderWidth: 0,
      },
      {
        label: "Expenses",
        data: monthlyCashflow.map((item) => item.totalExpenses),
        backgroundColor: "#e11d48",
        hoverBackgroundColor: "#be123c",
        borderRadius: 6,
        borderWidth: 0,
      },
    ],
  };

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: "#475569",
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"bar">) => {
            const value =
              typeof context.raw === "number" ? context.raw : Number(context.raw);
            return `${context.dataset.label}: ${currencyFormatter.format(
              value || 0
            )}`;
          },
          afterBody: (items: TooltipItem<"bar">[]) => {
            const index = items[0]?.dataIndex;
            if (index === undefined) return "";

            const savingsRate = monthlyCashflow[index]?.savingsRate;
            return savingsRate === null || savingsRate === undefined
              ? "Savings rate: n/a"
              : `Savings rate: ${percentFormatter.format(savingsRate)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#475569" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#e5edf6" },
        ticks: {
          color: "#475569",
          callback: (value) => currencyFormatter.format(Number(value)),
        },
      },
    },
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
          <div>
            <h4 className="mb-1">Monthly Cashflow</h4>
            <p className="text-muted mb-0">
              Income and expenses grouped by month, with savings rate in the
              tooltip.
            </p>
          </div>

          <div className="cashflow-year-filter">
            <label className="form-label">Year</label>
            <select
              className="form-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={years.length === 0}
            >
              <option value="ALL">All years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {monthlyCashflow.length === 0 ? (
          <div className="chart-empty-state">
            No income or expense transactions available for this selection.
          </div>
        ) : (
          <div className="chart-frame-lg">
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
}

export default MonthlyCashflowChart;
