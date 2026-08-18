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
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary,
    shadowColor: tokens.color.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
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
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center"
  }
});
