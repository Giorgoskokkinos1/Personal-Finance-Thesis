export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note?: string;
};

export type MonthlyCashflow = {
  monthKey: string;
  monthLabel: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number | null;
};

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
});

export function getAvailableCashflowYears(
  transactions: Transaction[]
): number[] {
  return Array.from(
    new Set(
      transactions
        .map((transaction) => {
          const date = new Date(transaction.date);
          return Number.isNaN(date.getTime()) ? null : date.getFullYear();
        })
        .filter((year): year is number => year !== null)
    )
  ).sort((a, b) => b - a);
}

// Groups income and expenses by month for the grouped cashflow bar chart.
export function buildMonthlyCashflow(
  transactions: Transaction[],
  year?: number
): MonthlyCashflow[] {
  const monthMap = new Map<string, MonthlyCashflow>();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    if (Number.isNaN(date.getTime())) return;

    const transactionYear = date.getFullYear();
    if (year && transactionYear !== year) return;

    const monthKey = `${transactionYear}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    const current =
      monthMap.get(monthKey) ||
      ({
        monthKey,
        monthLabel: monthFormatter.format(date),
        year: transactionYear,
        totalIncome: 0,
        totalExpenses: 0,
        savingsRate: null,
      } satisfies MonthlyCashflow);

    if (transaction.type === "income") {
      current.totalIncome += transaction.amount;
    } else {
      current.totalExpenses += transaction.amount;
    }

    // Savings rate is only meaningful when the month has income.
    current.savingsRate =
      current.totalIncome > 0
        ? ((current.totalIncome - current.totalExpenses) /
            current.totalIncome) *
          100
        : null;

    monthMap.set(monthKey, current);
  });

  return Array.from(monthMap.values()).sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey)
  );
}
