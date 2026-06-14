import { Text } from "react-native";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { useAssistantActions, useDailyBriefing } from "@/features/assistant/hooks";
import { colors, typography } from "@/styles/theme";

export default function BriefingScreen() {
  const briefing = useDailyBriefing();
  const actions = useAssistantActions();
  const items = briefing.data?.items ?? {};
  const count = (key: string) => Array.isArray(items[key]) ? items[key].length : 0;

  return (
    <TerminalScreen>
      <TerminalHeader title="Daily briefing" subtitle="A summary built only from data you confirmed." status="ready" />
      <TerminalCard title={briefing.data?.title ?? "Morning"}>
        <Text style={{ color: colors.text, fontFamily: typography.sans, lineHeight: 23 }}>{briefing.data?.summary ?? "Preparing your briefing..."}</Text>
        <TerminalStatRow label="active triggers" value={String(count("reminders"))} />
        <TerminalStatRow label="pending actions" value={String(count("actions"))} tone="amber" />
        <TerminalStatRow label="promises" value={String(count("promises"))} tone="cyan" />
        <TerminalStatRow label="debts and favours" value={String(count("debts"))} tone="muted" />
        <TerminalStatRow label="accountability goals" value={String(count("accountabilityGoals"))} tone="cyan" />
        <TerminalButton loading={actions.generateBriefing.isPending} onPress={() => actions.generateBriefing.mutate("MORNING")}>Refresh briefing</TerminalButton>
      </TerminalCard>
      <TerminalCard title="Evening" tone="amber">
        <Text style={{ color: colors.textMuted, fontFamily: typography.sans, lineHeight: 21 }}>Generate an evening review when you are ready to close the day.</Text>
        <TerminalButton variant="secondary" loading={actions.generateBriefing.isPending} onPress={() => actions.generateBriefing.mutate("EVENING")}>Generate evening review</TerminalButton>
      </TerminalCard>
    </TerminalScreen>
  );
}
