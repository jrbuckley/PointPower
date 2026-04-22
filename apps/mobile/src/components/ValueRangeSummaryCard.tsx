import { StyleSheet, Text, View } from "react-native";
import { formatDollarsRange, formatPoints } from "../utils/format";

type Props = {
  totalPoints: number;
  valueMin: number;
  valueMax: number;
};

export function ValueRangeSummaryCard({
  totalPoints,
  valueMin,
  valueMax,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.line1}>
        You have{" "}
        <Text style={styles.emphasis}>{formatPoints(totalPoints)}</Text> points
      </Text>
      <Text style={styles.line2}>
        Estimated value: {formatDollarsRange(valueMin, valueMax)}
      </Text>
      <Text style={styles.note}>
        Range depends on how you redeem—details below are illustrative.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 20,
  },
  line1: {
    fontSize: 18,
    color: "#374151",
    lineHeight: 26,
  },
  emphasis: {
    fontWeight: "800",
    color: "#111827",
  },
  line2: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "600",
    color: "#059669",
  },
  note: {
    marginTop: 10,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
});
