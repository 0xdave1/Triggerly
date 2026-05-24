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
      <TerminalHeader title="triggerly.sh" subtitle="auth gateway · privacy first" status="session: locked" />
      <TerminalCard title="login.session" active>
        <TerminalInput label="email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
        <TerminalInput label="password" value={password} onChangeText={setPassword} secureTextEntry placeholder="minimum 8 chars" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.row}>
          <TerminalButton loading={loading} disabled={!email || !password} onPress={submit}>
            LOGIN
          </TerminalButton>
          <TerminalButton variant="secondary" onPress={() => router.push("/register")}>
            REGISTER
          </TerminalButton>
        </View>
      </TerminalCard>
      <TerminalCard title="privacy_note">
        <Text style={styles.body}>no background listening · user-defined triggers only · location asks at point of need</Text>
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
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  },
  body: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  }
});
