import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, LinearTransition, interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { ConfirmModal } from "@/components/ConfirmModal";
import { GameResultModal } from "@/components/GameResultModal";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { HelpModal } from "@/components/HelpModal";
import { ShakeView } from "@/components/ShakeView";
import { SmallGameAction } from "@/components/SmallGameAction";
import { getBerlinDateKey } from "@/daily/date";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { BucketPreset } from "@/games/wordBuckets";
import { createNextWortschmelzeGame, restoreWortschmelzePuzzle } from "@/games/wortschmelze/daily";
import { submitWortschmelzeGuess } from "@/games/wortschmelze/engine";
import type { WortschmelzeState } from "@/games/wortschmelze/types";
import { getWorttrefferLetterStates, revealWorttrefferSolution } from "@/games/worttreffer/engine";
import { getWordTileLayout } from "@/games/wordTileLayout";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { updateBadgeCount } from "@/notifications/badge";
import { isStartedProgress, loadProgress, loadProgressForGames, saveProgress, type StoredProgress } from "@/storage/progress";
import { getPreset, loadWordBucketSettings } from "@/storage/wordBuckets";
import { isFinishedGameStatus, useGameRecorder } from "@/stats/recorder";

type WortschmelzeGame = ReturnType<typeof createNextWortschmelzeGame>;
type TileMark = "absent" | "present" | "correct";

const GAME_ID = "wortschmelze";
const TILE_REVEAL_DELAY_MS = 100;
const TILE_REVEAL_DURATION_MS = 320;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function createEmptyInput(length: number) {
  return Array.from({ length }, () => "");
}

