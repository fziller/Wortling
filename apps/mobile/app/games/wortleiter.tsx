import { Stack, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";

import { ConfirmModal } from "@/components/ConfirmModal";
import {
  GameHeaderButton,
  GameHeaderHelpButton,
  GameHeaderTitle,
} from "@/components/GameHeader";
import { HelpModal } from "@/components/HelpModal";
import { KeyboardDock } from "@/components/KeyboardDock";
import { Screen } from "@/components/Screen";
import { WordKeyboard } from "@/components/WordKeyboard";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import {
  createDailyWortleiterGame,
  createPracticeWortleiterGame,
} from "@/games/wortleiter/daily";
import {
  getWortleiterRating,
  revealWortleiterSolution,
  submitWortleiterGuess,
  undoWortleiterStep,
} from "@/games/wortleiter/engine";
import type { WortleiterState } from "@/games/wortleiter/types";
import { updateBadgeCount } from "@/notifications/badge";
import {
  loadProgress,
  loadProgressForGames,
  saveProgress,
} from "@/storage/progress";

const dailyGame = createDailyWortleiterGame();

function createEmptyInput(length: number): string[] {
  return Array.from({ length }, () => "");
}

function formatElapsedTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return minutes > 0
    ? `${minutes}:${String(rest).padStart(2, "0")}`
    : `${rest} Sek.`;
}

