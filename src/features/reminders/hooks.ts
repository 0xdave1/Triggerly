import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearLocalReminderData,
  completeReminder,
  createReminder,
  deleteReminder,
  getReminder,
  listReminders,
  snoozeReminder,
  updateReminder
} from "./api";
import type { ReminderCreateInput, ReminderUpdateInput } from "./types";

export const reminderKeys = {
  all: ["reminders"] as const,
  detail: (id: string) => ["reminders", id] as const
};

export function useReminders() {
  return useQuery({ queryKey: reminderKeys.all, queryFn: listReminders });
}

export function useReminder(id?: string) {
  return useQuery({
    queryKey: reminderKeys.detail(id ?? "missing"),
    queryFn: () => (id ? getReminder(id) : Promise.resolve(undefined)),
    enabled: Boolean(id)
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReminderCreateInput) => createReminder(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reminderKeys.all })
  });
}

export function useUpdateReminder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReminderUpdateInput) => updateReminder(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
      queryClient.invalidateQueries({ queryKey: reminderKeys.detail(id) });
    }
  });
}

export function useReminderActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: reminderKeys.all });

  return {
    complete: useMutation({ mutationFn: completeReminder, onSuccess: invalidate }),
    delete: useMutation({ mutationFn: deleteReminder, onSuccess: invalidate }),
    snooze: useMutation({ mutationFn: snoozeReminder, onSuccess: invalidate }),
    clearLocalData: useMutation({ mutationFn: clearLocalReminderData, onSuccess: invalidate })
  };
}
