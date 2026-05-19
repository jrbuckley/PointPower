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
  saved?: boolean;
  highlighted?: boolean;
  onPress?: () => void;
  onToggleSave?: () => void;
};

export function OfferCard({
  offer,
  saved = false,
  highlighted = false,
  onPress,
  onToggleSave,
}: Props) {
  return (
    <View
      style={[
        styles.card,
        highlighted && styles.cardHighlight,
        saved && styles.cardSaved,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.body, pressed && onPress && styles.pressed]}
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
            <Text style={styles.metricValue}>
              {formatPoints(offer.pointsRequired)}
            </Text>
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

      {onToggleSave ? (
        <Pressable
          onPress={onToggleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            saved && styles.saveBtnActive,
            pressed && styles.saveBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={saved ? "Remove from saved offers" : "Save offer"}
        >
          <Text style={[styles.saveBtnText, saved && styles.saveBtnTextActive]}>
            {saved ? "Saved ✓" : "Save offer"}
          </Text>
        </Pressable>
      ) : null}
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
  cardHighlight: {
    borderColor: "#2563eb",
    borderWidth: 2,
  },
  cardSaved: {
    borderColor: "#93c5fd",
  },
  body: {
    padding: 16,
    paddingBottom: 8,
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
  saveBtn: {
    margin: 12,
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2563eb",
    alignItems: "center",
  },
  saveBtnActive: {
    backgroundColor: "#eff6ff",
  },
  saveBtnPressed: { opacity: 0.9 },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563eb",
  },
  saveBtnTextActive: {
    color: "#1d4ed8",
  },
});
