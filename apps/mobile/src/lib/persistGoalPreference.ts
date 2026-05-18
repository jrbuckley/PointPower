import type { CustomGoalCode, GoalPreference } from "../types/models";
import { isApiConfigured } from "./apiClient";
import {
  updateProfileGoals,
  type SavedProfileGoals,
} from "./profileApi";

/** Saves goal preferences to the API when configured; otherwise returns input unchanged. */
export async function persistProfileGoals(
  goalPreference: GoalPreference,
  customGoalCode: CustomGoalCode | null,
): Promise<SavedProfileGoals> {
  if (!isApiConfigured()) {
    return {
      goalPreference,
      customGoalCode: goalPreference === "CUSTOM" ? customGoalCode : null,
    };
  }
  return updateProfileGoals(goalPreference, customGoalCode);
}
