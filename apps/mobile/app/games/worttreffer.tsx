import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { ConfirmModal } from "@/components/ConfirmModal";
import { captureEvent } from "@/analytics/events";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { GameResultModal } from "@/components/GameResultModal";
import { HelpModal } from "@/components/HelpModal";
import { ShakeView } from "@/components/ShakeView";
import { SmallGameAction } from "@/components/SmallGameAction";
import { getBerlinDateKey } from "@/daily/date";
import { useNextOpenDailyKniff } from "@/dailyKniffe/continuation";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import {
  createNextWorttrefferGame,
  restoreWorttrefferPuzzle,
} from "@/games/worttreffer/daily";
import {
  applyWorttrefferHint,
  getWorttrefferLetterStates,
  getWorttrefferRevealedLetters,
  revealWorttrefferSolution,
  submitWorttrefferGuess,
} from "@/games/worttreffer/engine";
import { WorttrefferState } from "@/games/worttreffer/types";
import { getWordTileLayout } from "@/games/wordTileLayout";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { updateBadgeCount } from "@/notifications/badge";
import { scheduleDailyReminder } from "@/notifications/scheduler";
import { useHintWallet } from "@/hints/useHintWallet";
import { getHintPolicy, requestAdHint } from "@/hints/policy";
import {
  isStartedProgress,
  loadProgress,
  loadProgressForGames,
  mergeCompletedStatus,
  saveProgress,
  type StoredProgress,
} from "@/storage/progress";
import { BucketPreset } from "@/games/wordBuckets";
import { getPreset, loadWordBucketSettings } from "@/storage/wordBuckets";
import { isFinishedGameStatus, useGameRecorder } from "@/stats/recorder";
import { usePacksSettings } from "@/hooks/usePacksSettings";
import { buildMarkedGridShareText } from "@/games/share/grid";
import { rejectMessage } from "@/games/rejectMessages";

type WorttrefferGame = ReturnType<typeof createNextWorttrefferGame>;
type TileMark = "absent" | "present" | "correct";

const TILE_REVEAL_DELAY_MS = 120;
const TILE_REVEAL_DURATION_MS = 360;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function createEmptyInput(length: number) {
  return Array.from({ length }, () => "");
}

