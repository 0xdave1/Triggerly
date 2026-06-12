import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors, typography } from "@/styles/theme";

const icons = {
  chat: "chatbubble-ellipses-outline",
  triggers: "notifications-outline",
  memory: "bookmark-outline",
  actions: "checkmark-circle-outline",
  control: "options-outline"
} as const;

export default function AppTabsLayout() {
  return (
    <Tabs
      initialRouteName="chat"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.backgroundAlt,
          borderTopColor: colors.border,
          height: 68,
          paddingBottom: 8,
          paddingTop: 7
        },
        tabBarLabelStyle: {
          fontFamily: typography.sans,
          fontSize: 11,
          fontWeight: "700"
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            color={color}
            name={icons[route.name as keyof typeof icons] ?? "ellipse-outline"}
            size={size}
          />
        )
      })}
    >
      <Tabs.Screen name="chat" options={{ title: "Chat" }} />
      <Tabs.Screen name="triggers" options={{ title: "Triggers" }} />
      <Tabs.Screen name="memory" options={{ title: "Memory" }} />
      <Tabs.Screen name="actions" options={{ title: "Actions" }} />
      <Tabs.Screen name="control" options={{ title: "Control" }} />
    </Tabs>
  );
}
