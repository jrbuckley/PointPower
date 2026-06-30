/**
 * Phase 3: bounded multi-hop transfer path search with ratio + bonus math.
 *
 * Paths: issuer → partner (→ partner …) → terminal valuation at final partner.
 * Compares issuer-side effective CPP from each feasible path vs generic transfer CPP.
 */
import type { ValuationCatalog } from "@points-exchange/shared";
import {
  applyTransferConversion,
  issuerCppFromPartnerTerminal,
} from "./transferMath.js";
import { bestPartnerDenominatedCppDb } from "./partnerTerminalCpp.js";

/** Max transfer edges in a path (issuer→partner counts as one). */
export const MAX_TRANSFER_PATH_HOPS = 3;

function roundCpp(n: number): number {
  return Math.round(n * 100) / 100;
}

function resolveGenericTransferCppDb(
  catalog: ValuationCatalog,
  programCode: string,
): number {
  const rule = catalog.valuationRules.find(
    (r) =>
      r.rewardProgramCode === programCode &&
      r.redemptionMethodCode === "transfer" &&
      !r.transferPartnerCode,
  );
  if (rule) return rule.typicalCpp;
  const fallback = catalog.valuationRules.filter(
    (r) => r.redemptionMethodCode === "transfer" && !r.transferPartnerCode,
  );
  return fallback.length > 0
    ? Math.max(...fallback.map((r) => r.typicalCpp))
    : 1.75;
}

function isBonusActive(
  startsAt: string,
  endsAt: string,
  asOf: Date,
): boolean {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const t = asOf.getTime();
  return t >= start && t <= end;
}

function issuerTransferBonusPercent(
  catalog: ValuationCatalog,
  issuerProgramCode: string,
  partnerCode: string,
  asOf: Date,
): number {
  let bonus = 0;
  for (const b of catalog.transferBonuses ?? []) {
    if (b.rewardProgramCode !== issuerProgramCode) continue;
    if (b.toPartnerCode !== partnerCode) continue;
    if (b.fromPartnerCode != null) continue;
    if (!isBonusActive(b.startsAt, b.endsAt, asOf)) continue;
    bonus = Math.max(bonus, b.bonusPercent);
  }
  return bonus;
}

function partnerTransferBonusPercent(
  catalog: ValuationCatalog,
  fromPartnerCode: string,
  toPartnerCode: string,
  asOf: Date,
): number {
  let bonus = 0;
  for (const b of catalog.transferBonuses ?? []) {
    if (b.rewardProgramCode != null) continue;
    if (b.fromPartnerCode !== fromPartnerCode) continue;
    if (b.toPartnerCode !== toPartnerCode) continue;
    if (!isBonusActive(b.startsAt, b.endsAt, asOf)) continue;
    bonus = Math.max(bonus, b.bonusPercent);
  }
  return bonus;
}

function evaluateTerminalIssuerCpp(
  catalog: ValuationCatalog,
  issuerProgramCode: string,
  issuerPoints: number,
  finalPartnerCode: string,
  partnerPoints: number,
): number {
  const partnerCpp = bestPartnerDenominatedCppDb(
    catalog,
    finalPartnerCode,
    issuerProgramCode,
  );
  if (partnerCpp <= 0) return 0;
  return issuerCppFromPartnerTerminal(
    issuerPoints,
    partnerPoints,
    partnerCpp,
  );
}

function dfsPartnerHops(
  catalog: ValuationCatalog,
  issuerProgramCode: string,
  issuerPoints: number,
  currentPartner: string,
  partnerPoints: number,
  hopsUsed: number,
  visited: Set<string>,
  asOf: Date,
  best: { cpp: number },
): void {
  const terminalCpp = evaluateTerminalIssuerCpp(
    catalog,
    issuerProgramCode,
    issuerPoints,
    currentPartner,
    partnerPoints,
  );
  if (terminalCpp > best.cpp) best.cpp = terminalCpp;

  if (hopsUsed >= MAX_TRANSFER_PATH_HOPS) return;

  for (const edge of catalog.partnerTransferEdges ?? []) {
    if (!edge.isActive) continue;
    if (edge.fromPartnerCode !== currentPartner) continue;
    if (visited.has(edge.toPartnerCode)) continue;

    if (
      edge.minTransferPoints != null &&
      partnerPoints < edge.minTransferPoints
    ) {
      continue;
    }

    const bonus = partnerTransferBonusPercent(
      catalog,
      edge.fromPartnerCode,
      edge.toPartnerCode,
      asOf,
    );
    const nextPoints = applyTransferConversion(
      partnerPoints,
      edge.transferRatioNum,
      edge.transferRatioDen,
      bonus,
    );
    if (nextPoints <= 0) continue;

    visited.add(edge.toPartnerCode);
    dfsPartnerHops(
      catalog,
      issuerProgramCode,
      issuerPoints,
      edge.toPartnerCode,
      nextPoints,
      hopsUsed + 1,
      visited,
      asOf,
      best,
    );
    visited.delete(edge.toPartnerCode);
  }
}

