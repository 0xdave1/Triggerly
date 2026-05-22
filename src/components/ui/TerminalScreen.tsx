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
      <View style={styles.shell}>
        <View style={styles.glowOne} pointerEvents="none" />
        <View style={styles.glowTwo} pointerEvents="none" />
        {scroll ? (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" style={styles.scroll}>
            {content}
          </ScrollView>
        ) : (
          content
        )}
        <ScanlineOverlay />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    alignItems: "center",
    flex: 1,
    backgroundColor: colors.background
  },
  shell: {
    backgroundColor: colors.background,
    borderLeftColor: colors.border,
    borderLeftWidth: 1,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    flex: 1,
    maxWidth: 430,
    overflow: "hidden",
    width: "100%"
  },
  scroll: {
    flex: 1,
    width: "100%"
  },
  scrollContent: {
    flexGrow: 1
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
