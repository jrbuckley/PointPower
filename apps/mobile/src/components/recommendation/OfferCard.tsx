import { Pressable, StyleSheet, Text, View } from "react-native";
import type { GoalCoverageStatus, RedemptionOffer } from "../../types/models";
import { formatDollars, formatPoints } from "../../utils/format";

const COVERAGE_LABELS: Record<GoalCoverageStatus, string> = {
  full: "You can cover this",
  partial: "Partial with your points",
  stretch: "Need more points",
};

const COVERAGE_COLORS: Record<GoalCoverageStatus, string> = {
  full: "#059669",
  partial: "#d97706",
  stretch: "#6b7280",
};

type Props = {
  offer: RedemptionOffer;
  onPress?: () => void;
};

export function OfferCard({ offer, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && onPress && styles.pressed,
      ]}
      accessibilityRole={onPress ? "button" : "text"}
    >
      <View style={styles.topRow}>
        <Text style={styles.title}>{offer.title}</Text>
        {offer.highlight ? (
          <View style={styles.highlight}>
            <Text style={styles.highlightText}>{offer.highlight}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.partner}>{offer.partner}</Text>
      <Text style={styles.via}>via {offer.programLabel}</Text>

      <View style={styles.metrics}>
        <View>
          <Text style={styles.metricLabel}>Points needed</Text>
          <Text style={styles.metricValue}>{formatPoints(offer.pointsRequired)}</Text>
        </View>
        <View>
          <Text style={styles.metricLabel}>Est. cash value</Text>
          <Text style={styles.metricValue}>
            {formatDollars(offer.estimatedCashValue)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text
          style={[
            styles.coverage,
            { color: COVERAGE_COLORS[offer.coverageStatus] },
          ]}
        >
          {COVERAGE_LABELS[offer.coverageStatus]}
        </Text>
        <Text style={styles.expiry}>{offer.expiresLabel}</Text>
      </View>
      <Text style={styles.note}>{offer.availabilityNote}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    marginBottom: 12,
  },
  pressed: { opacity: 0.92 },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 22,
  },
  highlight: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563eb",
  },
  partner: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
  },
  via: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 12,
  },
  metrics: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  coverage: {
    fontSize: 13,
    fontWeight: "700",
  },
  expiry: {
    fontSize: 13,
    fontWeight: "600",
    color: "#dc2626",
  },
  note: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
});
