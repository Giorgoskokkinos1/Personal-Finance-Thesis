export type CategorySpendingTransaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
};

export type CategorySpendingItem = {
  category: string;
  totalAmount: number;
  percentageOfTotal: number;
};

export type CategorySpendingDateRange = {
  from?: string;
  to?: string;
};

function isWithinDateRange(
  dateValue: string,
  range: CategorySpendingDateRange
): boolean {
  const transactionDate = new Date(dateValue);
  if (Number.isNaN(transactionDate.getTime())) return false;

  if (range.from) {
    const fromDate = new Date(range.from);
    if (!Number.isNaN(fromDate.getTime()) && transactionDate < fromDate) {
      return false;
    }
  }

  if (range.to) {
    const toDate = new Date(range.to);
    if (!Number.isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999);
      if (transactionDate > toDate) return false;
    }
  }

  return true;
}

// Expense-only aggregation used by the horizontal category spending chart.
export function buildCategorySpending(
  transactions: CategorySpendingTransaction[],
  range: CategorySpendingDateRange = {}
): CategorySpendingItem[] {
  const totalsByCategory = new Map<string, number>();

  transactions.forEach((transaction) => {
    if (transaction.type !== "expense") return;
    if (!isWithinDateRange(transaction.date, range)) return;

    const category = transaction.category.trim() || "Uncategorized";
    const currentTotal = totalsByCategory.get(category) || 0;
    totalsByCategory.set(category, currentTotal + transaction.amount);
  });

  const totalSpending = Array.from(totalsByCategory.values()).reduce(
    (sum, amount) => sum + amount,
    0
  );

  return Array.from(totalsByCategory.entries())
    .map(([category, totalAmount]) => ({
      category,
      totalAmount,
      percentageOfTotal:
        totalSpending > 0 ? (totalAmount / totalSpending) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}
