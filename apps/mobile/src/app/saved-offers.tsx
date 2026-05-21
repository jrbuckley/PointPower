import { useRouter } from "expo-router";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SavedOfferCard } from "../components/recommendation/SavedOfferCard";
import { LoadingSpinner } from "../components/loading/LoadingSpinner";
import { SkeletonBox } from "../components/loading/Skeleton";
import {
  useResolvedSavedOffers,
  useSavedOffersHydration,
} from "../hooks/useSavedOffers";
import { unsaveOffer } from "../lib/savedOffersService";
export default function SavedOffersScreen() {
  const router = useRouter();
  const { isLoading: hydrating } = useSavedOffersHydration(true);
  const { data: entries = [], isFetching, refetch, isPending } =
    useResolvedSavedOffers();

  const showSkeleton = hydrating || (isPending && entries.length === 0);

  function openEntry(recommendationId: string, offerKey?: string) {
    router.push({
      pathname: "/recommendation/[id]",
      params: {
        id: recommendationId,
        ...(offerKey ? { highlightOffer: offerKey } : {}),
      },
    });
  }

  function onRemove(id: string, title: string) {
    Alert.alert("Remove saved offer?", `Remove “${title}” from your list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await unsaveOffer(id);
              await refetch();
            } catch {
              Alert.alert("Could not remove", "Try again in a moment.");
            }
          })();
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.lead}>
        Saved offers refresh with your current points and goals. Coverage and
        expiry update automatically.
      </Text>

      {showSkeleton ? (
        <View style={styles.skeletonWrap}>
          <SkeletonBox height={120} borderRadius={14} />
          <SkeletonBox height={120} borderRadius={14} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No saved offers yet</Text>
          <Text style={styles.emptyBody}>
            Open a recommendation, pick an offer, and tap Save, or use the save
            action on the detail screen.
          </Text>
          <Pressable
            onPress={() => router.replace("/dashboard")}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Text style={styles.ctaText}>Back to dashboard</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && entries.length > 0}
              onRefresh={() => refetch()}
            />
          }
          contentContainerStyle={styles.list}
        >
          {isFetching && entries.length > 0 ? (
            <View style={styles.refreshing}>
              <LoadingSpinner message="Refreshing offers…" size="small" />
            </View>
          ) : null}
          {entries.map((entry) => (
            <SavedOfferCard
              key={entry.id}
              entry={entry}
              onPress={() =>
                openEntry(
                  entry.recommendationId,
                  entry.offer ? entry.offerKey : undefined,
                )
              }
              onRemove={() =>
                onRemove(
                  entry.id,
                  entry.offer?.title ?? entry.recommendationTitle,
                )
              }
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f7fb",
    padding: 20,
  },
  lead: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  skeletonWrap: {
    gap: 12,
  },
  list: {
    paddingBottom: 32,
  },
  refreshing: {
    marginBottom: 8,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  cta: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  ctaPressed: { opacity: 0.92 },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
