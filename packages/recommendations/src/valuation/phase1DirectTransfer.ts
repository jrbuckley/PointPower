/**
 * Transfer valuation: Phase 3 path search (multi-hop, ratios, bonuses) with goal tuning.
 *
 * Phases 1–2 logic is subsumed by `bestDbCppFromTransferPaths`, which considers:
 * generic transfer CPP, direct issuer→partner paths (with ratios/bonuses), partner→partner
 * chains up to MAX_TRANSFER_PATH_HOPS, and terminal partner CPP from rules + products.
 */
import type { ValuationCatalog } from "@points-exchange/shared";
import { resolveTuning } from "../customGoalTuning.js";
import type { GoalContext, RewardBalanceInput } from "../types.js";
import { bestDbCppFromTransferPaths } from "./phase3PathSearch.js";

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function dollarsFor(points: number, cpp: number): number {
  if (points <= 0) return 0;
  return roundMoney((points * cpp) / 100);
}

function effectiveIssuerTransferCpp(dbCpp: number, ctx: GoalContext): number {
  const tuning = resolveTuning(ctx);
  const baselineTransfer = 1.75;
  return roundMoney(dbCpp * (tuning.transferCpp / baselineTransfer));
}

/** Best effective CPP via transfer paths (Phase 3), with preset goal tuning applied. */
export function bestEffectiveCppDirectTransferPhase1(
  catalog: ValuationCatalog,
  programCode: string,
  ctx: GoalContext,
  asOf: Date = new Date(),
): number {
  if (ctx.goalPreference === "CUSTOM" && ctx.customGoalCode) {
    return resolveTuning(ctx).transferCpp;
  }

  const dbCpp = bestDbCppFromTransferPaths(catalog, programCode, asOf);
  return effectiveIssuerTransferCpp(dbCpp, ctx);
}

export function estimatedTransferValueDirectPhase1(
  catalog: ValuationCatalog,
  balances: RewardBalanceInput[],
  ctx: GoalContext,
  asOf: Date = new Date(),
): number {
  return roundMoney(
    balances
      .filter((b) => b.amount > 0)
      .reduce(
        (sum, b) =>
          sum +
          dollarsFor(
            b.amount,
            bestEffectiveCppDirectTransferPhase1(
              catalog,
              b.programCode,
              ctx,
              asOf,
            ),
          ),
        0,
      ),
  );
}
