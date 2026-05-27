import { Linking } from "react-native";
import type { RedemptionOffer, TransferPathExplanation } from "../types/models";

type ProgramCode = string;
type PartnerCode = string;

const ISSUER_TRAVEL_PORTAL_URL: Record<ProgramCode, string> = {
  chase_ur: "https://ultimaterewardspoints.chase.com/",
  amex_mr: "https://www.americanexpress.com/en-us/travel/",
  capital_one_miles: "https://travel.capitalone.com/",
  citi_ty: "https://www.thankyou.com/",
};

const ISSUER_TRANSFER_URL: Record<ProgramCode, string> = {
  chase_ur:
    "https://www.chase.com/personal/credit-cards/ultimate-rewards/transfer-points",
  amex_mr: "https://global.americanexpress.com/rewards/transfer",
  capital_one_miles:
    "https://www.capitalone.com/learn-grow/more-than-money/transfer-partners/",
  citi_ty: "https://www.thankyou.com/",
};

const ISSUER_REDEEM_CREDIT_URL: Record<ProgramCode, string> = {
  chase_ur: "https://ultimaterewardspoints.chase.com/",
  amex_mr: "https://www.americanexpress.com/en-us/rewards/",
  capital_one_miles: "https://www.capitalone.com/",
  citi_ty: "https://www.thankyou.com/",
  cashback: "https://www.capitalone.com/",
};

/** Where to search or book after points land in a partner program. */
const PARTNER_AWARD_SEARCH_URL: Record<PartnerCode, string> = {
  united: "https://www.united.com/en/us/flights",
  hyatt: "https://www.hyatt.com/shop/awards",
  flying_blue: "https://www.airfrance.us/search/offers",
};

/** Logged-in transfer / partner pages when moving points between programs. */
const PARTNER_TRANSFER_URL: Record<PartnerCode, string> = {
  united: "https://www.united.com/en/us/mileageplus/transfer-miles-to-partners",
  hyatt: "https://world.hyatt.com/content/gp/en/rewards/points-to-miles-partners.html",
  flying_blue: "https://www.flyingblue.com/en/account/transfer-points",
};

const ISSUER_SHORT: Record<ProgramCode, string> = {
  chase_ur: "Chase",
  amex_mr: "Amex",
  capital_one_miles: "Capital One",
  citi_ty: "Citi",
};

const PARTNER_SHORT: Record<PartnerCode, string> = {
  united: "United",
  hyatt: "Hyatt",
  flying_blue: "Flying Blue",
};

export type TransferPathStepAction = {
  label: string;
  url: string;
  kind: "issuer_transfer" | "partner_transfer" | "search_awards";
};

function safeUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) return null;
  return trimmed;
}

export function openHandoffUrl(url: string): void {
  void Linking.openURL(url).catch(() => {
    // Caller may show an alert; keep this helper fire-and-forget safe.
  });
}

function issuerShort(code: string): string {
  return ISSUER_SHORT[code] ?? code.replace(/_/g, " ");
}

function partnerShort(code: string): string {
  return PARTNER_SHORT[code] ?? code.replace(/_/g, " ");
}

export function resolvePartnerAwardSearchUrl(partnerCode: string): string | null {
  return safeUrl(PARTNER_AWARD_SEARCH_URL[partnerCode]);
}

export function resolvePartnerTransferUrl(partnerCode: string): string | null {
  return safeUrl(PARTNER_TRANSFER_URL[partnerCode]);
}

export function partnerCodeFromOffer(offer: RedemptionOffer): string | null {
  const hay = `${offer.title} ${offer.partner}`.toLowerCase();
  if (hay.includes("united")) return "united";
  if (hay.includes("hyatt")) return "hyatt";
  if (hay.includes("flying blue") || hay.includes("air france") || hay.includes("klm")) {
    return "flying_blue";
  }
  return null;
}

export function resolveOfferPartnerAwardUrl(offer: RedemptionOffer): string | null {
  const code = partnerCodeFromOffer(offer);
  return code ? resolvePartnerAwardSearchUrl(code) : null;
}

export function resolvePrimaryActionUrl(input: {
  actionType: "open_portal" | "start_transfer" | "statement_credit";
  programCode?: string | null;
  offer?: RedemptionOffer | null;
}): string | null {
  const programCode = input.programCode ?? input.offer?.programCode ?? null;

  if (input.actionType === "open_portal") {
    return safeUrl(programCode ? ISSUER_TRAVEL_PORTAL_URL[programCode] : undefined);
  }

  if (input.actionType === "start_transfer") {
    return safeUrl(programCode ? ISSUER_TRANSFER_URL[programCode] : undefined);
  }

  if (input.actionType === "statement_credit") {
    return safeUrl(programCode ? ISSUER_REDEEM_CREDIT_URL[programCode] : undefined);
  }

  return null;
}

/** Per trace-line action (parallel to path.traceLines). */
export function getTransferPathStepAction(
  path: TransferPathExplanation,
  stepIndex: number,
): TransferPathStepAction | null {
  const dests = path.stepDestinationCodes ?? [];
  if (stepIndex < 0 || stepIndex >= path.traceLines.length) return null;

  if (stepIndex === 0) {
    const url = safeUrl(ISSUER_TRANSFER_URL[path.issuerProgramCode]);
    if (!url) return null;
    return {
      kind: "issuer_transfer",
      label: `Open ${issuerShort(path.issuerProgramCode)} transfers`,
      url,
    };
  }

  const fromPartner = dests[stepIndex - 1];
  if (!fromPartner) return null;
  const url = resolvePartnerTransferUrl(fromPartner);
  if (!url) return null;
  return {
    kind: "partner_transfer",
    label: `Open ${partnerShort(fromPartner)} account`,
    url,
  };
}

export function getTransferPathAwardSearchAction(
  path: TransferPathExplanation,
): TransferPathStepAction | null {
  const url = resolvePartnerAwardSearchUrl(path.finalPartnerCode);
  if (!url) return null;
  return {
    kind: "search_awards",
    label: `Search awards at ${partnerShort(path.finalPartnerCode)}`,
    url,
  };
}
