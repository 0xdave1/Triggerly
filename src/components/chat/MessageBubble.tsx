import { StyleSheet, Text, View } from "react-native";
import type { ChatMessage } from "@/features/chat/types";
import { colors, radii, spacing, typography } from "@/styles/theme";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const user = message.role === "user";
  return (
    <View style={[styles.row, user && styles.userRow]}>
      <View style={[styles.bubble, user ? styles.userBubble : styles.assistantBubble]}>
        {!user ? <Text style={styles.label}>Triggerly</Text> : null}
        <Text style={[styles.text, user && styles.userText]}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "flex-start"
  },
  userRow: {
    alignItems: "flex-end"
  },
  bubble: {
    borderRadius: radii.lg,
    maxWidth: "88%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  assistantBubble: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1
  },
  userBubble: {
    backgroundColor: colors.primary
  },
  label: {
    color: colors.cyan,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: spacing.xs
  },
  text: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: typography.body,
    lineHeight: 23
  },
  userText: {
    color: colors.black,
    fontWeight: "600"
  }
});
