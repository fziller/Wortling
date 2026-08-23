import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  LinearTransition,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated";

import { ConfirmModal } from "@/components/ConfirmModal";
import { getBerlinDateKey } from "@/daily/date";
import { hashSeed } from "@/daily/seed";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { GameResultModal } from "@/components/GameResultModal";
import { HelpModal } from "@/components/HelpModal";
import { SmallGameAction } from "@/components/SmallGameAction";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { CONTENT_VERSION } from "@/games/between/content";
import { createPracticeBetweenGame } from "@/games/between/daily";
import { getTargetRangeMetrics, revealSolution, submitGuess } from "@/games/between/engine";
import { displayWord } from "@/games/between/format";
import { BetweenState, Guess } from "@/games/between/types";
import { getWordTileLayout } from "@/games/wordTileLayout";
import { updateBadgeCount } from "@/notifications/badge";
import { isStartedProgress, loadProgress, loadProgressForGames, saveProgress, type StoredProgress } from "@/storage/progress";

const BOARD_LINE_HEIGHT = 132;
const DOT_SIZE = 20;
const DOT_MARGIN = 4;
const puzzleVersion = hashSeed(CONTENT_VERSION);
const TILE_FLIP_DELAY_MS = 45;
const TILE_FLIP_DURATION_MS = 260;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function createEmptyInput(length: number) {
  return Array.from({ length }, () => "");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatElapsedTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return minutes > 0 ? `${minutes}:${String(rest).padStart(2, "0")}` : `${rest} Sek.`;
}

