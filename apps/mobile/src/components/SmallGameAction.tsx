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
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: tokens.border.controlSubtle,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.surface.keyboard,
  },
  disabled: {
    backgroundColor: tokens.surface.subdued,
    borderColor: "rgba(229, 215, 197, 0.5)",
  },
  text: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontFamily: tokens.font.ui.semibold,
  },
  disabledText: { color: tokens.state.disabledText },
});
