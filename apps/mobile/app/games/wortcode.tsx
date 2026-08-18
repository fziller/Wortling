import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/AppButton";
import { HelpButton, HelpModal } from "@/components/HelpModal";
import { Screen } from "@/components/Screen";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { createDailyWortcodeGame, createPracticeWortcodeGame } from "@/games/wortcode/daily";
import { revealWortcodeSolution, submitWortcodeGuess, toggleWortcodeLetterMark } from "@/games/wortcode/engine";
import { WortcodeLetterMark, WortcodeState } from "@/games/wortcode/types";
import { loadProgress, saveProgress } from "@/storage/progress";

const dailyGame = createDailyWortcodeGame();

export default function WortcodeScreen() {
  const router = useRouter();
  const [game, setGame] = useState(dailyGame);
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<WortcodeState>(game.state);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("Rate ein gültiges deutsches Wort.");
  const [helpVisible, setHelpVisible] = useState(false);

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

  function toggleMark(guessIndex: number, letterIndex: number) {
    setState((current) => toggleWortcodeLetterMark(current, guessIndex, letterIndex));
  }

  function reveal() {
    setState((current) => revealWortcodeSolution(current));
    setMessage("Lösung aufgedeckt.");
    setInput("");
  }

  function startNextWord() {
    const nextGame = createPracticeWortcodeGame(puzzle.answer);

    setGame(nextGame);
    setState(nextGame.state);
    setInput("");
    setMessage("Rate ein gültiges deutsches Wort.");
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={() => router.replace("/")} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </Pressable>
            <View style={styles.titleBlock}>
              <Text style={styles.date}>{dateKey}</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.title}>Wortcode</Text>
            </View>
            <HelpButton onPress={() => setHelpVisible(true)} />
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Gesucht: {puzzle.wordLength} Buchstaben</Text>
            <Text style={styles.summaryText}>Versuch {Math.min(state.guesses.length + 1, puzzle.maxAttempts)} / {puzzle.maxAttempts}</Text>
            <Text style={styles.rules}>Feedback ist absichtlich nicht positionsbezogen.</Text>
          </View>

          <View style={styles.history}>
            {state.guesses.length === 0 ? <Text style={styles.empty}>Noch kein Versuch.</Text> : null}
            {state.guesses.map((guess, guessIndex) => (
              <View accessibilityLabel={`${guess.value}. ${guess.exactMatches} exakt. ${guess.misplacedMatches} enthalten.`} key={guess.value} style={styles.guessRow}>
                <View style={styles.letterRow}>
                  {Array.from(guess.value).map((letter, letterIndex) => {
                    const mark = guess.marks?.[letterIndex] ?? "none";

                    return (
                      <Pressable
                        accessibilityLabel={`${letter.toUpperCase()}, ${markLabel(mark)}`}
                        accessibilityRole="button"
                        key={`${guess.value}-${letterIndex}`}
                        onPress={() => toggleMark(guessIndex, letterIndex)}
                        style={[styles.letterTile, mark === "included" && styles.includedTile, mark === "exact" && styles.exactTile]}
                      >
                        <Text style={[styles.letterText, mark === "exact" && styles.exactLetterText]}>{letter.toUpperCase()}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.feedback}>
                  <Text style={styles.feedbackText}>{guess.exactMatches} exakt</Text>
                  <Text style={styles.feedbackText}>{guess.misplacedMatches} enthalten</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.message}>{message}</Text>

          {state.status === "lost" || state.status === "revealed" ? <Text style={styles.answer}>Lösung: {puzzle.answer.toUpperCase()}</Text> : null}

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
          <View style={styles.actions}>
            {state.status === "playing" ? (
              <AppButton label="Lösung zeigen" onPress={reveal} />
            ) : (
              <AppButton label="Neues Wort" onPress={startNextWord} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <HelpModal {...gameHelp.wortcode} onClose={() => setHelpVisible(false)} visible={helpVisible} />
    </Screen>
  );
}

function markLabel(mark: WortcodeLetterMark): string {
  if (mark === "included") return "als enthalten markiert";
  if (mark === "exact") return "als exakt markiert";

  return "nicht markiert";
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.lg },
  scrollContent: { flexGrow: 1, gap: tokens.space.lg, paddingBottom: tokens.space.xl },
  header: { flexDirection: "row", alignItems: "center", gap: tokens.space.md, paddingTop: tokens.space.lg },
  titleBlock: { flex: 1, minWidth: 0 },
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
  guessRow: { gap: tokens.space.sm, padding: tokens.space.md, borderRadius: tokens.radius.md, backgroundColor: "rgba(255,255,255,0.58)" },
  letterRow: { flexDirection: "row", gap: tokens.space.xs },
  letterTile: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: tokens.radius.sm, backgroundColor: "white", borderWidth: 1, borderColor: tokens.color.line },
  includedTile: { backgroundColor: "#FFD76A", borderColor: "#D98500" },
  exactTile: { backgroundColor: tokens.color.success, borderColor: "#127456" },
  letterText: { color: tokens.color.ink, fontSize: 18, fontWeight: "900" },
  exactLetterText: { color: "white" },
  feedback: { flexDirection: "row", gap: tokens.space.sm },
  feedbackText: { color: tokens.color.muted, fontSize: tokens.type.small, fontWeight: "900" },
  message: { color: tokens.color.muted, fontSize: tokens.type.body, textAlign: "center" },
  answer: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900", textAlign: "center" },
  inputCard: { gap: tokens.space.md },
  input: { minHeight: 58, paddingHorizontal: tokens.space.lg, borderRadius: tokens.radius.pill, backgroundColor: "white", color: tokens.color.ink, fontSize: 24, fontWeight: "900", textAlign: "center", letterSpacing: 4 },
  actions: { gap: tokens.space.md }
});
