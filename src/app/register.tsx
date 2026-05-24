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

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    setError(undefined);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await register({ name: name || undefined, email, password });
      router.replace("/");
    } catch (caught) {
      setError(getFriendlyApiError(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <TerminalScreen>
      <TerminalHeader title="register.user" subtitle="create private trigger workspace" status="privacy_mode: on" />
      <TerminalCard title="new_user.config" active>
        <TerminalInput label="name_optional" value={name} onChangeText={setName} placeholder="Ada" />
        <TerminalInput label="email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
        <TerminalInput label="password" value={password} onChangeText={setPassword} secureTextEntry placeholder="minimum 8 chars" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.row}>
          <TerminalButton loading={loading} disabled={!email || !password} onPress={submit}>
            CREATE_ACCOUNT
          </TerminalButton>
          <TerminalButton variant="secondary" onPress={() => router.push("/login")}>
            LOGIN
          </TerminalButton>
        </View>
      </TerminalCard>
      <TerminalCard title="consent_boundary">
        <Text style={styles.body}>Triggerly stores reminders you create. No covert recording, hidden tracking, or automatic message reading.</Text>
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
