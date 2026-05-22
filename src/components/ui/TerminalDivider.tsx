import { StyleSheet, View } from "react-native";
import { colors } from "@/styles/theme";

export function TerminalDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: {
    backgroundColor: colors.border,
    height: 1,
    opacity: 0.8,
    width: "100%"
  }
});
