import type { RewardProgramCode } from "@points-exchange/shared";
import { PROGRAM_IDS } from "../constants/programs";
import type { RewardProgramId } from "../types/models";

export function programIdToCode(programId: RewardProgramId): RewardProgramCode {
  return programId.toLowerCase() as RewardProgramCode;
}

export function codeToProgramId(code: string): RewardProgramId | null {
  const programId = code.toUpperCase() as RewardProgramId;
  return PROGRAM_IDS.includes(programId) ? programId : null;
}
