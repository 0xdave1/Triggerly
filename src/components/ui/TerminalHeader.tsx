import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/styles/theme";
import { StatusPill } from "./StatusPill";

type TerminalHeaderProps = {
  title?: string;
  subtitle?: string;
  status?: string;
};

export function TerminalHeader({ title = "Triggerly", subtitle = "Private reminders that arrive when they matter.", status = "privacy enabled" }: TerminalHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.topline}>
        <Text style={styles.brand}>TRIGGERLY</Text>
        <StatusPill label={status} />
      </View>
      <View style={styles.titleGroup}>
        <Text style={styles.title}>{humanize(title)}</Text>
        <Text style={styles.subtitle}>{humanize(subtitle)}</Text>
      </View>
    </View>
  );
}

function humanize(value: string) {
  return value.replace(/[._]/g, " ").replace(/\s+/g, " ").trim();
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xl,
    paddingBottom: spacing.md
  },
  topline: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  brand: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5
  },
  titleGroup: {
    gap: spacing.sm,
    maxWidth: 620
  },
  title: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: typography.title,
    fontWeight: "800",
    lineHeight: 43
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: typography.body,
    lineHeight: 24
  }
});
