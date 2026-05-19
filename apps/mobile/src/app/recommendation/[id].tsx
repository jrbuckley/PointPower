import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DifficultyBadge } from "../../components/DifficultyBadge";
import { GoalFitCard } from "../../components/recommendation/GoalFitCard";
import { OfferCard } from "../../components/recommendation/OfferCard";
import { LoadingSpinner } from "../../components/loading/LoadingSpinner";
import { RecommendationDetailSkeleton } from "../../components/loading/RecommendationDetailSkeleton";
import { useRecommendationDetailQuery } from "../../hooks/useDashboardData";
import { runRecommendationAction } from "../../lib/recommendationActions";
import type { RedemptionOffer } from "../../types/models";
import { formatDollars, formatPoints } from "../../utils/format";

export default function RecommendationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isPending, isFetching, isError } = useRecommendationDetailQuery(id);
  const showSkeleton = !data && (isPending || isFetching);

  function onOfferPress(offer: RedemptionOffer) {
    Alert.alert(
      offer.title,
      `${offer.partner}\n\n${formatPoints(offer.pointsRequired)} points · ${formatDollars(offer.estimatedCashValue)} est. value\n${offer.expiresLabel}\n\n${offer.availabilityNote}`,
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Next steps",
          onPress: () => {
            const primary = data?.actions.find((a) => a.kind === "primary");
            if (primary) runRecommendationAction(primary);
          },
        },
      ],
    );
  }

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

      <GoalFitCard goalFit={data.goalFit} />

      <Text style={styles.sectionTitle}>Offers you can use</Text>
      <Text style={styles.sectionHint}>
        Specific paths based on your balances and goals. Tap an offer for details.
      </Text>
      {data.offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} onPress={() => onOfferPress(offer)} />
      ))}

      <Text style={styles.sectionTitle}>Take action</Text>
      <View style={styles.actions}>
        {data.actions.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => runRecommendationAction(action)}
            style={({ pressed }) => [
              action.kind === "primary" ? styles.actionPrimary : styles.actionSecondary,
              pressed && styles.actionPressed,
            ]}
            accessibilityRole="button"
          >
            <Text
              style={
                action.kind === "primary"
                  ? styles.actionPrimaryText
                  : styles.actionSecondaryText
              }
            >
              {action.label}
            </Text>
            <Text
              style={
                action.kind === "primary"
                  ? styles.actionPrimarySub
                  : styles.actionSecondarySub
              }
            >
              {action.description}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Next steps</Text>
      {data.nextSteps.map((step) => (
        <View key={step.order} style={styles.stepRow}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>{step.order}</Text>
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            {step.detail ? <Text style={styles.stepDetail}>{step.detail}</Text> : null}
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Why this path</Text>
      <Text style={styles.body}>{data.whyRecommended}</Text>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Compared to cash back</Text>
        <Text style={styles.body}>{extraVersusCash}</Text>
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
    marginBottom: 8,
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
  actions: {
    gap: 10,
    marginBottom: 24,
  },
  actionPrimary: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 16,
  },
  actionSecondary: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  actionPressed: { opacity: 0.92 },
  actionPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  actionPrimarySub: {
    color: "#dbeafe",
    fontSize: 14,
    lineHeight: 20,
  },
  actionSecondaryText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  actionSecondarySub: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  stepDetail: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
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
    marginBottom: 16,
  },
  bullet: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 26,
    marginTop: 4,
  },
});
