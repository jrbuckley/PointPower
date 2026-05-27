import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ComparePathsCard } from "../components/ComparePathsCard";
import { DashboardEmptyState } from "../components/DashboardEmptyState";
import { RecommendationCard } from "../components/RecommendationCard";
import { ValueRangeSummaryCard } from "../components/ValueRangeSummaryCard";
import { DashboardSkeleton } from "../components/loading/DashboardSkeleton";
import { isApiConfigured } from "../lib/apiClient";
import { useDashboardSummaryQuery } from "../hooks/useDashboardData";
import { useProfileFromApi } from "../hooks/useProfileFromApi";
import { useRewardAccountsFromApi } from "../hooks/useRewardAccountsFromApi";
import { useSavedOffersHydration } from "../hooks/useSavedOffers";
import { useValuationCatalog } from "../hooks/useValuationCatalog";
import { summarizeBalances } from "@points-exchange/recommendations";
import { balancesToInput } from "../lib/balanceInput";
import { isDashboardEmpty } from "../lib/rewardTotals";
import { useAppStore } from "../store/appStore";
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoading: balancesLoading } = useRewardAccountsFromApi(true);
  const { isLoading: profileLoading } = useProfileFromApi(true);
  useSavedOffersHydration(true);
  useValuationCatalog(true);
  const rewardBalances = useAppStore((s) => s.rewardBalances);
  const showEmpty = isDashboardEmpty(rewardBalances);
  const { data, isPending, isFetching, isRefetching, refetch } =
    useDashboardSummaryQuery();

  const apiHydrating =
    isApiConfigured() && (balancesLoading || profileLoading);
  const showSkeleton =
    !showEmpty && !data && (isPending || isFetching || apiHydrating);
  const showContent = !showEmpty && data;
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const pointsSummary = summarizeBalances(balancesToInput(rewardBalances));
  const moreCount = data?.moreRecommendations?.length ?? 0;

  function navigate(path: "/saved-offers" | "/rewards-accounts" | "/settings") {
    setMenuOpen(false);
    router.push(path);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>PointPower</Text>
        <View style={styles.topLinks}>
          <Pressable
            onPress={() => router.push("/goal-preferences")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Goals"
          >
            <Text style={styles.link}>Goals</Text>
          </Pressable>
          <Pressable
            onPress={() => setMenuOpen((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="More menu"
            accessibilityState={{ expanded: menuOpen }}
          >
            <Text style={styles.link}>More</Text>
          </Pressable>
        </View>
      </View>

      {menuOpen ? (
        <View style={styles.menu}>
          <Pressable
            onPress={() => navigate("/saved-offers")}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.menuItemText}>Saved offers</Text>
          </Pressable>
          <Pressable
            onPress={() => navigate("/rewards-accounts")}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.menuItemText}>Programs</Text>
          </Pressable>
          <Pressable
            onPress={() => navigate("/settings")}
            style={({ pressed }) => [
              styles.menuItem,
              styles.menuItemLast,
              pressed && styles.menuItemPressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.menuItemText}>Settings</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !!data}
            onRefresh={() => {
              setMenuOpen(false);
              refetch();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setMenuOpen(false)}
      >
        {showEmpty ? (
          <DashboardEmptyState
            onAddPrograms={() => router.push("/rewards-accounts")}
            onSetGoals={() => router.push("/goal-preferences")}
          />
        ) : showSkeleton ? (
          <DashboardSkeleton />
        ) : showContent ? (
            <>
              <ValueRangeSummaryCard
                totalPoints={data.totalPoints}
                valueMin={data.valueRangeMin}
                valueMax={data.valueRangeMax}
                programCount={pointsSummary.programCount}
              />

              <ComparePathsCard rows={data.comparison} />

              <Text style={styles.sectionTitle}>Top options</Text>
              <Text style={styles.sectionHint}>{data.insightMessage}</Text>

              {data.recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onPress={() =>
                    router.push({
                      pathname: "/recommendation/[id]",
                      params: { id: rec.id },
                    })
                  }
                />
              ))}

              {moreCount > 0 ? (
                <>
                  <Pressable
                    onPress={() => setShowMoreOptions((v) => !v)}
                    style={({ pressed }) => [
                      styles.seeMore,
                      pressed && styles.seeMorePressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: showMoreOptions }}
                  >
                    <Text style={styles.seeMoreText}>
                      {showMoreOptions
                        ? "Show fewer options"
                        : `See ${moreCount} more option${moreCount === 1 ? "" : "s"}`}
                    </Text>
                  </Pressable>
                  {showMoreOptions
                    ? data.moreRecommendations.map((rec) => (
                        <RecommendationCard
                          key={rec.id}
                          recommendation={rec}
                          onPress={() =>
                            router.push({
                              pathname: "/recommendation/[id]",
                              params: { id: rec.id },
                            })
                          }
                        />
                      ))
                    : null}
                </>
              ) : null}

            </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f7fb",
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },
  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    flexShrink: 1,
  },
  topLinks: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  link: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563eb",
  },
  menu: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
    overflow: "hidden",
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
  },
  menuItemPressed: {
    backgroundColor: "#f9fafb",
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  scroll: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
    marginTop: 8,
  },
  sectionHint: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 14,
    lineHeight: 20,
  },
  seeMore: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
    marginTop: -4,
  },
  seeMorePressed: {
    opacity: 0.7,
  },
  seeMoreText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563eb",
  },
});
