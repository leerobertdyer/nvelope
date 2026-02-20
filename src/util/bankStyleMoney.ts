/**
 * Bank-style money input: values stored as dollars (number), edited as integer cents.
 * Used by MoneyInput for consistent conversion and testability.
 */

/** Convert dollars to integer cents (rounds to avoid float drift). */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Convert integer cents to dollars. */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/** Format cents for display (e.g. 1234 -> "12.34", -1234 -> "-12.34"). */
export function formatCentsForDisplay(cents: number): string {
  if (cents === 0) return "";
  const absCents = Math.abs(cents);
  const dollars = (absCents / 100).toFixed(2);
  return cents < 0 ? `-${dollars}` : dollars;
}
