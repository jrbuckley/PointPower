import { isApiConfigured } from "./apiClient";
import { updateGoalPreference } from "./profileApi";
import type { GoalPreference } from "../types/models";

/** Saves goal preference to the API when configured; otherwise returns input unchanged. */
export async function persistGoalPreference(
  preference: GoalPreference,
): Promise<GoalPreference> {
  if (!isApiConfigured()) {
    return preference;
  }
  return updateGoalPreference(preference);
}
