import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";
import { getWordTileLayout } from "@/games/wordTileLayout";

type LetterInputTilesProps = {
  cursorIndex: number;
  disabled?: boolean;
  letters: readonly string[];
  onCursorChange: (index: number) => void;
};

export function LetterInputTiles({ cursorIndex, disabled = false, letters, onCursorChange }: LetterInputTilesProps) {
  const tileLayout = getWordTileLayout(letters.length);

  return (
    <View style={[styles.row, { gap: tileLayout.gap }]}>
      {letters.map((letter, index) => {
        const active = !disabled && index === cursorIndex;

        return (
          <Pressable
            accessibilityLabel={`Buchstabe ${index + 1}${letter ? `: ${letter.toUpperCase()}` : " leer"}`}
            accessibilityRole="button"
            disabled={disabled}
            key={index}
            onPress={() => onCursorChange(index)}
            style={[styles.tile, { minHeight: tileLayout.minHeight }, active && styles.activeTile]}
          >
            <Text style={[styles.tileText, { fontSize: tileLayout.fontSize }]}>{letter.toLocaleUpperCase("de-DE")}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  tile: {
    flex: 1,
    minWidth: 0,
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
