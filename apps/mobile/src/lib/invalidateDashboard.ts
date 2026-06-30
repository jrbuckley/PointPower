import { queryClient } from "./queryClient";

export function refreshDashboardData() {
  void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  void queryClient.invalidateQueries({ queryKey: ["recommendation"] });
  void queryClient.invalidateQueries({ queryKey: ["saved-offers"] });
}
