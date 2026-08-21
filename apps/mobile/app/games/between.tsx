import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  LinearTransition,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated";

import { ConfirmModal } from "@/components/ConfirmModal";
import { GameHeaderButton, GameHeaderHelpButton, GameHeaderTitle } from "@/components/GameHeader";
import { HelpModal } from "@/components/HelpModal";
import { KeyboardDock } from "@/components/KeyboardDock";
import { Screen } from "@/components/Screen";
import { WordKeyboard } from "@/components/WordKeyboard";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { allowedGuessCount, targetWordCount } from "@/games/between/content";
import { createDailyBetweenGame, createPracticeBetweenGame } from "@/games/between/daily";
import { getTargetRangeMetrics, revealSolution, submitGuess } from "@/games/between/engine";
import { displayWord } from "@/games/between/format";
import { BetweenState, Guess } from "@/games/between/types";

const BOARD_LINE_HEIGHT = 176;
const DOT_SIZE = 20;
const DOT_MARGIN = 4;
const dailyGame = createDailyBetweenGame();

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
  const [state, setState] = useState<BetweenState>(dailyGame.state);
  const [dateKey, setDateKey] = useState(dailyGame.dateKey);
  const [inputLetters, setInputLetters] = useState(() => createEmptyInput(5));
  const [cursorIndex, setCursorIndex] = useState(0);
  const [modal, setModal] = useState<"reveal" | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [movingGuess, setMovingGuess] = useState<Guess | null>(null);
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
  const centerWord = state.status === "revealed" || state.status === "won" ? state.targetWord : movingGuess?.word;
  const showScaleHints = Boolean(lastGuess);

  const sortedGuesses = useMemo(() => {
    return [...state.guesses].reverse();
  }, [state.guesses]);

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
      setSuccessVisible(true);
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

    setMovingGuess(result.guess.direction === "hit" ? null : result.guess);
    setState(result.state);
    setInputLetters(createEmptyInput(5));
    setCursorIndex(0);

    if (result.guess.direction !== "hit") {
      clearMovingGuessTimeout.current = setTimeout(() => setMovingGuess(null), tokens.motion.slow);
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
    const nextGame = createPracticeBetweenGame(state.targetWord);

    if (clearMovingGuessTimeout.current) {
      clearTimeout(clearMovingGuessTimeout.current);
    }

    setMovingGuess(null);
    setState(nextGame.state);
    setDateKey(nextGame.dateKey);
    setInputLetters(createEmptyInput(5));
    setCursorIndex(0);
    setModal(null);
    setSuccessVisible(false);
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
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerLeft: () => <GameHeaderButton accessibilityLabel="Zurück" label="←" onPress={goBack} />,
          headerRight: () => <GameHeaderHelpButton onPress={() => setHelpVisible(true)} />,
          headerShadowVisible: false,
          headerShown: true,
          headerStyle: { backgroundColor: tokens.color.paper },
          headerTitle: () => <GameHeaderTitle subtitle={dateKey} title="Dazwischen" />,
          headerTitleAlign: "center"
        }}
      />
      <View style={styles.keyboard}>
        <Animated.View entering={FadeInUp.duration(tokens.motion.normal)} style={styles.header}>
          <Text style={styles.rules}>Grenze das Zielwort alphabetisch ein.</Text>
          <Text style={styles.wordStats}>{allowedGuessCount} gültige Wörter · {targetWordCount} Zielwörter</Text>
        </Animated.View>

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
                disabled={Boolean(centerWord) || state.status !== "playing"}
                exitingDirection={movingGuess?.direction}
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

        <Animated.View style={[styles.inputCard, shakeStyle]}>
          {state.status === "playing" ? (
            <Pressable accessibilityRole="button" onPress={() => setModal("reveal")} style={styles.giveUpButton}>
              <Text style={styles.giveUpText}>Aufgeben</Text>
            </Pressable>
          ) : null}
          <KeyboardDock>
            <WordKeyboard disabled={state.status !== "playing"} onBackspace={backspace} onLetter={addLetter} onSubmit={guess} submitDisabled={!inputLetters.every(Boolean) || state.status !== "playing"} />
          </KeyboardDock>
        </Animated.View>

        <View style={styles.history}>
          {sortedGuesses.map((item) => (
            <Animated.View entering={SlideInRight.springify().damping(14)} key={item.word} layout={LinearTransition.springify()} style={styles.guessRow}>
              <View>
                <Text style={styles.guessWord}>{displayWord(item.word)}</Text>
                <Text style={styles.guessPercent}>{item.percent}%</Text>
              </View>
              <Text style={[styles.guessHint, item.direction === "hit" && styles.hit]}>
                {item.direction === "hit" ? "Treffer" : item.direction === "after" ? "Ziel danach" : "Ziel davor"}
              </Text>
            </Animated.View>
          ))}
        </View>

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
      <SuccessModal
        elapsedSeconds={elapsedSeconds}
        guesses={state.guesses.length}
        onHome={() => router.replace("/")}
        onNext={startNextWord}
        targetWord={state.targetWord}
        visible={successVisible}
      />
    </Screen>
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
  const exitingAnimation = exitingDirection === "after" ? FadeOutUp : exitingDirection === "before" ? FadeOutDown : FadeOut;

  return (
    <View style={styles.tileRow}>
      {letters.map((letter, index) => (
        <Animated.View
          entering={FadeInDown.delay(index * 35).duration(tokens.motion.quick)}
          exiting={exitingAnimation.duration(tokens.motion.quick)}
          key={`${letter}-${index}`}
          layout={LinearTransition.springify().damping(16)}
          style={styles.wordTileWrap}
        >
          <Pressable
            accessibilityLabel={`Buchstabe ${index + 1}${letter ? `: ${letter.toUpperCase()}` : " leer"}`}
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => onTilePress?.(index)}
          style={[
            styles.wordTile,
            filled ? styles.wordTileFilled : styles.wordTileEmpty,
            revealed && styles.wordTileRevealed,
            dimmed && styles.wordTileDimmed,
            !disabled && index === cursorIndex && styles.wordTileActive
          ]}
        >
          <Text style={[styles.wordTileText, filled || revealed ? styles.wordTileTextFilled : styles.wordTileTextEmpty]}>{letter.toLocaleUpperCase("de-DE")}</Text>
          </Pressable>
        </Animated.View>
      ))}
    </View>
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