export default function WortleiterScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const [game, setGame] = useState(dailyGame);
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<WortleiterState>(game.state);
  const [inputLetters, setInputLetters] = useState(() =>
    createEmptyInput(dailyGame.puzzle.wordLength),
  );
  const [cursorIndex, setCursorIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [helpVisible, setHelpVisible] = useState(false);
  const [revealVisible, setRevealVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      posthog.capture("screen_viewed", {
        screen: "wortleiter",
        params: { dateKey },
      });
      posthog.capture("game_started", { gameId: "wortleiter", dateKey });
    } catch {
      // Analytics must never break offline gameplay.
    }
  }, [dateKey, posthog]);

  useEffect(() => {
    loadProgress<WortleiterState>("wortleiter", dateKey).then((progress) => {
      if (
        progress?.puzzleId === puzzle.id &&
        progress.puzzleVersion === puzzle.version
      ) {
        setState(progress.state);
        setFinishedAt(
          progress.completedAt ? Date.parse(progress.completedAt) : null,
        );
        setResultVisible(progress.status !== "playing");
      }
      setProgressLoaded(true);
    });
  }, [dateKey, puzzle.id, puzzle.version]);

  useEffect(() => {
    if (!progressLoaded) return;

    const completedAt =
      state.status !== "playing"
        ? (state.completedAt ?? new Date().toISOString())
        : undefined;
    saveProgress({
      gameId: "wortleiter",
      dateKey,
      puzzleId: puzzle.id,
      puzzleVersion: puzzle.version,
      status: state.status,
      state: {
        ...state,
        startedAt: state.startedAt ?? new Date(startedAt).toISOString(),
        completedAt,
      },
      startedAt: state.startedAt ?? new Date(startedAt).toISOString(),
      completedAt,
    });
  }, [dateKey, progressLoaded, puzzle.id, puzzle.version, startedAt, state]);

  useEffect(() => {
    if (state.status !== "playing") {
      loadProgressForGames(
        games.map((game) => game.id),
        dateKey,
      ).then(updateBadgeCount);
    }
  }, [state.status, dateKey]);

  const canSubmit = inputLetters.every(Boolean) && state.status === "playing";
  const elapsedSeconds = Math.max(
    0,
    Math.round(((finishedAt ?? Date.now()) - startedAt) / 1000),
  );
  const steps = Math.max(0, state.words.length - 1);

  function addLetter(letter: string) {
    if (state.status !== "playing") return;
    setInputLetters((current) =>
      current.map((item, index) => (index === cursorIndex ? letter : item)),
    );
    setCursorIndex((current) => Math.min(current + 1, puzzle.wordLength - 1));
  }

  function backspace() {
    setInputLetters((current) => {
      if (current[cursorIndex])
        return current.map((item, index) =>
          index === cursorIndex ? "" : item,
        );

      const previousIndex = Math.max(cursorIndex - 1, 0);
      setCursorIndex(previousIndex);

      return current.map((item, index) =>
        index === previousIndex ? "" : item,
      );
    });
  }

  function submit() {
    const result = submitWortleiterGuess(puzzle, state, inputLetters.join(""));

    setState(result.state);
    setMessage(
      result.ok
        ? result.state.status === "won"
          ? "Geschafft!"
          : ""
        : result.reason,
    );

    if (result.ok) {
      setInputLetters(createEmptyInput(puzzle.wordLength));
      setCursorIndex(0);
    }

    if (result.ok && result.state.status === "won") {
      const now = Date.now();
      setFinishedAt(now);
      setResultVisible(true);
      try {
        posthog.capture("game_completed", {
          gameId: "wortleiter",
          dateKey,
          durationMs: now - startedAt,
          attempts: result.state.words.length - 1,
        });
      } catch {
        // Analytics must never break offline gameplay.
      }
    }
  }

  function undo() {
    setState((current) => undoWortleiterStep(current));
    setMessage("");
  }

  function reveal() {
    const nextState = revealWortleiterSolution(puzzle, state);
    setState(nextState);
    setMessage("Lösung aufgedeckt.");
    setInputLetters(createEmptyInput(puzzle.wordLength));
    setCursorIndex(0);
    setRevealVisible(false);
    setFinishedAt(Date.now());
    setResultVisible(true);
  }

  function startPracticePuzzle() {
    const nextGame = createPracticeWortleiterGame(puzzle.id);

    setGame(nextGame);
    setState(nextGame.state);
    setInputLetters(createEmptyInput(nextGame.puzzle.wordLength));
    setCursorIndex(0);
    setMessage("");
    setResultVisible(false);
    setRevealVisible(false);
    setProgressLoaded(true);
    setStartedAt(Date.now());
    setFinishedAt(null);
  }

  function goBack() {
    if (state.status === "playing" && state.words.length > 1) {
      try {
        posthog.capture("game_abandoned", {
          gameId: "wortleiter",
          dateKey,
          attempts: state.words.length - 1,
        });
      } catch {
        // Analytics must never break offline gameplay.
      }
    }
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <Screen videoBackground>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <GameHeaderButton
              accessibilityLabel="Zurück"
              label="←"
              onPress={goBack}
            />
          ),
          headerRight: () => (
            <GameHeaderHelpButton onPress={() => setHelpVisible(true)} />
          ),
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "transparent" },
          headerTransparent: true,
          headerTitle: () => (
            <GameHeaderTitle subtitle={dateKey} title="Wortleiter" />
          ),
          headerTitleAlign: "center",
        }}
      />
      <View style={styles.wrap}>
        <View style={styles.boardPanel}>
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>Schritte: {steps}</Text>
            <Text style={styles.statusText}>
              Optimal: {puzzle.optimalSteps}
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.ladderScrollContent}
            showsVerticalScrollIndicator={false}
            style={styles.ladderScroll}
          >
            <LadderWord
              label="Start"
              word={state.words[0] ?? puzzle.startWord}
            />

            {state.words.slice(1).map((word, index) => (
              <Animated.View
                entering={FadeInDown.duration(tokens.motion.normal)}
                key={`${word}-${index}`}
                layout={LinearTransition.springify()}
                style={styles.stepWrap}
              >
                <Text style={styles.arrow}>↓</Text>
                <LadderWord word={word} />
              </Animated.View>
            ))}

            {state.status === "playing" ? (
              <View style={styles.inputStep}>
                <Text style={styles.arrow}>↓</Text>
                <CompactLetterInputTiles
                  cursorIndex={cursorIndex}
                  letters={inputLetters}
                  onCursorChange={setCursorIndex}
                />
              </View>
            ) : null}

            {state.words[state.words.length - 1] !== puzzle.targetWord ? (
              <View style={styles.stepWrap}>
                <Text style={styles.arrow}>↓</Text>
                <LadderWord label="Ziel" target word={puzzle.targetWord} />
              </View>
            ) : null}
          </ScrollView>
        </View>

        {message || state.status === "won" ? (
          <View style={styles.statusBlock}>
            <Text style={styles.message}>{message}</Text>
            {state.status === "won" ? (
              <Text style={styles.rating}>
                {getWortleiterRating(puzzle, state)}
              </Text>
            ) : null}
          </View>
        ) : null}

        <KeyboardDock>
          {state.status === "playing" ? (
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={state.words.length <= 1}
                onPress={undo}
                style={[
                  styles.smallButton,
                  state.words.length <= 1 && styles.disabledButton,
                ]}
              >
                <Text style={styles.smallButtonText}>Zurück</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setRevealVisible(true)}
                style={styles.smallButton}
              >
                <Text style={styles.smallButtonText}>Lösung anzeigen</Text>
              </Pressable>
            </View>
          ) : null}
          <WordKeyboard
            disabled={state.status !== "playing"}
            onBackspace={backspace}
            onLetter={addLetter}
            onSubmit={submit}
            submitDisabled={!canSubmit}
          />
        </KeyboardDock>
      </View>
      <ConfirmModal
        confirmLabel="Lösung zeigen"
        message="Die Lösung wird angezeigt und die Runde zählt nicht als geschafft."
        onCancel={() => setRevealVisible(false)}
        onConfirm={reveal}
        title="Aufgeben?"
        visible={revealVisible}
      />
      <WortleiterResultModal
        elapsedTime={formatElapsedTime(elapsedSeconds)}
        onHome={() => router.replace("/")}
        onNext={startPracticePuzzle}
        optimalSteps={puzzle.optimalSteps}
        status={state.status}
        steps={steps}
        visible={resultVisible && state.status !== "playing"}
        words={state.words}
      />
      <HelpModal
        {...gameHelp.wortleiter}
        onClose={() => setHelpVisible(false)}
        visible={helpVisible}
      />
    </Screen>
  );
}

