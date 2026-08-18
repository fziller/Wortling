import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/AppButton";
import { Screen } from "@/components/Screen";
import { tokens } from "@/design/tokens";
import { createDailyWortcodeGame } from "@/games/wortcode/daily";
import { submitWortcodeGuess } from "@/games/wortcode/engine";
import { WortcodeState } from "@/games/wortcode/types";
import { loadProgress, saveProgress } from "@/storage/progress";

const dailyGame = createDailyWortcodeGame();

export default function WortcodeScreen() {
  const router = useRouter();
  const { dateKey, puzzle } = dailyGame;
  const [state, setState] = useState<WortcodeState>(dailyGame.state);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("Rate ein gültiges deutsches Wort.");

  useEffect(() => {
    loadProgress<WortcodeState>("wortcode", dateKey).then((progress) => {
      if (progress?.puzzleId === puzzle.id && progress.puzzleVersion === puzzle.version) {
        setState(progress.state);
      }
    });
  }, [dateKey, puzzle.id, puzzle.version]);

  useEffect(() => {
    saveProgress({
      gameId: "wortcode",
      dateKey,
      puzzleId: puzzle.id,
      puzzleVersion: puzzle.version,
      status: state.status,
      state,
      completedAt: state.status !== "playing" ? new Date().toISOString() : undefined
    });
  }, [dateKey, puzzle.id, puzzle.version, state]);

  const attemptsLeft = puzzle.maxAttempts - state.guesses.length;
  const canSubmit = input.trim().length > 0 && state.status === "playing";

  function submit() {
    const result = submitWortcodeGuess(puzzle, state, input);

    setState(result.state);
    setMessage(result.ok ? result.state.status === "won" ? "Code geknackt!" : result.state.status === "lost" ? "Heute nicht geknackt." : "Weiter eingrenzen." : result.reason);
    if (result.ok) setInput("");
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
              <Text style={styles.title}>Wortcode</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Gesucht: {puzzle.wordLength} Buchstaben</Text>
            <Text style={styles.summaryText}>Versuch {Math.min(state.guesses.length + 1, puzzle.maxAttempts)} / {puzzle.maxAttempts}</Text>
            <Text style={styles.rules}>Feedback ist absichtlich nicht positionsbezogen.</Text>
          </View>

          <View style={styles.history}>
            {state.guesses.length === 0 ? <Text style={styles.empty}>Noch kein Versuch.</Text> : null}
            {state.guesses.map((guess) => (
              <View accessibilityLabel={`${guess.value}. ${guess.exactMatches} exakt. ${guess.misplacedMatches} enthalten.`} key={guess.value} style={styles.guessRow}>
                <Text style={styles.guessWord}>{guess.value.toUpperCase()}</Text>
                <View style={styles.feedback}>
                  <Text style={styles.feedbackText}>{guess.exactMatches} exakt</Text>
                  <Text style={styles.feedbackText}>{guess.misplacedMatches} enthalten</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.message}>{message}</Text>

          {state.status === "lost" ? <Text style={styles.answer}>Lösung: {puzzle.answer.toUpperCase()}</Text> : null}

          <View style={styles.inputCard}>
            <TextInput
              autoCapitalize="characters"
              autoCorrect={false}
              editable={state.status === "playing"}
              maxLength={puzzle.wordLength}
              onChangeText={setInput}
              onSubmitEditing={submit}
              placeholder={"_".repeat(puzzle.wordLength)}
              placeholderTextColor="#B09E8B"
              returnKeyType="done"
              style={styles.input}
              value={input}
            />
            <AppButton disabled={!canSubmit} label={attemptsLeft <= 1 ? "Letzter Versuch" : "Prüfen"} onPress={submit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.lg },
  scrollContent: { flexGrow: 1, gap: tokens.space.lg, paddingBottom: tokens.space.xl },
  header: { flexDirection: "row", alignItems: "center", gap: tokens.space.md, paddingTop: tokens.space.lg },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: tokens.radius.pill, backgroundColor: tokens.color.card },
  backText: { color: tokens.color.ink, fontSize: 28, fontWeight: "900" },
  date: { color: tokens.color.primaryDark, fontSize: tokens.type.small, fontWeight: "900" },
  title: { color: tokens.color.ink, fontSize: tokens.type.title, fontWeight: "900" },
  summaryCard: { gap: tokens.space.xs, padding: tokens.space.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.card, borderWidth: 1, borderColor: tokens.color.line },
  summaryTitle: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900" },
  summaryText: { color: tokens.color.primaryDark, fontSize: tokens.type.body, fontWeight: "900" },
  rules: { color: tokens.color.muted, fontSize: tokens.type.small, lineHeight: 19 },
  history: { flex: 1, gap: tokens.space.sm },
  empty: { color: tokens.color.muted, fontSize: tokens.type.body, textAlign: "center" },
  guessRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: tokens.space.md, padding: tokens.space.md, borderRadius: tokens.radius.md, backgroundColor: "rgba(255,255,255,0.58)" },
  guessWord: { color: tokens.color.ink, fontSize: 22, fontWeight: "900", letterSpacing: 1 },
  feedback: { alignItems: "flex-end", gap: 2 },
  feedbackText: { color: tokens.color.muted, fontSize: tokens.type.small, fontWeight: "900" },
  message: { color: tokens.color.muted, fontSize: tokens.type.body, textAlign: "center" },
  answer: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900", textAlign: "center" },
  inputCard: { gap: tokens.space.md },
  input: { minHeight: 58, paddingHorizontal: tokens.space.lg, borderRadius: tokens.radius.pill, backgroundColor: "white", color: tokens.color.ink, fontSize: 24, fontWeight: "900", textAlign: "center", letterSpacing: 4 }
});
