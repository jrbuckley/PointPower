import { Alert } from "react-native";
import type { RecommendationAction } from "../types/models";

const ACTION_MESSAGES: Record<
  RecommendationAction["actionType"],
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
    title: "Offer saved",
    message:
      "We’ll add a saved-offers list soon. For now, bookmark this screen or note the partner and points required.",
  },
  set_reminder: {
    title: "Reminder set",
    message:
      "Expiry reminders are coming soon. We’ll notify you before this offer window closes.",
  },
  compare_alternatives: {
    title: "Compare paths",
    message:
      "Go back to your dashboard to see how this option compares to cash back and other redemption types.",
  },
};

export function runRecommendationAction(action: RecommendationAction): void {
  const copy = ACTION_MESSAGES[action.actionType];
  Alert.alert(copy.title, `${action.description}\n\n${copy.message}`);
}
