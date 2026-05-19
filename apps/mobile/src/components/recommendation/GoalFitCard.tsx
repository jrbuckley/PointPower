import { StyleSheet, Text, View } from "react-native";
import { CollapsibleCard } from "../CollapsibleCard";
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

  const summary =
    goalFit.status === "full"
      ? `${goalFit.percentCovered}% of your goal`
      : `${goalFit.percentCovered}% covered · ${formatPoints(goalFit.pointsShort)} pts to go`;

  return (
    <CollapsibleCard
      title={goalFit.headline}
      summary={summary}
      backgroundColor={s.bg}
      borderColor={s.border}
      style={styles.card}
      headerRight={
        <View style={[styles.badge, { backgroundColor: s.badge }]}>
          <Text style={styles.badgeText}>{s.label}</Text>
        </View>
      }
    >
      <Text style={styles.detail}>{goalFit.detail}</Text>
      <Text style={styles.meta}>
        {formatPoints(goalFit.pointsYouHave)} pts of{" "}
        {formatPoints(goalFit.pointsForFullCoverage)} typical for this goal
      </Text>
      {goalFit.status !== "full" ? (
        <Text style={styles.gap}>
          Gap: ~{formatDollars(goalFit.cashGap)} at typical rates
        </Text>
      ) : null}
      <Text style={styles.target}>{goalFit.targetLabel}</Text>
    </CollapsibleCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  detail: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 21,
    marginTop: 12,
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  gap: {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 6,
  },
  target: {
    fontSize: 13,
    color: "#6b7280",
    fontStyle: "italic",
  },
});
