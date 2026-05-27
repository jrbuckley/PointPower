import { Alert, Linking } from "react-native";
import type { Router } from "expo-router";
import type { RecommendationAction } from "../types/models";

const ACTION_MESSAGES: Record<
  Exclude<RecommendationAction["actionType"], "view_saved_offers">,
  { title: string; message: string }
> = {
  open_portal: {
    title: "Open travel portal",
    message:
      "Open your issuer’s travel site in your browser to search and book with your points.",
  },
  start_transfer: {
    title: "Start transfer",
    message:
      "Open your issuer’s rewards page to transfer points to the partner program for this offer.",
  },
  statement_credit: {
    title: "Redeem credit",
    message:
      "Open your card issuer’s app or website to redeem points for a statement credit.",
  },
  save_offer: {
    title: "Save offer",
    message: "Use the Save offer button on a specific offer card below.",
  },
  set_reminder: {
    title: "Reminder",
    message:
      "Open Saved offers from the menu to track offers you want to act on.",
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
  url?: string | null,
): void {
  if (action.actionType === "view_saved_offers") {
    router?.push("/saved-offers");
    return;
  }

  if (url) {
    void Linking.openURL(url).catch(() => {
      Alert.alert(
        "Could not open link",
        "We couldn’t open your browser. Please try again or open it manually.",
      );
    });
    return;
  }

  const copy = ACTION_MESSAGES[action.actionType];
  Alert.alert(copy.title, `${action.description}\n\n${copy.message}`);
}
