import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "@/styles/theme";
import { useReducedMotion } from "./animation";

export function ScanlineOverlay() {
  const reducedMotion = useReducedMotion();
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) return;
    const animation = Animated.loop(
      Animated.timing(translateY, {
        toValue: 18,
        duration: 1800,
        useNativeDriver: true
      })
    );
    animation.start();
    return () => animation.stop();
  }, [reducedMotion, translateY]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.scanlines, { transform: [{ translateY }] }]} />
      <View style={styles.noise} />
    </View>
  );
}

const styles = StyleSheet.create({
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    borderTopColor: colors.scanline,
    borderTopWidth: 1,
    opacity: 0.7
  },
  noise: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.012)"
  }
});
