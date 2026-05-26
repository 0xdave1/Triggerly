import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
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
        <View style={styles.chrome}>
          <View style={[styles.chromeDot, styles.red]} />
          <View style={[styles.chromeDot, styles.yellow]} />
          <View style={[styles.chromeDot, styles.green]} />
          <View style={styles.chromeTitleWrap}>
            <Text style={styles.chromeTitle}>triggerly.sh</Text>
          </View>
        </View>
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
    borderColor: colors.border,
    borderWidth: 1,
    flex: 1,
    maxWidth: 430,
    overflow: "hidden",
    width: "100%"
  },
  chrome: {
    alignItems: "center",
    backgroundColor: colors.chrome,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 6,
    height: 28,
    paddingHorizontal: spacing.md
  },
  chromeDot: {
    borderRadius: 4,
    height: 8,
    width: 8
  },
  red: {
    backgroundColor: "#FF5F56"
  },
  yellow: {
    backgroundColor: "#FFBD2E"
  },
  green: {
    backgroundColor: "#27C93F"
  },
  chromeTitleWrap: {
    alignItems: "center",
    flex: 1,
    paddingRight: 42
  },
  chromeTitle: {
    color: colors.textMuted,
    fontFamily: "monospace",
    fontSize: 10,
    letterSpacing: 1.8
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
  }
});
