import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";

import { AppButton } from "@/components/AppButton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { GameHeaderButton, GameHeaderHelpButton, GameHeaderTitle } from "@/components/GameHeader";
import { HelpModal } from "@/components/HelpModal";
import { KeyboardDock } from "@/components/KeyboardDock";
import { LetterInputTiles } from "@/components/LetterInputTiles";
import { Screen } from "@/components/Screen";
import { WordKeyboard } from "@/components/WordKeyboard";
import { tokens } from "@/design/tokens";
import { createDailyFormwortGame, createPracticeFormwortGame } from "@/games/formwort/daily";
import { getFormwortLetterStates, revealFormwortSolution, submitFormwortGuess } from "@/games/formwort/engine";
import type { FormwortState } from "@/games/formwort/types";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { updateBadgeCount } from "@/notifications/badge";
import { loadProgress, loadProgressForGames, saveProgress } from "@/storage/progress";

const dailyGame = createDailyFormwortGame();

function createEmptyInput(length: number) {
  return Array.from({ length }, () => "");
}

export default function FormwortScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const [game, setGame] = useState(dailyGame);
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<FormwortState>(game.state);
  const [inputLetters, setInputLetters] = useState(() => createEmptyInput(dailyGame.puzzle.wordLength));
  const [cursorIndex, setCursorIndex] = useState(0);
  const [message, setMessage] = useState("Gleiche Formen stehen für gleiche Buchstaben.");
  const [helpVisible, setHelpVisible] = useState(false);
  const [giveUpVisible, setGiveUpVisible] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    try {
      posthog.capture("screen_viewed", { screen: "formwort", params: { dateKey } });
      posthog.capture("game_started", { gameId: "formwort", dateKey });
    } catch {
      // Analytics must never break offline gameplay.
    }
  }, [dateKey, posthog]);

  useEffect(() => {
    loadProgress<FormwortState>("formwort", dateKey).then((progress) => {
      if (progress?.puzzleId === puzzle.id && progress.puzzleVersion === puzzle.version) setState(progress.state);
    });
  }, [dateKey, puzzle.id, puzzle.version]);

  useEffect(() => {
    saveProgress({ gameId: "formwort", dateKey, puzzleId: puzzle.id, puzzleVersion: puzzle.version, status: state.status, state, completedAt: state.status !== "playing" ? new Date().toISOString() : undefined });
  }, [dateKey, puzzle.id, puzzle.version, state]);

  useEffect(() => {
    if (state.status !== "playing") loadProgressForGames(games.map((g) => g.id), dateKey).then(updateBadgeCount);
  }, [state.status, dateKey]);

  const canSubmit = inputLetters.every(Boolean) && state.status === "playing";
  const letterStates = getFormwortLetterStates(state);

  function addLetter(letter: string) {
    if (state.status !== "playing") return;
    setInputLetters((current) => current.map((item, index) => index === cursorIndex ? letter : item));
    setCursorIndex((current) => Math.min(current + 1, puzzle.wordLength - 1));
  }

  function backspace() {
    setInputLetters((current) => {
      if (current[cursorIndex]) return current.map((item, index) => index === cursorIndex ? "" : item);

      const previousIndex = Math.max(cursorIndex - 1, 0);
      setCursorIndex(previousIndex);

      return current.map((item, index) => index === previousIndex ? "" : item);
    });
  }

  function submit() {
    const result = submitFormwortGuess(puzzle, state, inputLetters.join(""));

    setState(result.state);
    setMessage(result.ok ? result.state.status === "won" ? "Form geknackt!" : result.state.status === "lost" ? "Heute nicht geknackt." : "Weiter eingrenzen." : result.reason);
    if (result.ok) {
      setInputLetters(createEmptyInput(puzzle.wordLength));
      setCursorIndex(0);
    }
    if (result.ok && result.state.status !== "playing") {
      try {
        posthog.capture("game_completed", { gameId: "formwort", dateKey, durationMs: Date.now() - startedAt, attempts: result.state.guesses.length });
      } catch {
        // Analytics must never break offline gameplay.
      }
    }
  }

  function reveal() {
    setState((current) => revealFormwortSolution(current));
    setMessage("Lösung aufgedeckt.");
    setInputLetters(createEmptyInput(puzzle.wordLength));
    setCursorIndex(0);
    setGiveUpVisible(false);
  }

  function startNextWord() {
    const nextGame = createPracticeFormwortGame(puzzle.answer);

    setGame(nextGame);
    setState(nextGame.state);
    setInputLetters(createEmptyInput(nextGame.puzzle.wordLength));
    setCursorIndex(0);
    setMessage("Gleiche Formen stehen für gleiche Buchstaben.");
    setStartedAt(Date.now());
  }

  function goBack() {
    if (state.status === "playing" && state.guesses.length > 0) {
      try {
        posthog.capture("game_abandoned", { gameId: "formwort", dateKey, attempts: state.guesses.length });
      } catch {
        // Analytics must never break offline gameplay.
      }
    }
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
          headerTitle: () => <GameHeaderTitle subtitle={dateKey} title="Formwort" />,
          headerTitleAlign: "center"
        }}
      />
      <View style={styles.wrap}>
        <View style={styles.symbolRow}>
          {puzzle.symbols.map((symbol, index) => <Text key={`${symbol}-${index}`} style={styles.symbolTile}>{symbol}</Text>)}
        </View>

        <View style={styles.board}>
          {Array.from({ length: puzzle.maxAttempts }).map((_, rowIndex) => {
            const guess = state.guesses[rowIndex];
            const letters = guess ? Array.from(guess.value) : rowIndex === state.guesses.length ? inputLetters : createEmptyInput(puzzle.wordLength);

            return (
              <View key={rowIndex} style={styles.tileRow}>
                {letters.map((letter, letterIndex) => {
                  const mark = guess?.marks[letterIndex];

                  return (
                    <Pressable disabled key={`${rowIndex}-${letterIndex}`} style={[styles.tile, mark && styles[mark]]}>
                      <Text style={[styles.tileText, mark && styles.markedTileText]}>{letter.toLocaleUpperCase("de-DE")}</Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>

        <View style={styles.statusBlock}>
          <Text style={styles.message}>{message}</Text>
          {state.status === "lost" || state.status === "revealed" ? <Text style={styles.answer}>Lösung: {puzzle.answer.toLocaleUpperCase("de-DE")}</Text> : null}
        </View>

        <KeyboardDock>
          <LetterInputTiles cursorIndex={cursorIndex} disabled={state.status !== "playing"} letters={inputLetters} onCursorChange={setCursorIndex} />
          {state.status === "playing" ? (
            <Pressable accessibilityRole="button" onPress={() => setGiveUpVisible(true)} style={styles.giveUpButton}>
              <Text style={styles.giveUpText}>Aufgeben</Text>
            </Pressable>
          ) : null}
          <WordKeyboard disabled={state.status !== "playing"} letterStates={letterStates} onBackspace={backspace} onLetter={addLetter} onSubmit={submit} submitDisabled={!canSubmit} />
          {state.status !== "playing" ? <AppButton label="Neues Wort" onPress={startNextWord} /> : null}
        </KeyboardDock>
      </View>
      <ConfirmModal confirmLabel="Lösung zeigen" message="Die Lösung wird angezeigt und die Runde zählt nicht als geschafft." onCancel={() => setGiveUpVisible(false)} onConfirm={reveal} title="Aufgeben?" visible={giveUpVisible} />
      <HelpModal {...gameHelp.formwort} onClose={() => setHelpVisible(false)} visible={helpVisible} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.md },
  symbolRow: { flexDirection: "row", gap: tokens.space.xs, padding: tokens.space.md, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.card, borderWidth: 1, borderColor: tokens.color.line },
  symbolTile: { flex: 1, color: tokens.color.primaryDark, fontSize: 28, fontWeight: "900", textAlign: "center" },
  board: { flex: 1, justifyContent: "center", gap: 7 },
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
  giveUpButton: { alignSelf: "flex-end", paddingHorizontal: tokens.space.sm, paddingVertical: tokens.space.xs },
  giveUpText: { color: tokens.color.muted, fontSize: tokens.type.small, fontWeight: "900" }
});
