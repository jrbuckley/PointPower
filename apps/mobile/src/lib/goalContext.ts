import type { CustomGoalCode, GoalPreference } from "@points-exchange/shared";
import { DEFAULT_CUSTOM_GOAL_CODE } from "../constants/customGoals";

export type GoalContext = {
  goalPreference: GoalPreference;
  customGoalCode: CustomGoalCode | null;
};

export function buildGoalContext(
  goalPreference: GoalPreference,
  customGoalCode: CustomGoalCode | null,
): GoalContext {
  if (goalPreference !== "CUSTOM") {
    return { goalPreference, customGoalCode: null };
  }
  return {
    goalPreference,
    customGoalCode: customGoalCode ?? DEFAULT_CUSTOM_GOAL_CODE,
  };
}
