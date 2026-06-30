import type {
  CustomGoalCode,
  GoalPreference,
  UpdateUserProfileInput,
  UserProfile,
} from "@points-exchange/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

type ProfileRow = {
  id: string;
  display_name: string | null;
  goal_preference: GoalPreference;
  custom_goal_code: CustomGoalCode | null;
};

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    goalPreference: row.goal_preference,
    customGoalCode: row.custom_goal_code,
  };
}

/** Ensures `users_profile` exists for FK constraints on reward balances. */
export async function ensureUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("users_profile")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (data) {
    return;
  }

  const { error: insertError } = await supabase.from("users_profile").insert({
    id: userId,
  });
  if (insertError) {
    throw insertError;
  }
}

export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserProfile> {
  await ensureUserProfile(supabase, userId);

  const { data, error } = await supabase
    .from("users_profile")
    .select("id, display_name, goal_preference, custom_goal_code")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return mapProfile(data as ProfileRow);
}

export async function updateUserProfile(
  supabase: SupabaseClient,
  userId: string,
  input: UpdateUserProfileInput,
): Promise<UserProfile> {
  await ensureUserProfile(supabase, userId);

  const customGoalCode =
    input.goalPreference === "CUSTOM" ? (input.customGoalCode ?? null) : null;

  const { data, error } = await supabase
    .from("users_profile")
    .update({
      goal_preference: input.goalPreference,
      custom_goal_code: customGoalCode,
    })
    .eq("id", userId)
    .select("id, display_name, goal_preference, custom_goal_code")
    .single();

  if (error) {
    throw error;
  }

  return mapProfile(data as ProfileRow);
}

/** @deprecated Use updateUserProfile */
export async function updateUserGoalPreference(
  supabase: SupabaseClient,
  userId: string,
  goalPreference: GoalPreference,
): Promise<UserProfile> {
  return updateUserProfile(supabase, userId, { goalPreference });
}
