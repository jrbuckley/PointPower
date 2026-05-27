import type { RecommendationId } from "@points-exchange/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CollapsibleCard } from "../../components/CollapsibleCard";
import { CollapsibleSection } from "../../components/CollapsibleSection";
import { DifficultyBadge } from "../../components/DifficultyBadge";
import { GoalFitCard } from "../../components/recommendation/GoalFitCard";
import { OfferCard } from "../../components/recommendation/OfferCard";
import { TransferPathHero } from "../../components/recommendation/TransferPathHero";
import { LoadingSpinner } from "../../components/loading/LoadingSpinner";
import { RecommendationDetailSkeleton } from "../../components/loading/RecommendationDetailSkeleton";
import { useRecommendationDetailQuery } from "../../hooks/useDashboardData";
import { refreshDashboardData } from "../../lib/invalidateDashboard";
import { getOfferPrimaryAction } from "../../lib/recommendationDetail";
import { runRecommendationAction } from "../../lib/recommendationActions";
import { resolvePrimaryActionUrl } from "../../lib/handoffUrls";
import { toggleSaveOffer } from "../../lib/savedOffersService";
import { useAppStore } from "../../store/appStore";
import { useSavedOffersStore } from "../../store/savedOffersStore";
import type { RedemptionOffer } from "../../types/models";
import { formatDollars, formatPoints } from "../../utils/format";

function groupOffersByProgram(
  offers: RedemptionOffer[],
): [string, RedemptionOffer[]][] {
  const order: string[] = [];
  const map = new Map<string, RedemptionOffer[]>();
  for (const offer of offers) {
    if (!map.has(offer.programLabel)) {
      order.push(offer.programLabel);
      map.set(offer.programLabel, []);
    }
    map.get(offer.programLabel)!.push(offer);
  }
  return order.map((label) => [label, map.get(label)!]);
}

function redemptionStepsSummary(
  redemptionType: string,
  stepCount: number,
): string {
  if (redemptionType === "transfer") {
    return `${stepCount} steps: search awards, transfer, then book`;
  }
  if (redemptionType === "portal") {
    return `${stepCount} steps: search portal, then checkout with points`;
  }
  return `${stepCount} steps: pick amount, redeem in issuer app`;
}

