import type { RewardBalance, RewardProgramType } from "../types/models";

export const ALL_PROGRAMS: RewardProgramType[] = [
  "CHASE_UR",
  "AMEX_MR",
  "CAPITAL_ONE_MILES",
  "CITI_TY",
  "CASHBACK",
];

export const PROGRAM_LABELS: Record<RewardProgramType, string> = {
  CHASE_UR: "Chase Ultimate Rewards",
  AMEX_MR: "American Express Membership Rewards",
  CAPITAL_ONE_MILES: "Capital One Miles",
  CITI_TY: "Citi ThankYou Points",
  CASHBACK: "Cash back / statement credit",
};

export function emptyBalances(): RewardBalance[] {
  return ALL_PROGRAMS.map((program) => ({ program, amount: 0 }));
}
