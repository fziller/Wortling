import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/AppButton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { GameHeader } from "@/components/GameHeader";
import { HelpModal } from "@/components/HelpModal";
import { Screen } from "@/components/Screen";
import { WordKeyboard } from "@/components/WordKeyboard";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { createDailyDoppelGame, createPracticeDoppelGame } from "@/games/doppel/daily";
import { revealDoppelSolution, submitDoppelGuess, unlockDoppelHint } from "@/games/doppel/engine";
import { DoppelHint, DoppelState } from "@/games/doppel/types";
import { loadProgress, loadProgressForGames, saveProgress } from "@/storage/progress";
import { updateBadgeCount } from "@/notifications/badge";

const dailyGame = createDailyDoppelGame();

function hintText(hint: DoppelHint): string {
  if (hint.type === "length") return `${hint.value} Buchstaben`;
  if (hint.type === "first_letter") return `Beginnt mit ${hint.value.toUpperCase()}`;
  if (hint.type === "letter") return `Buchstabe ${hint.index + 1}: ${hint.value.toUpperCase()}`;

  return hint.value;
}

export default function DoppelScreen() {
  const router = useRouter();
  const [game, setGame] = useState(dailyGame);
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<DoppelState>(game.state);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("Finde ein Wort, das beide Seiten verbindet.");
  const [helpVisible, setHelpVisible] = useState(false);
  const [giveUpVisible, setGiveUpVisible] = useState(false);

  useEffect(() => {
    loadProgress<DoppelState>("doppel", dateKey).then((progress) => {
      if (progress?.puzzleId === puzzle.id && progress.puzzleVersion === puzzle.version) {
        setState(progress.state);
      }
    });
  }, [dateKey, puzzle.id, puzzle.version]);

  useEffect(() => {
    saveProgress({
      gameId: "doppel",
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

  function submit() {
    const result = submitDoppelGuess(puzzle, state, input);

    setState(result.state);
    setMessage(result.ok ? "Gelöst." : result.reason);
    if (result.ok) setInput("");
  }

  function hint() {
    const nextState = unlockDoppelHint(puzzle, state);
    setState(nextState);
    setMessage(nextState.unlockedHints === state.unlockedHints ? "Keine weiteren Hinweise." : "Hinweis freigeschaltet.");
  }

  function reveal() {
    setState(revealDoppelSolution(puzzle, state));
    setMessage("Lösung aufgedeckt.");
    setGiveUpVisible(false);
  }

  function startNextGame() {
    const nextGame = createPracticeDoppelGame(puzzle.id);

    setGame(nextGame);
    setState(nextGame.state);
    setInput("");
    setMessage("Finde ein Wort, das beide Seiten verbindet.");
  }

  return (
    <Screen>
      <View style={styles.wrap}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <GameHeader onBack={() => router.back()} onHelp={() => setHelpVisible(true)} subtitle={dateKey} title="Doppel" />

          <View style={styles.card}>
            <Text style={styles.sideWord}>{puzzle.leftWord.toUpperCase()}</Text>
            <Text style={styles.plus}>+</Text>
            <View style={styles.answerBox}>
              <Text style={styles.answerText}>{state.solvedAnswer?.toUpperCase() ?? "?".repeat(Array.from(puzzle.solutions[0].answer).length)}</Text>
            </View>
            <Text style={styles.plus}>+</Text>
            <Text style={styles.sideWord}>{puzzle.rightWord.toUpperCase()}</Text>
          </View>

          <Text style={styles.message}>{message}</Text>

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
          ) : (
            <View style={styles.inputCard}>
              <View style={styles.inputBox}>
                <Text style={[styles.inputText, !input && styles.placeholder]}>{input ? input.toLocaleUpperCase("de-DE") : "Lösung"}</Text>
              </View>
              <WordKeyboard disabled={state.status !== "playing"} onBackspace={backspace} onLetter={addLetter} onSubmit={submit} submitDisabled={!canSubmit} />
            </View>
          )}

          <View style={styles.actions}>
            {state.status === "playing" ? (
              <>
                <AppButton label="Hinweis" onPress={hint} />
                <Pressable accessibilityRole="button" onPress={() => setGiveUpVisible(true)} style={styles.giveUpButton}>
                  <Text style={styles.giveUpText}>Aufgeben</Text>
                </Pressable>
              </>
            ) : (
              <AppButton label="Neues Spiel" onPress={startNextGame} />
            )}
          </View>
        </ScrollView>
      </View>
      <ConfirmModal
        confirmLabel="Lösung zeigen"
        message="Die Lösung wird angezeigt und die Runde zählt nicht als geschafft."
        onCancel={() => setGiveUpVisible(false)}
        onConfirm={reveal}
        title="Aufgeben?"
        visible={giveUpVisible}
      />
      <HelpModal {...gameHelp.doppel} onClose={() => setHelpVisible(false)} visible={helpVisible} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.lg },
  scrollContent: { gap: tokens.space.lg, paddingBottom: tokens.space.xl },
  card: { alignItems: "center", gap: tokens.space.sm, padding: tokens.space.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.card, borderWidth: 1, borderColor: tokens.color.line },
  sideWord: { color: tokens.color.ink, fontSize: 28, fontWeight: "900", letterSpacing: 1 },
  plus: { color: tokens.color.muted, fontSize: 24, fontWeight: "900" },
  answerBox: { paddingHorizontal: tokens.space.lg, paddingVertical: tokens.space.md, borderRadius: tokens.radius.md, backgroundColor: "#FFE2D4" },
  answerText: { color: tokens.color.primaryDark, fontSize: 30, fontWeight: "900", letterSpacing: 2 },
  message: { color: tokens.color.muted, fontSize: tokens.type.body, textAlign: "center", lineHeight: 24 },
  inputCard: { gap: tokens.space.md },
  inputBox: { minHeight: 58, alignItems: "center", justifyContent: "center", paddingHorizontal: tokens.space.lg, borderRadius: tokens.radius.pill, backgroundColor: "white" },
  inputText: { color: tokens.color.ink, fontSize: 24, fontWeight: "900", letterSpacing: 1, textAlign: "center" },
  placeholder: { color: "#B09E8B" },
  actions: { gap: tokens.space.md },
  giveUpButton: { alignSelf: "center", paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.xs },
  giveUpText: { color: tokens.color.muted, fontSize: tokens.type.small, fontWeight: "900" },
  hints: { gap: tokens.space.sm, padding: tokens.space.md, borderRadius: tokens.radius.md, backgroundColor: "rgba(255,255,255,0.5)" },
  hint: { color: tokens.color.ink, fontSize: tokens.type.body, fontWeight: "700" },
  resultCard: { gap: tokens.space.sm, padding: tokens.space.lg, borderRadius: tokens.radius.lg, backgroundColor: "#E5F7EF" },
  resultTitle: { color: tokens.color.success, fontSize: tokens.type.h2, fontWeight: "900" },
  compound: { color: tokens.color.ink, fontSize: 24, fontWeight: "900" }
});
