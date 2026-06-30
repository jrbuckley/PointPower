import {
  rewardProgramCodeSchema,
  type RewardProgram,
  type RewardProgramCode,
  type UserRewardAccount,
} from "@points-exchange/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureUserProfile } from "./profiles.js";

type BalanceRow = {
  id: string;
  balance: number;
  source: string;
  last_updated_at: string;
  reward_program_id: string;
  reward_programs: {
    id: string;
    code: string;
    name: string;
    issuer: string | null;
    point_name: string | null;
    is_active: boolean;
  } | null;
};

const balanceSelect = `
  id,
  balance,
  source,
  last_updated_at,
  reward_program_id,
  reward_programs (
    id,
    code,
    name,
    issuer,
    point_name,
    is_active
  )
`;

function mapProgram(row: NonNullable<BalanceRow["reward_programs"]>): RewardProgram {
  const codeParsed = rewardProgramCodeSchema.safeParse(row.code);
  if (!codeParsed.success) {
    throw new Error(`Unknown program code in database: ${row.code}`);
  }
  return {
    id: row.id,
    code: codeParsed.data,
    name: row.name,
    issuer: row.issuer,
    pointName: row.point_name,
    isActive: row.is_active,
  };
}

function mapAccount(row: BalanceRow): UserRewardAccount {
  if (!row.reward_programs) {
    throw new Error(`Balance ${row.id} is missing program data`);
  }
  const program = mapProgram(row.reward_programs);
  const sourceParsed = ["manual", "linked", "linked_mock"].includes(row.source)
    ? (row.source as UserRewardAccount["source"])
    : "manual";

  return {
    id: row.id,
    programId: program.id,
    programCode: program.code,
    programName: program.name,
    balance: row.balance,
    source: sourceParsed,
    lastUpdatedAt: row.last_updated_at,
  };
}

export async function listRewardPrograms(
  supabase: SupabaseClient,
): Promise<RewardProgram[]> {
  const { data, error } = await supabase
    .from("reward_programs")
    .select("id, code, name, issuer, point_name, is_active")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapProgram(row as BalanceRow["reward_programs"] & { id: string }));
}

export async function listUserRewardAccounts(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserRewardAccount[]> {
  const { data, error } = await supabase
    .from("user_reward_balances")
    .select(balanceSelect)
    .eq("user_id", userId)
    .order("last_updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as BalanceRow[]).map(mapAccount);
}

async function getProgramByCode(
  supabase: SupabaseClient,
  programCode: RewardProgramCode,
) {
  const { data, error } = await supabase
    .from("reward_programs")
    .select("id, code, name, issuer, point_name, is_active")
    .eq("code", programCode)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  return mapProgram(data as BalanceRow["reward_programs"] & { id: string });
}

export async function createUserRewardAccount(
  supabase: SupabaseClient,
  userId: string,
  input: { programCode: RewardProgramCode; balance: number; source?: string },
): Promise<UserRewardAccount> {
  await ensureUserProfile(supabase, userId);
  const program = await getProgramByCode(supabase, input.programCode);
  if (!program) {
    throw new Error("program_not_found");
  }

  const { data, error } = await supabase
    .from("user_reward_balances")
    .insert({
      user_id: userId,
      reward_program_id: program.id,
      balance: input.balance,
      source: input.source ?? "manual",
    })
    .select(balanceSelect)
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("account_exists");
    }
    throw error;
  }

  return mapAccount(data as unknown as BalanceRow);
}

export async function updateUserRewardAccount(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
  balance: number,
): Promise<UserRewardAccount | null> {
  const { data, error } = await supabase
    .from("user_reward_balances")
    .update({ balance, last_updated_at: new Date().toISOString() })
    .eq("id", accountId)
    .eq("user_id", userId)
    .select(balanceSelect)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  return mapAccount(data as unknown as BalanceRow);
}

export async function deleteUserRewardAccount(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_reward_balances")
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }
  return Boolean(data);
}

export async function syncUserRewardAccounts(
  supabase: SupabaseClient,
  userId: string,
  accounts: { programCode: RewardProgramCode; balance: number }[],
): Promise<UserRewardAccount[]> {
  await ensureUserProfile(supabase, userId);

  const existing = await listUserRewardAccounts(supabase, userId);
  const desiredCodes = new Set(accounts.map((a) => a.programCode));

  for (const row of existing) {
    if (!desiredCodes.has(row.programCode)) {
      await deleteUserRewardAccount(supabase, userId, row.id);
    }
  }

  for (const account of accounts) {
    const program = await getProgramByCode(supabase, account.programCode);
    if (!program) {
      continue;
    }

    const { error } = await supabase.from("user_reward_balances").upsert(
      {
        user_id: userId,
        reward_program_id: program.id,
        balance: account.balance,
        source: "manual",
        last_updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,reward_program_id" },
    );

    if (error) {
      throw error;
    }
  }

  return listUserRewardAccounts(supabase, userId);
}
