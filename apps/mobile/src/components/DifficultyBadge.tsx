import { StyleSheet, Text, View } from "react-native";

type Difficulty = "easy" | "medium" | "advanced";

const LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Some steps",
  advanced: "More effort",
};

const COLORS: Record<Difficulty, { bg: string; text: string }> = {
  easy: { bg: "#dcfce7", text: "#166534" },
  medium: { bg: "#fef3c7", text: "#92400e" },
  advanced: { bg: "#fee2e2", text: "#991b1b" },
};

type Props = {
  difficulty: Difficulty;
};

export function DifficultyBadge({ difficulty }: Props) {
  const c = COLORS[difficulty];
  return (
    <View style={[styles.wrap, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{LABELS[difficulty]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
