import { useEffect, useRef } from "react";
import {
  Animated,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

type SkeletonBoxProps = {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Pulsing placeholder block for skeleton layouts. */
export function SkeletonBox({
  width = "100%",
  height,
  borderRadius = 10,
  style,
}: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.95,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.box,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

type SkeletonLinesProps = {
  lines?: number;
  lastLineWidth?: `${number}%`;
  gap?: number;
};

export function SkeletonLines({
  lines = 3,
  lastLineWidth = "72%",
  gap = 10,
}: SkeletonLinesProps) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBox
          key={i}
          height={14}
          width={i === lines - 1 ? lastLineWidth : "100%"}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#e5e7eb",
  },
});
