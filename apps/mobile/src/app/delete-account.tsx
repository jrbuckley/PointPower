import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DELETE_ACCOUNT_REASONS,
  type DeleteAccountReasonCode,
} from "../constants/deleteAccountReasons";
import { refreshDashboardData } from "../lib/invalidateDashboard";
import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const clearAllData = useAppStore((s) => s.clearAllData);

  const [reasonCode, setReasonCode] = useState<DeleteAccountReasonCode | null>(null);
  const [otherDetail, setOtherDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    reasonCode !== null &&
    (reasonCode !== "other" || otherDetail.trim().length > 0);

  function confirmDelete() {
    if (!canSubmit || !reasonCode) return;

    Alert.alert(
      "Delete account permanently?",
      "This cannot be undone. Your account, balances, and preferences will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: () => void runDelete(),
        },
      ],
    );
  }

  async function runDelete() {
    if (!reasonCode) return;
    setError(null);
    setSubmitting(true);

    const result = await deleteAccount({
      reasonCode,
      reasonDetail: reasonCode === "other" ? otherDetail : undefined,
    });

    if (!result.ok) {
      setSubmitting(false);
      setError(result.error);
      return;
    }

    await clearAllData();
    refreshDashboardData();
    setSubmitting(false);
    router.replace("/login");
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Before you go</Text>
          <Text style={styles.warningBody}>
            Deleting your account permanently removes your profile, reward balances,
            and goals. You will need to create a new account to use Points value again.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Why are you leaving? (required)</Text>
        <Text style={styles.sectionHint}>
          Your answer helps us improve the app. It is not shown publicly.
        </Text>

        <View style={styles.reasons}>
          {DELETE_ACCOUNT_REASONS.map((reason) => {
            const selected = reasonCode === reason.code;
            return (
              <Pressable
                key={reason.code}
                onPress={() => {
                  setReasonCode(reason.code);
                  setError(null);
                }}
                style={({ pressed }) => [
                  styles.reasonRow,
                  selected && styles.reasonRowSelected,
                  pressed && styles.reasonRowPressed,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <View style={styles.radioOuter}>
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={styles.reasonLabel}>{reason.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {reasonCode === "other" ? (
          <TextInput
            value={otherDetail}
            onChangeText={setOtherDetail}
            placeholder="Tell us more (required)"
            placeholderTextColor="#9ca3af"
            multiline
            style={styles.otherInput}
            accessibilityLabel="Other reason details"
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={confirmDelete}
          disabled={!canSubmit || submitting}
          style={({ pressed }) => [
            styles.deleteCta,
            pressed && styles.deleteCtaPressed,
            (!canSubmit || submitting) && styles.deleteCtaDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Delete my account"
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.deleteCtaText}>Delete my account</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          disabled={submitting}
          style={({ pressed }) => [styles.cancel, pressed && styles.cancelPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>Keep my account</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f6f7fb" },
  scroll: {
    padding: 20,
    paddingTop: 8,
  },
  warningCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#991b1b",
    marginBottom: 8,
  },
  warningBody: {
    fontSize: 15,
    color: "#7f1d1d",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 14,
  },
  reasons: {
    gap: 10,
    marginBottom: 16,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  reasonRowSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  reasonRowPressed: { opacity: 0.92 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2563eb",
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  otherInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    minHeight: 88,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  error: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  deleteCta: {
    backgroundColor: "#b91c1c",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  deleteCtaPressed: { opacity: 0.92 },
  deleteCtaDisabled: { opacity: 0.5 },
  deleteCtaText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  cancel: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  cancelPressed: { opacity: 0.85 },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
  },
});
