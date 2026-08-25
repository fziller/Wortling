import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { ConfirmModal } from "@/components/ConfirmModal";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { GameResultModal } from "@/components/GameResultModal";
import { HelpModal } from "@/components/HelpModal";
import { SmallGameAction } from "@/components/SmallGameAction";
import { getBerlinDateKey } from "@/daily/date";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { createNextDoppelGame } from "@/games/doppel/daily";
import { revealDoppelSolution, submitDoppelGuess, unlockDoppelHint } from "@/games/doppel/engine";
import { DoppelHint, DoppelState } from "@/games/doppel/types";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { isStartedProgress, loadProgress, loadProgressForGames, saveProgress, type StoredProgress } from "@/storage/progress";
import { updateBadgeCount } from "@/notifications/badge";
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
  const today = getBerlinDateKey();
  const stats = useGameRecorder();
  const completedAtRef = useRef<string | undefined>(undefined);
  const completedStatusRef = useRef<StoredProgress["status"] | undefined>(undefined);
  const [game, setGame] = useState<DoppelGame>(() => createNextDoppelGame(undefined, today));
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<DoppelState>(game.state);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
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
    const completedStatus = state.status !== "playing" ? state.status : completedStatusRef.current;
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
      loadProgressForGames(games.map((g) => g.id), dateKey).then(updateBadgeCount);
    }
  }, [state.status, dateKey]);

  const solution = puzzle.solutions.find((item) => item.answer === state.solvedAnswer) ?? puzzle.solutions[0];
  const visibleHints = (puzzle.hints ?? []).slice(0, state.unlockedHints);
  const canSubmit = input.trim().length > 0 && state.status === "playing";
  const maxInputLength = Math.max(...puzzle.solutions.map((item) => Array.from(item.answer).length));

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
    }
    if (result.ok && result.state.status !== "playing") {
      stats.finish("won");
      setFinishedAt(Date.now());
      setResultVisible(true);
    }
  }

  function hint() {
    startStats();
    const nextState = unlockDoppelHint(puzzle, state);

    if (nextState.unlockedHints > state.unlockedHints) {
      const unlockedHint = (puzzle.hints ?? [])[nextState.unlockedHints - 1];

      stats.recordHint(unlockedHint ? { type: unlockedHint.type } : undefined);
    }
    setState(nextState);
    setMessage(nextState.unlockedHints === state.unlockedHints ? "Keine weiteren Hinweise." : "Hinweis freigeschaltet.");
  }

  function reveal() {
    startStats();
    stats.finish("revealed");
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
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <GameScreenFrame
      actions={state.status === "playing" ? (
        <>
          <SmallGameAction label="Hinweis" onPress={hint} />
          <SmallGameAction label="Lösung anzeigen" onPress={() => setGiveUpVisible(true)} />
        </>
      ) : null}
      keyboard={{
        disabled: state.status !== "playing",
        onBackspace: backspace,
        onLetter: addLetter,
        onSubmit: submit,
        submitDisabled: !canSubmit,
      }}
      onBack={goBack}
      onHelp={() => setHelpVisible(true)}
      subtitle={dateKey}
      title="Doppel"
    >
      <View style={styles.wrap}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.sideWord}>{puzzle.leftWord.toUpperCase()}</Text>
            <Text style={styles.plus}>+</Text>
            <View style={styles.answerBox}>
              <Text style={styles.answerText}>{(state.solvedAnswer ?? input)?.toLocaleUpperCase("de-DE") || "?".repeat(Array.from(puzzle.solutions[0].answer).length)}</Text>
            </View>
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
        guesses={state.guesses}
        message={state.status === "won" ? `${solution.leftCompound} · ${solution.rightCompound}` : "Die Lösung ist raus. Noch eins?"}
        onHome={() => router.replace("/")}
        onNext={startNextGame}
        solution={solution.answer}
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
