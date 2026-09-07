import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";

import { captureEvent } from "@/analytics/events";
import { ConfirmModal } from "@/components/ConfirmModal";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { GameResultModal } from "@/components/GameResultModal";
import { HelpModal } from "@/components/HelpModal";
import { ShakeView } from "@/components/ShakeView";
import { SmallGameAction } from "@/components/SmallGameAction";
import { getBerlinDateKey } from "@/daily/date";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { createNextDoppelGame } from "@/games/doppel/daily";
import { revealDoppelSolution, submitDoppelGuess, unlockDoppelHint } from "@/games/doppel/engine";
import { DoppelHint, DoppelState } from "@/games/doppel/types";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { getHintPolicy, requestAdHint } from "@/hints/policy";
import { useHintWallet } from "@/hints/useHintWallet";
import { isStartedProgress, loadProgress, loadProgressForGames, mergeCompletedStatus, saveProgress, type StoredProgress } from "@/storage/progress";
import { updateBadgeCount } from "@/notifications/badge";
import { scheduleDailyReminder } from "@/notifications/scheduler";
import { useGameRecorder } from "@/stats/recorder";

type DoppelGame = ReturnType<typeof createNextDoppelGame>;

function hintText(hint: DoppelHint): string {
  if (hint.type === "length") return `${hint.value} Buchstaben`;
  if (hint.type === "first_letter") return `Beginnt mit ${hint.value.toUpperCase()}`;
  if (hint.type === "letter") return `Buchstabe ${hint.index + 1}: ${hint.value.toUpperCase()}`;

  return hint.value;
}

