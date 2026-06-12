import { Text } from "react-native";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { colors, typography } from "@/styles/theme";

export function CreatedActionCard({ title }: { title: string }) {
  return (
    <TerminalCard title="Action awaiting review" tone="amber">
      <Text style={{ color: colors.text, fontFamily: typography.sans }}>{title}</Text>
    </TerminalCard>
  );
}