export default function RecommendationDetailScreen() {
  const { id, highlightOffer } = useLocalSearchParams<{
    id: string;
    highlightOffer?: string;
  }>();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [highlightY, setHighlightY] = useState<number | null>(null);
  const rewardBalances = useAppStore((s) => s.rewardBalances);
  const isOfferSaved = useSavedOffersStore((s) => s.isOfferSaved);
  const { data, isPending, isFetching, isError } = useRecommendationDetailQuery(id);
  const showSkeleton = !data && (isPending || isFetching);

  useEffect(() => {
    if (highlightY == null) return;
    // Defer one tick so layout settles before scrolling.
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, highlightY - 14), animated: true });
    }, 0);
    return () => clearTimeout(t);
  }, [highlightY]);

  async function onToggleSaveOffer(offer: RedemptionOffer) {
    if (!id) return;
    try {
      const result = await toggleSaveOffer(offer.id, id as RecommendationId);
      refreshDashboardData();
      if (result.saved) {
        Alert.alert("Offer saved", "Find it under Saved in the menu.");
      }
    } catch {
      Alert.alert("Could not update", "Check your connection and try again.");
    }
  }

  function onRemindBeforeExpiry(offer: RedemptionOffer) {
    runRecommendationAction(
      {
        id: `reminder-${offer.id}`,
        label: "Remind me before expiry",
        description: `${offer.title}. ${offer.expiresLabel}`,
        kind: "secondary",
        actionType: "set_reminder",
      },
      router,
    );
  }

  function onOfferPress(offer: RedemptionOffer) {
    if (!data) return;

    const primary = getOfferPrimaryAction(data, offer, rewardBalances);
    const primaryUrl =
      primary.actionType === "open_portal" ||
      primary.actionType === "start_transfer" ||
      primary.actionType === "statement_credit"
        ? resolvePrimaryActionUrl({
            actionType: primary.actionType,
            programCode: offer.programCode,
            offer,
          })
        : null;

    const buttons: {
      text: string;
      style?: "cancel" | "default" | "destructive";
      onPress?: () => void;
    }[] = [
      {
        text: primary.label,
        onPress: () => runRecommendationAction(primary, router, primaryUrl),
      },
      { text: "Close", style: "cancel" },
    ];

    buttons.push({
      text: "Remind me before expiry",
      onPress: () => onRemindBeforeExpiry(offer),
    });

    if (isOfferSaved(offer.id)) {
      buttons.push({
        text: "View in Saved",
        onPress: () => router.push("/saved-offers"),
      });
    } else {
      buttons.push({
        text: "Save offer",
        onPress: () => void onToggleSaveOffer(offer),
      });
    }

    const message = [
      offer.partner,
      "",
      `${formatPoints(offer.pointsRequired)} pts, ${formatDollars(offer.estimatedCashValue)}`,
      offer.expiresLabel,
      offer.availabilityNote,
    ]
      .filter(Boolean)
      .join("\n");

    Alert.alert(offer.title, message, buttons);
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
  const aboutSummary = data.whyRecommended.slice(0, 100);
  const transferPathUrl = data.transferPath
    ? resolvePrimaryActionUrl({
        actionType: "start_transfer",
        programCode: data.transferPath.issuerProgramCode,
      })
    : null;

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {isFetching ? (
        <View style={styles.refreshing}>
          <LoadingSpinner message="Updating…" size="small" />
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.title}>{data.title}</Text>
        <View style={styles.headerMeta}>
          <Text style={styles.valueLine}>
            {formatDollars(data.estimatedDollarValue)} est.
          </Text>
          <DifficultyBadge difficulty={data.difficulty} />
        </View>
        {data.transferPath ? (
          <TransferPathHero
            path={data.transferPath}
            transferUrl={transferPathUrl}
            onOpenIssuerTransfer={() =>
              runRecommendationAction(
                {
                  id: "transfer-path-handoff",
                  label: "Start partner transfer",
                  description: `Move points from ${data.transferPath!.issuerProgramCode} along the modeled path.`,
                  kind: "primary",
                  actionType: "start_transfer",
                },
                router,
                transferPathUrl,
              )
            }
          />
        ) : null}
        {data.rankingRationale ? (
          <Text style={styles.rankingNote}>{data.rankingRationale}</Text>
        ) : null}
      </View>

      <View style={styles.offersBlock}>
        <Text style={styles.offersTitle}>Offers you can use</Text>
        <Text style={styles.offersHint}>
          {data.goalFit.programCount > 1
            ? "Tap an offer. Each one uses points from that program only."
            : "Tap an offer for actions and reminders."}
        </Text>
        {groupOffersByProgram(data.offers).map(([programLabel, programOffers]) => (
          <View key={programLabel} style={styles.offerGroup}>
            {data.goalFit.programCount > 1 ? (
              <Text style={styles.offerGroupTitle}>{programLabel}</Text>
            ) : null}
            {programOffers.map((offer) => (
              <View
                key={offer.id}
                onLayout={(e) => {
                  const isHighlighted =
                    highlightOffer === offer.id || highlightOffer === offer.offerKey;
                  if (isHighlighted) setHighlightY(e.nativeEvent.layout.y);
                }}
              >
                <OfferCard
                  offer={offer}
                  compact
                  saved={isOfferSaved(offer.id)}
                  highlighted={
                    highlightOffer === offer.id || highlightOffer === offer.offerKey
                  }
                  onPress={() => onOfferPress(offer)}
                />
              </View>
            ))}
          </View>
        ))}
      </View>

      <GoalFitCard goalFit={data.goalFit} />

      <CollapsibleCard
        title="How to redeem"
        summary={redemptionStepsSummary(
          data.redemptionType,
          data.nextSteps.length,
        )}
        defaultOpen={data.redemptionType === "transfer"}
        style={styles.stepsCard}
      >
        {data.nextSteps.map((step) => (
          <View key={step.order} style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{step.order}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              {step.detail ? (
                <Text style={styles.stepDetail}>{step.detail}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </CollapsibleCard>

      <CollapsibleSection
        title="About this option"
        summary={aboutSummary}
        defaultOpen={false}
        style={styles.aboutCard}
      >
        <Text style={[styles.body, styles.aboutBodyFirst]}>{data.whyRecommended}</Text>

        <Text style={styles.blockTitle}>Compared to cash back</Text>
        <Text style={styles.body}>{extraVersusCash}</Text>

        <Text style={styles.blockTitle}>Effort level</Text>
        <Text style={styles.body}>{data.effortExplanation}</Text>

        <Text style={styles.blockTitle}>What this could unlock</Text>
        {data.unlockExamples.map((line) => (
          <Text key={line} style={styles.bullet}>
            • {line}
          </Text>
        ))}
      </CollapsibleSection>
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
  header: {
    marginBottom: 16,
    gap: 10,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 28,
  },
  valueLine: {
    fontSize: 17,
    fontWeight: "700",
    color: "#059669",
    flexShrink: 1,
    textAlign: "right",
  },
  offersBlock: {
    marginBottom: 16,
  },
  offersTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  offersHint: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 10,
    lineHeight: 18,
  },
  offerGroup: {
    marginBottom: 4,
  },
  offerGroupTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 6,
    marginTop: 2,
  },
  rankingNote: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
    fontStyle: "italic",
  },
  stepsCard: {
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    marginTop: 4,
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
  aboutCard: {
    marginBottom: 0,
  },
  aboutBodyFirst: {
    marginTop: 12,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
    marginTop: 4,
  },
  body: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 24,
    marginBottom: 14,
  },
  bullet: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 26,
    marginTop: 4,
    marginBottom: 4,
  },
});
