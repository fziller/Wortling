import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, LinearTransition, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

import { captureEvent } from "@/analytics/events";
import { ConfirmModal } from "@/components/ConfirmModal";
import { GameResultModal } from "@/components/GameResultModal";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { HelpModal } from "@/components/HelpModal";
import { HexTile } from "@/components/HexTile";
import { SmallGameAction } from "@/components/SmallGameAction";
import { getBerlinDateKey } from "@/daily/date";
import { useNextOpenDailyKniff } from "@/dailyKniffe/continuation";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { buildSimpleShareText } from "@/games/share/grid";
import { createNextWabenwortGame, restoreWabenwortPuzzle } from "@/games/wabenwort/daily";
import { applyWabenwortHint, createWabenwortState, getWabenwortRank, getWabenwortWord, revealWabenwortSolution, submitWabenwortWord } from "@/games/wabenwort/engine";
import type { WabenwortRank, WabenwortState } from "@/games/wabenwort/types";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { selectionHaptic } from "@/haptics";
import { getHintPolicy, requestAdHint } from "@/hints/policy";
import { useHintWallet } from "@/hints/useHintWallet";
import { updateBadgeCount } from "@/notifications/badge";
import { scheduleDailyReminder } from "@/notifications/scheduler";
import { isStartedProgress, loadProgress, loadProgressForGames, mergeCompletedStatus, saveProgress, type StoredProgress } from "@/storage/progress";
import { useGameRecorder } from "@/stats/recorder";

const GAME_ID = "wabenwort";
type WabenwortGame = ReturnType<typeof createNextWabenwortGame>;

function formatElapsedTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}:${String(seconds % 60).padStart(2, "0")}` : `${seconds} Sek.`;
}

function rankLabel(rank: WabenwortRank) {
  return rank === "gold" ? "Gold" : rank === "silber" ? "Silber" : rank === "bronze" ? "Bronze" : "Start";
}

export default function WabenwortScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const today = getBerlinDateKey();
  const stats = useGameRecorder();
  const hintWallet = useHintWallet();
  const hintPolicy = getHintPolicy();
  const completedAtRef = useRef<string | undefined>(undefined);
  const completedStatusRef = useRef<StoredProgress["status"]>(undefined);
  const [game, setGame] = useState<WabenwortGame>(() => createNextWabenwortGame(undefined, today));
  const [state, setState] = useState<WabenwortState>(game.state);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [helpVisible, setHelpVisible] = useState(false);
  const [revealVisible, setRevealVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [activeLetterTick, setActiveLetterTick] = useState(0);
  const { dateKey, puzzle } = game;
  const { elapsedSeconds, reset: resetTimer } = useActiveTimer(state.status === "playing", finishedAt);
  const nextDailyKniffRoute = useNextOpenDailyKniff(GAME_ID, dateKey, state.status === "won");
  const rank = getWabenwortRank(puzzle, state);
  const foundCount = state.foundWords.length;
  const pangramCount = state.foundWords.filter((word) => getWabenwortWord(puzzle, word)?.isPangram).length;
  const hintDisabled = state.status !== "playing" || (hintPolicy !== "ads" && !hintWallet.canConsume);
  const hintLabel = hintPolicy === "ads" ? "💡 Hinweis (Werbung)" : `💡 Hinweis (${hintWallet.wallet.balance}/3)`;

  useEffect(() => {
    captureEvent(posthog, "screen_viewed", { screen: GAME_ID, params: { dateKey } });
    captureEvent(posthog, "game_started", { gameId: GAME_ID, dateKey });
  }, [dateKey, posthog]);

  useEffect(() => {
    loadProgress<WabenwortState>(GAME_ID, today).then((progress) => {
      completedAtRef.current = progress?.completedAt;
      completedStatusRef.current = progress?.completedStatus;
      const restoredPuzzle = restoreWabenwortPuzzle(progress?.puzzle);
      if (isStartedProgress(progress) && restoredPuzzle && progress.state.puzzleId === restoredPuzzle.id) {
        const restoredState = progress.state as WabenwortState & { input?: string };
        setGame({ dateKey: progress.dateKey, puzzle: restoredPuzzle, state: restoredState });
        setState(restoredState);
        setInput(restoredState.input ?? "");
        setFinishedAt(progress.completedAt ? Date.parse(progress.completedAt) : null);
        setResultVisible(progress.status !== "playing");
      }
      setProgressLoaded(true);
    });
  }, [today]);

  useEffect(() => {
    if (!progressLoaded) return;
    const completedAt = state.status !== "playing" ? (state.completedAt ?? new Date().toISOString()) : completedAtRef.current;
    const completedStatus = mergeCompletedStatus(completedStatusRef.current, state.status !== "playing" ? state.status : undefined);
    completedAtRef.current = completedAt;
    completedStatusRef.current = completedStatus;
    saveProgress({ gameId: GAME_ID, dateKey, puzzle, puzzleId: puzzle.id, puzzleVersion: puzzle.version, status: state.status, completedStatus, completedAt, state: { ...state, input, startedAt: state.startedAt ?? new Date().toISOString(), completedAt } });
  }, [dateKey, input, progressLoaded, puzzle, state]);

  useEffect(() => {
    if (state.status !== "playing") loadProgressForGames(games.map((item) => item.id), dateKey).then((progress) => {
      updateBadgeCount(progress);
      scheduleDailyReminder().catch(() => {});
    });
  }, [dateKey, state.status]);

  const foundByLength = useMemo(() => {
    const groups = new Map<number, string[]>();
    for (const word of state.foundWords) {
      const length = Array.from(word).length;
      groups.set(length, [...(groups.get(length) ?? []), word]);
    }
    return [...groups.entries()].sort(([a], [b]) => a - b);
  }, [state.foundWords]);

  const sortedAllowedWords = useMemo(() => [...puzzle.allowedWords].sort((a, b) => a.length - b.length || a.localeCompare(b, "de")), [puzzle]);
  const resultWordList = useMemo(() => {
    const found = new Set(state.foundWords);
    return [
      ...sortedAllowedWords.filter((word) => found.has(word)),
      ...sortedAllowedWords.filter((word) => !found.has(word)),
    ].map((word) => ({ word, found: found.has(word) }));
  }, [sortedAllowedWords, state.foundWords]);

  const totalByLength = useMemo(() => {
    const counts = new Map<number, number>();
    for (const word of puzzle.allowedWords) {
      const length = Array.from(word).length;
      counts.set(length, (counts.get(length) ?? 0) + 1);
    }
    return counts;
  }, [puzzle]);

  function startStats() {
    stats.start({ gameId: GAME_ID, playDate: dateKey, puzzleId: puzzle.id, gameVersion: puzzle.version, wordLength: 7 });
  }

  function addLetter(letter: string) {
    if (state.status !== "playing" || !puzzle.letters.includes(letter)) return;
    selectionHaptic();
    setActiveLetter(letter);
    setActiveLetterTick((current) => current + 1);
    setInput((current) => current + letter);
  }

  function backspace() {
    if (state.status !== "playing") return;
    setInput((current) => current.slice(0, -1));
  }

  function submit() {
    if (!input) return;
    startStats();
    const result = submitWabenwortWord(puzzle, state, input);
    if (!result.ok) {
      stats.recordRejectedGuess(result.reason, input);
      setMessage(result.reason === "Unbekanntes Wort." ? "Dieses Wort zählt in dieser Wabe nicht." : result.reason);
      return;
    }
    setState(result.state);
    setInput("");
    const nextFound = result.state.foundWords.length;
    stats.recordAcceptedGuess(result.word.word, { wordLength: result.word.word.length, isPangram: result.word.isPangram, foundWordCount: nextFound, totalWords: puzzle.allowedWords.length });
    setMessage(result.word.isPangram ? `Pangramm! Wort ${nextFound} von ${puzzle.goldWords}` : `Wort ${nextFound} von ${puzzle.goldWords}`);
    if (result.state.status === "won") {
      stats.finish("won");
      hintWallet.onWin().then((granted) => { if (granted) setMessage("Gold! Hinweis erhalten! 💡"); });
      setFinishedAt(Date.now());
      setResultVisible(true);
      captureEvent(posthog, "game_completed", { gameId: GAME_ID, dateKey, durationMs: elapsedSeconds * 1000, attempts: nextFound, outcome: "won", success: true, rank: result.rank, foundWordCount: nextFound, totalWords: puzzle.allowedWords.length, pangramCount: pangramCount + Number(result.word.isPangram), highestWordLength: Math.max(...result.state.foundWords.map((word) => word.length)) });
    }
  }

  async function useHint() {
    const next = applyWabenwortHint(puzzle, state);
    if (next === state) return;
    startStats();
    let source = "earned";
    if (hintPolicy === "ads") {
      if (!await requestAdHint()) return setMessage("Werbung gerade nicht verfügbar.");
      source = "ad";
    } else if (!await hintWallet.tryConsume()) return setMessage("Keine Hinweise verfügbar.");
    const hintedWord = next.foundWords[next.foundWords.length - 1]!;
    stats.recordHint({ source, gameId: GAME_ID, wordLength: hintedWord.length });
    captureEvent(posthog, "hint_used", { gameId: GAME_ID, dateKey, source });
    setState(next);
    setMessage(`Hinweis: ${hintedWord.toLocaleUpperCase("de-DE")} aufgedeckt.`);
    if (next.status === "won") {
      stats.finish("won");
      setFinishedAt(Date.now());
      setResultVisible(true);
      captureEvent(posthog, "game_completed", { gameId: GAME_ID, dateKey, durationMs: elapsedSeconds * 1000, attempts: next.foundWords.length, outcome: "won", success: true, rank: "gold", foundWordCount: next.foundWords.length, totalWords: puzzle.allowedWords.length, pangramCount: next.foundWords.filter((item) => getWabenwortWord(puzzle, item)?.isPangram).length, highestWordLength: Math.max(...next.foundWords.map((item) => item.length)) });
    }
  }

  function reveal() {
    startStats();
    stats.finish("revealed");
    const next = revealWabenwortSolution(puzzle, state);
    setState(next);
    setInput("");
    setMessage("Alle verfügbaren Wörter aufgedeckt.");
    setRevealVisible(false);
    setFinishedAt(Date.now());
    setResultVisible(true);
    captureEvent(posthog, "solution_revealed", { gameId: GAME_ID, dateKey, attempts: state.foundWords.length, foundWordCount: state.foundWords.length });
    captureEvent(posthog, "game_completed", { gameId: GAME_ID, dateKey, durationMs: elapsedSeconds * 1000, attempts: state.foundWords.length, outcome: "revealed", success: false, rank, foundWordCount: state.foundWords.length, totalWords: puzzle.allowedWords.length, pangramCount });
  }

  function startNextPuzzle() {
    const next = createNextWabenwortGame(puzzle.id, today);
    setGame(next); setState(next.state); setInput(""); setMessage(""); setResultVisible(false); setRevealVisible(false); setFinishedAt(null); resetTimer();
  }

  function goBack() {
    if (state.status === "playing" && state.foundWords.length) captureEvent(posthog, "game_abandoned", { gameId: GAME_ID, dateKey, attempts: state.foundWords.length, foundWordCount: state.foundWords.length });
    if (router.canGoBack()) router.back(); else router.replace("/");
  }

  return (
    <GameScreenFrame
      actions={state.status === "playing" ? <View style={styles.actionRow}><SmallGameAction disabled={hintDisabled} label={hintLabel} onPress={useHint} /><SmallGameAction label="Lösung anzeigen" onPress={() => setRevealVisible(true)} variant="reveal" /></View> : null}
      keyboard={{ disabled: state.status !== "playing", onBackspace: backspace, onLetter: addLetter, onSubmit: submit, showLetters: false, submitDisabled: !input }}
      onBack={goBack}
      onHelp={() => { captureEvent(posthog, "help_opened", { gameId: GAME_ID, dateKey }); setHelpVisible(true); }}
      progressLabel={`${foundCount}/${puzzle.goldWords} Wörter`}
      title="Wabenwort"
    >
      <View style={styles.wrap}>
        <RankProgress rank={rank} found={foundCount} puzzle={puzzle} />
        <Honeycomb activeLetter={activeLetter} activeTick={activeLetterTick} centerLetter={puzzle.centerLetter} letters={puzzle.letters} onLetter={addLetter} />
        <View style={styles.input}><Text style={styles.inputText}>{input ? input.toLocaleUpperCase("de-DE") : "Wort eingeben"}</Text><Text style={styles.inputHint}>{message}</Text></View>
        <ScrollView contentContainerStyle={styles.foundContent} showsVerticalScrollIndicator={false} style={styles.foundList}>
          {foundByLength.length ? foundByLength.map(([length, words]) => <View key={length} style={styles.wordGroup}><Text style={styles.groupLabel}>{length} BUCHSTABEN · {words.length}/{totalByLength.get(length) ?? words.length}</Text><View style={styles.wordWrap}>{words.map((word) => <Animated.View entering={FadeInDown.duration(tokens.motion.quick)} key={word} layout={LinearTransition.springify().damping(18).stiffness(220)} style={[styles.wordChip, getWabenwortWord(puzzle, word)?.isPangram && styles.pangramChip]}><Text style={styles.wordChipText}>{word.toLocaleUpperCase("de-DE")}</Text></Animated.View>)}</View></View>) : <Text style={styles.emptyText}>Deine gefundenen Wörter erscheinen hier.</Text>}
        </ScrollView>
      </View>
      <ConfirmModal confirmLabel="Lösung zeigen" message="Alle verfügbaren Wörter werden angezeigt. Die Runde zählt nicht als geschafft." onCancel={() => setRevealVisible(false)} onConfirm={reveal} title="Lösung anzeigen?" visible={revealVisible} />
      <GameResultModal actionLabel={nextDailyKniffRoute ? "Nächster Tageskniff" : "Neue Wabe"} dateKey={dateKey} durationMs={elapsedSeconds * 1000} gameId={GAME_ID} message={state.status === "won" ? "Gold erreicht. Sauber." : "Alle verfügbaren Wörter sind aufgedeckt."} onFeedback={(rating) => captureEvent(posthog, "game_feedback_submitted", { gameId: GAME_ID, dateKey, rating, outcome: state.status })} onHome={() => router.replace("/")} onNext={() => { setResultVisible(false); if (nextDailyKniffRoute) setTimeout(() => router.push(nextDailyKniffRoute as never), 0); else startNextPuzzle(); }} onShare={() => captureEvent(posthog, "result_shared", { gameId: GAME_ID, dateKey, scope: "game", outcome: state.status })} onViewed={() => captureEvent(posthog, "result_viewed", { gameId: GAME_ID, dateKey, scope: "game", outcome: state.status, success: state.status === "won" })} outcome={state.status === "playing" ? undefined : state.status} shareText={buildSimpleShareText("Wabenwort", dateKey, state.status, `${rankLabel(rank)} · ${foundCount}/${puzzle.allowedWords.length} Wörter`)} stats={[{ label: "Wörter", value: `${foundCount}/${puzzle.allowedWords.length}` }, { label: "Pangramme", value: pangramCount }, { label: "Zeit", value: formatElapsedTime(elapsedSeconds) }]} success={state.status === "won"} title={state.status === "won" ? "Gold!" : "Aufgelöst."} visible={resultVisible && state.status !== "playing"} wordList={resultWordList} />
      <HelpModal {...gameHelp.wabenwort} onClose={() => setHelpVisible(false)} visible={helpVisible} />
    </GameScreenFrame>
  );
}

function RankProgress({ puzzle, rank, found }: { puzzle: WabenwortGame["puzzle"]; rank: WabenwortRank; found: number }) {
  const progress = useSharedValue(0);
  useEffect(() => { progress.value = withTiming(Math.min(found / puzzle.goldWords, 1), { duration: 220 }); }, [progress, puzzle.goldWords, found]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const marks = [
    { key: "bronze" as const, count: puzzle.bronzeWords },
    { key: "silber" as const, count: puzzle.silverWords },
    { key: "gold" as const, count: puzzle.goldWords },
  ];
  return (
    <View style={styles.rankBlock}>
      <View style={styles.rankLabels}>
        {marks.map((mark) => (
          <Text key={mark.key} style={[styles.rankLabel, rank === mark.key && styles.rankLabelActive]}>
            {rankLabel(mark.key)} · {mark.count}
          </Text>
        ))}
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, rank === "gold" && styles.fillGold, fillStyle]} />
        {marks.map((mark) => (
          <View key={mark.key} style={[styles.rankTick, { left: `${Math.min((mark.count / puzzle.goldWords) * 100, 100)}%` }]} />
        ))}
      </View>
    </View>
  );
}

function Honeycomb({ activeLetter, activeTick, centerLetter, letters, onLetter }: { activeLetter: string | null; activeTick: number; centerLetter: string; letters: string[]; onLetter: (letter: string) => void }) {
  const outer = letters.filter((letter) => letter !== centerLetter);

  return (
    <View style={styles.honeyWrap}>
      <View style={styles.honey}>
        {outer.map((letter, index) => <HoneycombTile active={activeLetter === letter} activeTick={activeTick} key={`${letter}-${index}`} letter={letter} onPress={() => onLetter(letter)} style={outerPositions[index] ?? styles.r0l} />)}
        <HoneycombTile active={activeLetter === centerLetter} activeTick={activeTick} center letter={centerLetter} onPress={() => onLetter(centerLetter)} style={styles.centerHex} />
      </View>
    </View>
  );
}

function HoneycombTile({ active, activeTick, center = false, letter, onPress, style }: { active: boolean; activeTick: number; center?: boolean; letter: string; onPress: () => void; style: object }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (!active) return;
    pulse.value = withSequence(withTiming(1, { duration: 90 }), withSpring(0, { damping: 18, stiffness: 220 }));
  }, [active, activeTick, pulse]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.13 }], opacity: 1 - pulse.value * 0.08 }));

  return (
    <Pressable accessibilityLabel={`${center ? "Pflichtbuchstabe" : "Buchstabe"} ${letter}`} onPress={onPress} style={[styles.hexPressable, style]}>
      <Animated.View style={[styles.hex, animatedStyle]}>
        <HexTile label={letter.toLocaleUpperCase("de-DE")} size={72} variant={center ? "center" : "default"} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.sm }, actionRow: { flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm, justifyContent: "center" }, rankBlock: { gap: 5, paddingHorizontal: tokens.space.sm }, rankLabels: { flexDirection: "row", justifyContent: "space-between" }, rankLabel: { color: tokens.color.muted, fontFamily: tokens.font.ui.semibold, fontSize: 11, textTransform: "uppercase" }, rankLabelActive: { color: tokens.gameAccent.wabenwort }, track: { backgroundColor: tokens.color.line, borderRadius: 99, height: 8, overflow: "hidden" }, rankTick: { backgroundColor: tokens.color.card, borderRadius: 2, height: 8, position: "absolute", top: 0, width: 3 }, fill: { backgroundColor: tokens.color.warning, borderRadius: 99, height: "100%" }, fillGold: { backgroundColor: tokens.color.success }, honeyWrap: { alignItems: "center", height: 224, justifyContent: "center" }, honey: { height: 212, width: 232 }, hexPressable: { height: 76, position: "absolute", width: 76 }, hex: { alignItems: "center", height: 76, justifyContent: "center", width: 76 }, centerHex: { left: 78, top: 68 }, r0l: { left: 39, top: 0 }, r0r: { left: 117, top: 0 }, r1l: { left: 0, top: 68 }, r1r: { left: 156, top: 68 }, r2l: { left: 39, top: 136 }, r2r: { left: 117, top: 136 }, input: { alignItems: "center", minHeight: 47 }, inputText: { color: tokens.color.ink, fontFamily: tokens.font.ui.semibold, fontSize: 24, letterSpacing: 2 }, inputHint: { color: tokens.color.muted, fontFamily: tokens.font.ui.medium, fontSize: 13, minHeight: 18, textAlign: "center" }, foundList: { flex: 1, minHeight: 0 }, foundContent: { gap: tokens.space.sm, paddingBottom: tokens.space.xs }, emptyText: { color: tokens.color.muted, fontFamily: tokens.font.ui.regular, paddingVertical: tokens.space.md, textAlign: "center" }, wordGroup: { gap: 4 }, groupLabel: { color: tokens.color.muted, fontFamily: tokens.font.ui.semibold, fontSize: 10, letterSpacing: 1 }, wordWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, wordChip: { backgroundColor: tokens.surface.card, borderColor: tokens.border.subtle, borderRadius: tokens.radius.pill, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 }, pangramChip: { backgroundColor: "#FFF0C7", borderColor: "#E0AF28" }, wordChipText: { color: tokens.color.ink, fontFamily: tokens.font.ui.semibold, fontSize: 12 },
});
const outerPositions = [styles.r0l, styles.r0r, styles.r1l, styles.r1r, styles.r2l, styles.r2r];
