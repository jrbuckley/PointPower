import type {
  MockLinkConnectInput,
  MockLinkConnectResponse,
  SyncRewardAccountsInput,
  UserRewardAccount,
} from "@points-exchange/shared";
import { apiFetch } from "./apiClient";
import { codeToProgramId, programIdToCode } from "./programCodeMap";
import type { RewardBalance } from "../types/models";

function accountsToBalances(accounts: UserRewardAccount[]): RewardBalance[] {
  const balances: RewardBalance[] = [];
  for (const account of accounts) {
    const programId = codeToProgramId(account.programCode);
    if (!programId) continue;
    balances.push({ programId, amount: account.balance });
  }
  return balances;
}

function balancesToSyncInput(balances: RewardBalance[]): SyncRewardAccountsInput {
  return {
    accounts: balances.map((b) => ({
      programCode: programIdToCode(b.programId),
      balance: Math.max(0, Math.round(b.amount)),
    })),
  };
}

export async function fetchRewardAccounts(): Promise<RewardBalance[]> {
  const data = await apiFetch<{ accounts: UserRewardAccount[] }>(
    "/api/v1/reward-accounts",
  );
  return accountsToBalances(data.accounts);
}

export async function syncRewardAccounts(
  balances: RewardBalance[],
): Promise<RewardBalance[]> {
  const body = balancesToSyncInput(balances);
  const data = await apiFetch<{ accounts: UserRewardAccount[] }>(
    "/api/v1/reward-accounts/sync",
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
  );
  return accountsToBalances(data.accounts);
}

export async function mockLinkConnect(
  input: MockLinkConnectInput,
): Promise<MockLinkConnectResponse> {
  return apiFetch<MockLinkConnectResponse>("/api/v1/linked-accounts/mock-connect", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function applyMockLinkedAccounts(): Promise<RewardBalance[]> {
  const data = await apiFetch<{
    accounts: { programCode: string; balance: number }[];
  }>("/api/v1/linked-accounts/mock-connect/apply", {
    method: "POST",
    body: JSON.stringify({}),
  });
  const balances: RewardBalance[] = [];
  for (const row of data.accounts) {
    const programId = codeToProgramId(row.programCode);
    if (!programId) continue;
    balances.push({ programId, amount: row.balance });
  }
  return balances;
}
