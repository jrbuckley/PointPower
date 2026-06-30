import { programIdToCode } from "./programCodeMap";
import type { RewardBalance } from "../types/models";

export function balancesToInput(balances: RewardBalance[]) {
  return balances.map((b) => ({
    programCode: programIdToCode(b.programId),
    amount: b.amount,
  }));
}
