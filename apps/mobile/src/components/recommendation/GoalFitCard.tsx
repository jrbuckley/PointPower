import { StyleSheet, Text, View } from "react-native";
import { CollapsibleCard } from "../CollapsibleCard";
import type { GoalFitSummary } from "../../types/models";
import { formatDollars, formatPoints } from "../../utils/format";

const STATUS_STYLES = {
  full: { bg: "#ecfdf5", border: "#6ee7b7", badge: "#059669", label: "Full" },
  partial: { bg: "#fffbeb", border: "#fcd34d", badge: "#d97706", label: "Partial" },
  stretch: { bg: "#f3f4f6", border: "#d1d5db", badge: "#6b7280", label: "Stretch" },
} as const;

type Props = {
  goalFit: GoalFitSummary;
};

export function GoalFitCard({ goalFit }: Props) {
  const status = STATUS_STYLES[goalFit.status];

  const summary =
    goalFit.status === "full"
      ? `${goalFit.percentCovered}% of goal · ${formatPoints(goalFit.pointsYouHave)} pts`
      : `${goalFit.percentCovered}% of goal · ${formatPoints(goalFit.pointsShort)} pts short`;

  return (
    <CollapsibleCard
      title="Goal fit"
      summary={summary}
      defaultOpen={false}
      backgroundColor={status.bg}
      borderColor={status.border}
      style={styles.card}
      headerRight={
        <View style={[styles.badge, { backgroundColor: status.badge }]}>
          <Text style={styles.badgeText}>{status.label}</Text>
        </View>
      }
    >
      <Text style={styles.detail}>{goalFit.detail}</Text>
      {goalFit.status !== "full" ? (
        <Text style={styles.gap}>
          About {formatDollars(goalFit.cashGap)} short at typical rates for{" "}
          {goalFit.targetLabel.toLowerCase()}.
        </Text>
      ) : (
        <Text style={styles.gap}>{goalFit.targetLabel}</Text>
      )}
    </CollapsibleCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
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
    lineHeight: 20,
    marginTop: 10,
  },
  gap: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 19,
    marginTop: 8,
  },
});
