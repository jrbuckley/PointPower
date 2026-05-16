import type { GoalPreference, UserProfile } from "@points-exchange/shared";
import { apiFetch } from "./apiClient";

export async function fetchProfile(): Promise<UserProfile> {
  const data = await apiFetch<{ profile: UserProfile }>("/api/v1/profile");
  return data.profile;
}

export async function updateGoalPreference(
  goalPreference: GoalPreference,
): Promise<GoalPreference> {
  const data = await apiFetch<{ profile: UserProfile }>("/api/v1/profile", {
    method: "PATCH",
    body: JSON.stringify({ goalPreference }),
  });
  return data.profile.goalPreference;
}
