import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { VoiceInputButton } from "./VoiceInputButton";
import { colors, radii, spacing, typography } from "@/styles/theme";

export function ChatInput({
  value,
  onChangeText,
  onSend,
  onVoice,
  sending
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onVoice: () => void;
  sending?: boolean;
}) {
  const disabled = sending || !value.trim();
  return (
    <View style={styles.row}>
      <VoiceInputButton onPress={onVoice} disabled={sending} />
      <View style={styles.inputWrap}>
        <TextInput
          accessibilityLabel="Message Triggerly"
          multiline
          onChangeText={onChangeText}
          placeholder="Tell Triggerly what you want to remember, track, or do..."
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          style={styles.input}
          value={value}
        />
      </View>
      <Pressable
        accessibilityLabel="Send message"
        accessibilityRole="button"
        disabled={disabled}
        onPress={onSend}
        style={({ pressed }) => [styles.send, pressed && styles.pressed, disabled && styles.disabled]}
      >
        <Ionicons color={colors.black} name="arrow-up-outline" size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.sm
  },
  inputWrap: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  input: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: typography.body,
    maxHeight: 120,
    minHeight: 46,
    paddingVertical: spacing.md
  },
  send: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  pressed: {
    opacity: 0.72
  },
  disabled: {
    opacity: 0.42
  }
});