export default function DoppelScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const today = getBerlinDateKey();
  const stats = useGameRecorder();
  const hintWallet = useHintWallet();
  const hintPolicy = getHintPolicy();
  const completedAtRef = useRef<string | undefined>(undefined);
  const completedStatusRef = useRef<StoredProgress["status"] | undefined>(undefined);
  const [game, setGame] = useState<DoppelGame>(() => createNextDoppelGame(undefined, today));
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<DoppelState>(game.state);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [shakeTick, setShakeTick] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);
  const [giveUpVisible, setGiveUpVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const { elapsedSeconds, reset: resetTimer } = useActiveTimer(state.status === "playing", finishedAt);

  useEffect(() => {
    loadProgress<DoppelState>("doppel", today).then((progress) => {
      completedAtRef.current = progress?.completedAt;
      completedStatusRef.current = progress?.completedStatus;
      if (isStartedProgress(progress)) {
        setGame({ dateKey: progress.dateKey, puzzle: progress.puzzle as DoppelGame["puzzle"], state: progress.state });
        setState(progress.state);
        setInput(typeof progress.draft === "string" ? progress.draft : "");
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
      gameId: "doppel",
      dateKey,
      draft: input,
      completedStatus,
      puzzle,
      puzzleId: puzzle.id,
      puzzleVersion: puzzle.version,
      status: state.status,
      state,
      completedAt
    });
  }, [dateKey, input, progressLoaded, puzzle, state]);

  useEffect(() => {
    if (state.status !== "playing") {
      loadProgressForGames(games.map((g) => g.id), dateKey).then((progress) => {
        updateBadgeCount(progress);
        scheduleDailyReminder().catch(() => {});
      });
    }
  }, [state.status, dateKey]);

  const solution = puzzle.solutions.find((item) => item.answer === state.solvedAnswer) ?? puzzle.solutions[0];
  const visibleHints = (puzzle.hints ?? []).slice(0, state.unlockedHints);
  const canSubmit = input.trim().length > 0 && state.status === "playing";
  const maxInputLength = Math.max(...puzzle.solutions.map((item) => Array.from(item.answer).length));
  const hasMoreHints = state.unlockedHints < (puzzle.hints?.length ?? 0);
  const hintDisabled = state.status !== "playing" || !hasMoreHints || (hintPolicy !== "ads" && !hintWallet.canConsume);
  const hintLabel = hintPolicy === "ads" ? "💡 Hinweis (Werbung)" : `💡 Hinweis (${hintWallet.wallet.balance}/3)`;

  useEffect(() => {
    captureEvent(posthog, "screen_viewed", { screen: "doppel", params: { dateKey } });
    captureEvent(posthog, "game_started", { gameId: "doppel", dateKey });
  }, [dateKey, posthog]);

  function addLetter(letter: string) {
    if (state.status !== "playing") return;
    setInput((current) => Array.from(current).length >= maxInputLength ? current : current + letter);
  }

  function backspace() {
    setInput((current) => Array.from(current).slice(0, -1).join(""));
  }

  function startStats() {
    stats.start({ gameId: "doppel", playDate: dateKey, puzzleId: puzzle.id, gameVersion: puzzle.version });
  }

  function submit() {
    startStats();
    const result = submitDoppelGuess(puzzle, state, input);

    setState(result.state);
    setMessage(result.ok ? "Gelöst." : result.reason);
    if (result.ok) {
      stats.recordAcceptedGuess(input);
      setInput("");
    } else {
      stats.recordRejectedGuess(result.reason, input);
      setShakeTick((value) => value + 1);
    }
    if (result.ok && result.state.status !== "playing") {
      stats.finish("won");
      hintWallet.onWin().then((granted) => {
        if (granted) setMessage("Hinweis erhalten! 💡");
      });
      setFinishedAt(Date.now());
      setResultVisible(true);
      captureEvent(posthog, "game_completed", {
        gameId: "doppel",
        dateKey,
        durationMs: elapsedSeconds * 1000,
        attempts: result.state.guesses.length,
        outcome: "won",
        success: true,
      });
    }
  }

  async function hint() {
    startStats();
    const nextState = unlockDoppelHint(puzzle, state);
    if (nextState.unlockedHints === state.unlockedHints) {
      setMessage("Keine weiteren Hinweise.");
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

    const unlockedHint = (puzzle.hints ?? [])[nextState.unlockedHints - 1];

    stats.recordHint(unlockedHint ? { source, type: unlockedHint.type } : { source });
    captureEvent(posthog, "hint_used", { gameId: "doppel", dateKey, source });
    setState(nextState);
    setMessage("Hinweis freigeschaltet.");
  }

  function reveal() {
    startStats();
    stats.finish("revealed");
    captureEvent(posthog, "solution_revealed", { gameId: "doppel", dateKey, attempts: state.guesses.length });
    captureEvent(posthog, "game_completed", {
      gameId: "doppel",
      dateKey,
      durationMs: elapsedSeconds * 1000,
      attempts: state.guesses.length,
      outcome: "revealed",
      success: false,
    });
    setState(revealDoppelSolution(puzzle, state));
    setMessage("Lösung aufgedeckt.");
    setGiveUpVisible(false);
    setFinishedAt(Date.now());
    setResultVisible(true);
  }

  function startNextGame() {
    const nextGame = createNextDoppelGame(puzzle.id, today);

    setGame(nextGame);
    setState(nextGame.state);
    setInput("");
    setMessage("");
    setResultVisible(false);
    setFinishedAt(null);
    setProgressLoaded(true);
    resetTimer();
  }

  function resultTitle() {
    if (state.status === "won") return "Verbindung gefunden.";
    return "Aufgelöst.";
  }

  function goBack() {
    if (state.status === "playing" && state.guesses.length > 0) {
      captureEvent(posthog, "game_abandoned", { gameId: "doppel", dateKey, attempts: state.guesses.length });
    }
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <GameScreenFrame
      actions={state.status === "playing" ? (
        <View style={{ flexDirection: "row", flexShrink: 1, flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "center" }}>
          <SmallGameAction disabled={hintDisabled} label={hintLabel} onPress={hint} />
          <SmallGameAction label="Lösung anzeigen" onPress={() => setGiveUpVisible(true)} />
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
        captureEvent(posthog, "help_opened", { gameId: "doppel", dateKey });
        setHelpVisible(true);
      }}
      title="Doppel"
    >
      <View style={styles.wrap}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.sideWord}>{puzzle.leftWord.toUpperCase()}</Text>
            <Text style={styles.plus}>+</Text>
            <ShakeView trigger={shakeTick}>
              <View style={styles.answerBox}>
                <Text style={styles.answerText}>{(state.solvedAnswer ?? input)?.toLocaleUpperCase("de-DE") || "?".repeat(Array.from(puzzle.solutions[0].answer).length)}</Text>
              </View>
            </ShakeView>
            <Text style={styles.plus}>+</Text>
            <Text style={styles.sideWord}>{puzzle.rightWord.toUpperCase()}</Text>
          </View>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {visibleHints.length > 0 ? (
            <View style={styles.hints}>
              {visibleHints.map((item, index) => <Text key={index} style={styles.hint}>• {hintText(item)}</Text>)}
            </View>
          ) : null}

          {state.status === "won" || state.status === "revealed" ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>{state.status === "won" ? "Stark." : "Heute gelernt:"}</Text>
              <Text style={styles.compound}>{solution.leftCompound}</Text>
              <Text style={styles.compound}>{solution.rightCompound}</Text>
            </View>
          ) : null}

        </ScrollView>
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
        actionLabel="Neues Spiel"
        attempts={state.guesses.length}
        dateKey={dateKey}
        durationMs={elapsedSeconds * 1000}
        gameId="doppel"
        guesses={state.guesses}
        message={state.status === "won" ? `${solution.leftCompound} · ${solution.rightCompound}` : "Die Lösung ist raus. Noch eins?"}
        onFeedback={(rating) => captureEvent(posthog, "game_feedback_submitted", { gameId: "doppel", dateKey, rating, outcome: state.status })}
        onHome={() => router.replace("/")}
        onNext={startNextGame}
        onShare={() => captureEvent(posthog, "result_shared", { gameId: "doppel", dateKey, scope: "game", outcome: state.status })}
        onViewed={() => captureEvent(posthog, "result_viewed", { gameId: "doppel", dateKey, scope: "game", outcome: state.status, success: state.status === "won" })}
        outcome={state.status === "playing" ? undefined : state.status}
        shareText={`Wortkniff Doppel ${dateKey}\n${state.status === "won" ? "Gelöst" : "Aufgedeckt"} · ${state.guesses.length} Versuche · ${elapsedSeconds} Sek.`}
        solution={solution.answer}
        success={state.status === "won"}
        stats={[
          { label: "Hinweise", value: state.unlockedHints },
          { label: "Zeit", value: `${elapsedSeconds} Sek.` }
        ]}
        title={resultTitle()}
        visible={resultVisible && state.status !== "playing"}
      />
      <HelpModal {...gameHelp.doppel} onClose={() => setHelpVisible(false)} visible={helpVisible} />
    </GameScreenFrame>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scrollContent: { gap: tokens.space.md, paddingBottom: tokens.space.md },
  card: { alignItems: "center", gap: tokens.space.xs, padding: tokens.space.lg, borderRadius: tokens.radius.lg, backgroundColor: "rgba(253, 251, 247, 0.72)", borderWidth: 1, borderColor: tokens.color.line },
  sideWord: { color: tokens.color.ink, fontSize: 24, fontWeight: "900", letterSpacing: 1 },
  plus: { color: tokens.color.muted, fontSize: 18, fontWeight: "900" },
  answerBox: { minWidth: 120, alignItems: "center", paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.sm, borderRadius: tokens.radius.pill, backgroundColor: "rgba(255,255,255,0.58)", borderWidth: 1, borderColor: tokens.color.line },
  answerText: { color: tokens.color.ink, fontSize: 22, fontWeight: "900", letterSpacing: 2 },
  message: { color: tokens.color.muted, fontSize: tokens.type.body, textAlign: "center", lineHeight: 24 },
  hints: { gap: tokens.space.xs, padding: tokens.space.sm, borderRadius: tokens.radius.md, backgroundColor: "rgba(255,255,255,0.5)" },
  hint: { color: tokens.color.ink, fontSize: tokens.type.body, fontWeight: "700" },
  resultCard: { gap: tokens.space.sm, padding: tokens.space.lg, borderRadius: tokens.radius.lg, backgroundColor: "#E5F7EF" },
  resultTitle: { color: tokens.color.success, fontSize: tokens.type.h2, fontWeight: "900" },
  compound: { color: tokens.color.ink, fontSize: 24, fontWeight: "900" }
});
