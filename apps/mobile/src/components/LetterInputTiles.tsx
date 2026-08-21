import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";

type LetterInputTilesProps = {
  cursorIndex: number;
  disabled?: boolean;
  letters: readonly string[];
  onCursorChange: (index: number) => void;
};

export function LetterInputTiles({ cursorIndex, disabled = false, letters, onCursorChange }: LetterInputTilesProps) {
  return (
    <View style={styles.row}>
      {letters.map((letter, index) => {
        const active = !disabled && index === cursorIndex;

        return (
          <Pressable
            accessibilityLabel={`Buchstabe ${index + 1}${letter ? `: ${letter.toUpperCase()}` : " leer"}`}
            accessibilityRole="button"
            disabled={disabled}
            key={index}
            onPress={() => onCursorChange(index)}
            style={[styles.tile, active && styles.activeTile]}
          >
            <Text style={styles.tileText}>{letter.toLocaleUpperCase("de-DE")}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: tokens.space.xs
  },
  tile: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.sm,
    backgroundColor: "white"
  },
  activeTile: {
    borderColor: tokens.color.primary,
    backgroundColor: "#FFF1DF"
  },
  tileText: {
    color: tokens.color.ink,
    fontSize: 22,
    fontWeight: "900"
  }
});
