import type { RedemptionOffer } from "../types/models";

type ProgramCode = string;

const ISSUER_TRAVEL_PORTAL_URL: Record<ProgramCode, string> = {
  chase_ur: "https://ultimaterewardspoints.chase.com/",
  amex_mr: "https://www.americanexpress.com/en-us/travel/",
  capital_one_miles: "https://travel.capitalone.com/",
  citi_ty: "https://www.thankyou.com/",
};

const ISSUER_TRANSFER_URL: Record<ProgramCode, string> = {
  chase_ur: "https://www.chase.com/personal/credit-cards/ultimate-rewards/transfer-points",
  amex_mr: "https://global.americanexpress.com/rewards/transfer",
  capital_one_miles: "https://www.capitalone.com/learn-grow/more-than-money/transfer-partners/",
  citi_ty: "https://www.thankyou.com/",
};

const ISSUER_REDEEM_CREDIT_URL: Record<ProgramCode, string> = {
  chase_ur: "https://ultimaterewardspoints.chase.com/",
  amex_mr: "https://www.americanexpress.com/en-us/rewards/",
  capital_one_miles: "https://www.capitalone.com/",
  citi_ty: "https://www.thankyou.com/",
  cashback: "https://www.capitalone.com/",
};

function safeUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) return null;
  return trimmed;
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

