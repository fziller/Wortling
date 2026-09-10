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
                style={[styles.key, styles[state], disabled && styles.disabledKey]}
              >
                <Text style={[styles.keyText, state !== "unused" && styles.markedText]}>{letter}</Text>
              </KeyboardKey>
            );
          })}
        </View>
      ))}
      {showSubmit || showBackspace ? (
        <View style={styles.actionRow}>
          {showBackspace ? <KeyboardAction disabled={disabled} label="Löschen" onPress={onBackspace} variant="utility" /> : null}
          {showSubmit ? <KeyboardAction disabled={disabled || submitDisabled} label="Prüfen" onPress={onSubmit} variant="primary" /> : null}
        </View>
      ) : null}
    </View>
  );
}

type KeyboardActionProps = {
  disabled: boolean;
  label: string;
  onPress: () => void;
  variant: "primary" | "utility";
};

function KeyboardAction({ disabled, label, onPress, variant }: KeyboardActionProps) {
  return (
    <KeyboardKey accessibilityLabel={label} disabled={disabled} hitSlop={6} onPress={() => { selectionHaptic(); onPress(); }} style={[styles.actionKey, variant === "primary" ? styles.primaryAction : styles.utilityAction, disabled && styles.disabledAction]}>
      <Text style={[styles.actionText, variant === "primary" ? styles.primaryActionText : styles.utilityActionText, disabled && styles.disabledActionText]}>{label}</Text>
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
    opacity: 1 - disabledProgress.value * 0.36,
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
    paddingVertical: tokens.space.xs,
  },
  pressable: { flex: 1 },
  row: {
    flexDirection: "row",
    gap: 4,
    justifyContent: "center"
  },
  actionRow: {
    flexDirection: "row",
    gap: tokens.space.xs,
    alignItems: "stretch",
  },
  key: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.tile,
    backgroundColor: tokens.surface.tile,
    borderWidth: 1,
    borderColor: tokens.border.control,
  },
  actionKey: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space.sm,
    borderRadius: tokens.radius.action,
  },
  primaryAction: {
    flex: 1.45,
    backgroundColor: tokens.color.primary
  },
  utilityAction: {
    flex: 0.85,
    borderWidth: 1,
    borderColor: tokens.border.control,
    backgroundColor: "transparent",
  },
  keyText: {
    color: tokens.color.ink,
    fontSize: 20,
    fontFamily: tokens.font.ui.semibold,
  },
  actionText: {
    fontSize: 14,
    fontFamily: tokens.font.ui.semibold,
  },
  primaryActionText: {
    color: "white"
  },
  utilityActionText: {
    color: tokens.color.muted
  },
  markedText: {
    color: "white"
  },
  disabledKey: {
    backgroundColor: tokens.state.disabledSurface,
    borderColor: tokens.state.disabledSurface,
  },
  disabledAction: {
    backgroundColor: tokens.state.disabledControl,
    borderColor: tokens.border.hairline,
  },
  disabledActionText: {
    color: tokens.state.disabledText,
  },
  absent: {
    backgroundColor: tokens.semantic.eliminated,
    borderColor: tokens.semantic.eliminated
  },
  present: {
    backgroundColor: tokens.semantic.partial,
    borderColor: tokens.semantic.partial
  },
  correct: {
    backgroundColor: tokens.semantic.correct,
    borderColor: tokens.semantic.correct
  },
  unused: {}
});
