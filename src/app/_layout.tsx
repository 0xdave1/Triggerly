import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { router, Stack, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Text } from "react-native";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { registerNotificationActions } from "@/features/notifications/scheduler";
import { handleNotificationAction } from "@/features/notifications/handlers";
import { useReminderStore } from "@/features/reminders/store";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
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
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootStack() {
  const segments = useSegments();
  const { authenticated, initializing } = useAuth();

  useEffect(() => {
    if (initializing) return;
    const route = segments[0];
    const publicRoute = route === "onboarding" || route === "login" || route === "register";

    if (!authenticated && !publicRoute) {
      router.replace("/login");
    }

    if (authenticated && publicRoute) {
      router.replace("/");
    }
  }, [authenticated, initializing, segments]);

  if (initializing) {
    return (
      <TerminalScreen>
        <Text style={{ color: colors.primary, fontFamily: "monospace" }}>auth_state.loading...</Text>
      </TerminalScreen>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text, fontFamily: "monospace", fontWeight: "800" }
      }}
    >
      <Stack.Screen name="index" options={{ title: "Triggerly" }} />
      <Stack.Screen name="onboarding" options={{ title: "Welcome" }} />
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="register" options={{ title: "Register" }} />
      <Stack.Screen name="habits" options={{ title: "Habits" }} />
      <Stack.Screen name="settings" options={{ title: "Settings and Privacy" }} />
      <Stack.Screen name="triggers/confirm" options={{ title: "Confirm trigger" }} />
      <Stack.Screen name="reminders/new" options={{ title: "Reminder" }} />
      <Stack.Screen name="reminders/location" options={{ title: "Location picker" }} />
      <Stack.Screen name="reminders/[id]" options={{ title: "Reminder details" }} />
    </Stack>
  );
}
