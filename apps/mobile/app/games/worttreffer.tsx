import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";

import { AppButton } from "@/components/AppButton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { GameHeader } from "@/components/GameHeader";
import { HelpModal } from "@/components/HelpModal";
import { Screen } from "@/components/Screen";
import { WordKeyboard } from "@/components/WordKeyboard";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { createDailyWorttrefferGame, createPracticeWorttrefferGame } from "@/games/worttreffer/daily";
import { getWorttrefferLetterStates, revealWorttrefferSolution, submitWorttrefferGuess } from "@/games/worttreffer/engine";
import { WorttrefferState } from "@/games/worttreffer/types";
import { updateBadgeCount } from "@/notifications/badge";
import { loadProgress, loadProgressForGames, saveProgress } from "@/storage/progress";

const dailyGame = createDailyWorttrefferGame();

export default function WorttrefferScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const [game, setGame] = useState(dailyGame);
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<WorttrefferState>(game.state);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [helpVisible, setHelpVisible] = useState(false);
  const [giveUpVisible, setGiveUpVisible] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    try {
      posthog.capture("screen_viewed", { screen: "worttreffer", params: { dateKey } });
      posthog.capture("game_started", { gameId: "worttreffer", dateKey });
    } catch {
      // Analytics must never break offline gameplay.
    }
  }, [dateKey, posthog]);

  useEffect(() => {
    loadProgress<WorttrefferState>("worttreffer", dateKey).then((progress) => {
      if (progress?.puzzleId === puzzle.id && progress.puzzleVersion === puzzle.version) {
        setState(progress.state);
      }
    });
  }, [dateKey, puzzle.id, puzzle.version]);

  useEffect(() => {
    saveProgress({
      gameId: "worttreffer",
      dateKey,
      puzzleId: puzzle.id,
      puzzleVersion: puzzle.version,
      status: state.status,
      state,
      completedAt: state.status !== "playing" ? new Date().toISOString() : undefined
    });
  }, [dateKey, puzzle.id, puzzle.version, state]);

  useEffect(() => {
    if (state.status !== "playing") {
      loadProgressForGames(games.map((g) => g.id), dateKey).then(updateBadgeCount);
    }
  }, [state.status, dateKey]);

  const canSubmit = input.length === puzzle.wordLength && state.status === "playing";
  const letterStates = getWorttrefferLetterStates(state);

  function addLetter(letter: string) {
    if (state.status !== "playing") return;
    setInput((current) => current.length >= puzzle.wordLength ? current : current + letter);
  }

  function backspace() {
    setInput((current) => current.slice(0, -1));
  }

  function submit() {
    const result = submitWorttrefferGuess(puzzle, state, input);

    setState(result.state);
    setMessage(result.ok ? result.state.status === "won" ? "Getroffen!" : result.state.status === "lost" ? "Heute nicht getroffen." : "Weiter geht's." : result.reason);
    if (result.ok) {
      setInput("");
    }
    if (result.ok && result.state.status !== "playing") {
      try {
        posthog.capture("game_completed", { gameId: "worttreffer", dateKey, durationMs: Date.now() - startedAt, attempts: result.state.guesses.length });
      } catch {
        // Analytics must never break offline gameplay.
      }
    }
  }

  function reveal() {
    setState((current) => revealWorttrefferSolution(current));
    setMessage("Lösung aufgedeckt.");
    setInput("");
    setGiveUpVisible(false);
  }

  function startNextWord() {
    const nextGame = createPracticeWorttrefferGame(puzzle.answer);

    setGame(nextGame);
    setState(nextGame.state);
    setInput("");
    setMessage("");
    setStartedAt(Date.now());
  }

  return (
    <Screen>
      <View style={styles.wrap}>
        <GameHeader onBack={() => router.back()} onHelp={() => setHelpVisible(true)} subtitle={dateKey} title="Worttreffer" />

        <View style={styles.board}>
          {Array.from({ length: puzzle.maxAttempts }).map((_, rowIndex) => {
            const guess = state.guesses[rowIndex];
            const letters = guess ? Array.from(guess.value) : rowIndex === state.guesses.length ? Array.from(input.padEnd(puzzle.wordLength, " ")) : Array.from(" ".repeat(puzzle.wordLength));

            return (
              <View key={rowIndex} style={styles.tileRow}>
                {letters.map((letter, letterIndex) => {
                  const mark = guess?.marks[letterIndex];

                  return (
                    <View key={`${rowIndex}-${letterIndex}`} style={[styles.tile, mark && styles[mark]]}>
                      <Text style={[styles.tileText, mark && styles.markedTileText]}>{letter.trim().toUpperCase()}</Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        <View style={styles.statusBlock}>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {state.status === "lost" || state.status === "revealed" ? <Text style={styles.answer}>Lösung: {puzzle.answer.toUpperCase()}</Text> : null}
        </View>

        <View style={styles.bottom}>
          {state.status === "playing" ? (
            <Pressable accessibilityRole="button" onPress={() => setGiveUpVisible(true)} style={styles.giveUpButton}>
              <Text style={styles.giveUpText}>Aufgeben</Text>
            </Pressable>
          ) : null}
          <WordKeyboard disabled={state.status !== "playing"} letterStates={letterStates} onBackspace={backspace} onLetter={addLetter} onSubmit={submit} submitDisabled={!canSubmit} />
          {state.status !== "playing" ? <AppButton label="Neues Wort" onPress={startNextWord} /> : null}
        </View>
      </View>
      <ConfirmModal
        confirmLabel="Lösung zeigen"
        message="Die Lösung wird angezeigt und die Runde zählt nicht als geschafft."
        onCancel={() => setGiveUpVisible(false)}
        onConfirm={reveal}
        title="Aufgeben?"
        visible={giveUpVisible}
      />
      <HelpModal {...gameHelp.worttreffer} onClose={() => setHelpVisible(false)} visible={helpVisible} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.md },
  board: { flex: 1, justifyContent: "center", gap: 7, paddingTop: tokens.space.sm },
  tileRow: { flexDirection: "row", gap: 7 },
  tile: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: tokens.color.line, borderRadius: tokens.radius.sm, backgroundColor: "rgba(255,255,255,0.5)" },
  tileText: { color: tokens.color.ink, fontSize: 25, fontWeight: "900" },
  markedTileText: { color: "white" },
  absent: { backgroundColor: "#7B736A", borderColor: "#7B736A" },
  present: { backgroundColor: "#D98500", borderColor: "#D98500" },
  correct: { backgroundColor: tokens.color.success, borderColor: tokens.color.success },
  statusBlock: { minHeight: 56, justifyContent: "center", gap: tokens.space.xs },
  message: { color: tokens.color.muted, fontSize: tokens.type.body, textAlign: "center" },
  answer: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900", textAlign: "center" },
  bottom: { gap: tokens.space.sm, paddingBottom: tokens.space.md },
  giveUpButton: { alignSelf: "flex-end", paddingHorizontal: tokens.space.sm, paddingVertical: tokens.space.xs },
  giveUpText: { color: tokens.color.muted, fontSize: tokens.type.small, fontWeight: "900" }
});
