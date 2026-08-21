import { Link, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { Screen } from "@/components/Screen";
import { getBerlinDateKey } from "@/daily/date";
import { tokens } from "@/design/tokens";
import { games } from "@/games/registry";
import type { GameStatus } from "@/games/types";
import { updateBadgeCount } from "@/notifications/badge";
import { loadProgressForGames, type StoredProgress } from "@/storage/progress";

const homeOrder = [
  "worttreffer",
  "galgenwort",
  "between",
  "wortcode",
  "formwort",
  "wortleiter",
] as const;

const previewWords = {
  wortcode: ["S", "P", "I", "E", "L"],
  galgenwort: ["K", "", "", "F", "F"],
  wortleiterTop: ["M", "A", "U", "S"],
  wortleiterBottom: ["H", "A", "U", "S"],
} as const;

const gameMeta = {
  wortcode: {
    color: "#2E7D32",
    dot: tokens.color.success,
    description: "Knacke das Wort mit Zahlenhinweisen.",
    rotate: "1deg",
    tape: "topRight",
  },
  galgenwort: {
    color: "#FBC02D",
    dot: "#FBC02D",
    description: "Errate die Buchstaben.",
    rotate: "-1deg",
    tape: "topLeft",
  },
  worttreffer: {
    color: tokens.color.primaryDark,
    dot: tokens.color.primary,
    description: "Errate das Wort in sechs Versuchen.",
    rotate: "1deg",
    tape: "bottomRight",
  },
  between: {
    color: tokens.color.secondary,
    dot: tokens.color.secondary,
    description: "Grenze das Zielwort alphabetisch ein.",
    rotate: "-1deg",
    tape: "topCenter",
  },
  doppel: {
    color: "#7B1FA2",
    dot: "#7B1FA2",
    description: "Zwei Wörter, ein Sinn.",
    rotate: "1deg",
    tape: "bottomLeft",
  },
  formwort: {
    color: "#C2185B",
    dot: "#C2185B",
    description: "Nutze Formen und Farbhinweise.",
    rotate: "-1deg",
    tape: "topRight",
  },
  wortleiter: {
    color: "#00796B",
    dot: "#00796B",
    description: "Schritt für Schritt.",
    rotate: "1deg",
    tape: "bottomCenter",
  },
} as const;

type TapePosition = keyof typeof tapePositions;

function statusDotColor(status?: GameStatus, fallback: string = tokens.color.primary): string {
  if (status === "won") return tokens.color.success;
  if (status === "playing") return "#FBC02D";
  if (status === "lost" || status === "revealed") return tokens.color.danger;

  return fallback;
}

export default function HomeScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const dateKey = getBerlinDateKey();
  const [progressByGame, setProgressByGame] = useState<Record<string, StoredProgress | null>>({});
  const orderedGames = homeOrder
    .map((id) => games.find((game) => game.id === id))
    .filter((game): game is (typeof games)[number] => Boolean(game));

  useEffect(() => {
    try {
      posthog.capture("screen_viewed", { screen: "home", params: { dateKey } });
    } catch {}
  }, [dateKey, posthog]);

  useEffect(() => {
    let mounted = true;

    loadProgressForGames(
      games.map((game) => game.id),
      dateKey,
    ).then((progress) => {
      if (mounted) {
        setProgressByGame(progress);
        updateBadgeCount(progress);
      }
    });

    return () => {
      mounted = false;
    };
  }, [dateKey]);

  return (
    <Screen>
      <View style={styles.topBar}>
        <View style={styles.iconButton} />
        <Text style={styles.logo}>WORTKNIFF</Text>
        <Link href="/settings" asChild>
          <Pressable accessibilityLabel="Einstellungen öffnen" accessibilityRole="button" style={styles.iconButton}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </Link>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(tokens.motion.slow)} style={styles.progressSection}>
          <Text style={styles.progressTitle}>DEIN FORTSCHRITT</Text>
          <View style={styles.tokensRow}>
            <ProgressToken complete rotate="-2deg" />
            <ProgressToken complete rotate="1deg" />
            <ProgressToken rotate="-1deg" />
          </View>
          <Text style={styles.progressText}>2 von 3 Rätseln gelöst</Text>
        </Animated.View>

        <View style={styles.gameList}>
          {orderedGames.map((game, index) => {
            const meta = gameMeta[game.id as keyof typeof gameMeta];
            const status = progressByGame[game.id]?.status;

            return (
              <Animated.View
                entering={FadeInDown.delay(90 + index * 45).duration(tokens.motion.slow)}
                key={game.id}
              >
                <Pressable
                  accessibilityLabel={`${game.title} öffnen`}
                  accessibilityRole="button"
                  onPress={() => router.push(game.route as never)}
                  style={({ pressed }) => [
                    styles.card,
                    { transform: [{ rotate: meta.rotate }, { scale: pressed ? 0.98 : 1 }] },
                  ]}
                >
                  <Tape position={meta.tape} />
                  <View style={styles.cardHeader}>
                    <View style={styles.titleRow}>
                      <Text style={styles.cardTitle}>{game.title}</Text>
                      <View style={[styles.statusDot, { backgroundColor: statusDotColor(status, meta.dot) }]} />
                    </View>
                  </View>
                  <Text style={styles.cardText}>{meta.description}</Text>
                  {renderPreview(game.id as keyof typeof gameMeta, meta.color)}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

function ProgressToken({ complete = false, rotate }: { complete?: boolean; rotate: string }) {
  return (
    <View style={[styles.progressToken, complete ? styles.progressTokenDone : styles.progressTokenOpen, { transform: [{ rotate }] }]}>
      {complete ? <Text style={styles.check}>✓</Text> : null}
    </View>
  );
}

function Tape({ position }: { position: TapePosition }) {
  return <View style={[styles.tape, tapePositions[position]]} />;
}

function renderPreview(gameId: keyof typeof gameMeta, color: string) {
  if (gameId === "worttreffer") {
    return (
      <View style={styles.wordcodePreview}>
        {previewWords.wortcode.map((letter) => (
          <View key={letter} style={[styles.bigTile, { backgroundColor: "#2E7D32" }]}> 
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
      <Text style={[styles.wordChipText, dashed && { color }]}>{label}</Text>
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

const tapePositions = StyleSheet.create({
  topRight: {
    right: 18,
    top: -5,
    transform: [{ rotate: "10deg" }],
  },
  topLeft: {
    left: 34,
    top: -6,
    transform: [{ rotate: "-15deg" }],
  },
  topCenter: {
    left: "43%",
    top: 5,
    transform: [{ rotate: "3deg" }],
  },
  bottomRight: {
    bottom: 10,
    right: 44,
    transform: [{ rotate: "48deg" }],
  },
  bottomLeft: {
    bottom: 18,
    left: 18,
    transform: [{ rotate: "-12deg" }],
  },
  bottomCenter: {
    bottom: -1,
    left: "43%",
    transform: [{ rotate: "-3deg" }],
  },
});

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    backgroundColor: "#FDFBF7",
    borderBottomColor: "#EEE7DD",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -tokens.space.md,
    marginTop: -tokens.space.lg,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: 14,
  },
  iconButton: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  settingsIcon: {
    color: "#5F6368",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 25,
  },
  logo: {
    color: "#E65100",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -1,
  },
  scrollContent: {
    gap: 22,
    paddingBottom: tokens.space.xl,
    paddingTop: tokens.space.lg,
  },
  progressSection: {
    alignItems: "center",
    gap: 14,
    paddingVertical: tokens.space.sm,
  },
  progressTitle: {
    color: tokens.color.ink,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  tokensRow: {
    flexDirection: "row",
    gap: 16,
  },
  progressToken: {
    alignItems: "center",
    borderRadius: 13,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  progressTokenDone: {
    backgroundColor: "#E65100",
    shadowColor: "#9C2E00",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 3,
  },
  progressTokenOpen: {
    backgroundColor: "#F2EDE4",
    borderColor: "#E1D8CB",
    borderStyle: "dashed",
    borderWidth: 1,
  },
  check: {
    color: "#FFFDF8",
    fontSize: 33,
    fontWeight: "900",
    lineHeight: 34,
  },
  progressText: {
    color: "#5F6368",
    fontSize: 14,
    fontWeight: "600",
  },
  gameList: {
    gap: 20,
  },
  card: {
    backgroundColor: "#FFFDF8",
    borderColor: "#EEE6DA",
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 158,
    overflow: "visible",
    padding: 20,
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 9, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  cardTitle: {
    color: tokens.color.ink,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  statusDot: {
    borderRadius: 999,
    height: 9,
    shadowColor: "#000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    width: 9,
  },
  cardText: {
    color: "#5F6368",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  tape: {
    backgroundColor: "rgba(253, 251, 247, 0.72)",
    borderColor: "rgba(0,0,0,0.05)",
    borderWidth: 1,
    height: 23,
    opacity: 0.9,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    width: 82,
    zIndex: 2,
  },
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
    shadowColor: "#000",
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    width: 41,
  },
  bigTileText: {
    color: "#FFFDF8",
    fontSize: 17,
    fontWeight: "900",
  },
  smallTilesRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 30,
  },
  smallTile: {
    alignItems: "center",
    backgroundColor: "#F2EFE8",
    borderRadius: 7,
    height: 29,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    width: 29,
  },
  emptyHangmanTile: {
    borderBottomColor: "#E65100",
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
    backgroundColor: "#F2EFE8",
    borderRadius: 7,
    minWidth: "47%",
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  wordChipText: {
    color: tokens.color.ink,
    fontSize: 12,
    fontWeight: "900",
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
    backgroundColor: "#F2EFE8",
    borderRadius: 7,
    minWidth: 58,
    paddingHorizontal: 11,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  wordChipSmall: {
    minWidth: 43,
    paddingHorizontal: 8,
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
    backgroundColor: "#F2EFE8",
    borderColor: "#E0D9CF",
    borderRadius: 7,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    width: 36,
  },
  circleTile: {
    borderRadius: 999,
  },
  diamondTile: {
    transform: [{ rotate: "45deg" }],
  },
  shapeTileText: {
    color: tokens.color.ink,
    fontSize: 13,
    fontWeight: "900",
  },
  diamondText: {
    transform: [{ rotate: "-45deg" }],
  },
  leiterPreview: {
    alignItems: "center",
    gap: 4,
    marginTop: 22,
  },
  leiterRow: {
    flexDirection: "row",
    gap: 4,
  },
  miniTile: {
    alignItems: "center",
    backgroundColor: "#F2EFE8",
    borderRadius: 6,
    height: 21,
    justifyContent: "center",
    shadowColor: "#000",
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
  activeMiniTileText: {
    color: "#FFFDF8",
  },
  arrow: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 18,
  },
});
