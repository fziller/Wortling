import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import Animated, { FadeInDown, LinearTransition, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

import { captureEvent } from "@/analytics/events";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ContinueAfterLossModal } from "@/components/ContinueAfterLossModal";
import { GameResultModal } from "@/components/GameResultModal";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { HelpModal } from "@/components/HelpModal";
import { HintableLetterTile } from "@/components/HintableLetterTile";
import { ShakeView } from "@/components/ShakeView";
import { SmallGameAction } from "@/components/SmallGameAction";
import { getBerlinDateKey } from "@/daily/date";
import { useNextOpenDailyKniff } from "@/dailyKniffe/continuation";
import { tokens } from "@/design/tokens";
import { createNextAnagrammGame, restoreAnagrammPuzzle } from "@/games/anagramm/daily";
import { applyAnagrammHint, getAnagrammDraft, getAnagrammHintPosition, placeAnagrammTile, removeAnagrammTile, revealAnagrammSolution, submitAnagrammGuess } from "@/games/anagramm/engine";
import type { AnagrammState } from "@/games/anagramm/types";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { buildSimpleShareText } from "@/games/share/grid";
import { useFirstGameHelp } from "@/games/useFirstGameHelp";
import { getWordTileLayout } from "@/games/wordTileLayout";
import type { BucketPreset } from "@/games/wordBuckets";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { useHintWallet } from "@/hints/useHintWallet";
import { getHintPolicy, requestAdHint } from "@/hints/policy";
import { selectionHaptic, successHaptic, warningHaptic } from "@/haptics";
import { updateBadgeCount } from "@/notifications/badge";
import { scheduleDailyReminder } from "@/notifications/scheduler";
import { rejectMessage } from "@/games/rejectMessages";
import { isStartedProgress, loadProgress, loadProgressForGames, mergeCompletedStatus, saveProgress, type StoredProgress } from "@/storage/progress";
import { getPreset, loadWordBucketSettings } from "@/storage/wordBuckets";
import { isFinishedGameStatus, useGameRecorder } from "@/stats/recorder";

type AnagrammGame = ReturnType<typeof createNextAnagrammGame>;