/**
 * Best raw (DB-style) issuer CPP from generic transfer rule, direct/multi-hop paths,
 * and partner terminal valuations. Does not apply goal tuning.
 */
export function bestDbCppFromTransferPaths(
  catalog: ValuationCatalog,
  issuerProgramCode: string,
  asOf: Date = new Date(),
): number {
  let bestCpp = resolveGenericTransferCppDb(catalog, issuerProgramCode);

  const issuerPoints = 1;

  for (const edge of catalog.issuerTransferEdges ?? []) {
    if (edge.rewardProgramCode !== issuerProgramCode) continue;

    const bonus = issuerTransferBonusPercent(
      catalog,
      issuerProgramCode,
      edge.partnerCode,
      asOf,
    );
    const partnerPoints = applyTransferConversion(
      issuerPoints,
      edge.transferRatioNum,
      edge.transferRatioDen,
      bonus,
    );
    if (partnerPoints <= 0) continue;

    const directCpp = evaluateTerminalIssuerCpp(
      catalog,
      issuerProgramCode,
      issuerPoints,
      edge.partnerCode,
      partnerPoints,
    );
    if (directCpp > bestCpp) bestCpp = directCpp;

    const visited = new Set<string>([edge.partnerCode]);
    const hopBest = { cpp: bestCpp };
    dfsPartnerHops(
      catalog,
      issuerProgramCode,
      issuerPoints,
      edge.partnerCode,
      partnerPoints,
      1,
      visited,
      asOf,
      hopBest,
    );
    if (hopBest.cpp > bestCpp) bestCpp = hopBest.cpp;
  }

  return roundCpp(bestCpp);
}

export type TransferPathSummary = {
  issuerProgramCode: string;
  finalPartnerCode: string;
  transferHops: number;
  issuerEffectiveCppDb: number;
  trace: string[];
};

/** Returns the strongest path by issuer-side DB CPP (for explainability / future UI). */
export function findBestTransferPathSummary(
  catalog: ValuationCatalog,
  issuerProgramCode: string,
  asOf: Date = new Date(),
): TransferPathSummary | null {
  const issuerPoints = 1;
  let best: TransferPathSummary | null = null;

  function consider(
    finalPartner: string,
    partnerPoints: number,
    hops: number,
    trace: string[],
  ) {
    const cpp = evaluateTerminalIssuerCpp(
      catalog,
      issuerProgramCode,
      issuerPoints,
      finalPartner,
      partnerPoints,
    );
    if (cpp <= 0) return;
    if (!best || cpp > best.issuerEffectiveCppDb) {
      best = {
        issuerProgramCode,
        finalPartnerCode: finalPartner,
        transferHops: hops,
        issuerEffectiveCppDb: cpp,
        trace,
      };
    }
  }

  for (const edge of catalog.issuerTransferEdges ?? []) {
    if (edge.rewardProgramCode !== issuerProgramCode) continue;
    const bonus = issuerTransferBonusPercent(
      catalog,
      issuerProgramCode,
      edge.partnerCode,
      asOf,
    );
    const partnerPoints = applyTransferConversion(
      issuerPoints,
      edge.transferRatioNum,
      edge.transferRatioDen,
      bonus,
    );
    if (partnerPoints <= 0) continue;

    const trace = [
      `${issuerProgramCode} → ${edge.partnerCode} (${edge.transferRatioNum}:${edge.transferRatioDen}${bonus > 0 ? ` +${bonus}%` : ""})`,
    ];
    consider(edge.partnerCode, partnerPoints, 1, trace);

    function dfs(
      currentPartner: string,
      pts: number,
      hops: number,
      visited: Set<string>,
      pathTrace: string[],
    ) {
      if (hops >= MAX_TRANSFER_PATH_HOPS) return;
      for (const pe of catalog.partnerTransferEdges ?? []) {
        if (!pe.isActive) continue;
        if (pe.fromPartnerCode !== currentPartner) continue;
        if (visited.has(pe.toPartnerCode)) continue;
        if (pe.minTransferPoints != null && pts < pe.minTransferPoints) continue;

        const pb = partnerTransferBonusPercent(
          catalog,
          pe.fromPartnerCode,
          pe.toPartnerCode,
          asOf,
        );
        const nextPts = applyTransferConversion(
          pts,
          pe.transferRatioNum,
          pe.transferRatioDen,
          pb,
        );
        if (nextPts <= 0) continue;

        const nextTrace = [
          ...pathTrace,
          `${pe.fromPartnerCode} → ${pe.toPartnerCode} (${pe.transferRatioNum}:${pe.transferRatioDen}${pb > 0 ? ` +${pb}%` : ""})`,
        ];
        consider(pe.toPartnerCode, nextPts, hops + 1, nextTrace);

        visited.add(pe.toPartnerCode);
        dfs(pe.toPartnerCode, nextPts, hops + 1, visited, nextTrace);
        visited.delete(pe.toPartnerCode);
      }
    }

    dfs(
      edge.partnerCode,
      partnerPoints,
      1,
      new Set([edge.partnerCode]),
      trace,
    );
  }

  return best;
}
