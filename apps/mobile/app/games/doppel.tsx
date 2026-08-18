import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/AppButton";
import { Screen } from "@/components/Screen";
import { tokens } from "@/design/tokens";
import { createDailyDoppelGame } from "@/games/doppel/daily";
import { revealDoppelSolution, submitDoppelGuess, unlockDoppelHint } from "@/games/doppel/engine";
import { DoppelHint, DoppelState } from "@/games/doppel/types";
import { loadProgress, saveProgress } from "@/storage/progress";

const dailyGame = createDailyDoppelGame();

function hintText(hint: DoppelHint): string {
  if (hint.type === "length") return `${hint.value} Buchstaben`;
  if (hint.type === "first_letter") return `Beginnt mit ${hint.value.toUpperCase()}`;
  if (hint.type === "letter") return `Buchstabe ${hint.index + 1}: ${hint.value.toUpperCase()}`;

  return hint.value;
}

export default function DoppelScreen() {
  const router = useRouter();
  const { dateKey, puzzle } = dailyGame;
  const [state, setState] = useState<DoppelState>(dailyGame.state);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("Finde ein Wort, das beide Seiten verbindet.");

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

  const solution = puzzle.solutions.find((item) => item.answer === state.solvedAnswer) ?? puzzle.solutions[0];
  const visibleHints = (puzzle.hints ?? []).slice(0, state.unlockedHints);
  const canSubmit = input.trim().length > 0 && state.status === "playing";

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
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={() => router.replace("/")} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </Pressable>
            <View>
              <Text style={styles.date}>{dateKey}</Text>
              <Text style={styles.title}>Doppel</Text>
            </View>
          </View>

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
              <TextInput
                autoCapitalize="characters"
                autoCorrect={false}
                onChangeText={setInput}
                onSubmitEditing={submit}
                placeholder="Lösung"
                placeholderTextColor="#B09E8B"
                returnKeyType="done"
                style={styles.input}
                value={input}
              />
              <AppButton disabled={!canSubmit} label="Prüfen" onPress={submit} />
            </View>
          )}

          <View style={styles.actions}>
            <AppButton disabled={state.status !== "playing"} label="Hinweis" onPress={hint} />
            <AppButton disabled={state.status !== "playing"} label="Lösung zeigen" onPress={reveal} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.lg },
  scrollContent: { gap: tokens.space.lg, paddingBottom: tokens.space.xl },
  header: { flexDirection: "row", alignItems: "center", gap: tokens.space.md, paddingTop: tokens.space.lg },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: tokens.radius.pill, backgroundColor: tokens.color.card },
  backText: { color: tokens.color.ink, fontSize: 28, fontWeight: "900" },
  date: { color: tokens.color.primaryDark, fontSize: tokens.type.small, fontWeight: "900" },
  title: { color: tokens.color.ink, fontSize: tokens.type.title, fontWeight: "900" },
  card: { alignItems: "center", gap: tokens.space.sm, padding: tokens.space.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.card, borderWidth: 1, borderColor: tokens.color.line },
  sideWord: { color: tokens.color.ink, fontSize: 28, fontWeight: "900", letterSpacing: 1 },
  plus: { color: tokens.color.muted, fontSize: 24, fontWeight: "900" },
  answerBox: { paddingHorizontal: tokens.space.lg, paddingVertical: tokens.space.md, borderRadius: tokens.radius.md, backgroundColor: "#FFE2D4" },
  answerText: { color: tokens.color.primaryDark, fontSize: 30, fontWeight: "900", letterSpacing: 2 },
  message: { color: tokens.color.muted, fontSize: tokens.type.body, textAlign: "center", lineHeight: 24 },
  inputCard: { gap: tokens.space.md },
  input: { minHeight: 58, paddingHorizontal: tokens.space.lg, borderRadius: tokens.radius.pill, backgroundColor: "white", color: tokens.color.ink, fontSize: 24, fontWeight: "900", textAlign: "center", letterSpacing: 1 },
  actions: { gap: tokens.space.md },
  hints: { gap: tokens.space.sm, padding: tokens.space.md, borderRadius: tokens.radius.md, backgroundColor: "rgba(255,255,255,0.5)" },
  hint: { color: tokens.color.ink, fontSize: tokens.type.body, fontWeight: "700" },
  resultCard: { gap: tokens.space.sm, padding: tokens.space.lg, borderRadius: tokens.radius.lg, backgroundColor: "#E5F7EF" },
  resultTitle: { color: tokens.color.success, fontSize: tokens.type.h2, fontWeight: "900" },
  compound: { color: tokens.color.ink, fontSize: 24, fontWeight: "900" }
});