export default function AnagrammScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const today = getBerlinDateKey();
  const stats = useGameRecorder();
  const hintWallet = useHintWallet();
  const hintPolicy = getHintPolicy();
  const completedAtRef = useRef<string | undefined>(undefined);
  const completedStatusRef = useRef<StoredProgress["status"] | undefined>(undefined);
  const [bucketPreset, setBucketPreset] = useState<BucketPreset>("klassisch");
  const [game, setGame] = useState<AnagrammGame>(() => createNextAnagrammGame(undefined, today));
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<AnagrammState>(game.state);
  const [message, setMessage] = useState("");
  const [shakeTick, setShakeTick] = useState(0);
  const [giveUpVisible, setGiveUpVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [lossVisible, setLossVisible] = useState(false);
  const [continuedAfterLoss, setContinuedAfterLoss] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const { elapsedSeconds, reset: resetTimer } = useActiveTimer(state.status === "playing", finishedAt);
  const nextDailyKniffRoute = useNextOpenDailyKniff("anagramm", dateKey, state.status === "won");
  const help = useFirstGameHelp({
    enabled: progressLoaded && state.status === "playing",
    gameId: "anagramm",
    onAutomaticOpen: () => captureEvent(posthog, "help_opened", { gameId: "anagramm", dateKey, source: "automatic" }),
  });

  useEffect(() => {
    loadWordBucketSettings().then((settings) => setBucketPreset(getPreset(settings)));
  }, []);

  useEffect(() => {
    captureEvent(posthog, "screen_viewed", { screen: "anagramm", params: { dateKey } });
    captureEvent(posthog, "game_started", { gameId: "anagramm", dateKey });
  }, [dateKey, posthog]);

  useEffect(() => {
    loadProgress<AnagrammState>("anagramm", today).then((progress) => {
      completedAtRef.current = progress?.completedAt;
      completedStatusRef.current = progress?.completedStatus;
      setContinuedAfterLoss(Boolean(progress?.continuedAfterLoss && !progress.postLossCompletion));
      const restoredPuzzle = restoreAnagrammPuzzle(progress?.puzzle);
      if (isStartedProgress(progress) && restoredPuzzle && progress.state.puzzleId === restoredPuzzle.id) {
        setGame({ dateKey: progress.dateKey, puzzle: restoredPuzzle, state: progress.state });
        setState(progress.state);
      }
      setProgressLoaded(true);
    });
  }, [today]);

  useEffect(() => {
    if (!progressLoaded) return;
    const officialOutcome = continuedAfterLoss ? "lost" : state.status === "lost" ? "lost" : undefined;
    const completedAt = officialOutcome || state.status !== "playing" ? new Date().toISOString() : completedAtRef.current;
    const completedStatus = mergeCompletedStatus(completedStatusRef.current, officialOutcome ?? (state.status !== "playing" ? state.status : undefined));
    completedAtRef.current = completedAt;
    completedStatusRef.current = completedStatus;
    saveProgress({ gameId: "anagramm", dateKey, completedStatus, puzzle, puzzleId: puzzle.id, puzzleVersion: puzzle.version, status: state.status, state, completedAt, officialOutcome, continuedAfterLoss, officialLossAttemptCount: continuedAfterLoss ? puzzle.maxAttempts : undefined, solvedAfterLoss: continuedAfterLoss && state.status === "won", postLossCompletion: continuedAfterLoss && state.status === "won" ? "solved" : continuedAfterLoss && state.status === "revealed" ? "revealed" : undefined });
  }, [continuedAfterLoss, dateKey, progressLoaded, puzzle, state]);

  useEffect(() => {
    if (state.status !== "playing") loadProgressForGames(games.map((game) => game.id), dateKey).then((progress) => {
      updateBadgeCount(progress);
      scheduleDailyReminder().catch(() => {});
    });
  }, [dateKey, state.status]);

  const tileLayout = getWordTileLayout(puzzle.wordLength);
  const usedTiles = new Set(state.placedTileIndices.filter((index): index is number => index !== null));
  const draft = getAnagrammDraft(puzzle, state);
  const canSubmit = state.status === "playing" && state.placedTileIndices.every((index) => index !== null);
  const hintDisabled = state.status !== "playing" || getAnagrammHintPosition(puzzle, state) === null || (hintPolicy !== "ads" && !hintWallet.canConsume);
  const hintLabel = hintPolicy === "ads" ? "💡 Hinweis (Werbung)" : `💡 Hinweis (${hintWallet.wallet.balance}/3)`;

  function startStats() {
    stats.start({ gameId: "anagramm", playDate: dateKey, puzzleId: puzzle.id, gameVersion: puzzle.version, wordLength: puzzle.wordLength, difficulty: puzzle.difficulty });
  }

  function place(tileIndex: number) {
    const next = placeAnagrammTile(puzzle, state, tileIndex);
    if (next === state) return;
    selectionHaptic();
    setState(next);
  }

  function remove(slotIndex: number) {
    const next = removeAnagrammTile(state, slotIndex);
    if (next === state) return;
    selectionHaptic();
    setState(next);
  }

  async function useHint() {
    if (state.status !== "playing") return;
    const next = applyAnagrammHint(puzzle, state);
    if (next === state) { setMessage("Alle Positionen sind schon gelöst."); return; }
    let source = "earned";
    if (hintPolicy === "ads") {
      if (!await requestAdHint()) { setMessage("Werbung gerade nicht verfügbar."); return; }
      source = "ad";
    } else if (!await hintWallet.tryConsume()) { setMessage("Keine Hinweise verfügbar."); return; }
    startStats();
    setState(next);
    stats.recordHint({ source, gameId: "anagramm", fixedCount: next.fixedIndices.length, wordLength: puzzle.wordLength });
    captureEvent(posthog, "hint_used", { gameId: "anagramm", dateKey, source });
    setMessage("Hinweis: Buchstabe fixiert.");
  }

  function finish(result: Extract<ReturnType<typeof submitAnagrammGuess>, { ok: true }>) {
    const outcome = result.state.status;
    if (outcome === "lost") {
      stats.finish("lost");
      setFinishedAt(Date.now());
      setLossVisible(true);
    } else if (isFinishedGameStatus(outcome)) {
      if (continuedAfterLoss && outcome === "won") stats.finishAfterLoss("solved"); else stats.finish(outcome);
      setFinishedAt(Date.now());
      setResultVisible(true);
    }
    if (outcome === "won" || outcome === "lost" || outcome === "revealed") captureEvent(posthog, "game_completed", { gameId: "anagramm", dateKey, durationMs: elapsedSeconds * 1000, attempts: result.state.guesses.length, outcome, success: outcome === "won" && !continuedAfterLoss });
  }

  function submit() {
    startStats();
    const result = submitAnagrammGuess(puzzle, state, { ignoreAttemptLimit: continuedAfterLoss });
    setState(result.state);
    if (!result.ok) {
      stats.recordRejectedGuess(result.reason, draft);
      setMessage(rejectMessage(result.reason));
      setShakeTick((value) => value + 1);
      warningHaptic();
      return;
    }
    stats.recordAcceptedGuess(result.guess, { difficulty: puzzle.difficulty, wordLength: puzzle.wordLength, wrongAttempts: result.state.status === "won" ? result.state.guesses.length - 1 : result.state.guesses.length, fixedLetterCount: state.fixedIndices.length });
    setMessage(result.state.status === "won" ? "Gelöst!" : result.state.status === "lost" ? "Heute nicht gelöst." : "Nicht ganz – weiterprobieren.");
    if (result.state.status === "won") successHaptic();
    else if (result.state.status === "lost") warningHaptic();
    finish(result);
  }

  function reveal() {
    startStats();
    if (continuedAfterLoss) stats.finishAfterLoss("revealed"); else stats.finish("revealed");
    captureEvent(posthog, "solution_revealed", { gameId: "anagramm", dateKey, attempts: state.guesses.length });
    captureEvent(posthog, "game_completed", { gameId: "anagramm", dateKey, durationMs: elapsedSeconds * 1000, attempts: state.guesses.length, outcome: "revealed", success: false });
    setState((current) => revealAnagrammSolution(current));
    setGiveUpVisible(false);
    setFinishedAt(Date.now());
    setResultVisible(true);
  }

  function continueAfterLoss() {
    setState((current) => ({ ...current, status: "playing" }));
    setContinuedAfterLoss(true);
    setLossVisible(false);
    setFinishedAt(null);
    stats.continueAfterLoss(state.guesses.length);
    captureEvent(posthog, "game_continued_after_loss", { gameId: "anagramm", dateKey, attempts: state.guesses.length });
  }

  function nextGame() {
    const next = createNextAnagrammGame(puzzle.answer, today, bucketPreset);
    setGame(next); setState(next.state); setMessage(""); setResultVisible(false); setLossVisible(false); setContinuedAfterLoss(false); setFinishedAt(null); resetTimer();
  }

  function goBack() {
    if (state.status === "playing" && state.guesses.length > 0) captureEvent(posthog, "game_abandoned", { gameId: "anagramm", dateKey, attempts: state.guesses.length });
    if (router.canGoBack()) router.back(); else router.replace("/");
  }

  return (
    <GameScreenFrame
      actions={<View style={styles.actions}>{state.status === "playing" ? <SmallGameAction disabled={hintDisabled} label={hintLabel} onPress={useHint} /> : null}{state.status === "playing" ? <SmallGameAction label="Lösung anzeigen" onPress={() => setGiveUpVisible(true)} variant="reveal" /> : null}</View>}
      keyboard={{ disabled: state.status !== "playing", onBackspace: () => undefined, onLetter: () => undefined, onSubmit: submit, showBackspace: false, showLetters: false, showSubmit: true, submitDisabled: !canSubmit }}
      onBack={goBack}
      onHelp={() => { captureEvent(posthog, "help_opened", { gameId: "anagramm", dateKey, source: "manual" }); help.open(); }}
      progressLabel={continuedAfterLoss ? `${state.guesses.length} Versuche · frei` : `${state.guesses.length}/${puzzle.maxAttempts} Versuche`}
      subtitle={`${puzzle.wordLength} Buchstaben · ${difficultyLabel(puzzle.difficulty)}`}
      title="Anagramm"
    >
      <View style={styles.content}>
        <Text style={styles.label}>BUCHSTABEN</Text>
        <View style={[styles.tiles, { gap: tileLayout.gap + 3 }]}>
          {puzzle.shuffledLetters.map((letter, index) => <LetterTile disabled={state.status !== "playing" || usedTiles.has(index)} key={`${letter}-${index}`} label={letter} minHeight={tileLayout.minHeight + 10} onPress={() => place(index)} textSize={tileLayout.fontSize + 3} />)}
        </View>
        <Text style={styles.label}>LÖSUNG</Text>
        <ShakeView trigger={shakeTick}>
          <Animated.View layout={LinearTransition.springify().damping(18).stiffness(220)} style={[styles.tiles, { gap: tileLayout.gap }]}> 
            {state.placedTileIndices.map((tileIndex, index) => {
              const fixed = state.fixedIndices.includes(index);
              return <LetterTile disabled={tileIndex === null || fixed || state.status !== "playing"} fixed={fixed} key={index} label={tileIndex === null ? "" : puzzle.shuffledLetters[tileIndex]} minHeight={tileLayout.minHeight + 10} onPress={() => remove(index)} textSize={tileLayout.fontSize + 3} />;
            })}
          </Animated.View>
        </ShakeView>
        <Text style={styles.remaining}>{continuedAfterLoss ? "Fehler zählen nicht mehr." : `${Math.max(0, puzzle.maxAttempts - state.guesses.length)} Fehlversuche übrig`}</Text>
        {message ? <Animated.Text entering={FadeInDown.duration(tokens.motion.quick)} style={styles.message}>{message}</Animated.Text> : null}
      </View>
      <ConfirmModal confirmLabel="Lösung zeigen" message="Die Lösung wird angezeigt und die Runde zählt nicht als geschafft." onCancel={() => setGiveUpVisible(false)} onConfirm={reveal} title="Lösung anzeigen?" visible={giveUpVisible} />
      <ContinueAfterLossModal onContinue={continueAfterLoss} onGiveUp={reveal} visible={lossVisible} />
      <GameResultModal attempts={state.guesses.length} dateKey={dateKey} durationMs={elapsedSeconds * 1000} gameId="anagramm" guesses={state.guesses} message={state.status === "won" ? "Buchstaben sauber sortiert." : "Die Lösung ist raus. Noch eins?"} onFeedback={(rating) => captureEvent(posthog, "game_feedback_submitted", { gameId: "anagramm", dateKey, rating, outcome: state.status })} onHome={() => router.replace("/")} actionLabel={nextDailyKniffRoute ? "Nächster Tageskniff" : undefined} onNext={() => { setResultVisible(false); if (nextDailyKniffRoute) setTimeout(() => router.replace(nextDailyKniffRoute as never), 0); else nextGame(); }} onShare={() => captureEvent(posthog, "result_shared", { gameId: "anagramm", dateKey, scope: "game", outcome: state.status })} onViewed={() => captureEvent(posthog, "result_viewed", { gameId: "anagramm", dateKey, scope: "game", outcome: state.status, success: state.status === "won" })} outcome={state.status === "playing" ? undefined : state.status} shareText={buildSimpleShareText("Anagramm", dateKey, state.status, `${state.guesses.length} Versuche · ${elapsedSeconds} Sek.`)} solution={puzzle.answer} stats={[{ label: "Versuche", value: state.guesses.length }, { label: "Hinweise", value: state.fixedIndices.length }, { label: "Zeit", value: `${elapsedSeconds} Sek.` }]} success={state.status === "won"} title={state.status === "won" ? "Gelöst." : state.status === "lost" ? "Heute nicht gelöst." : "Aufgelöst."} visible={resultVisible && state.status !== "playing"} />
      <HelpModal {...gameHelp.anagramm} onClose={help.close} visible={help.visible} />
    </GameScreenFrame>
  );
}

