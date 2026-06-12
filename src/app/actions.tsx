import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ActionPromptCard } from "@/components/reminders/ActionPromptCard";
import { Select } from "@/components/ui/Select";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalInput } from "@/components/ui/TerminalInput";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { useActionPromptActions, useActionPrompts } from "@/features/action-prompts/hooks";
import type { ActionPrompt, ActionPromptType } from "@/features/action-prompts/types";
import { usePrivacySettings } from "@/features/privacy/hooks";
import { isFeatureEnabled } from "@/features/privacy/types";
import { colors, spacing, typography } from "@/styles/theme";

const actionTypes: ActionPromptType[] = [
  "draft_email",
  "draft_message",
  "open_payment_app",
  "payment_reminder",
  "call_contact",
  "open_maps",
  "create_calendar_event",
  "generate_checklist",
  "prepare_meeting_notes",
  "open_url"
];

export default function ActionsScreen() {
  const [actionType, setActionType] = useState<ActionPromptType>("draft_email");
  const [title, setTitle] = useState("Draft email to Mr Ade");
  const [payloadText, setPayloadText] = useState("proposal tomorrow morning");
  const [editingId, setEditingId] = useState<string>();
  const prompts = useActionPrompts();
  const actions = useActionPromptActions();
  const privacy = usePrivacySettings();
  const disabledMessage = privacyGateMessage(actionType, privacy.data);
  const grouped = useMemo(() => {
    const data = prompts.data ?? [];
    return {
      pending: data.filter((prompt) => prompt.status === "pending_confirmation"),
      confirmed: data.filter((prompt) => prompt.status === "confirmed"),
      completed: data.filter((prompt) => prompt.status === "completed")
    };
  }, [prompts.data]);

  const reset = () => {
    setEditingId(undefined);
    setTitle("");
    setPayloadText("");
  };

  const save = async () => {
    const input = { actionType, title, payload: payloadFrom(actionType, payloadText) };
    if (editingId) await actions.update.mutateAsync({ id: editingId, input });
    else await actions.create.mutateAsync(input);
    reset();
  };

  const edit = (prompt: ActionPrompt) => {
    setEditingId(prompt.id);
    setActionType(prompt.actionType);
    setTitle(prompt.title ?? prompt.actionType);
    setPayloadText(String(prompt.payload?.topic ?? prompt.payload?.draft ?? prompt.payload?.recipientName ?? ""));
  };

  return (
    <TerminalScreen>
      <TerminalHeader title="ai_pa.actions" subtitle="prepare only · confirmation required" status="auto_execute: disabled" />
      <TerminalCard title="new_action_prompt" active>
        <Select label="action_type" value={actionType} onChange={setActionType} options={actionTypes.map((value) => ({ label: value, value }))} />
        <TerminalInput label="title" value={title} onChangeText={setTitle} placeholder="Draft email to Mr Ade" />
        <TerminalInput label="payload_hint" value={payloadText} onChangeText={setPayloadText} placeholder="proposal tomorrow morning" multiline />
        {disabledMessage ? <Text style={styles.warning}>{disabledMessage}</Text> : null}
        <TerminalButton disabled={Boolean(disabledMessage) || !title.trim()} loading={actions.create.isPending || actions.update.isPending} onPress={save}>
          {editingId ? "UPDATE_ACTION" : "CREATE_PENDING_ACTION"}
        </TerminalButton>
        {editingId ? (
          <TerminalButton variant="secondary" onPress={reset}>
            CANCEL_EDIT
          </TerminalButton>
        ) : null}
      </TerminalCard>

      <ActionSection title="pending_actions" prompts={grouped.pending} actions={actions} onEdit={edit} />
      <ActionSection title="confirmed_actions" prompts={grouped.confirmed} actions={actions} onEdit={edit} />
      <ActionSection title="completed_actions" prompts={grouped.completed} actions={actions} onEdit={edit} />
      {!prompts.isPending && !(prompts.data ?? []).length ? <Text style={styles.note}>no_action_prompts</Text> : null}
      {prompts.isPending ? <Text style={styles.note}>loading_action_center...</Text> : null}
    </TerminalScreen>
  );
}

function ActionSection({
  title,
  prompts,
  actions,
  onEdit
}: {
  title: string;
  prompts: ActionPrompt[];
  actions: ReturnType<typeof useActionPromptActions>;
  onEdit: (prompt: ActionPrompt) => void;
}) {
  if (!prompts.length) return null;
  return (
    <TerminalCard title={title}>
      <View style={styles.stack}>
        {prompts.map((prompt) => (
          <ActionPromptCard
            key={prompt.id}
            prompt={prompt}
            onEdit={() => onEdit(prompt)}
            onGenerate={() => actions.generateContent.mutate({ id: prompt.id })}
            onConfirm={() => actions.confirm.mutate(prompt.id)}
            onCancel={() => actions.cancel.mutate(prompt.id)}
            onComplete={() => actions.complete.mutate(prompt.id)}
          />
        ))}
      </View>
    </TerminalCard>
  );
}

function payloadFrom(actionType: ActionPromptType, text: string) {
  if (actionType === "draft_email") return { recipientName: "Mr Ade", topic: text, externalSend: false };
  if (actionType === "draft_message") return { recipientName: "contact", topic: text, externalSend: false };
  if (actionType === "payment_reminder") return { recipientName: "recipient", amount: undefined, currency: "NGN", date: text };
  if (actionType === "generate_checklist") return { item: text || "shopping", externalExecution: false };
  if (actionType === "prepare_meeting_notes") return { topic: text };
  return { draft: text, externalExecution: false };
}

function privacyGateMessage(actionType: ActionPromptType, settings: ReturnType<typeof usePrivacySettings>["data"]) {
  if (actionType === "draft_email" && !isFeatureEnabled(settings, "emailDraftingEnabled")) return "Email drafting is disabled in privacy.config.";
  if (actionType === "draft_message" && !isFeatureEnabled(settings, "messageDraftingEnabled")) return "Message drafting is disabled in privacy.config.";
  if (actionType === "payment_reminder" && !isFeatureEnabled(settings, "paymentRemindersEnabled")) return "Payment reminders are disabled in privacy.config.";
  if (actionType === "open_payment_app" && !isFeatureEnabled(settings, "paymentActionsEnabled")) return "Payment app prompts require explicit permission and confirmation.";
  if (actionType === "call_contact" && !isFeatureEnabled(settings, "contactAccessEnabled")) return "Contact actions are disabled in privacy.config.";
  if (actionType === "create_calendar_event" && !isFeatureEnabled(settings, "calendarIntegrationEnabled")) return "Calendar integration is disabled in privacy.config.";
  return undefined;
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md
  },
  warning: {
    color: colors.warning,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  },
  note: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  }
});
