import { ReminderTerminalCard } from "./ReminderTerminalCard";
import type { ReminderWithTriggers } from "@/features/reminders/types";

type TimeTriggerCardProps = {
  reminder: ReminderWithTriggers;
  onPress?: () => void;
  onComplete?: () => void;
};

export function TimeTriggerCard(props: TimeTriggerCardProps) {
  return <ReminderTerminalCard {...props} />;
}
