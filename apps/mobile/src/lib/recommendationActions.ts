import { Alert } from "react-native";
import type { Router } from "expo-router";
import type { RecommendationAction } from "../types/models";

const ACTION_MESSAGES: Record<
  Exclude<RecommendationAction["actionType"], "view_saved_offers">,
  { title: string; message: string }
> = {
  open_portal: {
    title: "Open travel portal",
    message:
      "In a future update this will deep-link to your issuer’s travel site with your balances pre-filled.",
  },
  start_transfer: {
    title: "Start transfer",
    message:
      "In a future update this will guide you through moving points to the partner program for the offer you selected.",
  },
  statement_credit: {
    title: "Redeem credit",
    message:
      "In a future update this will open your card app on the redeem-points screen.",
  },
  save_offer: {
    title: "Save offer",
    message: "Use the Save offer button on a specific offer card below.",
  },
  set_reminder: {
    title: "Reminder set",
    message:
      "Expiry reminders are coming soon. We’ll notify you before this offer’s window closes.",
  },
  compare_alternatives: {
    title: "Compare paths",
    message:
      "Go back to your dashboard to see how this option compares to cash back and other redemption types.",
  },
};

export function runRecommendationAction(
  action: RecommendationAction,
  router?: Router,
): void {
  if (action.actionType === "view_saved_offers") {
    router?.push("/saved-offers");
    return;
  }

  const copy = ACTION_MESSAGES[action.actionType];
  Alert.alert(copy.title, `${action.description}\n\n${copy.message}`);
}
