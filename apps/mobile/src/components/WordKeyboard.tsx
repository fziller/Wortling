import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { tokens } from "@/design/tokens";
import { selectionHaptic } from "@/haptics";

export type KeyboardLetterState = "unused" | "absent" | "present" | "correct";

type WordKeyboardProps = {
  disabled?: boolean;
  letterStates?: Record<string, KeyboardLetterState>;
  onBackspace: () => void;
  onLetter: (letter: string) => void;
  onSubmit: () => void;
  showBackspace?: boolean;
  showSubmit?: boolean;
  submitDisabled?: boolean;
};

const rows = ["QWERTZUIOP", "ASDFGHJKLÜ", "YXCVBNMÄÖ"];

export function WordKeyboard({ disabled = false, letterStates = {}, onBackspace, onLetter, onSubmit, showBackspace = true, showSubmit = true, submitDisabled = false }: WordKeyboardProps) {
  return (
    <View style={styles.keyboard}>
      {rows.map((row) => (
        <View key={row} style={styles.row}>
          {Array.from(row).map((letter) => {
            const base = letter.toLocaleLowerCase("de-DE");
            const state = letterStates[base] ?? "unused";

            return (
              <KeyboardKey
                accessibilityLabel={`Buchstabe ${letter}`}
                disabled={disabled}
                hitSlop={6}
                key={letter}
                onPress={() => { selectionHaptic(); onLetter(base); }}
                style={[styles.key, styles[state]]}
              >
                <Text style={[styles.keyText, state !== "unused" && styles.markedText]}>{letter}</Text>
              </KeyboardKey>
            );
          })}
        </View>
      ))}
      {showSubmit || showBackspace ? (
        <View style={styles.actionRow}>
          {showSubmit ? <KeyboardAction disabled={disabled || submitDisabled} label="Prüfen" onPress={onSubmit} /> : null}
          {showBackspace ? <KeyboardAction disabled={disabled} label="Löschen" onPress={onBackspace} /> : null}
        </View>
      ) : null}
    </View>
  );
}

type KeyboardActionProps = {
  disabled: boolean;
  label: string;
  onPress: () => void;
};

function KeyboardAction({ disabled, label, onPress }: KeyboardActionProps) {
  const primary = label === "Prüfen";

  return (
    <KeyboardKey accessibilityLabel={label} disabled={disabled} hitSlop={6} onPress={() => { selectionHaptic(); onPress(); }} style={[styles.actionKey, primary ? styles.primaryAction : styles.secondaryAction]}>
      <Text style={[styles.actionText, primary ? styles.primaryActionText : styles.secondaryActionText]}>{label}</Text>
    </KeyboardKey>
  );
}

function KeyboardKey({ accessibilityLabel, children, disabled, hitSlop, onPress, style }: {
  accessibilityLabel: string;
  children: ReactNode;
  disabled: boolean;
  hitSlop: number;
  onPress: () => void;
  style: StyleProp<ViewStyle>;
}) {
  const pressed = useSharedValue(0);
  const disabledProgress = useSharedValue(disabled ? 1 : 0);

  useEffect(() => {
    disabledProgress.value = withTiming(disabled ? 1 : 0, { duration: tokens.motion.quick });
  }, [disabled, disabledProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - disabledProgress.value * 0.5,
    transform: [{ scale: 1 - pressed.value * 0.035 }],
  }));

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onPressIn={() => { pressed.value = withTiming(1, { duration: tokens.motion.quick }); }}
      onPressOut={() => { pressed.value = withTiming(0, { duration: tokens.motion.quick }); }}
      style={styles.pressable}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    gap: tokens.space.xs,
    padding: tokens.space.xs,
    borderWidth: 1,
    borderColor: "rgba(229, 215, 197, 0.78)",
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.surface.keyboard,
  },
  pressable: { flex: 1 },
  row: {
    flexDirection: "row",
    gap: 4,
    justifyContent: "center"
  },
  actionRow: {
    flexDirection: "row",
    gap: tokens.space.xs
  },
  key: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.surface.keyboard,
    borderWidth: 1,
    borderColor: "rgba(229, 215, 197, 0.7)",
  },
  actionKey: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space.sm,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
  },
  primaryAction: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primary
  },
  secondaryAction: {
    borderColor: "rgba(23, 19, 13, 0.22)",
    backgroundColor: tokens.surface.keyboard
  },
  keyText: {
    color: tokens.color.ink,
    fontSize: 20,
    fontFamily: tokens.font.ui.bold,
  },
  actionText: {
    fontSize: 14,
    fontFamily: tokens.font.ui.bold,
  },
  primaryActionText: {
    color: "white"
  },
  secondaryActionText: {
    color: tokens.color.ink
  },
  markedText: {
    color: "white"
  },
  absent: {
    backgroundColor: "#7B736A",
    borderColor: "#7B736A"
  },
  present: {
    backgroundColor: "#D98500",
    borderColor: "#D98500"
  },
  correct: {
    backgroundColor: tokens.color.success,
    borderColor: tokens.color.success
  },
  unused: {}
});
