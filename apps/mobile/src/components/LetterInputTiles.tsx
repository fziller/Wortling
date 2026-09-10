import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";
import { getWordTileLayout } from "@/games/wordTileLayout";
import { ShakeView } from "@/components/ShakeView";

type LetterInputTilesProps = {
  cursorIndex: number;
  disabled?: boolean;
  placeholders?: readonly (string | null)[];
  letters: readonly string[];
  onCursorChange: (index: number) => void;
  shakeTrigger?: number;
};

export function LetterInputTiles({ cursorIndex, disabled = false, letters, onCursorChange, placeholders = [], shakeTrigger = 0 }: LetterInputTilesProps) {
  const tileLayout = getWordTileLayout(letters.length);

  return (
    <ShakeView trigger={shakeTrigger}>
      <View style={[styles.row, { gap: tileLayout.gap }]}>
      {letters.map((letter, index) => {
        const active = !disabled && index === cursorIndex;
        const placeholder = !letter ? placeholders[index] : undefined;

        return (
          <Pressable
            accessibilityLabel={`Buchstabe ${index + 1}${letter ? `: ${letter.toUpperCase()}` : placeholder ? `, Hinweis ${placeholder.toUpperCase()}` : " leer"}`}
            accessibilityRole="button"
            disabled={disabled}
            key={index}
            onPress={() => onCursorChange(index)}
            style={[styles.tile, { minHeight: tileLayout.minHeight }, active && styles.activeTile]}
          >
            <Text style={[styles.tileText, { fontSize: tileLayout.fontSize, minWidth: 12, textAlign: "center" }, placeholder && styles.placeholderText]}>{(letter || placeholder || "").toLocaleUpperCase("de-DE")}</Text>
          </Pressable>
        );
      })}
      </View>
    </ShakeView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    width: "100%",
  },
  tile: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.tile,
    backgroundColor: tokens.surface.tile
  },
  activeTile: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primaryLight
  },
  tileText: {
    color: tokens.color.ink,
    fontSize: 22,
    ...tokens.typography.gameLetter,
  },
  placeholderText: {
    color: tokens.color.muted,
    opacity: 0.45,
  }
});
