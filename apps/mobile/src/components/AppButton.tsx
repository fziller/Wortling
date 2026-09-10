import { Pressable, StyleSheet, Text } from "react-native";

import { tokens } from "@/design/tokens";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function AppButton({ label, onPress, disabled }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space.lg,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.primary,
    shadowColor: tokens.shadow.raised.color,
    shadowOpacity: tokens.shadow.raised.opacity,
    shadowRadius: tokens.shadow.raised.radius,
    shadowOffset: tokens.shadow.raised.offset,
    elevation: tokens.shadow.raised.elevation,
  },
  disabled: {
    opacity: 0.45
  },
  pressed: {
    transform: [{ translateY: 2 }],
    backgroundColor: tokens.color.primaryDark
  },
  label: {
    color: "white",
    ...tokens.typography.uiControl,
    fontFamily: tokens.font.ui.semibold,
    textAlign: "center"
  }
});
