import { format, formatDistanceToNowStrict } from "date-fns";

export const formatCurrency = (amount: number | string, currency = "INR"): string => {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatDate = (iso: string): string => format(new Date(iso), "dd MMM yyyy");

export const formatRelativeTime = (iso: string): string =>
  `${formatDistanceToNowStrict(new Date(iso), { addSuffix: true })}`;

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) {
    return `${remainder}m`;
  }
  if (remainder === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainder}m`;
};

export const formatPercentile = (value: number): string => {
  const percentile = Math.max(0, Math.min(100, Math.round((1 - value) * 100)));
  return `Top ${percentile}%`;
};
