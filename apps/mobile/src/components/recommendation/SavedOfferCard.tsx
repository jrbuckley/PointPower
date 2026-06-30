import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SavedOfferEntry } from "../../lib/recommendationDetail";
import type { GoalCoverageStatus } from "../../types/models";
import { formatDollars, formatPoints } from "../../utils/format";

const COVERAGE_LABELS: Record<GoalCoverageStatus, string> = {
  full: "Full coverage",
  partial: "Partial",
  stretch: "Stretch",
};

const STATUS_LABELS = {
  active: "Active",
  expired: "Expired",
  unavailable: "No longer listed",
} as const;

const STATUS_COLORS = {
  active: "#059669",
  expired: "#dc2626",
  unavailable: "#6b7280",
} as const;

type Props = {
  entry: SavedOfferEntry;
  onContinue: () => void;
  onRemove: () => void;
};

export function SavedOfferCard({ entry, onContinue, onRemove }: Props) {
  const offer = entry.offer;
  const canContinue = entry.status === "active" && offer != null;

  return (
    <View style={[styles.card, entry.status !== "active" && styles.cardMuted]}>
      <Pressable
        onPress={canContinue ? onContinue : undefined}
        disabled={!canContinue}
        style={({ pressed }) => [
          styles.main,
          canContinue && pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canContinue }}
      >
        <View style={styles.top}>
          <Text style={styles.path}>{entry.recommendationTitle}</Text>
          <Text style={[styles.status, { color: STATUS_COLORS[entry.status] }]}>
            {STATUS_LABELS[entry.status]}
          </Text>
        </View>

        {offer ? (
          <>
            <Text style={styles.title}>{offer.title}</Text>
            <Text style={styles.partner}>{offer.partner}</Text>
            <View style={styles.metrics}>
              <Text style={styles.metric}>
                {formatPoints(offer.pointsRequired)} pts ·{" "}
                {formatDollars(offer.estimatedCashValue)}
              </Text>
              <Text style={styles.coverage}>
                {COVERAGE_LABELS[offer.coverageStatus]}
              </Text>
            </View>
            <Text style={styles.expiry}>{offer.expiresLabel}</Text>
          </>
        ) : (
          <Text style={styles.unavailable}>
            This offer isn’t in the current catalog. Remove it or open the
            recommendation for alternatives.
          </Text>
        )}
      </Pressable>

      <View style={styles.actions}>
        {canContinue ? (
          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [
              styles.continue,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue with this offer"
          >
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onRemove}
          style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Remove saved offer"
        >
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
    overflow: "hidden",
  },
  cardMuted: {
    opacity: 0.92,
  },
  main: {
    padding: 16,
  },
  pressed: { opacity: 0.9 },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  path: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  status: {
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  partner: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 10,
  },
  metrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  metric: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  coverage: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b5563",
    textTransform: "capitalize",
  },
  expiry: {
    fontSize: 13,
    fontWeight: "600",
    color: "#dc2626",
  },
  unavailable: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  continue: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#e5e7eb",
    backgroundColor: "#eff6ff",
  },
  continueText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2563eb",
  },
  remove: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  removeText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#dc2626",
  },
});
