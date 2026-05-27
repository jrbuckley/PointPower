import { StyleSheet, Text, View } from "react-native";
import type { ValueComparisonRow } from "../types/models";
import { formatDollars } from "../utils/format";

type Props = {
  rows: ValueComparisonRow[];
};

export function ComparePathsCard({ rows }: Props) {
  if (rows.length === 0) return null;

  const max = Math.max(...rows.map((r) => r.estimatedDollars));
  const cashback = rows.find((r) => r.id === "cashback")?.estimatedDollars ?? 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Compare redemption types</Text>
      <Text style={styles.subtitle}>
        Estimated total value for your balances and goal.
      </Text>

      {rows.map((row) => {
        const isBest = row.estimatedDollars >= max && max > 0;
        const uplift =
          cashback > 0 && row.id !== "cashback"
            ? Math.round(
                ((row.estimatedDollars - cashback) / cashback) * 100,
              )
            : null;
        const barWidth =
          max > 0 ? Math.max(8, (row.estimatedDollars / max) * 100) : 0;

        return (
          <View
            key={row.id}
            style={[styles.row, isBest && styles.rowBest]}
            accessibilityRole="text"
          >
            <View style={styles.rowHeader}>
              <View style={styles.rowLabels}>
                <Text style={[styles.label, isBest && styles.labelBest]}>
                  {row.label}
                  {isBest ? " · Best" : ""}
                </Text>
                <Text style={styles.rowSub}>{row.subtitle}</Text>
              </View>
              <Text style={[styles.value, isBest && styles.valueBest]}>
                {formatDollars(row.estimatedDollars)}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  isBest && styles.barFillBest,
                  { width: `${barWidth}%` },
                ]}
              />
            </View>
            {uplift != null && uplift > 0 ? (
              <Text style={styles.uplift}>
                About {uplift}% more than cash back
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 14,
  },
  row: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f3f4f6",
  },
  rowBest: {
    backgroundColor: "#f0fdf4",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderTopColor: "transparent",
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },
  rowLabels: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  labelBest: {
    color: "#047857",
  },
  rowSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
    lineHeight: 17,
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  valueBest: {
    color: "#059669",
  },
  barTrack: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    backgroundColor: "#93c5fd",
    borderRadius: 3,
  },
  barFillBest: {
    backgroundColor: "#059669",
  },
  uplift: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
  },
});
