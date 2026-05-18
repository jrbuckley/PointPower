import { useQuery } from "@tanstack/react-query";
import { buildGoalContext } from "../lib/goalContext";
import {
  getDashboardSummary,
  getRecommendationDetail,
} from "../lib/mockApi";
import { useAppStore } from "../store/appStore";

export function useDashboardSummaryQuery() {
  const rewardBalances = useAppStore((s) => s.rewardBalances);
  const goalPreference = useAppStore((s) => s.goalPreference);
  const customGoalCode = useAppStore((s) => s.customGoalCode);
  const goal = buildGoalContext(goalPreference, customGoalCode);

  return useQuery({
    queryKey: ["dashboard", rewardBalances, goal] as const,
    queryFn: () => getDashboardSummary({ rewardBalances, goal }),
  });
}

export function useRecommendationDetailQuery(id: string | undefined) {
  const rewardBalances = useAppStore((s) => s.rewardBalances);
  const goalPreference = useAppStore((s) => s.goalPreference);
  const customGoalCode = useAppStore((s) => s.customGoalCode);
  const goal = buildGoalContext(goalPreference, customGoalCode);

  return useQuery({
    queryKey: ["recommendation", id, rewardBalances, goal] as const,
    queryFn: () =>
      getRecommendationDetail({
        id: id!,
        rewardBalances,
        goal,
      }),
    enabled: !!id,
  });
}
