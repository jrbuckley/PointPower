import type { RewardBalance } from "../types/models";

export function getTotalRewardPoints(balances: RewardBalance[]): number {
  return Math.round(
    balances.reduce((sum, b) => sum + Math.max(0, b.amount), 0),
  );
}

/** No programs, or every balance is zero — show onboarding-style empty dashboard. */
export function isDashboardEmpty(balances: RewardBalance[]): boolean {
  return getTotalRewardPoints(balances) === 0;
}
