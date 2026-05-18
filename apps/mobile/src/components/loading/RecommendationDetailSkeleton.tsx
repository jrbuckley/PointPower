import { StyleSheet, View } from "react-native";
import { SkeletonBox, SkeletonLines } from "./Skeleton";

export function RecommendationDetailSkeleton() {
  return (
    <View style={styles.wrap}>
      <SkeletonBox height={28} width="88%" />
      <SkeletonBox height={22} width="60%" style={styles.gapMd} />
      <SkeletonBox height={28} width={96} borderRadius={14} style={styles.gapMd} />

      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.block}>
          <SkeletonBox height={18} width="45%" />
          <View style={styles.gapSm}>
            <SkeletonLines lines={3} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 20,
    paddingBottom: 40,
  },
  block: {
    marginTop: 22,
  },
  gapSm: { marginTop: 10 },
  gapMd: { marginTop: 12 },
});
