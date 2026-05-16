import { isApiConfigured } from "./apiClient";
import { syncRewardAccounts } from "./rewardAccountsApi";
import type { RewardBalance } from "../types/models";

/** Saves balances to the API when configured; otherwise returns input unchanged. */
export async function persistRewardBalances(
  balances: RewardBalance[],
): Promise<RewardBalance[]> {
  if (!isApiConfigured()) {
    return balances;
  }
  return syncRewardAccounts(balances);
}
