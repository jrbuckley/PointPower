import { StyleSheet, View } from "react-native";
import { SkeletonBox, SkeletonLines } from "./Skeleton";

export function GoalPreferencesSkeleton() {
  return (
    <View style={styles.wrap}>
      <SkeletonLines lines={2} lastLineWidth="95%" gap={8} />
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.option}>
          <SkeletonBox width={22} height={22} borderRadius={11} />
          <View style={styles.optionText}>
            <SkeletonBox height={18} width="55%" />
            <SkeletonBox height={14} width="92%" style={styles.gapSm} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 20,
    gap: 12,
  },
  option: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  optionText: {
    flex: 1,
  },
  gapSm: { marginTop: 8 },
});
