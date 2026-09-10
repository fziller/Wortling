import { Pressable, StyleSheet, Text } from "react-native";

import { tokens } from "@/design/tokens";

type SmallGameActionProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  variant?: "secondary" | "tertiary" | "reveal";
};

export function SmallGameAction({ disabled = false, label, onPress, variant = "secondary" }: SmallGameActionProps) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, styles[variant], disabled && styles.disabled]}>
      <Text style={[styles.text, styles[`${variant}Text`], disabled && styles.disabledText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radius.action,
    borderWidth: 1,
  },
  secondary: {
    borderColor: tokens.border.strong,
    backgroundColor: tokens.surface.raised,
  },
  tertiary: {
    borderColor: tokens.border.control,
    backgroundColor: "transparent",
  },
  reveal: {
    borderColor: tokens.border.strong,
    backgroundColor: tokens.surface.chip,
  },
  disabled: {
    backgroundColor: "transparent",
    borderColor: tokens.border.hairline,
    opacity: 0.56,
  },
  text: {
    fontSize: 12,
    fontFamily: tokens.font.ui.semibold,
  },
  secondaryText: { color: tokens.color.primaryDark },
  tertiaryText: { color: tokens.color.muted },
  revealText: { color: tokens.color.primaryDark },
  disabledText: { color: tokens.state.disabledText },
});
