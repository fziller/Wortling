import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";

import { AppButton } from "@/components/AppButton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { GameHeaderButton, GameHeaderHelpButton, GameHeaderTitle } from "@/components/GameHeader";
import { HelpModal } from "@/components/HelpModal";
import { Screen } from "@/components/Screen";
import { WordKeyboard } from "@/components/WordKeyboard";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { createDailyWortcodeGame, createPracticeWortcodeGame } from "@/games/wortcode/daily";
import { revealWortcodeSolution, submitWortcodeGuess, toggleWortcodeLetterMark } from "@/games/wortcode/engine";
import { WortcodeLetterMark, WortcodeState } from "@/games/wortcode/types";
import { loadProgress, loadProgressForGames, saveProgress } from "@/storage/progress";
import { updateBadgeCount } from "@/notifications/badge";

const dailyGame = createDailyWortcodeGame();

export default function WortcodeScreen() {
  const router = useRouter();
  const [game, setGame] = useState(dailyGame);
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<WortcodeState>(game.state);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("Rate ein gültiges deutsches Wort.");
  const [helpVisible, setHelpVisible] = useState(false);
  const [giveUpVisible, setGiveUpVisible] = useState(false);

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

  useEffect(() => {
    if (state.status !== "playing") {
      loadProgressForGames(games.map((g) => g.id), dateKey).then(updateBadgeCount);
    }
  }, [state.status, dateKey]);

  const canSubmit = Array.from(input).length === puzzle.wordLength && state.status === "playing";

  function addLetter(letter: string) {
    if (state.status !== "playing") return;
    setInput((current) => Array.from(current).length >= puzzle.wordLength ? current : current + letter);
  }

  function backspace() {
    setInput((current) => Array.from(current).slice(0, -1).join(""));
  }

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
    setGiveUpVisible(false);
  }

  function startNextWord() {
    const nextGame = createPracticeWortcodeGame(puzzle.answer);

    setGame(nextGame);
    setState(nextGame.state);
    setInput("");
    setMessage("Rate ein gültiges deutsches Wort.");
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
          headerTitle: () => <GameHeaderTitle subtitle={dateKey} title="Wortcode" />,
          headerTitleAlign: "center"
        }}
      />
      <View style={styles.wrap}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
            <View style={styles.inputRow}>
              {Array.from(input.padEnd(puzzle.wordLength, " ")).map((letter, index) => (
                <View key={index} style={styles.inputTile}>
                  <Text style={styles.inputTileText}>{letter.trim().toUpperCase()}</Text>
                </View>
              ))}
            </View>
            <WordKeyboard disabled={state.status !== "playing"} onBackspace={backspace} onLetter={addLetter} onSubmit={submit} submitDisabled={!canSubmit} />
          </View>
          <View style={styles.actions}>
            {state.status === "playing" ? (
              <Pressable accessibilityRole="button" onPress={() => setGiveUpVisible(true)} style={styles.giveUpButton}>
                <Text style={styles.giveUpText}>Aufgeben</Text>
              </Pressable>
            ) : (
              <AppButton label="Neues Wort" onPress={startNextWord} />
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
  inputRow: { flexDirection: "row", gap: tokens.space.xs },
  inputTile: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: tokens.radius.sm, backgroundColor: "white", borderWidth: 1, borderColor: tokens.color.line },
  inputTileText: { color: tokens.color.ink, fontSize: 20, fontWeight: "900" },
  actions: { gap: tokens.space.md },
  giveUpButton: { alignSelf: "center", paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.xs },
  giveUpText: { color: tokens.color.muted, fontSize: tokens.type.small, fontWeight: "900" }
});
