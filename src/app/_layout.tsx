import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registerNotificationActions } from "@/features/notifications/scheduler";
import { handleNotificationAction } from "@/features/notifications/handlers";
import { useReminderStore } from "@/features/reminders/store";
import { colors } from "@/styles/theme";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const hydrate = useReminderStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
    registerNotificationActions();
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationAction);
    return () => subscription.remove();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTitleStyle: { color: colors.text, fontFamily: "monospace", fontWeight: "800" }
        }}
      >
        <Stack.Screen name="index" options={{ title: "Triggerly" }} />
        <Stack.Screen name="onboarding" options={{ title: "Welcome" }} />
        <Stack.Screen name="habits" options={{ title: "Habits" }} />
        <Stack.Screen name="settings" options={{ title: "Settings and Privacy" }} />
        <Stack.Screen name="reminders/new" options={{ title: "Reminder" }} />
        <Stack.Screen name="reminders/location" options={{ title: "Location picker" }} />
        <Stack.Screen name="reminders/[id]" options={{ title: "Reminder details" }} />
      </Stack>
    </QueryClientProvider>
  );
}
