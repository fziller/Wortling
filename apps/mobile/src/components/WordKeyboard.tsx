import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";

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

const rows = ["QWERTZUIOP", "ASDFGHJKL", "YXCVBNM"];

const umlautBanks: Record<string, string[]> = {
  a: ["ä"],
  o: ["ö"],
  u: ["ü"],
  s: ["ß"],
};

export function WordKeyboard({ disabled = false, letterStates = {}, onBackspace, onLetter, onSubmit, showBackspace = true, showSubmit = true, submitDisabled = false }: WordKeyboardProps) {
  return (
    <View style={styles.keyboard}>
      {rows.map((row, rowIndex) => (
        <View key={row} style={styles.row}>
          {Array.from(row).map((letter) => {
            const base = letter.toLocaleLowerCase("de-DE");
            const isUmlautCarrier = umlautBanks[base];
            const state = letterStates[base] ?? "unused";

            if (isUmlautCarrier) {
              return <UmlautKey key={letter} letter={base} disabled={disabled} letterState={state} onLetter={onLetter} />;
            }

            return (
              <Pressable
                accessibilityLabel={`Buchstabe ${letter}`}
                accessibilityRole="button"
                disabled={disabled}
                hitSlop={6}
                key={letter}
                onPress={() => onLetter(base)}
                style={({ pressed }) => [styles.key, styles[state], pressed && !disabled && styles.pressed, disabled && styles.disabled]}
              >
                <Text style={[styles.keyText, state !== "unused" && styles.markedText]}>{letter}</Text>
              </Pressable>
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

type UmlautKeyProps = {
  letter: string;
  letterState: KeyboardLetterState;
  disabled: boolean;
  onLetter: (letter: string) => void;
};

function UmlautKey({ letter, letterState, disabled, onLetter }: UmlautKeyProps) {
  const variants = umlautBanks[letter];
  const [open, setOpen] = useState(false);
  const longPressedRef = useRef(false);

  const pick = (variant: string) => {
    onLetter(variant);
    setOpen(false);
  };

  return (
    <Pressable
      accessibilityLabel={`Buchstabe ${letter}`}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={6}
      delayLongPress={500}
      onLongPress={() => {
        longPressedRef.current = true;
        setOpen(true);
      }}
      onPress={() => {
        if (longPressedRef.current) {
          longPressedRef.current = false;
          return;
        }
        pick(letter);
      }}
      style={({ pressed }) => [styles.key, styles[letterState], pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={[styles.keyText, letterState !== "unused" && styles.markedText]}>{letter.toUpperCase()}</Text>
      {open ? (
        <View style={styles.menu}>
          {variants.map((variant) => (
            <Pressable
              accessibilityLabel={`Buchstabe ${variant}`}
              accessibilityRole="button"
              disabled={disabled}
              hitSlop={6}
              key={variant}
              onPress={() => pick(variant)}
              style={({ pressed }) => [styles.menuKey, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
            >
              <Text style={[styles.keyText, disabled && styles.disabledText]}>{variant}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Pressable>
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
    <Pressable accessibilityLabel={label} accessibilityRole="button" disabled={disabled} hitSlop={6} onPress={onPress} style={({ pressed }) => [styles.actionKey, primary ? styles.primaryAction : styles.secondaryAction, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>
      <Text style={[styles.actionText, primary ? styles.primaryActionText : styles.secondaryActionText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    gap: 7
  },
  row: {
    flexDirection: "row",
    gap: 2,
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
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderWidth: 1,
    borderColor: tokens.color.line,
    shadowColor: tokens.color.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  actionKey: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space.sm,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    shadowColor: tokens.color.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  primaryAction: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primary
  },
  secondaryAction: {
    borderColor: "rgba(23, 19, 13, 0.22)",
    backgroundColor: "rgba(253, 251, 247, 0.72)"
  },
  keyText: {
    color: tokens.color.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  actionText: {
    fontSize: 14,
    fontWeight: "900"
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
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.72
  },
  menu: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 3,
    paddingBottom: 4,
    pointerEvents: "box-none"
  },
  menuKey: {
    flex: 1,
    maxWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.card,
    borderWidth: 1,
    borderColor: tokens.color.line
  },
  disabled: {
    opacity: 0.45
  },
  disabledText: {
    color: tokens.color.muted
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
