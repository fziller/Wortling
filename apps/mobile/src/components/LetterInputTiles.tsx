import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";
import { getWordTileLayout } from "@/games/wordTileLayout";
import { ShakeView } from "@/components/ShakeView";

type LetterInputTilesProps = {
  cursorIndex: number;
  disabled?: boolean;
  letters: readonly string[];
  onCursorChange: (index: number) => void;
  shakeTrigger?: number;
};

export function LetterInputTiles({ cursorIndex, disabled = false, letters, onCursorChange, shakeTrigger = 0 }: LetterInputTilesProps) {
  const tileLayout = getWordTileLayout(letters.length);

  return (
    <ShakeView trigger={shakeTrigger}>
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
    </ShakeView>
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
    backgroundColor: tokens.color.primaryLight
  },
  tileText: {
    color: tokens.color.ink,
    fontSize: 22,
    fontWeight: "900"
  }
});
