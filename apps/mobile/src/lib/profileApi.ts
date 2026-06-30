import type {
  CustomGoalCode,
  GoalPreference,
  UpdateUserProfileInput,
  UserProfile,
} from "@points-exchange/shared";
import { apiFetch } from "./apiClient";

export async function fetchProfile(): Promise<UserProfile> {
  const data = await apiFetch<{ profile: UserProfile }>("/api/v1/profile");
  return data.profile;
}

export async function updateProfile(
  input: UpdateUserProfileInput,
): Promise<UserProfile> {
  const data = await apiFetch<{ profile: UserProfile }>("/api/v1/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.profile;
}

export type SavedProfileGoals = {
  goalPreference: GoalPreference;
  customGoalCode: CustomGoalCode | null;
};

export async function updateProfileGoals(
  goalPreference: GoalPreference,
  customGoalCode: CustomGoalCode | null,
): Promise<SavedProfileGoals> {
  const body: UpdateUserProfileInput =
    goalPreference === "CUSTOM"
      ? { goalPreference, customGoalCode: customGoalCode! }
      : { goalPreference, customGoalCode: null };

  const profile = await updateProfile(body);
  return {
    goalPreference: profile.goalPreference,
    customGoalCode: profile.customGoalCode,
  };
}
