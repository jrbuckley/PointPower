export function formatPoints(n: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDollars(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDollarsRange(min: number, max: number): string {
  return `${formatDollars(min)} to ${formatDollars(max)}`;
}

export function parseAmountInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return 0;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
}

export function formatAmountInputDisplay(amount: number): string {
  if (amount <= 0) return "";
  return formatPoints(amount);
}