export default function BetweenScreen() {
  const router = useRouter();
  const today = getBerlinDateKey();
  const completedAtRef = useRef<string | undefined>(undefined);
  const completedStatusRef = useRef<StoredProgress["status"] | undefined>(undefined);
  const [state, setState] = useState<BetweenState>(() => createPracticeBetweenGame(undefined, today).state);
  const [dateKey, setDateKey] = useState(today);
  const [inputLetters, setInputLetters] = useState(() => createEmptyInput(5));
  const [cursorIndex, setCursorIndex] = useState(0);
  const [modal, setModal] = useState<"reveal" | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [clearingDirection, setClearingDirection] = useState<Guess["direction"] | undefined>(undefined);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const clearMovingGuessTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shake = useSharedValue(0);
  const winGlow = useSharedValue(0);
  const markerOpacity = useSharedValue(1);
  const markerY = useSharedValue(BOARD_LINE_HEIGHT / 2);
  const markerNudge = useSharedValue(0);

  const lastGuess = state.guesses[state.guesses.length - 1] as Guess | undefined;
  const rangeMetrics = getTargetRangeMetrics(state);
  const elapsedSeconds = Math.max(0, Math.round(((finishedAt ?? Date.now()) - startedAt) / 1000));
  const centerWord = state.status === "revealed" || state.status === "won" ? state.targetWord : undefined;
  const showScaleHints = Boolean(lastGuess);
  const puzzleId = `between-${state.targetWord}`;

  useEffect(() => {
    loadProgress<BetweenState>("between", today).then((progress) => {
      completedAtRef.current = progress?.completedAt;
      completedStatusRef.current = progress?.completedStatus;
      if (isStartedProgress(progress)) {
        setState(progress.state);
        setDateKey(progress.dateKey);
        setInputLetters(Array.isArray(progress.draft) ? progress.draft.map(String) : createEmptyInput(5));
        setFinishedAt(progress.completedAt ? Date.parse(progress.completedAt) : null);
        setResultVisible(progress.status !== "playing");
      }
      setProgressLoaded(true);
    });
  }, [today]);

  useEffect(() => {
    if (!progressLoaded) return;

    const completedAt = state.status !== "playing" ? new Date().toISOString() : completedAtRef.current;
    const status = state.status === "abandoned" ? "revealed" : state.status;
    const completedStatus = state.status !== "playing" ? status : completedStatusRef.current;
    completedAtRef.current = completedAt;
    completedStatusRef.current = completedStatus;
    saveProgress({
      gameId: "between",
      dateKey,
      draft: inputLetters,
      puzzle: { targetWord: state.targetWord },
      puzzleId,
      puzzleVersion,
      completedStatus,
      status,
      state,
      completedAt,
    });
  }, [dateKey, inputLetters, progressLoaded, puzzleId, state]);

  useEffect(() => {
    if (state.status !== "playing") {
      loadProgressForGames(games.map((game) => game.id), dateKey).then((progress) => updateBadgeCount(progress, dateKey));
    }
  }, [state.status, dateKey]);

  useEffect(() => {
    const rawY = (rangeMetrics.targetPositionPercent / 100) * BOARD_LINE_HEIGHT;
    const nextY = clamp(rawY, DOT_MARGIN, BOARD_LINE_HEIGHT - DOT_SIZE - DOT_MARGIN);
    const nudge = lastGuess?.direction === "before" ? -10 : lastGuess?.direction === "after" ? 10 : 0;

    markerOpacity.value = withTiming(1, { duration: tokens.motion.quick });
    markerY.value = withSpring(nextY, { damping: 15, stiffness: 120 });
    markerNudge.value = withSequence(
      withTiming(nudge, { duration: tokens.motion.normal }),
      withSpring(0, { damping: 9, stiffness: 80 })
    );
  }, [lastGuess, markerNudge, markerOpacity, markerY, rangeMetrics.targetPositionPercent]);

  useEffect(() => {
    if (state.status === "won") {
      setFinishedAt((current) => current ?? Date.now());
      setResultVisible(true);
      winGlow.value = withSequence(
        withTiming(1, { duration: tokens.motion.normal }),
        withSpring(0.35, { damping: 8, stiffness: 90 })
      );
    }
  }, [state.status, winGlow]);

  useEffect(() => {
    return () => {
      if (clearMovingGuessTimeout.current) {
        clearTimeout(clearMovingGuessTimeout.current);
      }
    };
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.12 + winGlow.value * 0.28,
    transform: [{ scale: 1 + winGlow.value * 0.025 }]
  }));

  const markerStyle = useAnimatedStyle(() => ({
    opacity: markerOpacity.value,
    transform: [{ translateY: markerY.value + markerNudge.value }]
  }));

  function fail() {
    shake.value = withSequence(
      withTiming(-10, { duration: 45 }),
      withTiming(10, { duration: 70 }),
      withTiming(-6, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
  }

  function guess() {
    const result = submitGuess(state, inputLetters.join(""));

    if (!result.ok) {
      fail();
      return;
    }

    if (clearMovingGuessTimeout.current) {
      clearTimeout(clearMovingGuessTimeout.current);
    }

    setState(result.state);
    setCursorIndex(0);

    if (result.guess.direction !== "hit") {
      setClearingDirection(result.guess.direction);
      clearMovingGuessTimeout.current = setTimeout(() => {
        setInputLetters(createEmptyInput(5));
        clearMovingGuessTimeout.current = setTimeout(() => setClearingDirection(undefined), TILE_FLIP_DURATION_MS + 5 * TILE_FLIP_DELAY_MS);
      }, tokens.motion.quick);
    } else {
      setInputLetters(createEmptyInput(5));
    }

  }

  function addLetter(letter: string) {
    if (state.status !== "playing") return;
    setInputLetters((current) => current.map((item, index) => index === cursorIndex ? letter : item));
    setCursorIndex((current) => Math.min(current + 1, 4));
  }

  function backspace() {
    setInputLetters((current) => {
      if (current[cursorIndex]) {
        return current.map((item, index) => index === cursorIndex ? "" : item);
      }

      const previousIndex = Math.max(cursorIndex - 1, 0);
      setCursorIndex(previousIndex);

      return current.map((item, index) => index === previousIndex ? "" : item);
    });
  }

  function startNextWord() {
    const nextGame = createPracticeBetweenGame(state.targetWord, today);

    if (clearMovingGuessTimeout.current) {
      clearTimeout(clearMovingGuessTimeout.current);
    }

    setClearingDirection(undefined);
    setState(nextGame.state);
    setDateKey(nextGame.dateKey);
    setInputLetters(createEmptyInput(5));
    setCursorIndex(0);
    setModal(null);
    setResultVisible(false);
    setStartedAt(Date.now());
    setFinishedAt(null);
    markerOpacity.value = 1;
    markerY.value = BOARD_LINE_HEIGHT / 2;
    markerNudge.value = 0;
    winGlow.value = 0;
  }

  function revealRound() {
    setState(revealSolution(state));
    setModal(null);
    setFinishedAt(Date.now());
    setResultVisible(true);
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <GameScreenFrame
      actions={state.status === "playing" ? <SmallGameAction label="Lösung anzeigen" onPress={() => setModal("reveal")} /> : null}
      keyboard={{
        disabled: state.status !== "playing",
        onBackspace: backspace,
        onLetter: addLetter,
        onSubmit: guess,
        submitDisabled: !inputLetters.every(Boolean) || state.status !== "playing",
      }}
      onBack={goBack}
      onHelp={() => setHelpVisible(true)}
      subtitle={dateKey}
      title="Dazwischen"
    >
      <View style={styles.keyboard}>
        <Animated.View entering={FadeInDown.delay(80)} layout={LinearTransition.springify()} style={[styles.boardCard, glowStyle]}>
          <View style={styles.rangeStats}>
            <Text style={styles.statText}>{state.guesses.length} Tipps</Text>
          </View>

          <View style={styles.boardWrap}>
            <View style={styles.sideRail}>
              {showScaleHints ? (
                <View style={[styles.distanceBubble, styles.distanceBubbleTop]}>
                  <Text style={styles.distanceText}>{rangeMetrics.topDistancePercent}%</Text>
                </View>
              ) : null}
              <View style={styles.boardLine}>
                {showScaleHints ? <Animated.View style={[styles.orangeDot, markerStyle]} /> : null}
              </View>
              {showScaleHints ? (
                <View style={[styles.distanceBubble, styles.distanceBubbleBottom]}>
                  <Text style={styles.distanceText}>{rangeMetrics.bottomDistancePercent}%</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.wordStack}>
              <WordTiles dimmed={state.status === "revealed"} filled word={state.lowerBound} />
              <WordTiles
                cursorIndex={cursorIndex}
                disabled={Boolean(centerWord) || Boolean(clearingDirection) || state.status !== "playing"}
                exitingDirection={clearingDirection}
                letters={centerWord ? undefined : inputLetters}
                onTilePress={setCursorIndex}
                revealed={state.status === "revealed" || state.status === "won"}
                word={centerWord}
              />
              <WordTiles dimmed={state.status === "revealed"} filled word={state.upperBound} />
            </View>
          </View>

          <Text style={styles.alphabetLabel}>Offener Alphabetbereich</Text>
          <AlphabetStrip lowerBound={state.lowerBound} upperBound={state.upperBound} />
        </Animated.View>

        <Animated.View style={shakeStyle} />

      </View>

      <HelpModal {...gameHelp.between} onClose={() => setHelpVisible(false)} visible={helpVisible} />
      <ConfirmModal
        confirmLabel="Lösung zeigen"
        message="Die Runde wird beendet und nicht als gewonnen gewertet."
        onCancel={() => setModal(null)}
        onConfirm={revealRound}
        title="Lösung anzeigen?"
        visible={modal === "reveal"}
      />
      <GameResultModal
        guesses={state.guesses.map((guess) => guess.word)}
        message={state.status === "won" ? "Ziel sauber eingegrenzt." : "Die Lösung ist raus. Noch eins?"}
        onHome={() => router.replace("/")}
        onNext={startNextWord}
        solution={state.targetWord}
        stats={[
          { label: "Tipps", value: state.guesses.length },
          { label: "Zeit", value: formatElapsedTime(elapsedSeconds) },
          { label: "Rest", value: `${rangeMetrics.topDistancePercent + rangeMetrics.bottomDistancePercent}%` }
        ]}
        title={state.status === "won" ? "Gefunden." : "Aufgelöst."}
        visible={resultVisible && state.status !== "playing"}
      />
    </GameScreenFrame>
  );
}

type WordTilesProps = {
  cursorIndex?: number;
  disabled?: boolean;
  word?: string;
  letters?: readonly string[];
  filled?: boolean;
  dimmed?: boolean;
  onTilePress?: (index: number) => void;
  revealed?: boolean;
  exitingDirection?: Guess["direction"];
};

function WordTiles({ cursorIndex = 0, disabled = true, word, letters: inputLetters, filled = false, dimmed = false, onTilePress, revealed = false, exitingDirection }: WordTilesProps) {
  const letters = word ? Array.from(displayWord(word)) : inputLetters ?? Array.from({ length: 5 }, () => "");
  const tileLayout = getWordTileLayout(letters.length);
  const flipChanges = Boolean(word) || Boolean(exitingDirection) || filled || revealed;

  return (
    <View style={[styles.tileRow, { gap: tileLayout.gap }]}>
      {letters.map((letter, index) => (
        <FlipWordTile
          cursorIndex={cursorIndex}
          disabled={disabled}
          dimmed={dimmed}
          filled={filled}
          flip={flipChanges}
          index={index}
          key={index}
          letter={letter}
          minHeight={tileLayout.minHeight}
          onPress={() => onTilePress?.(index)}
          revealed={revealed}
          textSize={tileLayout.fontSize}
        />
      ))}
    </View>
  );
}

type FlipWordTileProps = {
  cursorIndex: number;
  disabled: boolean;
  dimmed: boolean;
  filled: boolean;
  flip: boolean;
  index: number;
  letter: string;
  minHeight: number;
  onPress: () => void;
  revealed: boolean;
  textSize: number;
};

function FlipWordTile({ cursorIndex, disabled, dimmed, filled, flip, index, letter, minHeight, onPress, revealed, textSize }: FlipWordTileProps) {
  const [displayLetter, setDisplayLetter] = useState(letter);
  const progress = useSharedValue(1);

  useEffect(() => {
    if (displayLetter === letter) return;

    if (!flip) {
      setDisplayLetter(letter);
      progress.value = 1;
      return;
    }

    const delay = index * TILE_FLIP_DELAY_MS;
    const timeout = setTimeout(() => setDisplayLetter(letter), delay + TILE_FLIP_DURATION_MS / 2);

    progress.value = 0;
    progress.value = withDelay(delay, withTiming(1, { duration: TILE_FLIP_DURATION_MS }));

    return () => clearTimeout(timeout);
  }, [displayLetter, flip, index, letter, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scaleY = interpolate(progress.value, [0, 0.5, 1], [1, 0.08, 1]);
    const targetColor = revealed ? tokens.color.success : filled ? tokens.color.secondary : "rgba(255,255,255,0.5)";
    const targetBorderColor = revealed ? tokens.color.success : filled ? tokens.color.secondary : tokens.color.line;
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 0.5, 1],
      ["rgba(255,255,255,0.5)", "rgba(255,255,255,0.5)", targetColor]
    );
    const borderColor = interpolateColor(
      progress.value,
      [0, 0.5, 1],
      [tokens.color.line, tokens.color.line, targetBorderColor]
    );

    return { backgroundColor, borderColor, transform: [{ scaleY }] };
  });

  return (
    <AnimatedPressable
      accessibilityLabel={`Buchstabe ${index + 1}${displayLetter ? `: ${displayLetter.toUpperCase()}` : " leer"}`}
      accessibilityRole="button"
      disabled={disabled}
      entering={FadeInDown.delay(index * 35).duration(tokens.motion.quick)}
      layout={LinearTransition.springify().damping(16)}
      onPress={onPress}
      style={[
        styles.wordTile,
        { minHeight },
        filled ? styles.wordTileFilled : styles.wordTileEmpty,
        revealed && styles.wordTileRevealed,
        dimmed && styles.wordTileDimmed,
        animatedStyle,
        !disabled && index === cursorIndex && styles.wordTileActive
      ]}
    >
      <Text style={[styles.wordTileText, { fontSize: textSize }, filled || revealed ? styles.wordTileTextFilled : styles.wordTileTextEmpty]}>{displayLetter.toLocaleUpperCase("de-DE")}</Text>
    </AnimatedPressable>
  );
}

