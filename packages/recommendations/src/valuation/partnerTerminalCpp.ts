import type { ValuationCatalog } from "@points-exchange/shared";
import { cppDbFromPartnerProduct } from "./phase2TransferProducts.js";

function roundCpp(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Best cents-per-partner-point at a terminal partner node from catalog rules and products.
 * When `issuerProgramCode` is set, issuer-specific transfer rules for that partner are included.
 */
export function bestPartnerDenominatedCppDb(
  catalog: ValuationCatalog,
  partnerCode: string,
  issuerProgramCode?: string,
): number {
  let best = 0;

  if (issuerProgramCode) {
    const issuerRule = catalog.valuationRules.find(
      (r) =>
        r.rewardProgramCode === issuerProgramCode &&
        r.redemptionMethodCode === "transfer" &&
        r.transferPartnerCode === partnerCode,
    );
    if (issuerRule) best = Math.max(best, issuerRule.typicalCpp);
  }

  for (const rule of catalog.valuationRules) {
    if (
      rule.redemptionMethodCode === "transfer" &&
      rule.transferPartnerCode === partnerCode
    ) {
      best = Math.max(best, rule.typicalCpp);
    }
  }

  for (const product of catalog.redemptionProducts ?? []) {
    if (product.redemptionMethodCode !== "transfer") continue;
    if (product.partnerCode !== partnerCode) continue;
    best = Math.max(best, cppDbFromPartnerProduct(product));
  }

  return roundCpp(best);
}
