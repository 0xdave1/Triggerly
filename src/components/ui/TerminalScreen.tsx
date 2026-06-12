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
        <ScanlineOverlay />
        {scroll ? (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" style={styles.scroll}>
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  shell: {
    backgroundColor: colors.background,
    flex: 1,
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
    alignSelf: "center",
    gap: spacing.xl,
    maxWidth: 760,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 48,
    width: "100%"
  }
});
