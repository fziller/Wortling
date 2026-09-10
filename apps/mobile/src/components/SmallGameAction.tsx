import { Pressable, StyleSheet, Text } from "react-native";

import { tokens } from "@/design/tokens";

type SmallGameActionProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

export function SmallGameAction({ disabled = false, label, onPress }: SmallGameActionProps) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, disabled && styles.disabled]}>
      <Text style={[styles.text, disabled && styles.disabledText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: tokens.border.control,
    borderRadius: tokens.radius.action,
    backgroundColor: "transparent",
  },
  disabled: {
    backgroundColor: tokens.state.disabledControl,
    borderColor: "transparent",
  },
  text: {
    color: tokens.color.muted,
    fontSize: 12,
    fontFamily: tokens.font.ui.semibold,
  },
  disabledText: { color: tokens.state.disabledText },
});
