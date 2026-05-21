import { useQuery } from "@tanstack/react-query";
import { buildGoalContext } from "../lib/goalContext";
import {
  canUseRecommendationsApi,
  fetchDashboardFromApi,
  fetchRecommendationDetailFromApi,
} from "../lib/recommendationsApi";
import {
  getDashboardSummary,
  getRecommendationDetail,
} from "../lib/mockApi";
import { useAppStore } from "../store/appStore";
import { useValuationCatalog } from "./useValuationCatalog";

export function useDashboardSummaryQuery() {
  const rewardBalances = useAppStore((s) => s.rewardBalances);
  const goalPreference = useAppStore((s) => s.goalPreference);
  const customGoalCode = useAppStore((s) => s.customGoalCode);
  const goal = buildGoalContext(goalPreference, customGoalCode);
  const catalogQuery = useValuationCatalog(true);
  const useApi = canUseRecommendationsApi();

  return useQuery({
    queryKey: ["dashboard", useApi, rewardBalances, goal, catalogQuery.dataUpdatedAt] as const,
    queryFn: () =>
      useApi
        ? fetchDashboardFromApi()
        : getDashboardSummary({ rewardBalances, goal }),
    placeholderData: (previous) => previous,
    enabled: !useApi || catalogQuery.isSuccess || catalogQuery.isFetched,
  });
}

export function useRecommendationDetailQuery(id: string | undefined) {
  const rewardBalances = useAppStore((s) => s.rewardBalances);
  const goalPreference = useAppStore((s) => s.goalPreference);
  const customGoalCode = useAppStore((s) => s.customGoalCode);
  const goal = buildGoalContext(goalPreference, customGoalCode);
  const catalogQuery = useValuationCatalog(true);
  const useApi = canUseRecommendationsApi();

  return useQuery({
    queryKey: [
      "recommendation",
      useApi,
      id,
      rewardBalances,
      goal,
      catalogQuery.dataUpdatedAt,
    ] as const,
    queryFn: () =>
      useApi
        ? fetchRecommendationDetailFromApi(id!)
        : getRecommendationDetail({
            id: id!,
            rewardBalances,
            goal,
          }),
    enabled:
      !!id && (!useApi || catalogQuery.isSuccess || catalogQuery.isFetched),
    placeholderData: (previous) => previous,
  });
}
