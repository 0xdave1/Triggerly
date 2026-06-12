import { Text } from "react-native";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { colors, typography } from "@/styles/theme";

export function CreatedTriggerCard({ title }: { title: string }) {
  return (
    <TerminalCard title="Trigger created" active>
      <Text style={{ color: colors.text, fontFamily: typography.sans }}>{title}</Text>
    </TerminalCard>
  );
}
