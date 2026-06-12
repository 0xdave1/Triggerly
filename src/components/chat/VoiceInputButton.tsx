import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { colors, radii } from "@/styles/theme";

export function VoiceInputButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityLabel="Voice input"
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Ionicons color={colors.textMuted} name="mic-outline" size={21} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  pressed: {
    backgroundColor: colors.surfaceRaised
  },
  disabled: {
    opacity: 0.45
  }
});
