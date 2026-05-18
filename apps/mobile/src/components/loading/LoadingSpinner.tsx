import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = {
  message?: string;
  size?: "small" | "large";
  style?: StyleProp<ViewStyle>;
};

export function LoadingSpinner({
  message = "Loading…",
  size = "large",
  style,
}: Props) {
  return (
    <View style={[styles.wrap, style]} accessibilityRole="progressbar">
      <ActivityIndicator size={size} color="#2563eb" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  message: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
  },
});
