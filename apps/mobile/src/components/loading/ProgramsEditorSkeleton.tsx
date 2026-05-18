import { StyleSheet, View } from "react-native";
import { SkeletonBox } from "./Skeleton";

export function ProgramsEditorSkeleton() {
  return (
    <View style={styles.wrap}>
      <SkeletonBox height={16} width="95%" />
      <View style={styles.card}>
        <SkeletonBox height={18} width={140} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.row}>
            <SkeletonBox height={16} width="45%" />
            <SkeletonBox height={40} width={100} borderRadius={8} />
          </View>
        ))}
      </View>
      <SkeletonBox height={52} borderRadius={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
});
