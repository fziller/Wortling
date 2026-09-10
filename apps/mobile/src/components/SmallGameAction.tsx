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
      <Text style={styles.text}>{label}</Text>
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
    borderColor: "rgba(23, 19, 13, 0.18)",
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.surface.keyboard,
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontFamily: tokens.font.ui.semibold,
  },
});
