import { Pressable, StyleSheet, Text, View } from "react-native";

const BENEFITS = [
  {
    title: "Understand real dollar value",
    body: "Turn scattered points into a clear range you can actually plan with.",
  },
  {
    title: "Compare redemption paths",
    body: "See how cash back, bank travel sites, and partner transfers stack up—without spreadsheets.",
  },
  {
    title: "Match suggestions to your goals",
    body: "Whether you want simplicity, max value, or a custom focus like international flights.",
  },
  {
    title: "Stay in control",
    body: "Plain-language guidance you can act on—or ignore—when you’re ready.",
  },
] as const;

type Props = {
  onAddPrograms: () => void;
  onSetGoals?: () => void;
};

export function DashboardEmptyState({ onAddPrograms, onSetGoals }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.heroCard}>
        <Text style={styles.kicker}>Get started</Text>
        <Text style={styles.title}>See what your points are worth</Text>
        <Text style={styles.lead}>
          Add the programs you use and rough balances. We’ll show personalized
          options once there’s something to work with.
        </Text>
        <Pressable
          onPress={onAddPrograms}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>Add your programs</Text>
        </Pressable>
        {onSetGoals ? (
          <Pressable
            onPress={onSetGoals}
            style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>Set your goals first</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>What you’ll get</Text>
      {BENEFITS.map((item) => (
        <View key={item.title} style={styles.benefitCard}>
          <Text style={styles.benefitTitle}>{item.title}</Text>
          <Text style={styles.benefitBody}>{item.body}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 24,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 28,
    marginBottom: 10,
  },
  lead: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 18,
  },
  cta: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaPressed: { opacity: 0.92 },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondary: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryPressed: { opacity: 0.85 },
  secondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563eb",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  benefitCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  benefitBody: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
});
