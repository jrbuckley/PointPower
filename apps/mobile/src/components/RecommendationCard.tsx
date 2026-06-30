import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Recommendation } from "../types/models";
import { formatDollars } from "../utils/format";
import { DifficultyBadge } from "./DifficultyBadge";

type Props = {
  recommendation: Recommendation;
  onPress: () => void;
};

export function RecommendationCard({ recommendation, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Text style={styles.kicker}>{recommendation.tagline}</Text>
      <Text style={styles.title}>{recommendation.title}</Text>
      <Text style={styles.desc} numberOfLines={2}>
        {recommendation.description}
      </Text>
      <View style={styles.row}>
        <Text style={styles.value}>
          About {formatDollars(recommendation.estimatedDollarValue)}
        </Text>
        <DifficultyBadge difficulty={recommendation.difficulty} />
      </View>
      <Text style={styles.hint}>Tap for details and offers</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.92,
    backgroundColor: "#fafafa",
  },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  desc: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  value: {
    fontSize: 17,
    fontWeight: "700",
    color: "#059669",
  },
  hint: {
    marginTop: 10,
    fontSize: 13,
    color: "#6b7280",
  },
});
