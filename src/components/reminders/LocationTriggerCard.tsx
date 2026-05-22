import { ReminderTerminalCard } from "./ReminderTerminalCard";
import type { ReminderWithTriggers } from "@/features/reminders/types";

type LocationTriggerCardProps = {
  reminder: ReminderWithTriggers;
  onPress?: () => void;
  onComplete?: () => void;
};

export function LocationTriggerCard(props: LocationTriggerCardProps) {
  return <ReminderTerminalCard {...props} />;
}
