import type { ValuationCatalog } from "@points-exchange/shared";
import type { RewardBalanceInput, TransferPathExplanation } from "../types.js";
import {
  findBestTransferPathSummary,
  type TransferPathSummary,
} from "./phase3PathSearch.js";

function activeBalances(balances: RewardBalanceInput[]): RewardBalanceInput[] {
  return balances.filter((b) => b.amount > 0);
}

export function weightedBestTransferPathSummary(
  catalog: ValuationCatalog,
  balances: RewardBalanceInput[],
  asOf: Date = new Date(),
): TransferPathSummary | null {
  let chosen: TransferPathSummary | null = null;
  let bestWeight = -1;

  for (const b of activeBalances(balances)) {
    const summary = findBestTransferPathSummary(catalog, b.programCode, asOf);
    if (!summary) continue;
    const weight = summary.issuerEffectiveCppDb * b.amount;
    if (
      weight > bestWeight ||
      (weight === bestWeight &&
        chosen &&
        summary.issuerEffectiveCppDb > chosen.issuerEffectiveCppDb)
    ) {
      bestWeight = weight;
      chosen = summary;
    }
  }

  return chosen;
}

const PARTNER_LABELS: Record<string, string> = {
  united: "United MileagePlus",
  hyatt: "World of Hyatt",
  flying_blue: "Air France / KLM Flying Blue",
};

const PROGRAM_LABELS: Record<string, string> = {
  amex_mr: "Amex Membership Rewards",
  chase_ur: "Chase Ultimate Rewards",
  capital_one_miles: "Capital One Miles",
  citi_ty: "Citi ThankYou Points",
};

export function formatPartnerCode(code: string): string {
  return PARTNER_LABELS[code] ?? code.replace(/_/g, " ");
}

function formatProgramCode(code: string): string {
  return PROGRAM_LABELS[code] ?? code.replace(/_/g, " ");
}

function formatNodeCode(code: string): string {
  if (code in PROGRAM_LABELS) return formatProgramCode(code);
  return formatPartnerCode(code);
}

function destinationCodeFromTraceLine(line: string): string {
  const arrow = " → ";
  const i = line.indexOf(arrow);
  if (i < 0) return "";
  const after = line.slice(i + arrow.length);
  const paren = after.indexOf(" (");
  return (paren >= 0 ? after.slice(0, paren) : after).trim();
}

function formatTraceLine(line: string): string {
  const arrow = " → ";
  if (!line.includes(arrow)) return line;
  const parts = line.split(arrow);
  const head = parts[0]!;
  const tail = parts.slice(1).join(arrow);
  const ratioMatch = tail.match(/^(.+?) \((\d+:\d+)(.*)\)$/);
  if (!ratioMatch) {
    return `${formatNodeCode(head)} → ${formatNodeCode(tail)}`;
  }
  const partnerPart = ratioMatch[1]!.trim();
  const ratio = ratioMatch[2];
  const bonus = ratioMatch[3] ?? "";
  return `${formatNodeCode(head)} → ${formatNodeCode(partnerPart)} (${ratio}${bonus})`;
}

export function buildTransferPathExplanation(
  summary: TransferPathSummary,
): TransferPathExplanation {
  const issuerLabel = formatProgramCode(summary.issuerProgramCode);
  const partnerLabel = formatPartnerCode(summary.finalPartnerCode);
  const traceLines = summary.trace.map(formatTraceLine);
  const stepDestinationCodes = summary.trace.map(destinationCodeFromTraceLine);

  const headline =
    summary.transferHops > 1
      ? `Best transfer path: ${issuerLabel} → ${partnerLabel} (${summary.transferHops} transfers)`
      : `Best transfer path: ${issuerLabel} → ${partnerLabel}`;

  const detail =
    summary.transferHops > 1
      ? `Among available transfer routes (up to ${summary.transferHops} hops), this chain has the highest estimated cents-per-point for ${issuerLabel}. Confirm award availability before transferring.`
      : `This partner has the highest estimated cents-per-point for ${issuerLabel}. Confirm award availability before transferring.`;

  return {
    headline,
    detail,
    traceLines,
    stepDestinationCodes,
    issuerProgramCode: summary.issuerProgramCode,
    finalPartnerCode: summary.finalPartnerCode,
    transferHops: summary.transferHops,
    modeledIssuerCpp: summary.issuerEffectiveCppDb,
  };
}

export function transferPathExplanationForPortfolio(
  catalog: ValuationCatalog,
  balances: RewardBalanceInput[],
  asOf: Date = new Date(),
): TransferPathExplanation | null {
  const summary = weightedBestTransferPathSummary(catalog, balances, asOf);
  if (!summary) return null;
  return buildTransferPathExplanation(summary);
}
