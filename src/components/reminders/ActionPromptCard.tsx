import { StyleSheet, Text, View } from "react-native";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import type { ActionPrompt } from "@/features/action-prompts/types";
import { colors, spacing, typography } from "@/styles/theme";

export function ActionPromptCard({
  prompt,
  onConfirm,
  onCancel,
  onComplete,
  onGenerate,
  onEdit
}: {
  prompt: ActionPrompt;
  onConfirm?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
  onGenerate?: () => void;
  onEdit?: () => void;
}) {
  const payment = prompt.actionType === "open_payment_app" || prompt.actionType === "payment_reminder";
  const emailOrMessage = prompt.actionType === "draft_email" || prompt.actionType === "draft_message";
  return (
    <TerminalCard title={`action.${prompt.actionType}`} tone={payment ? "amber" : "cyan"}>
      <Text style={styles.title}>{prompt.title ?? "user_approval_required"}</Text>
      <TerminalStatRow label="status" value={prompt.status} tone={prompt.status === "pending_confirmation" ? "amber" : "green"} />
      <TerminalStatRow label="sensitive" value={prompt.sensitive ? "yes" : "no"} tone={prompt.sensitive ? "amber" : "muted"} />
      <TerminalStatRow label="auto_execute" value="disabled" tone="green" />
      {prompt.generatedContent ? <Text style={styles.generated}>{prompt.generatedContent}</Text> : null}
      {payment ? <Text style={styles.warning}>Payment actions are reminders or app-open prompts only. Triggerly never moves money automatically.</Text> : null}
      {emailOrMessage ? <Text style={styles.warning}>Draft only. Triggerly does not send email or messages automatically.</Text> : null}
      <View style={styles.row}>
        <TerminalButton variant="secondary" onPress={onGenerate}>GENERATE_CONTENT</TerminalButton>
        <TerminalButton variant="ghost" onPress={onEdit}>EDIT</TerminalButton>
        <TerminalButton disabled={prompt.status !== "pending_confirmation"} onPress={onConfirm}>CONFIRM_ACTION</TerminalButton>
        <TerminalButton disabled={prompt.status === "completed" || prompt.status === "cancelled"} variant="secondary" onPress={onComplete}>COMPLETE</TerminalButton>
        <TerminalButton variant="danger" onPress={onCancel}>CANCEL</TerminalButton>
      </View>
    </TerminalCard>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.warning,
    fontFamily: typography.mono,
    fontSize: typography.small,
    fontWeight: "900"
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  generated: {
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  },
  warning: {
    color: colors.warning,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  }
});
