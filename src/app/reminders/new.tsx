import { Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { useCreateReminder, useReminder, useUpdateReminder } from "@/features/reminders/hooks";
import type { ReminderCreateInput } from "@/features/reminders/types";

export default function NewReminderScreen() {
  const params = useLocalSearchParams<{ id?: string; quick?: string }>();
  const existingReminder = useReminder(params.id);
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder(params.id ?? "missing");

  const submit = async (input: ReminderCreateInput) => {
    try {
      if (params.id) {
        await updateReminder.mutateAsync(input);
      } else {
        await createReminder.mutateAsync(input);
      }
      router.replace("/");
    } catch (error) {
      Alert.alert("Could not save reminder", error instanceof Error ? error.message : "Please try again.");
      throw error;
    }
  };

  return (
    <TerminalScreen>
      <TerminalHeader title="new_trigger.config" subtitle="user confirmation required" status="system: armed" />
      <ReminderForm
        initialReminder={existingReminder.data}
        initialQuickInput={typeof params.quick === "string" ? params.quick : ""}
        loading={createReminder.isPending || updateReminder.isPending}
        onSubmit={submit}
      />
    </TerminalScreen>
  );
}