export default function WortschmelzeScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const today = getBerlinDateKey();
  const stats = useGameRecorder();
  const completedAtRef = useRef<string | undefined>(undefined);
  const completedStatusRef = useRef<StoredProgress["status"] | undefined>(undefined);
  const revealDoneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bucketPreset, setBucketPreset] = useState<BucketPreset>("klassisch");
  const [game, setGame] = useState<WortschmelzeGame>(() => createNextWortschmelzeGame(undefined, today, "klassisch"));
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<WortschmelzeState>(game.state);
  const [inputLetters, setInputLetters] = useState(() => createEmptyInput(game.puzzle.wordLength));
  const [cursorIndex, setCursorIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [shakeTick, setShakeTick] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);
  const [giveUpVisible, setGiveUpVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [revealingGuessIndex, setRevealingGuessIndex] = useState<number | null>(null);
  const { elapsedSeconds, reset: resetTimer } = useActiveTimer(state.status === "playing", finishedAt);

  useEffect(() => {
    loadWordBucketSettings().then((settings) => setBucketPreset(getPreset(settings)));
    return () => {
      if (revealDoneTimeoutRef.current) clearTimeout(revealDoneTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    try {
      posthog.capture("screen_viewed", { screen: GAME_ID, params: { dateKey } });
      posthog.capture("game_started", { gameId: GAME_ID, dateKey });
    } catch {}
  }, [dateKey, posthog]);

  useEffect(() => {
    loadProgress<WortschmelzeState>(GAME_ID, today).then((progress) => {
      completedAtRef.current = progress?.completedAt;
      completedStatusRef.current = progress?.completedStatus;
      const restoredPuzzle = restoreWortschmelzePuzzle(progress?.puzzle);
      if (isStartedProgress(progress) && restoredPuzzle && progress.state.puzzleId === restoredPuzzle.id) {
        const nextGame = { dateKey: progress.dateKey, puzzle: restoredPuzzle, state: progress.state };
        setGame(nextGame);
        setState(progress.state);
        const draft = Array.isArray(progress.draft) ? progress.draft.map(String).slice(0, nextGame.puzzle.wordLength) : [];
        setInputLetters(draft.length === nextGame.puzzle.wordLength ? draft : createEmptyInput(nextGame.puzzle.wordLength));
        const firstEmpty = draft.findIndex((letter) => !letter);
        if (firstEmpty >= 0) setCursorIndex(firstEmpty);
      }
      setProgressLoaded(true);
    });
  }, [today]);

  useEffect(() => {
    if (!progressLoaded) return;
    const completedAt = state.status !== "playing" ? new Date().toISOString() : completedAtRef.current;
    const completedStatus = state.status !== "playing" ? state.status : completedStatusRef.current;
    completedAtRef.current = completedAt;
    completedStatusRef.current = completedStatus;
    saveProgress({ gameId: GAME_ID, dateKey, draft: inputLetters, completedStatus, puzzle, puzzleId: puzzle.id, puzzleVersion: puzzle.version, status: state.status, state, completedAt });
  }, [dateKey, inputLetters, progressLoaded, puzzle, state]);

  useEffect(() => {
    if (state.status !== "playing") loadProgressForGames(games.map((game) => game.id), dateKey).then(updateBadgeCount);
  }, [dateKey, state.status]);

  const canSubmit = inputLetters.every(Boolean) && state.status === "playing";
  const letterStates = getWorttrefferLetterStates(state);
  const tileLayout = getWordTileLayout(puzzle.wordLength);
  const visibleRows = state.guesses.length + (state.status === "playing" && revealingGuessIndex === null ? 1 : 0);
  const usedLetters = new Set(state.guesses.flatMap((guess) => Array.from(guess.value))).size;

  function addLetter(letter: string) {
    if (state.status !== "playing") return;
    setInputLetters((current) => current.map((item, index) => (index === cursorIndex ? letter : item)));
    setCursorIndex((current) => Math.min(current + 1, puzzle.wordLength - 1));
  }

  function backspace() {
    setInputLetters((current) => {
      if (current[cursorIndex]) return current.map((item, index) => (index === cursorIndex ? "" : item));
      const previousIndex = Math.max(cursorIndex - 1, 0);
      setCursorIndex(previousIndex);
      return current.map((item, index) => (index === previousIndex ? "" : item));
    });
  }

  function startStats() {
    stats.start({ gameId: GAME_ID, playDate: dateKey, puzzleId: puzzle.id, gameVersion: puzzle.version, wordLength: puzzle.wordLength });
  }

  function submit() {
    startStats();
    const result = submitWortschmelzeGuess(puzzle, state, inputLetters.join(""));
    if (revealDoneTimeoutRef.current) clearTimeout(revealDoneTimeoutRef.current);
    setState(result.state);
    setMessage(result.ok ? result.state.status === "won" ? "Verschmolzen!" : result.state.status === "lost" ? "Heute nicht geschmolzen." : "" : result.reason);

    if (!result.ok) {
      stats.recordRejectedGuess(result.reason, inputLetters.join(""));
      setShakeTick((value) => value + 1);
      return;
    }

    stats.recordAcceptedGuess(result.guess.value, { marks: [...result.guess.marks], left: puzzle.left, right: puzzle.right, overlap: puzzle.overlap });
    const nextGuessIndex = result.state.guesses.length - 1;
    setRevealingGuessIndex(nextGuessIndex);
    setInputLetters(createEmptyInput(puzzle.wordLength));
    setCursorIndex(0);

    const revealDuration = puzzle.wordLength * TILE_REVEAL_DELAY_MS + TILE_REVEAL_DURATION_MS;
    revealDoneTimeoutRef.current = setTimeout(() => {
      setRevealingGuessIndex(null);
      if (isFinishedGameStatus(result.state.status)) {
        stats.finish(result.state.status);
        setFinishedAt(Date.now());
        setResultVisible(true);
        try {
          posthog.capture("game_completed", { gameId: GAME_ID, dateKey, durationMs: elapsedSeconds * 1000, attempts: result.state.guesses.length });
        } catch {}
      }
    }, revealDuration);
  }

  function reveal() {
    if (revealDoneTimeoutRef.current) clearTimeout(revealDoneTimeoutRef.current);
    startStats();
    stats.finish("revealed");
    setState((current) => revealWorttrefferSolution(current));
    setMessage("Lösung aufgedeckt.");
    setInputLetters(createEmptyInput(puzzle.wordLength));
    setCursorIndex(0);
    setGiveUpVisible(false);
    setFinishedAt(Date.now());
    setResultVisible(true);
    setRevealingGuessIndex(null);
  }

  function startNextWord() {
    const nextGame = createNextWortschmelzeGame(puzzle.answer, today, bucketPreset);
    if (revealDoneTimeoutRef.current) clearTimeout(revealDoneTimeoutRef.current);
    setGame(nextGame);
    setState(nextGame.state);
    setInputLetters(createEmptyInput(nextGame.puzzle.wordLength));
    setCursorIndex(0);
    setMessage("");
    setResultVisible(false);
    setFinishedAt(null);
    setProgressLoaded(true);
    setRevealingGuessIndex(null);
    resetTimer();
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  const solution = `${puzzle.left.toUpperCase()} + ${puzzle.right.toUpperCase()} = ${puzzle.answer.toUpperCase()}`;

  return (
    <GameScreenFrame
      actions={state.status === "playing" ? <SmallGameAction label="Lösung anzeigen" onPress={() => setGiveUpVisible(true)} /> : null}
      keyboard={{ disabled: state.status !== "playing", letterStates, onBackspace: backspace, onLetter: addLetter, onSubmit: submit, submitDisabled: !canSubmit }}
      onBack={goBack}
      onHelp={() => setHelpVisible(true)}
      subtitle={`${dateKey} · 5+5 → 8 Buchstaben`}
      title="Wortschmelze"
    >
      <View style={styles.wrap}>
        <View style={styles.board}>
          {Array.from({ length: visibleRows }).map((_, rowIndex) => {
            const guess = state.guesses[rowIndex];
            const inputRow = state.status === "playing" && rowIndex === state.guesses.length;
            const letters = guess ? Array.from(guess.value) : inputRow ? inputLetters : createEmptyInput(puzzle.wordLength);
            const rowContent = (
              <Animated.View entering={FadeInDown.duration(tokens.motion.quick)} key={rowIndex} layout={LinearTransition.springify().damping(16)} style={[styles.tileRow, { gap: tileLayout.gap }]}> 
                {letters.map((letter, letterIndex) => {
                  const mark = guess?.marks[letterIndex];
                  return (
                    <AnimatedWortschmelzeTile
                      disabled={Boolean(guess) || !inputRow || state.status !== "playing"}
                      key={`${rowIndex}-${letterIndex}`}
                      letter={letter}
                      mark={mark}
                      minHeight={tileLayout.minHeight}
                      onPress={() => setCursorIndex(letterIndex)}
                      revealed={Boolean(mark) && rowIndex !== revealingGuessIndex}
                      revealDelay={letterIndex * TILE_REVEAL_DELAY_MS}
                      revealing={Boolean(mark) && rowIndex === revealingGuessIndex}
                      selected={inputRow && letterIndex === cursorIndex}
                      textSize={tileLayout.fontSize}
                    />
                  );
                })}
              </Animated.View>
            );
            return inputRow ? <ShakeView key={rowIndex} trigger={shakeTick}>{rowContent}</ShakeView> : rowContent;
          })}
        </View>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {state.status === "lost" || state.status === "revealed" ? <Text style={styles.answer}>{solution}</Text> : null}
      </View>
      <ConfirmModal confirmLabel="Lösung zeigen" message="Die Lösung wird angezeigt und die Runde zählt nicht als geschafft." onCancel={() => setGiveUpVisible(false)} onConfirm={reveal} title="Lösung anzeigen?" visible={giveUpVisible} />
      <GameResultModal
        guesses={state.guesses.map((guess) => guess.value)}
        message={state.status === "won" ? "Sauber, die Wörter sind verschmolzen." : "Die Lösung ist raus. Noch eins?"}
        onHome={() => router.replace("/")}
        onNext={startNextWord}
        solution={solution}
        stats={[{ label: "Versuche", value: state.guesses.length }, { label: "Zeit", value: `${elapsedSeconds} Sek.` }, { label: "Buchstaben", value: usedLetters }]}
        title={state.status === "won" ? "Stark geschmolzen." : state.status === "lost" ? "Nicht geschmolzen." : "Aufgelöst."}
        visible={resultVisible && state.status !== "playing"}
      />
      <HelpModal {...gameHelp.wortschmelze} onClose={() => setHelpVisible(false)} visible={helpVisible} />
    </GameScreenFrame>
  );
}

type AnimatedWortschmelzeTileProps = {
  disabled: boolean;
  letter: string;
  mark?: TileMark;
  minHeight: number;
  onPress: () => void;
  revealed: boolean;
  revealDelay: number;
  revealing: boolean;
  selected: boolean;
  textSize: number;
};

function markColor(mark?: TileMark) {
  if (mark === "correct") return tokens.color.success;
  if (mark === "present") return "#D98500";
  if (mark === "absent") return "#7B736A";
  return "rgba(255,255,255,0.5)";
}

function AnimatedWortschmelzeTile({ disabled, letter, mark, minHeight, onPress, revealed, revealDelay, revealing, selected, textSize }: AnimatedWortschmelzeTileProps) {
  const targetColor = markColor(mark);
  const progress = useSharedValue(revealed ? 1 : 0);

  useEffect(() => {
    if (revealing) {
      progress.value = 0;
      progress.value = withDelay(revealDelay, withTiming(1, { duration: TILE_REVEAL_DURATION_MS }));
      return;
    }
    progress.value = revealed ? 1 : 0;
  }, [progress, revealDelay, revealed, revealing]);

  const tileStyle = useAnimatedStyle(() => {
    const baseBorder = selected ? tokens.color.primary : tokens.color.line;
    const baseBg = selected ? tokens.color.primaryLight : "rgba(255,255,255,0.5)";
    return {
      backgroundColor: interpolateColor(progress.value, [0, 0.5, 1], [baseBg, baseBg, targetColor]),
      borderColor: interpolateColor(progress.value, [0, 0.5, 1], [baseBorder, baseBorder, targetColor]),
      transform: [{ scaleY: interpolate(progress.value, [0, 0.5, 1], [1, 0.08, 1]) }],
    };
  });
  const textStyle = useAnimatedStyle(() => ({ color: interpolateColor(progress.value, [0, 0.5, 1], [tokens.color.ink, tokens.color.ink, mark ? "white" : tokens.color.ink]) }));

  return (
    <AnimatedPressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.tile, { minHeight }, tileStyle]}>
      <Animated.Text style={[styles.tileText, { fontSize: textSize }, textStyle]}>{letter.trim().toLocaleUpperCase("de-DE")}</Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.sm },
  board: { flex: 1, gap: 5, justifyContent: "flex-start" },
  tileRow: { flexDirection: "row" },
  tile: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.sm,
    borderWidth: 2,
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  tileText: { color: tokens.color.ink, fontWeight: "900" },
  message: { color: tokens.color.muted, fontSize: tokens.type.body, textAlign: "center" },
  answer: { color: tokens.color.ink, fontSize: tokens.type.body, fontWeight: "900", textAlign: "center" },
});