type SuccessModalProps = {
  visible: boolean;
  targetWord: string;
  guesses: number;
  elapsedSeconds: number;
  onNext: () => void;
  onHome: () => void;
};

function SuccessModal({ visible, targetWord, guesses, elapsedSeconds, onNext, onHome }: SuccessModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <Animated.View entering={FadeInDown.duration(tokens.motion.normal)} style={styles.modalCard}>
          <Text style={styles.successKicker}>Gelöst</Text>
          <Text style={styles.successWord}>{displayWord(targetWord)}</Text>
          <View style={styles.resultGrid}>
            <View style={styles.resultTile}>
              <Text style={styles.resultValue}>{guesses}</Text>
              <Text style={styles.resultLabel}>Versuche</Text>
            </View>
            <View style={styles.resultTile}>
              <Text style={styles.resultValue}>{formatElapsedTime(elapsedSeconds)}</Text>
              <Text style={styles.resultLabel}>Zeit</Text>
            </View>
          </View>
          <View style={styles.modalActions}>
            <Pressable accessibilityRole="button" onPress={onHome} style={[styles.modalButton, styles.modalButtonSecondary]}>
              <Text style={styles.modalButtonSecondaryText}>Startseite</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onNext} style={[styles.modalButton, styles.modalButtonPrimary]}>
              <Text style={styles.modalButtonPrimaryText}>Weiteres Wort</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    gap: tokens.space.md
  },
  header: {
    gap: tokens.space.sm
  },
  rules: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontWeight: "800",
    lineHeight: 19
  },
  wordStats: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontWeight: "900"
  },
  boardCard: {
    gap: tokens.space.md,
    padding: tokens.space.lg,
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
    flexDirection: "row",
    gap: 6
  },
  wordTile: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  wordTileWrap: {
    flex: 1
  },
  wordTileFilled: {
    backgroundColor: tokens.color.secondary
  },
  wordTileRevealed: {
    borderWidth: 0,
    backgroundColor: tokens.color.success
  },
  wordTileDimmed: {
    opacity: 0.28
  },
  wordTileEmpty: {
    borderWidth: 2,
    borderColor: "rgba(23, 19, 13, 0.62)",
    backgroundColor: "rgba(255, 255, 255, 0.35)"
  },
  wordTileActive: {
    borderColor: tokens.color.primary,
    backgroundColor: "#FFF1DF"
  },
  wordTileText: {
    fontSize: 26,
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
  },
  inputCard: {
    gap: tokens.space.md
  },
  giveUpButton: {
    alignSelf: "flex-end",
    paddingHorizontal: tokens.space.sm,
    paddingVertical: tokens.space.xs
  },
  giveUpText: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontWeight: "900"
  },
  history: {
    gap: tokens.space.sm
  },
  guessRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.62)"
  },
  guessWord: {
    color: tokens.color.ink,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 1.5
  },
  guessPercent: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontWeight: "900"
  },
  guessHint: {
    color: tokens.color.secondary,
    fontWeight: "900"
  },
  hit: {
    color: tokens.color.success
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: tokens.space.lg,
    backgroundColor: "rgba(23, 19, 13, 0.48)"
  },
  modalCard: {
    gap: tokens.space.md,
    padding: tokens.space.lg,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.card
  },
  modalActions: {
    flexDirection: "row",
    gap: tokens.space.sm,
    marginTop: tokens.space.sm
  },
  modalButton: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill
  },
  modalButtonSecondary: {
    borderWidth: 1,
    borderColor: tokens.color.line,
    backgroundColor: "white"
  },
  modalButtonPrimary: {
    backgroundColor: tokens.color.primary
  },
  modalButtonSecondaryText: {
    color: tokens.color.ink,
    fontWeight: "900"
  },
  modalButtonPrimaryText: {
    color: "white",
    fontWeight: "900"
  },
  successKicker: {
    color: tokens.color.success,
    fontSize: tokens.type.small,
    fontWeight: "900",
    letterSpacing: 1.6,
    textTransform: "uppercase"
  },
  successWord: {
    color: tokens.color.ink,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center"
  },
  resultGrid: {
    flexDirection: "row",
    gap: tokens.space.sm
  },
  resultTile: {
    flex: 1,
    alignItems: "center",
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    backgroundColor: "rgba(36, 107, 254, 0.1)"
  },
  resultValue: {
    color: tokens.color.ink,
    fontSize: tokens.type.h2,
    fontWeight: "900"
  },
  resultLabel: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontWeight: "900"
  }
});
