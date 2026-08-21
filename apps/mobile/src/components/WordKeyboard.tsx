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

const rows = ["QWERTZUIOPÜ", "ASDFGHJKLÖÄ", "YXCVBNMß"];

export function WordKeyboard({ disabled = false, letterStates = {}, onBackspace, onLetter, onSubmit, showBackspace = true, showSubmit = true, submitDisabled = false }: WordKeyboardProps) {
  return (
    <View style={styles.keyboard}>
      {rows.map((row, rowIndex) => (
        <View key={row} style={styles.row}>
          {Array.from(row).map((letter) => {
            const state = letterStates[letter.toLocaleLowerCase("de-DE")] ?? "unused";

            return (
              <Pressable
                accessibilityLabel={`Buchstabe ${letter}`}
                accessibilityRole="button"
                disabled={disabled}
                hitSlop={4}
                key={letter}
                onPress={() => onLetter(letter.toLocaleLowerCase("de-DE"))}
                style={[styles.key, styles[state], disabled && styles.disabled]}
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

type KeyboardActionProps = {
  disabled: boolean;
  label: string;
  onPress: () => void;
};

function KeyboardAction({ disabled, label, onPress }: KeyboardActionProps) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" disabled={disabled} hitSlop={4} onPress={onPress} style={[styles.actionKey, disabled && styles.disabled]}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    gap: 7
  },
  row: {
    flexDirection: "row",
    gap: 3,
    justifyContent: "center"
  },
  actionRow: {
    flexDirection: "row",
    gap: tokens.space.sm
  },
  key: {
    flex: 1,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.sm,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderWidth: 1,
    borderColor: tokens.color.line
  },
  actionKey: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space.sm,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.ink
  },
  keyText: {
    color: tokens.color.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  actionText: {
    color: "white",
    fontSize: tokens.type.body,
    fontWeight: "900"
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
  unused: {},
  disabled: {
    opacity: 0.45
  }
});
