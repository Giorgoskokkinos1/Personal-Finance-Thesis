// src/pages/Charts.js
import React from "react";
import MonthlyCashflowChart from "../components/MonthlyCashflowChart";
import CategorySpendingRangeChart from "../components/CategorySpendingRangeChart";
import TargetTrendChart from "../components/TargetTrendChart";
import SpendingCalendarHeatmap from "../components/SpendingCalendarHeatmap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend
);

function ChartsPage({
  cashflowTransactions,
  targetTrendTransactions,
  targets,
}) {
  return (
    <div className="page-shell charts-page">
      <div className="page-header">
        <p className="section-kicker mb-1">Insights</p>
        <h1 className="page-title">Money Insights</h1>
        <p className="page-subtitle">
          Understand cashflow, spending patterns, and goal progress without
          digging through transaction rows.
        </p>
      </div>

      <MonthlyCashflowChart transactions={cashflowTransactions} />

      <CategorySpendingRangeChart transactions={cashflowTransactions} />

      <SpendingCalendarHeatmap transactions={cashflowTransactions} />

      <TargetTrendChart
        transactions={targetTrendTransactions}
        targets={targets}
      />
    </div>
  );
}

export default ChartsPage;
