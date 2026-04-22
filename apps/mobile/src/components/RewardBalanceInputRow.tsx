import type { RewardProgramType } from "../types/models";
import { StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  program: RewardProgramType;
};

export function RewardBalanceInputRow({
  label,
  value,
  onChangeText,
  program: _program,
}: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        placeholderTextColor="#9ca3af"
        keyboardType="number-pad"
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={`${label} balance`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  input: {
    minWidth: 120,
    maxWidth: 140,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: "right",
    backgroundColor: "#fff",
    color: "#111827",
  },
});