export default function WorttrefferScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const today = getBerlinDateKey();
  const stats = useGameRecorder();
  const completedAtRef = useRef<string | undefined>(undefined);
  const completedStatusRef = useRef<StoredProgress["status"] | undefined>(undefined);
  const [bucketPreset, setBucketPreset] = useState<BucketPreset>("klassisch");
  const { packs } = usePacksSettings();
  const [game, setGame] = useState<WorttrefferGame>(() => createNextWorttrefferGame(undefined, today, "klassisch"));

  useEffect(() => {
    loadWordBucketSettings().then((s) => setBucketPreset(getPreset(s)));
  }, []);
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<WorttrefferState>(game.state);
  const [inputLetters, setInputLetters] = useState(() =>
    createEmptyInput(game.puzzle.wordLength),
  );
  const [cursorIndex, setCursorIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [shakeTick, setShakeTick] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);
  const [giveUpVisible, setGiveUpVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const { elapsedSeconds, reset: resetTimer } = useActiveTimer(state.status === "playing", finishedAt);
  const [revealingGuessIndex, setRevealingGuessIndex] = useState<number | null>(null);
  const revealDoneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintWallet = useHintWallet();
  const hintPolicy = getHintPolicy();
  const revealedLetters = getWorttrefferRevealedLetters(puzzle, state);

  useEffect(() => {
    return () => {
      if (revealDoneTimeoutRef.current) clearTimeout(revealDoneTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    captureEvent(posthog, "screen_viewed", { screen: "worttreffer", params: { dateKey } });
    captureEvent(posthog, "game_started", { gameId: "worttreffer", dateKey });
  }, [dateKey, posthog]);

  useEffect(() => {
    loadProgress<WorttrefferState>("worttreffer", today).then((progress) => {
      completedAtRef.current = progress?.completedAt;
      completedStatusRef.current = progress?.completedStatus;
      const restoredPuzzle = restoreWorttrefferPuzzle(progress?.puzzle);
      if (isStartedProgress(progress) && restoredPuzzle && progress.state.puzzleId === restoredPuzzle.id) {
        const nextGame = { dateKey: progress.dateKey, puzzle: restoredPuzzle, state: progress.state };
        setGame(nextGame);
        setState(progress.state);
        const draft = Array.isArray(progress.draft) ? progress.draft.map(String).slice(0, nextGame.puzzle.wordLength) : [];
        const base = draft.length === nextGame.puzzle.wordLength ? draft : createEmptyInput(nextGame.puzzle.wordLength);
        setInputLetters(base);
        const firstEmpty = base.findIndex((ch) => !ch);
        if (firstEmpty >= 0) setCursorIndex(firstEmpty);
      }
      setProgressLoaded(true);
    });
  }, [today]);

  useEffect(() => {
    if (!progressLoaded) return;

    const completedAt = state.status !== "playing" ? new Date().toISOString() : completedAtRef.current;
    const completedStatus = mergeCompletedStatus(completedStatusRef.current, state.status !== "playing" ? state.status : undefined);
    completedAtRef.current = completedAt;
    completedStatusRef.current = completedStatus;
    saveProgress({
      gameId: "worttreffer",
      dateKey,
      draft: inputLetters,
      completedStatus,
      puzzle,
      puzzleId: puzzle.id,
      puzzleVersion: puzzle.version,
      status: state.status,
      state,
      completedAt,
    });
  }, [dateKey, inputLetters, progressLoaded, puzzle, state]);

  useEffect(() => {
    if (state.status !== "playing") {
      loadProgressForGames(
        games.map((g) => g.id),
        dateKey,
      ).then((progress) => {
        updateBadgeCount(progress);
        scheduleDailyReminder().catch(() => {});
      });
    }
  }, [state.status, dateKey]);

  const canSubmit = inputLetters.every(Boolean) && state.status === "playing";
  const letterStates = getWorttrefferLetterStates(state);
  const tileLayout = getWordTileLayout(puzzle.wordLength);
  const visibleRows = state.guesses.length + (state.status === "playing" && revealingGuessIndex === null ? 1 : 0);
  const nextDailyKniffRoute = useNextOpenDailyKniff("worttreffer", dateKey, state.status === "won");

  function addLetter(letter: string) {
    if (state.status !== "playing") return;
    setInputLetters((current) => current.map((item, index) => (index === cursorIndex ? letter : item)));
    setCursorIndex((current) => Math.min(current + 1, puzzle.wordLength - 1));
  }

  function backspace() {
    setInputLetters((current) => {
      if (current[cursorIndex]) {
        return current.map((item, index) => (index === cursorIndex ? "" : item));
      }
      const previousIndex = Math.max(cursorIndex - 1, 0);
      setCursorIndex(previousIndex);
      return current.map((item, index) => (index === previousIndex ? "" : item));
    });
  }

  async function useHint() {
    if (state.status !== "playing") return;
    // ad policy branch – later shows ad, today falls through to wallet check
    if (hintPolicy === "ads") {
      const ok = await requestAdHint();
      if (!ok) {
        setMessage("Werbung gerade nicht verfügbar.");
        return;
      }
      // ad succeeded -> grant without wallet
      const next = applyWorttrefferHint(puzzle, state);
      if (next === state) {
        setMessage("Alle Buchstaben schon aufgedeckt.");
        return;
      }
      setState(next);
      stats.recordHint({ source: "ad", gameId: "worttreffer" });
      captureEvent(posthog, "hint_used", { gameId: "worttreffer", dateKey, source: "ad" });
      setMessage("Hinweis aufgedeckt.");
      return;
    }

    if (!hintWallet.canConsume) {
      setMessage(
        hintWallet.wallet.balance >= 3 ? "Hinweis-Lager voll (3/3)." : `Keine Hinweise. Gewinne noch ${3 - hintWallet.wallet.winsSinceLastHint} Runden.`,
      );
      return;
    }
    const next = applyWorttrefferHint(puzzle, state);
    if (next === state) {
      setMessage("Alle Buchstaben schon aufgedeckt.");
      return;
    }
    const consumed = await hintWallet.tryConsume();
    if (!consumed) {
      setMessage("Keine Hinweise verfügbar.");
      return;
    }
    setState(next);
    startStats();
    stats.recordHint({ source: "earned", gameId: "worttreffer", revealedCount: next.revealedIndices?.length });
    captureEvent(posthog, "hint_used", { gameId: "worttreffer", dateKey, source: "earned" });
    setMessage("Hinweis: Buchstabe aufgedeckt.");
  }

  function startStats() {
    stats.start({ gameId: "worttreffer", playDate: dateKey, puzzleId: puzzle.id, gameVersion: puzzle.version, wordLength: puzzle.wordLength });
  }

  async function submit() {
    startStats();
    const result = submitWorttrefferGuess(puzzle, state, inputLetters.join(""));

    if (revealDoneTimeoutRef.current) clearTimeout(revealDoneTimeoutRef.current);
    setState(result.state);
    setMessage(
      result.ok
        ? result.state.status === "won"
          ? "Getroffen!"
          : result.state.status === "lost"
            ? "Heute nicht getroffen."
            : ""
        : rejectMessage(result.reason),
    );
    if (result.ok) {
      stats.recordAcceptedGuess(result.guess.value, { marks: [...result.guess.marks] });
      const nextGuessIndex = result.state.guesses.length - 1;

      setRevealingGuessIndex(nextGuessIndex);
      setInputLetters(createEmptyInput(puzzle.wordLength));
      setCursorIndex(0);
    } else {
      stats.recordRejectedGuess(result.reason, inputLetters.join(""));
      setShakeTick((value) => value + 1);
    }
    if (result.ok && isFinishedGameStatus(result.state.status)) {
      const outcome = result.state.status;

      stats.finish(result.state.status);
      if (result.state.status === "won") {
        // earn hint: 3 wins -> +1
        hintWallet.onWin().then((granted) => {
          if (granted) setMessage("Hinweis erhalten! 💡");
          try {
            posthog.capture(granted ? "hint_earned" : "hint_progress", {
              gameId: "worttreffer",
              dateKey,
              winsSinceLastHint: hintWallet.wallet.winsSinceLastHint,
            });
          } catch {}
        });
      }
      const revealDuration = puzzle.wordLength * TILE_REVEAL_DELAY_MS + TILE_REVEAL_DURATION_MS;

      revealDoneTimeoutRef.current = setTimeout(() => {
        setRevealingGuessIndex(null);
        setFinishedAt(Date.now());
        setResultVisible(true);
        captureEvent(posthog, "game_completed", {
          gameId: "worttreffer",
          dateKey,
          durationMs: elapsedSeconds * 1000,
          attempts: result.state.guesses.length,
          outcome,
          success: outcome === "won",
        });
      }, revealDuration);
    } else if (result.ok) {
      const revealDuration = puzzle.wordLength * TILE_REVEAL_DELAY_MS + TILE_REVEAL_DURATION_MS;

      revealDoneTimeoutRef.current = setTimeout(() => {
        setRevealingGuessIndex(null);
      }, revealDuration);
    }
  }

  function reveal() {
    if (revealDoneTimeoutRef.current) clearTimeout(revealDoneTimeoutRef.current);
    startStats();
    stats.finish("revealed");
    captureEvent(posthog, "solution_revealed", { gameId: "worttreffer", dateKey, attempts: state.guesses.length });
    captureEvent(posthog, "game_completed", {
      gameId: "worttreffer",
      dateKey,
      durationMs: elapsedSeconds * 1000,
      attempts: state.guesses.length,
      outcome: "revealed",
      success: false,
    });
    setRevealingGuessIndex(null);
    setState((current) => revealWorttrefferSolution(current));
    setMessage("Lösung aufgedeckt.");
    setInputLetters(createEmptyInput(puzzle.wordLength));
    setCursorIndex(0);
    setGiveUpVisible(false);
    setFinishedAt(Date.now());
    setResultVisible(true);
  }

  function startNextWord() {
    const nextGame = createNextWorttrefferGame(puzzle.answer, today, bucketPreset, packs);

    if (revealDoneTimeoutRef.current) clearTimeout(revealDoneTimeoutRef.current);
    setGame(nextGame);
    setState(nextGame.state);
    setInputLetters(createEmptyInput(nextGame.puzzle.wordLength));
    setCursorIndex(0);
    setMessage("");
    setResultVisible(false);
    setFinishedAt(null);
    setProgressLoaded(true);
    resetTimer();
    setRevealingGuessIndex(null);
  }

  function resultTitle() {
    if (state.status === "won") return "Stark getroffen.";
    if (state.status === "lost") return "Heute nicht getroffen.";

    return "Aufgelöst.";
  }

  function goBack() {
    if (state.status === "playing" && state.guesses.length > 0) {
      captureEvent(posthog, "game_abandoned", { gameId: "worttreffer", dateKey, attempts: state.guesses.length });
    }
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  const hintDisabled = state.status !== "playing" || (hintPolicy !== "ads" && !hintWallet.canConsume);
  const hintLabel = hintPolicy === "ads" ? "💡 Hinweis (Werbung)" : `💡 Hinweis (${hintWallet.wallet.balance}/3)`;

  return (
    <GameScreenFrame
      actions={
          <View style={{ flexDirection: "row", flexShrink: 1, flexWrap: "wrap", gap: tokens.space.sm, alignItems: "center", justifyContent: "center" }}>
          {state.status === "playing" ? (
            <SmallGameAction disabled={hintDisabled} label={hintLabel} onPress={useHint} />
          ) : null}
          {state.status === "playing" ? <SmallGameAction label="Lösung anzeigen" onPress={() => setGiveUpVisible(true)} /> : null}
        </View>
      }
      keyboard={{
        disabled: state.status !== "playing",
        letterStates,
        onBackspace: backspace,
        onLetter: addLetter,
        onSubmit: submit,
        submitDisabled: !canSubmit,
      }}
      onBack={goBack}
      onHelp={() => {
        captureEvent(posthog, "help_opened", { gameId: "worttreffer", dateKey });
        setHelpVisible(true);
      }}
      progressLabel={`${state.guesses.length}/${puzzle.maxAttempts} Versuche`}
      subtitle={`${puzzle.wordLength} Buchstaben`}
      title="Worttreffer"
    >
      <View style={styles.wrap}>
        <View style={styles.board}>
          {Array.from({ length: visibleRows }).map((_, rowIndex) => {
            const guess = state.guesses[rowIndex];
            const inputRow = state.status === "playing" && rowIndex === state.guesses.length;
            const letters = guess ? Array.from(guess.value) : inputRow ? inputLetters : createEmptyInput(puzzle.wordLength);

            const rowContent = (
              <Animated.View
                entering={FadeInDown.duration(tokens.motion.quick)}
                key={rowIndex}
                layout={LinearTransition.springify().damping(16)}
                style={[styles.tileRow, { gap: tileLayout.gap }]}
              >
                {letters.map((letter, letterIndex) => {
                  const mark = guess?.marks[letterIndex];
                  const placeholder = inputRow && !letter ? revealedLetters[letterIndex] : null;

                  return (
                    <AnimatedWorttrefferTile
                      accessibilityRole="button"
                      disabled={
                        Boolean(guess) ||
                        !inputRow ||
                        state.status !== "playing"
                      }
                      key={`${rowIndex}-${letterIndex}`}
                      letter={letter}
                      mark={mark}
                      minHeight={tileLayout.minHeight}
                      onPress={() => setCursorIndex(letterIndex)}
                      placeholder={placeholder}
                      revealed={Boolean(mark) && rowIndex !== revealingGuessIndex}
                      revealDelay={letterIndex * TILE_REVEAL_DELAY_MS}
                      revealing={Boolean(mark) && rowIndex === revealingGuessIndex}
                      selected={inputRow && !guess && letterIndex === cursorIndex}
                      textSize={tileLayout.fontSize}
                    />
                  );
                })}
              </Animated.View>
            );

            if (inputRow) {
              return (
                <ShakeView key={rowIndex} trigger={shakeTick}>
                  {rowContent}
                </ShakeView>
              );
            }

            return rowContent;
          })}
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
      <ConfirmModal
        confirmLabel="Lösung zeigen"
        message="Die Lösung wird angezeigt und die Runde zählt nicht als geschafft."
        onCancel={() => setGiveUpVisible(false)}
        onConfirm={reveal}
        title="Lösung anzeigen?"
        visible={giveUpVisible}
      />
      <GameResultModal
        attempts={state.guesses.length}
        dateKey={dateKey}
        durationMs={elapsedSeconds * 1000}
        gameId="worttreffer"
        guesses={state.guesses.map((guess) => guess.value)}
        message={
          state.status === "won"
            ? "Sauber, das war das Wort."
            : "Die Lösung ist raus. Weiteres Wort?"
        }
        onFeedback={(rating) => captureEvent(posthog, "game_feedback_submitted", { gameId: "worttreffer", dateKey, rating, outcome: state.status })}
        onHome={() => router.replace("/")}
        actionLabel={nextDailyKniffRoute ? "Nächster Tageskniff" : undefined}
        onNext={() => nextDailyKniffRoute ? router.push(nextDailyKniffRoute as never) : startNextWord()}
        onShare={() => captureEvent(posthog, "result_shared", { gameId: "worttreffer", dateKey, scope: "game", outcome: state.status })}
        onViewed={() => captureEvent(posthog, "result_viewed", { gameId: "worttreffer", dateKey, scope: "game", outcome: state.status, success: state.status === "won" })}
        outcome={state.status === "playing" ? undefined : state.status}
        shareRows={state.guesses.map((guess) => ({ guess: guess.value, marks: guess.marks }))}
        shareText={buildMarkedGridShareText("Worttreffer", dateKey, state.status, state.guesses.map((guess) => ({ guess: guess.value, marks: guess.marks })), puzzle.answer)}
        solution={puzzle.answer}
        success={state.status === "won"}
        stats={[
          { label: "Versuche", value: state.guesses.length },
          { label: "Zeit", value: `${elapsedSeconds} Sek.` },
        ]}
        title={resultTitle()}
        visible={resultVisible && state.status !== "playing"}
      />
      <HelpModal
        {...gameHelp.worttreffer}
        onClose={() => setHelpVisible(false)}
        visible={helpVisible}
      />
    </GameScreenFrame>
  );
}

type AnimatedWorttrefferTileProps = {
  accessibilityRole: "button";
  disabled: boolean;
  letter: string;
  mark?: TileMark;
  minHeight: number;
  onPress: () => void;
  placeholder?: string | null;
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

  return tokens.surface.input;
}

function AnimatedWorttrefferTile({ accessibilityRole, disabled, letter, mark, minHeight, onPress, placeholder, revealed, revealDelay, revealing, selected, textSize }: AnimatedWorttrefferTileProps) {
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
    const baseBg = selected ? tokens.color.primaryLight : tokens.surface.input;
    const endBorder = selected ? tokens.color.primary : targetColor;
    const endBg = selected ? tokens.color.primaryLight : targetColor;
    const backgroundColor = interpolateColor(progress.value, [0, 0.5, 1], [baseBg, baseBg, endBg]);
    const borderColor = interpolateColor(progress.value, [0, 0.5, 1], [baseBorder, baseBorder, endBorder]);
    const scaleY = interpolate(progress.value, [0, 0.5, 1], [1, 0.08, 1]);

    return { backgroundColor, borderColor, transform: [{ scaleY }] };
  });

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(progress.value, [0, 0.5, 1], [tokens.color.ink, tokens.color.ink, mark ? "white" : tokens.color.ink]);

    return { color };
  });

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      disabled={disabled}
      onPress={onPress}
      style={[styles.tile, { minHeight }, tileStyle]}
    >
      <Animated.Text style={[styles.tileText, { fontSize: textSize, minWidth: 12, textAlign: "center" }, placeholder && !letter && styles.placeholderText, textStyle]}>{(letter || placeholder || "").trim().toLocaleUpperCase("de-DE")}</Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.sm },
  board: {
    flex: 1,
    justifyContent: "flex-start",
    gap: 5,
  },
  tileRow: { flexDirection: "row" },
  tile: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.surface.input,
  },
  activeTile: { borderColor: tokens.color.primary, backgroundColor: tokens.color.primaryLight },
  tileText: { color: tokens.color.ink, fontSize: 25, ...tokens.typography.gameLetter },
  placeholderText: { color: tokens.color.muted, opacity: 0.45 },
  markedTileText: { color: "white" },
  absent: { backgroundColor: "#7B736A", borderColor: "#7B736A" },
  present: { backgroundColor: "#D98500", borderColor: "#D98500" },
  correct: {
    backgroundColor: tokens.color.success,
    borderColor: tokens.color.success,
  },
  message: {
    color: tokens.color.muted,
    ...tokens.typography.uiBody,
    textAlign: "center",
  },
});
