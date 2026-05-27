import type { RecommendationId } from "@points-exchange/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
import {
  resolveOfferPartnerAwardUrl,
  resolvePrimaryActionUrl,
} from "../../lib/handoffUrls";
import { toggleSaveOffer } from "../../lib/savedOffersService";
import { useAppStore } from "../../store/appStore";
import { useSavedOffersStore } from "../../store/savedOffersStore";
import type {
  RecommendationDetail,
  RedemptionOffer,
  RewardBalance,
} from "../../types/models";
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

function SimpleHandoffBar({
  detail,
  rewardBalances,
  onPress,
}: {
  detail: RecommendationDetail;
  rewardBalances: RewardBalance[];
  onPress: () => void;
}) {
  const offer = detail.offers[0];
  if (!offer) return null;

  const primary = getOfferPrimaryAction(detail, offer, rewardBalances);
  const url =
    primary.actionType === "open_portal" ||
    primary.actionType === "start_transfer" ||
    primary.actionType === "statement_credit"
      ? resolvePrimaryActionUrl({
          actionType: primary.actionType,
          programCode: offer.programCode,
          offer,
        })
      : null;

  if (!url) return null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.simpleHandoff,
        pressed && styles.simpleHandoffPressed,
      ]}
      accessibilityRole="button"
    >
      <Text style={styles.simpleHandoffText}>{primary.label}</Text>
    </Pressable>
  );
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

    const partnerAwardUrl =
      primary.actionType === "start_transfer"
        ? resolveOfferPartnerAwardUrl(offer)
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

    if (partnerAwardUrl) {
      buttons.splice(1, 0, {
        text: "Search partner awards",
        onPress: () => {
          runRecommendationAction(
            {
              id: `partner-search-${offer.id}`,
              label: "Search partner awards",
              description: offer.title,
              kind: "secondary",
              actionType: "open_portal",
            },
            router,
            partnerAwardUrl,
          );
        },
      });
    }

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
      `${formatPoints(offer.pointsRequired)} pts · ${formatDollars(offer.estimatedCashValue)}`,
      offer.expiresLabel,
    ].join("\n");

    Alert.alert(offer.title, message, buttons);
  }

  function openSimpleHandoff(detail: RecommendationDetail) {
    const offer = detail.offers[0];
    if (!offer) return;
    const primary = getOfferPrimaryAction(detail, offer, rewardBalances);
    const url =
      primary.actionType === "open_portal" ||
      primary.actionType === "start_transfer" ||
      primary.actionType === "statement_credit"
        ? resolvePrimaryActionUrl({
            actionType: primary.actionType,
            programCode: offer.programCode,
            offer,
          })
        : null;
    runRecommendationAction(primary, router, url);
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

  const cashCompare =
    data.vsCashbackExtraDollars > 0
      ? `About ${formatDollars(data.vsCashbackExtraDollars)} more than typical cash back.`
      : "Similar value to typical cash back for your balances.";

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
        <Text style={styles.tagline}>{data.tagline}</Text>
        <Text style={styles.title}>{data.title}</Text>
        <View style={styles.headerMeta}>
          <Text style={styles.valueLine}>
            {formatDollars(data.estimatedDollarValue)} est.
          </Text>
          <DifficultyBadge difficulty={data.difficulty} />
        </View>
      </View>

      {data.transferPath ? (
        <TransferPathHero path={data.transferPath} />
      ) : (
        <SimpleHandoffBar
          detail={data}
          rewardBalances={rewardBalances}
          onPress={() => openSimpleHandoff(data)}
        />
      )}

      <View style={styles.offersBlock}>
        <Text style={styles.offersTitle}>Offers you can use</Text>
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

      <CollapsibleSection
        title="Why this option"
        summary={data.whyRecommended.slice(0, 72)}
        defaultOpen={false}
        style={styles.aboutCard}
      >
        <Text style={styles.body}>{data.whyRecommended}</Text>
        <Text style={styles.bodySecondary}>{cashCompare}</Text>
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
    gap: 4,
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
    marginBottom: 8,
    gap: 6,
  },
  tagline: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
    textTransform: "uppercase",
    letterSpacing: 0.3,
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
  simpleHandoff: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  simpleHandoffPressed: {
    opacity: 0.92,
  },
  simpleHandoffText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  offersBlock: {
    marginBottom: 8,
  },
  offersTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  offerGroup: {
    marginBottom: 2,
  },
  offerGroupTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 4,
    marginTop: 4,
  },
  aboutCard: {
    marginBottom: 0,
  },
  body: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
    marginTop: 12,
  },
  bodySecondary: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginTop: 10,
  },
});
