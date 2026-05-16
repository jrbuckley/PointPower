import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RecommendationCard } from "../components/RecommendationCard";
import { ValueRangeSummaryCard } from "../components/ValueRangeSummaryCard";
import { useDashboardSummaryQuery } from "../hooks/useDashboardData";
import { useProfileFromApi } from "../hooks/useProfileFromApi";
import { useRewardAccountsFromApi } from "../hooks/useRewardAccountsFromApi";
import { formatDollars } from "../utils/format";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useRewardAccountsFromApi(true);
  useProfileFromApi(true);
  const { data, isPending, isRefetching, refetch } = useDashboardSummaryQuery();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Points value</Text>
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
            onPress={() => router.push("/rewards-accounts")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Programs"
          >
            <Text style={styles.link}>Programs</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/settings")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Text style={styles.link}>Settings</Text>
          </Pressable>
        </View>
      </View>

      {isPending && !data ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Estimating your value…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
          showsVerticalScrollIndicator={false}
        >
          {data ? (
            <>
              <ValueRangeSummaryCard
                totalPoints={data.totalPoints}
                valueMin={data.valueRangeMin}
                valueMax={data.valueRangeMax}
              />

              <Text style={styles.sectionTitle}>Top options for you</Text>
              <Text style={styles.sectionHint}>
                Ordered by what you said matters—tap any card to learn more.
              </Text>

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

              <Text style={styles.sectionTitle}>Quick comparison</Text>
              <View style={styles.compareCard}>
                {data.comparison.map((row, i) => (
                  <View
                    key={row.id}
                    style={[
                      styles.compareRow,
                      i === data.comparison.length - 1 && styles.compareRowLast,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.compareLabel}>{row.label}</Text>
                      <Text style={styles.compareSub}>{row.subtitle}</Text>
                    </View>
                    <Text style={styles.compareValue}>
                      {formatDollars(row.estimatedDollars)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.insight}>
                <Text style={styles.insightText}>{data.insightMessage}</Text>
              </View>
            </>
          ) : null}
        </ScrollView>
      )}
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
    marginBottom: 16,
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
  scroll: {
    paddingBottom: 40,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: "#6b7280",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 14,
    lineHeight: 20,
  },
  compareCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 4,
    marginBottom: 20,
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
  },
  compareRowLast: {
    borderBottomWidth: 0,
  },
  compareLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  compareSub: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  compareValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
    marginLeft: 12,
  },
  insight: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  insightText: {
    fontSize: 15,
    color: "#1e3a8a",
    lineHeight: 22,
  },
});