type LadderWordProps = {
  label?: string;
  target?: boolean;
  word: string;
};

function LadderWord({ label, target = false, word }: LadderWordProps) {
  return (
    <View style={[styles.wordPill, target && styles.targetPill]}>
      {label ? <Text style={styles.pillLabel}>{label}</Text> : null}
      <Text style={styles.pillWord}>{word.toLocaleUpperCase("de-DE")}</Text>
    </View>
  );
}

type CompactLetterInputTilesProps = {
  cursorIndex: number;
  letters: readonly string[];
  onCursorChange: (index: number) => void;
};

function CompactLetterInputTiles({
  cursorIndex,
  letters,
  onCursorChange,
}: CompactLetterInputTilesProps) {
  return (
    <View style={styles.inputRow}>
      {letters.map((letter, index) => (
        <Pressable
          accessibilityRole="button"
          key={index}
          onPress={() => onCursorChange(index)}
          style={[
            styles.inputTile,
            index === cursorIndex && styles.activeInputTile,
          ]}
        >
          <Text style={styles.inputTileText}>
            {letter.toLocaleUpperCase("de-DE")}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

type WortleiterResultModalProps = {
  elapsedTime: string;
  onHome: () => void;
  onNext: () => void;
  optimalSteps: number;
  status: WortleiterState["status"];
  steps: number;
  visible: boolean;
  words: readonly string[];
};

function WortleiterResultModal({
  elapsedTime,
  onHome,
  onNext,
  optimalSteps,
  status,
  steps,
  visible,
  words,
}: WortleiterResultModalProps) {
  const won = status === "won";

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {won ? "Geschafft!" : "Aufgelöst."}
          </Text>
          <Text style={styles.modalMessage}>
            {won
              ? `Deine Schritte: ${steps} · Optimal: ${optimalSteps}`
              : "Die kürzeste bekannte Leiter:"}
          </Text>
          <ScrollView
            contentContainerStyle={styles.modalLadder}
            showsVerticalScrollIndicator={false}
            style={styles.modalLadderScroll}
          >
            {words.map((word, index) => (
              <View key={`${word}-${index}`} style={styles.modalStep}>
                {index > 0 ? <Text style={styles.modalArrow}>↓</Text> : null}
                <Text style={styles.modalWord}>
                  {word.toLocaleUpperCase("de-DE")}
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.modalStats}>
            <View style={styles.modalStatTile}>
              <Text style={styles.modalStatValue}>{steps}</Text>
              <Text style={styles.modalStatLabel}>Schritte</Text>
            </View>
            <View style={styles.modalStatTile}>
              <Text style={styles.modalStatValue}>{optimalSteps}</Text>
              <Text style={styles.modalStatLabel}>Optimal</Text>
            </View>
            <View style={styles.modalStatTile}>
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={styles.modalStatValue}
              >
                {elapsedTime}
              </Text>
              <Text style={styles.modalStatLabel}>Zeit</Text>
            </View>
          </View>
          <View style={styles.modalActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onHome}
              style={[styles.modalButton, styles.modalSecondary]}
            >
              <Text style={styles.modalSecondaryText}>Startseite</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onNext}
              style={[styles.modalButton, styles.modalPrimary]}
            >
              <Text style={styles.modalPrimaryText}>Neue Leiter</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.sm },
  boardPanel: {
    flex: 1,
    gap: tokens.space.xs,
    paddingTop: tokens.space.sm,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: tokens.space.sm,
  },
  statusText: {
    color: tokens.color.primaryDark,
    fontSize: tokens.type.small,
    fontWeight: "900",
  },
  ladderScroll: { flexGrow: 0, maxHeight: 300 },
  ladderScrollContent: {
    alignItems: "center",
    gap: 2,
    paddingVertical: tokens.space.xs,
  },
  stepWrap: { alignItems: "center", gap: tokens.space.xs },
  inputStep: { width: "100%", alignItems: "center", gap: tokens.space.xs },
  arrow: {
    color: tokens.color.primaryDark,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 16,
    textAlign: "center",
  },
  wordPill: {
    minWidth: 148,
    alignItems: "center",
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.xs,
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(255,255,255,0.78)",
  },
  targetPill: {
    backgroundColor: "#EAF6F0",
    borderColor: "rgba(33, 166, 122, 0.28)",
  },
  pillLabel: {
    color: tokens.color.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  pillWord: {
    color: tokens.color.ink,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 4,
    textAlign: "center",
  },
  inputRow: { width: "82%", flexDirection: "row", gap: tokens.space.xs },
  inputTile: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.sm,
    backgroundColor: "rgba(255,255,255,0.78)",
  },
  activeInputTile: {
    borderColor: tokens.color.primary,
    backgroundColor: "#FFF1DF",
  },
  inputTileText: { color: tokens.color.ink, fontSize: 20, fontWeight: "900" },
  statusBlock: {
    minHeight: 32,
    justifyContent: "center",
    gap: tokens.space.xs,
  },
  message: {
    color: tokens.color.muted,
    fontSize: tokens.type.body,
    textAlign: "center",
  },
  rating: {
    color: tokens.color.warning,
    fontSize: tokens.type.h2,
    fontWeight: "900",
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: tokens.space.sm,
  },
  smallButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space.sm,
    paddingVertical: tokens.space.xs,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 1,
    borderColor: tokens.color.line,
  },
  disabledButton: { opacity: 0.45 },
  smallButtonText: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontWeight: "900",
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: tokens.space.md,
    backgroundColor: "rgba(23, 19, 13, 0.48)",
  },
  modalCard: {
    width: "100%",
    maxHeight: "94%",
    gap: tokens.space.sm,
    padding: tokens.space.md,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.card,
  },
  modalTitle: {
    color: tokens.color.success,
    fontSize: tokens.type.h2,
    fontWeight: "900",
    textAlign: "center",
  },
  modalMessage: {
    color: tokens.color.muted,
    fontSize: tokens.type.body,
    lineHeight: 24,
    textAlign: "center",
  },
  modalLadderScroll: {
    flexGrow: 0,
    maxHeight: 300,
  },
  modalLadder: {
    alignItems: "center",
    paddingVertical: tokens.space.xs,
  },
  modalStep: { alignItems: "center", gap: 2 },
  modalArrow: {
    color: tokens.color.primaryDark,
    fontSize: 16,
    fontWeight: "900",
  },
  modalWord: {
    minWidth: 116,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(36, 107, 254, 0.1)",
    color: tokens.color.ink,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
  },
  modalStats: { flexDirection: "row", gap: tokens.space.xs },
  modalStatTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 76,
    padding: tokens.space.xs,
    borderRadius: tokens.radius.md,
    backgroundColor: "rgba(36, 107, 254, 0.1)",
  },
  modalStatValue: {
    color: tokens.color.ink,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  modalStatLabel: {
    color: tokens.color.muted,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: tokens.space.sm,
    marginTop: tokens.space.sm,
  },
  modalButton: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill,
  },
  modalSecondary: {
    borderWidth: 1,
    borderColor: tokens.color.line,
    backgroundColor: "white",
  },
  modalPrimary: { backgroundColor: tokens.color.primary },
  modalSecondaryText: {
    color: tokens.color.ink,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  modalPrimaryText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
});
