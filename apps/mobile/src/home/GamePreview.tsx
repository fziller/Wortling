import { StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";
import { HomeGameId, previewWords } from "@/home/homeMeta";

type GamePreviewProps = {
  color: string;
  gameId: HomeGameId;
};

export function GamePreview({ color, gameId }: GamePreviewProps) {
  if (gameId === "worttreffer") {
    return (
      <View style={styles.wordcodePreview}>
        {previewWords.worttreffer.map((letter, index) => (
          <View key={`${letter}-${index}`} style={[styles.bigTile, { backgroundColor: tokens.semantic.correct }, !letter && styles.emptyBigTile]}> 
            <Text style={styles.bigTileText}>{letter}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (gameId === "galgenwort") {
    return (
      <View style={styles.smallTilesRow}>
        {previewWords.galgenwort.map((letter, index) => (
          <View key={`${letter}-${index}`} style={[styles.smallTile, !letter && styles.emptyHangmanTile]}>
            <Text style={styles.smallTileText}>{letter}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (gameId === "wortschmelze") {
    return (
      <View style={styles.schmelzePreview}>
        <View style={styles.schmelzeRow}>
          {previewWords.wortschmelzeTop.map((letter, index) => <MiniTile active={index === 3} color={tokens.semantic.partial} key={`top-${letter}-${index}`} label={letter} />)}
          {previewWords.wortschmelzeBottom.slice(2).map((letter, index) => <MiniTile active={index === 0} color={tokens.semantic.correct} key={`bottom-${letter}-${index}`} label={letter} />)}
        </View>
        <Text style={styles.schmelzeText}>WALZE + ZEBRA</Text>
      </View>
    );
  }

  if (gameId === "wortcode") {
    return (
      <View style={styles.wordGrid}>
        {["WORT", "KNIFF", "SPIEL", "SPASS"].map((word) => (
          <View key={word} style={styles.wordChipWide}>
            <Text style={styles.wordChipText}>{word}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (gameId === "between") {
    return (
      <View style={styles.betweenPreview}>
        <WordChip label="BAUM" />
        <View style={[styles.dashedLine, { borderColor: color }]} />
        <WordChip label="HAUS" />
      </View>
    );
  }

  if (gameId === "doppel") {
    return (
      <View style={styles.doppelPreview}>
        <View style={styles.formulaRow}>
          <WordChip small label="TAG" />
          <Text style={[styles.plus, { color }]}>+</Text>
          <WordChip dashed color={color} small label="???" />
        </View>
        <View style={styles.formulaRow}>
          <WordChip dashed color={color} small label="???" />
          <Text style={[styles.plus, { color }]}>+</Text>
          <WordChip small label="BUCH" />
        </View>
      </View>
    );
  }

  if (gameId === "formwort") {
    return (
      <View style={styles.formwortPreview}>
        <ShapeTile label="R" shape="circle" />
        <ShapeTile label="O" shape="diamond" />
        <ShapeTile label="T" />
      </View>
    );
  }

  return (
    <View style={styles.leiterPreview}>
      <View style={styles.leiterRow}>{previewWords.wortleiterTop.map((letter) => <MiniTile key={letter} label={letter} />)}</View>
      <Text style={[styles.arrow, { color }]}>↓</Text>
      <View style={styles.leiterRow}>{previewWords.wortleiterBottom.map((letter, index) => <MiniTile active={index === 0} color={color} key={`${letter}-${index}`} label={letter} />)}</View>
    </View>
  );
}

function WordChip({ color, dashed = false, label, small = false }: { color?: string; dashed?: boolean; label: string; small?: boolean }) {
  return (
    <View style={[styles.wordChip, small && styles.wordChipSmall, dashed && { borderColor: color, borderStyle: "dashed", borderWidth: 1 }]}>
      <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={[styles.wordChipText, dashed && { color }]}>{label}</Text>
    </View>
  );
}

function ShapeTile({ label, shape }: { label: string; shape?: "circle" | "diamond" }) {
  return (
    <View style={[styles.shapeTile, shape === "circle" && styles.circleTile, shape === "diamond" && styles.diamondTile]}>
      <Text style={[styles.shapeTileText, shape === "diamond" && styles.diamondText]}>{label}</Text>
    </View>
  );
}

function MiniTile({ active = false, color, label }: { active?: boolean; color?: string; label: string }) {
  return (
    <View style={[styles.miniTile, active && { backgroundColor: color }]}> 
      <Text style={[styles.miniTileText, active && styles.activeMiniTileText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wordcodePreview: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 25,
  },
  bigTile: {
    alignItems: "center",
    borderRadius: 7,
    height: 41,
    justifyContent: "center",
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    width: 41,
  },
  bigTileText: {
    color: tokens.text.inverse,
    fontSize: 17,
    fontWeight: "900",
  },
  emptyBigTile: {
    backgroundColor: tokens.surface.tile,
    borderColor: tokens.semantic.correct,
    borderStyle: "dashed",
    borderWidth: 2,
  },
  smallTilesRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 30,
  },
  smallTile: {
    alignItems: "center",
    backgroundColor: tokens.surface.subdued,
    borderRadius: 7,
    height: 29,
    justifyContent: "center",
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    width: 29,
  },
  emptyHangmanTile: {
    borderBottomColor: tokens.semantic.brandAccent,
    borderBottomWidth: 1,
    borderStyle: "dashed",
  },
  smallTileText: {
    color: tokens.color.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  wordGrid: {
    columnGap: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 27,
    rowGap: 8,
  },
  wordChipWide: {
    alignItems: "center",
    backgroundColor: tokens.surface.subdued,
    borderRadius: 7,
    minWidth: "47%",
    paddingVertical: 9,
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  wordChipText: {
    color: tokens.color.ink,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
    minWidth: 12,
    textAlign: "center",
  },
  betweenPreview: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginTop: 28,
  },
  dashedLine: {
    borderBottomWidth: 2,
    borderStyle: "dashed",
    width: 72,
  },
  wordChip: {
    alignItems: "center",
    backgroundColor: tokens.surface.subdued,
    borderRadius: 7,
    minWidth: 58,
    paddingHorizontal: 11,
    paddingVertical: 8,
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  wordChipSmall: {
    minWidth: 43,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  doppelPreview: {
    alignItems: "center",
    gap: 8,
    marginTop: 26,
  },
  formulaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  plus: {
    fontSize: 17,
    fontWeight: "900",
  },
  formwortPreview: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
    justifyContent: "center",
    marginTop: 28,
  },
  shapeTile: {
    alignItems: "center",
    backgroundColor: tokens.surface.subdued,
    borderColor: tokens.border.subtle,
    borderRadius: 7,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    width: 36,
  },
  circleTile: { borderRadius: 999 },
  diamondTile: { transform: [{ rotate: "45deg" }] },
  shapeTileText: {
    color: tokens.color.ink,
    fontSize: 13,
    fontWeight: "900",
  },
  diamondText: { transform: [{ rotate: "-45deg" }] },
  leiterPreview: {
    alignItems: "center",
    gap: 4,
    marginTop: 22,
  },
  schmelzePreview: {
    alignItems: "center",
    gap: 5,
    marginTop: 24,
  },
  schmelzeRow: {
    flexDirection: "row",
    gap: 4,
  },
  schmelzeText: {
    color: tokens.color.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  leiterRow: {
    flexDirection: "row",
    gap: 4,
  },
  miniTile: {
    alignItems: "center",
    backgroundColor: tokens.surface.subdued,
    borderRadius: 6,
    height: 21,
    justifyContent: "center",
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    width: 21,
  },
  miniTileText: {
    color: tokens.color.ink,
    fontSize: 10,
    fontWeight: "900",
  },
  activeMiniTileText: { color: tokens.text.inverse },
  arrow: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 18,
  },
});
