import { useQuery } from "@tanstack/react-query";
import {
  getDashboardSummary,
  getRecommendationDetail,
} from "../lib/mockApi";
import { useAppStore } from "../store/appStore";

export function useDashboardSummaryQuery() {
  const rewardBalances = useAppStore((s) => s.rewardBalances);
  const goalPreference = useAppStore((s) => s.goalPreference);

  return useQuery({
    queryKey: ["dashboard", rewardBalances, goalPreference] as const,
    queryFn: () =>
      getDashboardSummary({ rewardBalances, goalPreference }),
  });
}

export function useRecommendationDetailQuery(id: string | undefined) {
  const rewardBalances = useAppStore((s) => s.rewardBalances);
  const goalPreference = useAppStore((s) => s.goalPreference);

  return useQuery({
    queryKey: ["recommendation", id, rewardBalances, goalPreference] as const,
    queryFn: () =>
      getRecommendationDetail({
        id: id!,
        rewardBalances,
        goalPreference,
      }),
    enabled: !!id,
  });
}
