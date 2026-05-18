import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DifficultyBadge } from "../../components/DifficultyBadge";
import { LoadingSpinner } from "../../components/loading/LoadingSpinner";
import { RecommendationDetailSkeleton } from "../../components/loading/RecommendationDetailSkeleton";
import { useRecommendationDetailQuery } from "../../hooks/useDashboardData";
import { formatDollars, formatPoints } from "../../utils/format";

export default function RecommendationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isPending, isFetching, isError } = useRecommendationDetailQuery(id);
  const showSkeleton = !data && (isPending || isFetching);

  if (showSkeleton) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollGrow}
        showsVerticalScrollIndicator={false}
      >
        <RecommendationDetailSkeleton />
      </ScrollView>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.err}>We couldn’t load this recommendation.</Text>
        <Text style={styles.link} onPress={() => router.back()}>
          Go back
        </Text>
      </View>
    );
  }

  const extraVersusCash =
    data.vsCashbackExtraDollars > 0
      ? `About ${formatDollars(data.vsCashbackExtraDollars)} more than a simple cash-out at typical rates.`
      : "Similar to a simple cash-out for your current estimate.";

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {isFetching ? (
        <View style={styles.refreshing}>
          <LoadingSpinner message="Updating…" size="small" />
        </View>
      ) : null}
      <Text style={styles.title}>{data.title}</Text>
      <Text style={styles.valueLine}>
        Estimated value: {formatDollars(data.estimatedDollarValue)}
      </Text>
      <View style={styles.badgeRow}>
        <DifficultyBadge difficulty={data.difficulty} />
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Why we suggest this</Text>
        <Text style={styles.body}>{data.whyRecommended}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Compared to cash back</Text>
        <Text style={styles.body}>{extraVersusCash}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>What you’re using</Text>
        <Text style={styles.body}>
          Roughly {formatPoints(data.pointsUsed)} points in this example, worth
          about {formatDollars(data.estimatedDollarValue)} at this redemption
          style.
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Effort level</Text>
        <Text style={styles.body}>{data.effortExplanation}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>What this could unlock</Text>
        {data.unlockExamples.map((line) => (
          <Text key={line} style={styles.bullet}>
            • {line}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  scrollGrow: {
    flexGrow: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  refreshing: {
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f6f7fb",
  },
  err: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
    marginBottom: 12,
  },
  link: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  valueLine: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 12,
  },
  badgeRow: {
    marginBottom: 24,
  },
  block: {
    marginBottom: 22,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 24,
  },
  bullet: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 26,
    marginTop: 4,
  },
});
