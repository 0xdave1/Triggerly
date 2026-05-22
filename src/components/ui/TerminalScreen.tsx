import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/styles/theme";
import { ScanlineOverlay } from "./ScanlineOverlay";

type TerminalScreenProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function TerminalScreen({ children, scroll = true }: TerminalScreenProps) {
  const content = <View style={styles.content}>{children}</View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.glowOne} pointerEvents="none" />
      <View style={styles.glowTwo} pointerEvents="none" />
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}
      <ScanlineOverlay />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl
  },
  glowOne: {
    backgroundColor: "rgba(0, 255, 102, 0.08)",
    borderRadius: 220,
    height: 320,
    position: "absolute",
    right: -130,
    top: -120,
    width: 320
  },
  glowTwo: {
    backgroundColor: "rgba(24, 216, 255, 0.045)",
    borderRadius: 180,
    bottom: 120,
    height: 240,
    left: -110,
    position: "absolute",
    width: 240
  }
});
