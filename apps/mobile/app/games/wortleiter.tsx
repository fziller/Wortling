import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useEffect, useRef, useState } from "react";
import {
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

import { captureEvent } from "@/analytics/events";
import { ConfirmModal } from "@/components/ConfirmModal";
import { GameResultModal } from "@/components/GameResultModal";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { HelpModal } from "@/components/HelpModal";
import { LetterInputTiles } from "@/components/LetterInputTiles";
import { SmallGameAction } from "@/components/SmallGameAction";
import { getBerlinDateKey } from "@/daily/date";
import { useNextOpenDailyKniff } from "@/dailyKniffe/continuation";
import { tokens } from "@/design/tokens";
import { buildSimpleShareText } from "@/games/share/grid";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import {
  createNextWortleiterGame,
} from "@/games/wortleiter/daily";
import {
  getWortleiterRating,
  getWortleiterHintWord,
  applyWortleiterHint,
  revealWortleiterSolution,
  submitWortleiterGuess,
  undoWortleiterStep,
} from "@/games/wortleiter/engine";
import type { WortleiterState } from "@/games/wortleiter/types";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { getHintPolicy, requestAdHint } from "@/hints/policy";
import { useHintWallet } from "@/hints/useHintWallet";
import { updateBadgeCount } from "@/notifications/badge";
import { scheduleDailyReminder } from "@/notifications/scheduler";
import {
  isStartedProgress,
  loadProgress,
  loadProgressForGames,
  mergeCompletedStatus,
  saveProgress,
  type StoredProgress,
} from "@/storage/progress";
import { useGameRecorder } from "@/stats/recorder";
import { rejectMessage } from "@/games/rejectMessages";

type WortleiterGame = ReturnType<typeof createNextWortleiterGame>;

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
  const today = getBerlinDateKey();
  const stats = useGameRecorder();
  const hintWallet = useHintWallet();
  const hintPolicy = getHintPolicy();
  const completedAtRef = useRef<string | undefined>(undefined);
  const completedStatusRef = useRef<StoredProgress["status"] | undefined>(undefined);
  const [game, setGame] = useState<WortleiterGame>(() => createNextWortleiterGame(undefined, today));
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<WortleiterState>(game.state);
  const [inputLetters, setInputLetters] = useState(() =>
    createEmptyInput(game.puzzle.wordLength),
  );
  const [cursorIndex, setCursorIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [shakeTick, setShakeTick] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);
  const [revealVisible, setRevealVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const { elapsedSeconds, reset: resetTimer } = useActiveTimer(state.status === "playing", finishedAt);
  const nextDailyKniffRoute = useNextOpenDailyKniff("wortleiter", dateKey, state.status === "won");

  useEffect(() => {
    captureEvent(posthog, "screen_viewed", { screen: "wortleiter", params: { dateKey } });
    captureEvent(posthog, "game_started", { gameId: "wortleiter", dateKey });
  }, [dateKey, posthog]);

  useEffect(() => {
    loadProgress<WortleiterState>("wortleiter", today).then((progress) => {
      completedAtRef.current = progress?.completedAt;
      completedStatusRef.current = progress?.completedStatus;
      if (isStartedProgress(progress)) {
        const nextGame = { dateKey: progress.dateKey, puzzle: progress.puzzle as WortleiterGame["puzzle"], state: progress.state };
        setGame(nextGame);
        setState(progress.state);
        setInputLetters(Array.isArray(progress.draft) ? progress.draft.map(String) : createEmptyInput(nextGame.puzzle.wordLength));
        setFinishedAt(
          progress.completedAt ? Date.parse(progress.completedAt) : null,
        );
        setResultVisible(progress.status !== "playing");
      }
      setProgressLoaded(true);
    });
  }, [today]);

  useEffect(() => {
    if (!progressLoaded) return;

    const completedAt =
      state.status !== "playing"
        ? (state.completedAt ?? new Date().toISOString())
        : completedAtRef.current;
    const completedStatus = mergeCompletedStatus(completedStatusRef.current, state.status !== "playing" ? state.status : undefined);
    completedAtRef.current = completedAt;
    completedStatusRef.current = completedStatus;
    saveProgress({
      gameId: "wortleiter",
      dateKey,
      draft: inputLetters,
      completedStatus,
      puzzle,
      puzzleId: puzzle.id,
      puzzleVersion: puzzle.version,
      status: state.status,
      state: {
        ...state,
        startedAt: state.startedAt ?? new Date().toISOString(),
        completedAt,
      },
      startedAt: state.startedAt ?? new Date().toISOString(),
      completedAt,
    });
  }, [dateKey, inputLetters, progressLoaded, puzzle, state]);

  useEffect(() => {
    if (state.status !== "playing") {
      loadProgressForGames(
        games.map((game) => game.id),
        dateKey,
      ).then((progress) => {
        updateBadgeCount(progress);
        scheduleDailyReminder().catch(() => {});
      });
    }
  }, [state.status, dateKey]);

  const canSubmit = inputLetters.every(Boolean) && state.status === "playing";
  const steps = Math.max(0, state.words.length - 1);
  const hintWord = getWortleiterHintWord(puzzle, state);
  const hintDisabled = state.status !== "playing" || !hintWord || (hintPolicy !== "ads" && !hintWallet.canConsume);
  const hintLabel = hintPolicy === "ads" ? "💡 Hinweis (Werbung)" : `💡 Hinweis (${hintWallet.wallet.balance}/3)`;

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

  function startStats() {
    stats.start({ gameId: "wortleiter", playDate: dateKey, puzzleId: puzzle.id, gameVersion: puzzle.version, wordLength: puzzle.wordLength });
  }

  function submit() {
    startStats();
    const result = submitWortleiterGuess(puzzle, state, inputLetters.join(""));

    setState(result.state);
    setMessage(
      result.ok
        ? result.state.status === "won"
          ? "Geschafft!"
          : ""
        : rejectMessage(result.reason),
    );

    if (result.ok) {
      const lastWord = result.state.words[result.state.words.length - 1];

      stats.recordAcceptedGuess(lastWord);
      setInputLetters(createEmptyInput(puzzle.wordLength));
      setCursorIndex(0);
    } else {
      stats.recordRejectedGuess(result.reason, inputLetters.join(""));
      setShakeTick((value) => value + 1);
    }

    if (result.ok && result.state.status === "won") {
      const now = Date.now();

      stats.finish("won");
      hintWallet.onWin().then((granted) => {
        if (granted) setMessage("Hinweis erhalten! 💡");
      });
      setFinishedAt(now);
      setResultVisible(true);
      captureEvent(posthog, "game_completed", {
        gameId: "wortleiter",
        dateKey,
        durationMs: elapsedSeconds * 1000,
        attempts: result.state.words.length - 1,
        outcome: "won",
        success: true,
      });
    }
  }

  async function useHint() {
    startStats();
    const nextState = applyWortleiterHint(puzzle, state);
    const hintedWord = nextState.words[nextState.words.length - 1];

    if (nextState === state) {
      setMessage("Von hier finde ich keinen sauberen nächsten Schritt.");
      return;
    }

    let source = "earned";
    if (hintPolicy === "ads") {
      const ok = await requestAdHint();
      if (!ok) {
        setMessage("Werbung gerade nicht verfügbar.");
        return;
      }
      source = "ad";
    } else {
      const consumed = await hintWallet.tryConsume();
      if (!consumed) {
        setMessage("Keine Hinweise verfügbar.");
        return;
      }
    }

    setState(nextState);
    setInputLetters(createEmptyInput(puzzle.wordLength));
    setCursorIndex(0);
    stats.recordHint({ source, gameId: "wortleiter", wordAdded: hintedWord });
    captureEvent(posthog, "hint_used", { gameId: "wortleiter", dateKey, source });
    setMessage(nextState.status === "won" ? "Geschafft!" : "Hinweis: nächster Schritt ergänzt.");

    if (nextState.status === "won") {
      stats.finish("won");
      hintWallet.onWin().then((granted) => {
        if (granted) setMessage("Hinweis erhalten! 💡");
      });
      setFinishedAt(Date.now());
      setResultVisible(true);
      captureEvent(posthog, "game_completed", { gameId: "wortleiter", dateKey, durationMs: elapsedSeconds * 1000, attempts: nextState.words.length - 1, outcome: "won", success: true });
    }
  }

  function undo() {
    setState((current) => undoWortleiterStep(current));
    setMessage("");
  }

  function reveal() {
    startStats();
    stats.finish("revealed");
    captureEvent(posthog, "solution_revealed", { gameId: "wortleiter", dateKey, attempts: steps });
    captureEvent(posthog, "game_completed", {
      gameId: "wortleiter",
      dateKey,
      durationMs: elapsedSeconds * 1000,
      attempts: steps,
      outcome: "revealed",
      success: false,
    });
    const nextState = revealWortleiterSolution(puzzle, state);
    setState(nextState);
    setMessage("Lösung aufgedeckt.");
    setInputLetters(createEmptyInput(puzzle.wordLength));
    setCursorIndex(0);
    setRevealVisible(false);
    setFinishedAt(Date.now());
    setResultVisible(true);
  }

  function startNextPuzzle() {
    const nextGame = createNextWortleiterGame(puzzle.id, today);

    setGame(nextGame);
    setState(nextGame.state);
    setInputLetters(createEmptyInput(nextGame.puzzle.wordLength));
    setCursorIndex(0);
    setMessage("");
    setResultVisible(false);
    setRevealVisible(false);
    setProgressLoaded(true);
    setFinishedAt(null);
    resetTimer();
  }

  function goBack() {
    if (state.status === "playing" && state.words.length > 1) {
      captureEvent(posthog, "game_abandoned", { gameId: "wortleiter", dateKey, attempts: state.words.length - 1 });
    }
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <GameScreenFrame
      actions={state.status === "playing" ? (
        <View style={{ flexDirection: "row", flexShrink: 1, flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "center" }}>
          <SmallGameAction disabled={state.words.length <= 1} label="Zurück" onPress={undo} />
          <SmallGameAction disabled={hintDisabled} label={hintLabel} onPress={useHint} />
          <SmallGameAction label="Lösung anzeigen" onPress={() => setRevealVisible(true)} />
        </View>
      ) : null}
      keyboard={{
        disabled: state.status !== "playing",
        onBackspace: backspace,
        onLetter: addLetter,
        onSubmit: submit,
        submitDisabled: !canSubmit,
      }}
      onBack={goBack}
      onHelp={() => {
        captureEvent(posthog, "help_opened", { gameId: "wortleiter", dateKey });
        setHelpVisible(true);
      }}
      title="Wortleiter"
    >
      <View style={styles.wrap}>
        <View style={styles.boardPanel}>
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
              <Animated.View
                entering={FadeInDown.duration(tokens.motion.quick)}
                layout={LinearTransition.springify()}
                style={styles.inputStep}
              >
                <Text style={styles.arrow}>↓</Text>
                <LetterInputTiles
                  cursorIndex={cursorIndex}
                  letters={inputLetters}
                  onCursorChange={setCursorIndex}
                  shakeTrigger={shakeTick}
                />
              </Animated.View>
            ) : null}

            {state.words[state.words.length - 1] !== puzzle.targetWord ? (
              <Animated.View
                entering={FadeInDown.duration(tokens.motion.quick)}
                layout={LinearTransition.springify()}
                style={styles.stepWrap}
              >
                <Text style={styles.arrow}>↓</Text>
                <LadderWord label="Ziel" target word={puzzle.targetWord} />
              </Animated.View>
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
      </View>
      <ConfirmModal
        confirmLabel="Lösung zeigen"
        message="Die Lösung wird angezeigt und die Runde zählt nicht als geschafft."
        onCancel={() => setRevealVisible(false)}
        onConfirm={reveal}
        title="Lösung anzeigen?"
        visible={revealVisible}
      />
      <GameResultModal
        actionLabel={nextDailyKniffRoute ? "Nächster Tageskniff" : "Neue Leiter"}
        attempts={steps}
        dateKey={dateKey}
        durationMs={elapsedSeconds * 1000}
        gameId="wortleiter"
        guesses={state.words}
        message={state.status === "won" ? `Deine Schritte: ${steps} · Optimal: ${puzzle.optimalSteps}` : "Die kürzeste bekannte Leiter ist aufgedeckt."}
        onFeedback={(rating) => captureEvent(posthog, "game_feedback_submitted", { gameId: "wortleiter", dateKey, rating, outcome: state.status })}
        onHome={() => router.replace("/")}
        onNext={() => nextDailyKniffRoute ? router.push(nextDailyKniffRoute as never) : startNextPuzzle()}
        onShare={() => captureEvent(posthog, "result_shared", { gameId: "wortleiter", dateKey, scope: "game", outcome: state.status })}
        onViewed={() => captureEvent(posthog, "result_viewed", { gameId: "wortleiter", dateKey, scope: "game", outcome: state.status, success: state.status === "won" })}
        outcome={state.status === "playing" ? undefined : state.status}
        shareText={buildSimpleShareText("Wortleiter", dateKey, state.status, `${steps} Schritte · ${formatElapsedTime(elapsedSeconds)}`)}
        solution={state.words[state.words.length - 1]}
        stats={[
          { label: "Schritte", value: steps },
          { label: "Optimal", value: puzzle.optimalSteps },
          { label: "Zeit", value: formatElapsedTime(elapsedSeconds) }
        ]}
        success={state.status === "won"}
        title={state.status === "won" ? "Geschafft!" : "Aufgelöst."}
        visible={resultVisible && state.status !== "playing"}
      />
      <HelpModal
        {...gameHelp.wortleiter}
        onClose={() => setHelpVisible(false)}
        visible={helpVisible}
      />
    </GameScreenFrame>
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

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.sm },
  boardPanel: {
    flex: 1,
    minHeight: 0,
    gap: tokens.space.xs,
  },
  ladderScroll: { flex: 1, minHeight: 0 },
  ladderScrollContent: {
    alignItems: "stretch",
    gap: 4,
    paddingBottom: tokens.space.xs,
  },
  stepWrap: { alignItems: "center", gap: tokens.space.xs },
  inputStep: { width: "100%", alignItems: "stretch", gap: tokens.space.xs },
  arrow: {
    color: tokens.color.primaryDark,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 16,
    textAlign: "center",
  },
  wordPill: {
    minWidth: 104,
    alignItems: "center",
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
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
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  pillWord: {
    color: tokens.color.ink,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 4,
    textAlign: "center",
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
});
