export const formatCurrencyAmount = (amount, currency = "EUR") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

export const formatDateByPreference = (dateValue, dateFormat = "dd/mm/yyyy") => {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  if (dateFormat === "yyyy-mm-dd") {
    return `${yyyy}-${mm}-${dd}`;
  }

  if (dateFormat === "mm/dd/yyyy") {
    return `${mm}/${dd}/${yyyy}`;
  }

  return `${dd}/${mm}/${yyyy}`;
};
