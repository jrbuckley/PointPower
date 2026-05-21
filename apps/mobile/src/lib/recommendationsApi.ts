import type { DashboardSummary, RecommendationDetail } from "../types/models";
import { ApiError, apiFetch, isApiConfigured } from "./apiClient";

export async function fetchDashboardFromApi(): Promise<DashboardSummary> {
  const data = await apiFetch<{ dashboard: DashboardSummary }>(
    "/api/v1/recommendations/dashboard",
  );
  return data.dashboard;
}

export async function fetchRecommendationDetailFromApi(
  id: string,
): Promise<RecommendationDetail | null> {
  try {
    const data = await apiFetch<{ detail: RecommendationDetail }>(
      `/api/v1/recommendations/${id}`,
    );
    return data.detail;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export function canUseRecommendationsApi(): boolean {
  return isApiConfigured();
}
