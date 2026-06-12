import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalInput } from "@/components/ui/TerminalInput";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { useAuth } from "@/features/auth/AuthProvider";
import { getFriendlyApiError } from "@/lib/apiClient";
import { colors, spacing, typography } from "@/styles/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    setError(undefined);
    setLoading(true);
    try {
      await login({ email, password });
      router.replace("/");
    } catch (caught) {
      setError(getFriendlyApiError(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <TerminalScreen>
      <TerminalHeader title="Welcome back." subtitle="Your reminders, memory, and approvals stay private." status="secure sign in" />
      <TerminalCard title="Sign in" active>
        <TerminalInput label="email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
        <TerminalInput label="password" value={password} onChangeText={setPassword} secureTextEntry placeholder="minimum 8 chars" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.row}>
          <TerminalButton loading={loading} disabled={!email || !password} onPress={submit}>
            Sign in
          </TerminalButton>
          <TerminalButton variant="secondary" onPress={() => router.push("/register")}>
            Create account
          </TerminalButton>
        </View>
      </TerminalCard>
      <TerminalCard title="Your privacy">
        <Text style={styles.body}>No background listening. Location is requested only when a reminder needs it.</Text>
      </TerminalCard>
    </TerminalScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  error: {
    color: colors.danger,
    fontFamily: typography.sans,
    fontSize: typography.small,
    lineHeight: 20
  },
  body: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: typography.small,
    lineHeight: 20
  }
});