function LetterTile({ disabled, fixed = false, label, minHeight, onPress, textSize }: { disabled: boolean; fixed?: boolean; label: string; minHeight: number; onPress: () => void; textSize: number }) {
  const disabledProgress = useSharedValue(disabled ? 1 : 0);
  const fixedProgress = useSharedValue(fixed ? 1 : 0);
  useEffect(() => {
    disabledProgress.value = withTiming(disabled ? 1 : 0, { duration: tokens.motion.quick });
    fixedProgress.value = withSpring(fixed ? 1 : 0, { damping: 18, stiffness: 220 });
  }, [disabled, disabledProgress, fixed, fixedProgress]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: label ? 1 - disabledProgress.value * 0.72 : 1,
    transform: [{ scale: 1 + fixedProgress.value * 0.035 }],
  }));
  if (fixed) {
    return <HintableLetterTile accessibilityLabel={`Buchstabe ${label.toLocaleUpperCase("de-DE")}, per Hinweis fixiert`} disabled={disabled} letter={label} mark="correct" minHeight={minHeight} onPress={onPress} textSize={textSize} />;
  }

  return <Pressable accessibilityLabel={label ? `Buchstabe ${label.toLocaleUpperCase("de-DE")}` : "Leeres Lösungsfeld"} accessibilityRole="button" disabled={disabled} onPress={onPress} style={styles.tilePressable}><Animated.View style={[styles.tile, { minHeight }, animatedStyle]}><Text style={[styles.tileText, { fontSize: textSize }]}>{label.toLocaleUpperCase("de-DE")}</Text></Animated.View></Pressable>;
}

function difficultyLabel(difficulty: "easy" | "medium" | "hard") { return difficulty === "easy" ? "leicht" : difficulty === "medium" ? "mittel" : "schwer"; }

const styles = StyleSheet.create({
  actions: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  content: { flex: 1, gap: tokens.space.md, justifyContent: "center" },
  label: { color: tokens.color.muted, fontFamily: tokens.font.ui.semibold, fontSize: 11, letterSpacing: 1, textAlign: "center" },
  tiles: { flexDirection: "row", justifyContent: "center" },
  tilePressable: { flex: 1, minWidth: 0 },
  tile: { alignItems: "center", backgroundColor: tokens.surface.control, borderColor: tokens.border.control, borderRadius: tokens.radius.sm, borderWidth: 2, flex: 1, justifyContent: "center", minWidth: 0 },
  tileText: { color: tokens.color.ink, ...tokens.typography.gameLetter },
  remaining: { color: tokens.color.muted, fontFamily: tokens.font.ui.semibold, fontSize: tokens.type.body, textAlign: "center" },
  message: { color: tokens.color.ink, fontFamily: tokens.font.ui.semibold, fontSize: tokens.type.body, textAlign: "center" },
});
