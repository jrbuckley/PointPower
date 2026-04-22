import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "../store/appStore";

const SLIDES = [
  {
    title: "See what your points are worth",
    body: "Turn balances into dollar ranges you can understand at a glance.",
  },
  {
    title: "Compare redemption options",
    body: "We highlight a few clear paths—no spreadsheets required.",
  },
  {
    title: "More value without complexity",
    body: "Plain language, gentle guidance, and you stay in control.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setHasCompletedOnboarding = useAppStore(
    (s) => s.setHasCompletedOnboarding,
  );

  function onContinue() {
    setHasCompletedOnboarding(true);
    router.replace("/add-rewards");
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hero}>Welcome</Text>
        <Text style={styles.lead}>
          A calmer way to understand the value already sitting in your
          accounts.
        </Text>

        {SLIDES.map((s, i) => (
          <View key={s.title} style={styles.card}>
            <Text style={styles.cardIndex}>{i + 1}</Text>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.ctaPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Continue to add rewards"
        >
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f7fb",
    paddingHorizontal: 22,
  },
  scroll: {
    paddingBottom: 24,
  },
  hero: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  lead: {
    fontSize: 17,
    color: "#4b5563",
    lineHeight: 24,
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardIndex: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
    backgroundColor: "#f6f7fb",
  },
  cta: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaPressed: { opacity: 0.9 },
  ctaText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
