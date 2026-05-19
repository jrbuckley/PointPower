import { StyleSheet, Text, View } from "react-native";
import type { GoalFitSummary } from "../../types/models";
import { formatDollars, formatPoints } from "../../utils/format";

const STATUS_STYLES = {
  full: { bg: "#ecfdf5", border: "#6ee7b7", badge: "#059669", label: "Full coverage" },
  partial: { bg: "#fffbeb", border: "#fcd34d", badge: "#d97706", label: "Partial" },
  stretch: { bg: "#f3f4f6", border: "#d1d5db", badge: "#6b7280", label: "Stretch" },
} as const;

type Props = {
  goalFit: GoalFitSummary;
};

export function GoalFitCard({ goalFit }: Props) {
  const s = STATUS_STYLES[goalFit.status];

  return (
    <View style={[styles.card, { backgroundColor: s.bg, borderColor: s.border }]}>
      <View style={styles.header}>
        <Text style={styles.headline}>{goalFit.headline}</Text>
        <View style={[styles.badge, { backgroundColor: s.badge }]}>
          <Text style={styles.badgeText}>{s.label}</Text>
        </View>
      </View>
      <Text style={styles.detail}>{goalFit.detail}</Text>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Your points</Text>
          <Text style={styles.statValue}>{formatPoints(goalFit.pointsYouHave)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Typical target</Text>
          <Text style={styles.statValue}>
            {formatPoints(goalFit.pointsForFullCoverage)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Covered</Text>
          <Text style={styles.statValue}>{goalFit.percentCovered}%</Text>
        </View>
      </View>
      {goalFit.status !== "full" ? (
        <Text style={styles.gap}>
          Gap: {formatPoints(goalFit.pointsShort)} pts (~{formatDollars(goalFit.cashGap)})
        </Text>
      ) : null}
      <Text style={styles.target}>Goal: {goalFit.targetLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  headline: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 24,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  detail: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 14,
  },
  stats: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  stat: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: 10,
    padding: 10,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  gap: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 6,
  },
  target: {
    fontSize: 13,
    color: "#6b7280",
    fontStyle: "italic",
  },
});
