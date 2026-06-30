/**
 * Phase 2: incorporation of catalogued redemption products (named leaves).
 * Transfer products are priced in partner points; reachable from an issuer iff
 * a direct issuerTransferEdge exists. Assumes 1:1 issuer→partner ratios for CPP comparison.
 */
import type { ValuationCatalog } from "@points-exchange/shared";

function roundCpp(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Cents per originating issuer point implied by partner-denominated product pricing. */
export function cppDbFromPartnerProduct(product: {
  cashValueUsd: number;
  pointsRequired: number;
}): number {
  if (product.pointsRequired <= 0) return 0;
  return roundCpp((product.cashValueUsd / product.pointsRequired) * 100);
}

/** Best raw (DB-style) issuer CPP contributed by transferable partner redemption products for this issuer. */
export function bestDbCppFromIssuerTransferProducts(
  catalog: ValuationCatalog,
  issuerProgramCode: string,
): number | null {
  let best: number | null = null;

  const edges = catalog.issuerTransferEdges ?? [];

  for (const p of catalog.redemptionProducts ?? []) {
    if (p.redemptionMethodCode !== "transfer" || !p.partnerCode) continue;

    const hasEdge = edges.some(
      (e) =>
        e.rewardProgramCode === issuerProgramCode &&
        e.partnerCode === p.partnerCode,
    );
    if (!hasEdge) continue;

    const cppDb = cppDbFromPartnerProduct(p);
    if (best === null || cppDb > best) best = cppDb;
  }

  return best;
}