type AlphabetStripProps = {
  lowerBound: string;
  upperBound: string;
};

function AlphabetStrip({ lowerBound, upperBound }: AlphabetStripProps) {
  const firstOpenLetter = lowerBound[0]?.toLocaleUpperCase("de-DE") ?? "A";
  const lastOpenLetter = upperBound[0]?.toLocaleUpperCase("de-DE") ?? "Z";

  return (
    <View style={styles.alphabetStrip}>
      {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => {
        const isAvailable = letter >= firstOpenLetter && letter <= lastOpenLetter;

        return (
          <Text key={letter} style={[styles.alphabetLetter, !isAvailable && styles.alphabetLetterDisabled]}>
            {letter}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    gap: tokens.space.sm
  },
  boardCard: {
    gap: tokens.space.sm,
    padding: tokens.space.md,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.card,
    shadowColor: tokens.color.primary,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4
  },
  rangeStats: {
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  statText: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontWeight: "900"
  },
  boardWrap: {
    flexDirection: "row",
    gap: tokens.space.md,
    alignItems: "center"
  },
  sideRail: {
    width: 64,
    height: BOARD_LINE_HEIGHT,
    alignItems: "center",
    justifyContent: "center"
  },
  distanceBubble: {
    position: "absolute",
    left: 0,
    zIndex: 3,
    minWidth: 46,
    alignItems: "center",
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.secondary
  },
  distanceBubbleTop: {
    top: -6
  },
  distanceBubbleBottom: {
    bottom: -6
  },
  distanceText: {
    color: "white",
    fontSize: tokens.type.small,
    fontWeight: "900"
  },
  boardLine: {
    width: 6,
    height: BOARD_LINE_HEIGHT,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.secondary
  },
  orangeDot: {
    position: "absolute",
    top: 0,
    left: -7,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: "#FF8500"
  },
  wordStack: {
    flex: 1,
    gap: tokens.space.sm
  },
  tileRow: {
    flexDirection: "row"
  },
  wordTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.sm
  },
  wordTileFilled: {
    borderWidth: 2,
    borderColor: tokens.color.secondary,
    backgroundColor: tokens.color.secondary
  },
  wordTileRevealed: {
    borderWidth: 2,
    borderColor: tokens.color.success,
    backgroundColor: tokens.color.success
  },
  wordTileDimmed: {
    opacity: 0.28
  },
  wordTileEmpty: {
    borderWidth: 2,
    borderColor: tokens.color.line,
    backgroundColor: "rgba(255,255,255,0.5)"
  },
  wordTileActive: {
    borderColor: tokens.color.primary,
    backgroundColor: "#FFF1DF"
  },
  wordTileText: {
    fontWeight: "900"
  },
  wordTileTextFilled: {
    color: "white"
  },
  wordTileTextEmpty: {
    color: tokens.color.ink
  },
  alphabetLabel: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontWeight: "900"
  },
  alphabetStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  alphabetLetter: {
    minWidth: 20,
    color: tokens.color.secondary,
    fontSize: tokens.type.small,
    fontWeight: "900",
    textAlign: "center"
  },
  alphabetLetterDisabled: {
    color: "rgba(23, 19, 13, 0.22)"
  }
});
