import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  loading: boolean;
  label: string;
  loadingLabel?: string;
  color?: string;
};

export function LoadingButtonLabel({
  loading,
  label,
  loadingLabel,
  color = "#fff",
}: Props) {
  if (!loading) {
    return <Text style={[styles.text, { color }]}>{label}</Text>;
  }

  return (
    <View style={styles.row}>
      <ActivityIndicator size="small" color={color} />
      <Text style={[styles.text, { color }]}>{loadingLabel ?? label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  text: {
    fontSize: 17,
    fontWeight: "700",
  },
});
