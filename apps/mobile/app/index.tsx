import { Link, useFocusEffect, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { Screen } from "@/components/Screen";
import { getBerlinDateKey } from "@/daily/date";
import { generateDailyKniffe, getDailyKniffeSummary, isDailyKniffCompleted } from "@/dailyKniffe";
import { tokens } from "@/design/tokens";
import { gameRegistry, games } from "@/games/registry";
import type { GameStatus } from "@/games/types";
import { updateBadgeCount } from "@/notifications/badge";
import { loadDailyKniffeSeedOverride } from "@/storage/dailyKniffeDev";
import { completeDailyStreak, loadDailyStreak, type DailyStreak } from "@/storage/dailyStreak";
import { loadProgressForGames, type StoredProgress } from "@/storage/progress";

const homeOrder = [
  "worttreffer",
  "galgenwort",
  "between",
  "wortcode",
  "formwort",
  "wortleiter",
  "doppel",
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
  const [dailyStreak, setDailyStreak] = useState<DailyStreak>({ current: 0, best: 0 });
  const [seedOverride, setSeedOverride] = useState<number | undefined>();
  const completedEventIds = useRef(new Set<string>());
  const orderedGames = homeOrder
    .map((id) => games.find((game) => game.id === id))
    .filter((game): game is (typeof games)[number] => Boolean(game));
  const dailyKniffe = useMemo(() => generateDailyKniffe({
    dateKey,
    devConfig: { seedOverride },
    games,
  }), [dateKey, seedOverride]);
  const dailyKniffeByGame = useMemo(() => new Map(dailyKniffe.map((kniff) => [kniff.gameId, kniff])), [dailyKniffe]);
  const dailyKniffGames = dailyKniffe
    .map((kniff) => gameRegistry[kniff.gameId])
    .filter((game): game is (typeof games)[number] => Boolean(game));
  const dailySummary = getDailyKniffeSummary(dailyKniffe, progressByGame);

  useEffect(() => {
    try {
      posthog.capture("screen_viewed", { screen: "home", params: { dateKey } });
      posthog.capture("daily_kniffe_viewed", { dateKey, total: dailySummary.total });
    } catch {}
  }, [dateKey, dailySummary.total, posthog]);

  useFocusEffect(useCallback(() => {
    let mounted = true;

    Promise.all([loadDailyKniffeSeedOverride(), loadDailyStreak()]).then(([nextSeedOverride, nextStreak]) => {
      if (!mounted) return;
      setSeedOverride(nextSeedOverride);
      setDailyStreak(nextStreak);
    });

    return () => {
      mounted = false;
    };
  }, []));

  useEffect(() => {
    let mounted = true;

    loadProgressForGames(
      games.map((game) => game.id),
      dateKey,
    ).then((progress) => {
      if (mounted) {
        setProgressByGame(progress);
        updateBadgeCount(progress, dateKey, seedOverride);
      }
    });

    return () => {
      mounted = false;
    };
  }, [dateKey, seedOverride]);

  useEffect(() => {
    for (const kniff of dailyKniffe) {
      if (!isDailyKniffCompleted(progressByGame[kniff.gameId]) || completedEventIds.current.has(kniff.id)) continue;

      completedEventIds.current.add(kniff.id);
      try {
        posthog.capture("daily_kniff_completed", { dateKey, gameId: kniff.gameId });
      } catch {}
    }
  }, [dateKey, dailyKniffe, posthog, progressByGame]);

  useEffect(() => {
    if (!dailySummary.isComplete || dailyStreak.lastCompletedDateKey === dateKey) return;

    completeDailyStreak(dateKey).then((nextStreak) => {
      setDailyStreak(nextStreak);
      try {
        posthog.capture("daily_kniffe_all_completed", { dateKey, streak: nextStreak.current });
      } catch {}
    });
  }, [dailyStreak.lastCompletedDateKey, dailySummary.isComplete, dateKey, posthog]);

  function openDailyKniff(gameId: string) {
    const game = gameRegistry[gameId];
    if (!game) return;

    try {
      posthog.capture("daily_kniff_opened", {
        dateKey,
        gameId,
        completed: String(isDailyKniffCompleted(progressByGame[gameId])),
      });
    } catch {}

    router.push(game.route as never);
  }

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
        <Animated.View entering={FadeInUp.duration(tokens.motion.slow)} style={styles.dailyCard}>
          <Tape position="dailyTopRight" />
          <View style={styles.dailyHeader}>
            <Text style={styles.dailyTitle}>Tageskniffe</Text>
            <View style={styles.dailyCountPill}>
              <Text style={styles.dailyCountText}>{dailySummary.completed}/{dailySummary.total || 3} ERLEDIGT</Text>
            </View>
          </View>

          <View style={styles.dailyRows}>
            {dailyKniffGames.map((game) => {
              const complete = isDailyKniffCompleted(progressByGame[game.id]);

              return (
                <Pressable
                  accessibilityLabel={`${game.title}, ${complete ? "Tageskniff erledigt" : "offener Tageskniff"}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: complete }}
                  key={game.id}
                  onPress={() => openDailyKniff(game.id)}
                  style={({ pressed }) => [styles.dailyRow, complete && styles.dailyRowDone, pressed && styles.pressed]}
                >
                  {complete ? (
                    <View style={styles.dailyStamp}>
                      <View style={styles.dailyStampCoin}>
                        <Text style={styles.dailyStampCheck}>✓</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.dailyOpenMark}>
                      <View style={styles.dailyOpenDot} />
                    </View>
                  )}
                  <Text style={[styles.dailyGameTitle, complete && styles.dailyGameTitleDone]}>{game.title}</Text>
                  {complete ? (
                    <Text style={styles.dailyDoneLabel}>ABGESCHLOSSEN</Text>
                  ) : (
                    <View style={styles.dailyPlayPill}>
                      <Text style={styles.dailyPlayText}>SPIELEN</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.dailyFooter}>
            {dailySummary.isComplete
              ? `Tageskniffe geschafft · Serie ${dailyStreak.current || 1}`
              : dailySummary.total < 3
                ? "Noch nicht genug Spiele freigegeben."
                : `Noch ${dailySummary.total - dailySummary.completed} für deine Serie`}
          </Text>
        </Animated.View>

        <View style={styles.gameList}>
          {orderedGames.map((game, index) => {
            const meta = gameMeta[game.id as keyof typeof gameMeta];
            const status = progressByGame[game.id]?.status;
            const dailyKniff = dailyKniffeByGame.get(game.id);
            const dailyKniffComplete = isDailyKniffCompleted(progressByGame[game.id]);

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
                  {dailyKniff ? (
                    <Text style={[styles.dailyBadge, dailyKniffComplete && styles.dailyBadgeDone]}>
                      {dailyKniffComplete ? "✓ Tageskniff" : "✦ Tageskniff"}
                    </Text>
                  ) : null}
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
  dailyTopRight: {
    right: 38,
    top: -6,
    transform: [{ rotate: "10deg" }],
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
  dailyCard: {
    gap: tokens.space.md,
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#EEE6DA",
    backgroundColor: "#FFFDF8",
    overflow: "visible",
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.09,
    shadowRadius: 22,
    elevation: 4,
    transform: [{ rotate: "-1deg" }],
  },
  dailyHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: tokens.space.sm,
    marginBottom: tokens.space.xs,
  },
  dailyTitle: {
    color: tokens.color.ink,
    flexShrink: 1,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  dailyCountPill: {
    alignItems: "center",
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 5,
    borderRadius: tokens.radius.pill,
    backgroundColor: "#FFE0B2",
  },
  dailyCountText: {
    color: tokens.color.primaryDark,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  dailyRows: {
    gap: 9,
  },
  dailyRow: {
    minHeight: 50,
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE5DA",
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  dailyRowDone: {
    backgroundColor: "rgba(245, 240, 230, 0.35)",
    borderColor: "#E0D8CD",
    borderStyle: "dashed",
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.72,
  },
  dailyStamp: {
    width: 44,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(23, 19, 13, 0.55)",
    transform: [{ rotate: "-1deg" }],
  },
  dailyStampCoin: {
    width: 21,
    height: 21,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#FFE0B2",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  dailyStampCheck: {
    color: tokens.color.primaryDark,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 15,
  },
  dailyOpenMark: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#F5F0E6",
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 2, width: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  dailyOpenDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: tokens.color.primary,
  },
  dailyGameTitle: {
    color: tokens.color.ink,
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
  },
  dailyGameTitleDone: {
    color: tokens.color.ink,
  },
  dailyDoneLabel: {
    color: "#2E7D32",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  dailyPlayPill: {
    minWidth: 72,
    alignItems: "center",
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary,
    shadowColor: tokens.color.primaryDark,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  dailyPlayText: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  dailyFooter: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontWeight: "900",
    textAlign: "center",
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
  dailyBadge: {
    alignSelf: "flex-start",
    marginTop: tokens.space.xs,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(255, 107, 53, 0.12)",
    color: tokens.color.primaryDark,
    fontSize: tokens.type.small,
    fontWeight: "900",
  },
  dailyBadgeDone: {
    backgroundColor: "rgba(33, 166, 122, 0.14)",
    color: tokens.color.success,
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
