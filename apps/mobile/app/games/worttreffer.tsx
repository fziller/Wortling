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
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { GameResultModal } from "@/components/GameResultModal";
import { HelpModal } from "@/components/HelpModal";
import { SmallGameAction } from "@/components/SmallGameAction";
import { getBerlinDateKey } from "@/daily/date";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import {
  createPracticeWorttrefferGame,
  restoreWorttrefferPuzzle,
} from "@/games/worttreffer/daily";
import {
  getWorttrefferLetterStates,
  revealWorttrefferSolution,
  submitWorttrefferGuess,
} from "@/games/worttreffer/engine";
import { WorttrefferState } from "@/games/worttreffer/types";
import { getWordTileLayout } from "@/games/wordTileLayout";
import { updateBadgeCount } from "@/notifications/badge";
import {
  isStartedProgress,
  loadProgress,
  loadProgressForGames,
  saveProgress,
  type StoredProgress,
} from "@/storage/progress";

type WorttrefferGame = ReturnType<typeof createPracticeWorttrefferGame>;
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
  const completedAtRef = useRef<string | undefined>(undefined);
  const completedStatusRef = useRef<StoredProgress["status"] | undefined>(undefined);
  const [game, setGame] = useState<WorttrefferGame>(() => createPracticeWorttrefferGame(undefined, today));
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<WorttrefferState>(game.state);
  const [inputLetters, setInputLetters] = useState(() =>
    createEmptyInput(game.puzzle.wordLength),
  );
  const [cursorIndex, setCursorIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [helpVisible, setHelpVisible] = useState(false);
  const [giveUpVisible, setGiveUpVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [revealingGuessIndex, setRevealingGuessIndex] = useState<number | null>(null);
  const revealDoneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revealDoneTimeoutRef.current) clearTimeout(revealDoneTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    try {
      posthog.capture("screen_viewed", {
        screen: "worttreffer",
        params: { dateKey },
      });
      posthog.capture("game_started", { gameId: "worttreffer", dateKey });
    } catch {
      // Analytics must never break offline gameplay.
    }
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
        setInputLetters(draft.length === nextGame.puzzle.wordLength ? draft : createEmptyInput(nextGame.puzzle.wordLength));
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
      ).then(updateBadgeCount);
    }
  }, [state.status, dateKey]);

  const canSubmit = inputLetters.every(Boolean) && state.status === "playing";
  const letterStates = getWorttrefferLetterStates(state);
  const tileLayout = getWordTileLayout(puzzle.wordLength);
  const elapsedSeconds = Math.max(
    0,
    Math.round(((finishedAt ?? Date.now()) - startedAt) / 1000),
  );
  const usedLetters = new Set(
    state.guesses.flatMap((guess) => Array.from(guess.value)),
  ).size;
  const visibleRows = state.guesses.length + (state.status === "playing" && revealingGuessIndex === null ? 1 : 0);

  function addLetter(letter: string) {
    if (state.status !== "playing") return;
    setInputLetters((current) =>
      current.map((item, index) => (index === cursorIndex ? letter : item)),
    );
    setCursorIndex((current) => Math.min(current + 1, puzzle.wordLength - 1));
  }

  function backspace() {
    setInputLetters((current) => {
      if (current[cursorIndex]) {
        return current.map((item, index) =>
          index === cursorIndex ? "" : item,
        );
      }

      const previousIndex = Math.max(cursorIndex - 1, 0);
      setCursorIndex(previousIndex);

      return current.map((item, index) =>
        index === previousIndex ? "" : item,
      );
    });
  }

  function submit() {
    const result = submitWorttrefferGuess(puzzle, state, inputLetters.join(""));

    if (revealDoneTimeoutRef.current) clearTimeout(revealDoneTimeoutRef.current);
    setState(result.state);
    setMessage(
      result.ok
        ? result.state.status === "won"
          ? "Getroffen!"
          : result.state.status === "lost"
            ? "Heute nicht getroffen."
            : "Weiter geht's."
        : result.reason,
    );
    if (result.ok) {
      const nextGuessIndex = result.state.guesses.length - 1;

      setRevealingGuessIndex(nextGuessIndex);
      setInputLetters(createEmptyInput(puzzle.wordLength));
      setCursorIndex(0);
    }
    if (result.ok && result.state.status !== "playing") {
      const revealDuration = puzzle.wordLength * TILE_REVEAL_DELAY_MS + TILE_REVEAL_DURATION_MS;

      revealDoneTimeoutRef.current = setTimeout(() => {
        setRevealingGuessIndex(null);
        setFinishedAt(Date.now());
        setResultVisible(true);
        try {
          posthog.capture("game_completed", {
            gameId: "worttreffer",
            dateKey,
            durationMs: Date.now() - startedAt,
            attempts: result.state.guesses.length,
          });
        } catch {
          // Analytics must never break offline gameplay.
        }
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
    setRevealingGuessIndex(null);
    setState((current) => revealWorttrefferSolution(current));
    setMessage("Lösung aufgedeckt.");
    setInputLetters(createEmptyInput(puzzle.wordLength));
    setCursorIndex(0);
    setGiveUpVisible(false);
    setFinishedAt(Date.now());
    setResultVisible(true);
  }

  function startPracticeWord() {
    const nextGame = createPracticeWorttrefferGame(puzzle.answer, today);

    if (revealDoneTimeoutRef.current) clearTimeout(revealDoneTimeoutRef.current);
    setGame(nextGame);
    setState(nextGame.state);
    setInputLetters(createEmptyInput(nextGame.puzzle.wordLength));
    setCursorIndex(0);
    setMessage("");
    setResultVisible(false);
    setFinishedAt(null);
    setProgressLoaded(true);
    setStartedAt(Date.now());
    setRevealingGuessIndex(null);
  }

  function resultTitle() {
    if (state.status === "won") return "Stark getroffen.";
    if (state.status === "lost") return "Heute nicht getroffen.";

    return "Aufgelöst.";
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <GameScreenFrame
      actions={state.status === "playing" ? <SmallGameAction label="Lösung anzeigen" onPress={() => setGiveUpVisible(true)} /> : null}
      keyboard={{
        disabled: state.status !== "playing",
        letterStates,
        onBackspace: backspace,
        onLetter: addLetter,
        onSubmit: submit,
        submitDisabled: !canSubmit,
      }}
      onBack={goBack}
      onHelp={() => setHelpVisible(true)}
      subtitle={`${dateKey} · ${puzzle.wordLength} Buchstaben`}
      title="Worttreffer"
    >
      <View style={styles.wrap}>
        <View style={styles.board}>
          {Array.from({ length: visibleRows }).map((_, rowIndex) => {
            const guess = state.guesses[rowIndex];
            const inputRow = state.status === "playing" && rowIndex === state.guesses.length;
            const letters = guess ? Array.from(guess.value) : inputRow ? inputLetters : createEmptyInput(puzzle.wordLength);

            return (
              <Animated.View
                entering={FadeInDown.duration(tokens.motion.quick)}
                key={rowIndex}
                layout={LinearTransition.springify().damping(16)}
                style={[styles.tileRow, { gap: tileLayout.gap }]}
              >
                {letters.map((letter, letterIndex) => {
                  const mark = guess?.marks[letterIndex];

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
          })}
        </View>

        {state.status === "lost" || state.status === "revealed" ? <Text style={styles.answer}>Lösung: {puzzle.answer.toUpperCase()}</Text> : null}
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
        guesses={state.guesses.map((guess) => guess.value)}
        message={
          state.status === "won"
            ? "Sauber, das war das Wort."
            : "Die Lösung ist raus. Weiteres Wort?"
        }
        onHome={() => router.replace("/")}
        onNext={startPracticeWord}
        solution={puzzle.answer}
        stats={[
          { label: "Versuche", value: state.guesses.length },
          { label: "Zeit", value: `${elapsedSeconds} Sek.` },
          { label: "Buchstaben", value: usedLetters },
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

function AnimatedWorttrefferTile({ accessibilityRole, disabled, letter, mark, minHeight, onPress, revealed, revealDelay, revealing, selected, textSize }: AnimatedWorttrefferTileProps) {
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
    const backgroundColor = interpolateColor(progress.value, [0, 0.5, 1], ["rgba(255,255,255,0.5)", "rgba(255,255,255,0.5)", targetColor]);
    const borderColor = interpolateColor(progress.value, [0, 0.5, 1], [tokens.color.line, tokens.color.line, targetColor]);
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
      style={[styles.tile, { minHeight }, tileStyle, selected && styles.activeTile]}
    >
      <Animated.Text style={[styles.tileText, { fontSize: textSize }, textStyle]}>{letter.trim().toLocaleUpperCase("de-DE")}</Animated.Text>
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
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  activeTile: { borderColor: tokens.color.primary, backgroundColor: "#FFF1DF" },
  tileText: { color: tokens.color.ink, fontSize: 25, fontWeight: "900" },
  markedTileText: { color: "white" },
  absent: { backgroundColor: "#7B736A", borderColor: "#7B736A" },
  present: { backgroundColor: "#D98500", borderColor: "#D98500" },
  correct: {
    backgroundColor: tokens.color.success,
    borderColor: tokens.color.success,
  },
  message: {
    color: tokens.color.muted,
    fontSize: tokens.type.body,
    textAlign: "center",
  },
  answer: {
    color: tokens.color.ink,
    fontSize: tokens.type.h2,
    fontWeight: "900",
    textAlign: "center",
  },
});
