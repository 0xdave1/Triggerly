import { Text } from "react-native";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { colors, typography } from "@/styles/theme";

export function CreatedMemoryCard({ title }: { title: string }) {
  return (
    <TerminalCard title="Memory saved" tone="cyan">
      <Text style={{ color: colors.text, fontFamily: typography.sans }}>{title}</Text>
    </TerminalCard>
  );
}
