import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";

import { AppButton } from "@/components/AppButton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { GameHeaderButton, GameHeaderHelpButton, GameHeaderTitle } from "@/components/GameHeader";
import { HelpModal } from "@/components/HelpModal";
import { KeyboardDock } from "@/components/KeyboardDock";
import { Screen } from "@/components/Screen";
import { WordKeyboard } from "@/components/WordKeyboard";
import { tokens } from "@/design/tokens";
import { createDailyGalgenwortGame, createPracticeGalgenwortGame } from "@/games/galgenwort/daily";
import { getGalgenwortLetterStates, getGalgenwortRevealedLetters, getGalgenwortWrongLetters, revealGalgenwortSolution, submitGalgenwortLetter } from "@/games/galgenwort/engine";
import type { GalgenwortState } from "@/games/galgenwort/types";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { updateBadgeCount } from "@/notifications/badge";
import { loadProgress, loadProgressForGames, saveProgress } from "@/storage/progress";

const dailyGame = createDailyGalgenwortGame();

export default function GalgenwortScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const [game, setGame] = useState(dailyGame);
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<GalgenwortState>(game.state);
  const [message, setMessage] = useState("Errate das Wort Buchstabe für Buchstabe.");
  const [helpVisible, setHelpVisible] = useState(false);
  const [giveUpVisible, setGiveUpVisible] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    try {
      posthog.capture("screen_viewed", { screen: "galgenwort", params: { dateKey } });
      posthog.capture("game_started", { gameId: "galgenwort", dateKey });
    } catch {
      // Analytics must never break offline gameplay.
    }
  }, [dateKey, posthog]);

  useEffect(() => {
    loadProgress<GalgenwortState>("galgenwort", dateKey).then((progress) => {
      if (progress?.puzzleId === puzzle.id && progress.puzzleVersion === puzzle.version) setState(progress.state);
    });
  }, [dateKey, puzzle.id, puzzle.version]);

  useEffect(() => {
    saveProgress({ gameId: "galgenwort", dateKey, puzzleId: puzzle.id, puzzleVersion: puzzle.version, status: state.status, state, completedAt: state.status !== "playing" ? new Date().toISOString() : undefined });
  }, [dateKey, puzzle.id, puzzle.version, state]);

  useEffect(() => {
    if (state.status !== "playing") loadProgressForGames(games.map((g) => g.id), dateKey).then(updateBadgeCount);
  }, [state.status, dateKey]);

  const revealed = getGalgenwortRevealedLetters(puzzle, state);
  const wrongLetters = getGalgenwortWrongLetters(puzzle, state);
  const letterStates = getGalgenwortLetterStates(puzzle, state);

  function guess(letter: string) {
    const result = submitGalgenwortLetter(puzzle, state, letter);

    setState(result.state);
    setMessage(result.ok ? result.state.status === "won" ? "Gelöst!" : result.state.status === "lost" ? "Heute nicht gerettet." : result.correct ? "Treffer." : "Leider nicht drin." : result.reason);
    if (result.ok && result.state.status !== "playing") {
      try {
        posthog.capture("game_completed", { gameId: "galgenwort", dateKey, durationMs: Date.now() - startedAt, attempts: result.state.guessedLetters.length });
      } catch {
        // Analytics must never break offline gameplay.
      }
    }
  }

  function reveal() {
    setState((current) => revealGalgenwortSolution(current));
    setMessage("Lösung aufgedeckt.");
    setGiveUpVisible(false);
  }

  function startNextWord() {
    const nextGame = createPracticeGalgenwortGame(puzzle.id);

    setGame(nextGame);
    setState(nextGame.state);
    setMessage("Errate das Wort Buchstabe für Buchstabe.");
    setStartedAt(Date.now());
  }

  function goBack() {
    if (state.status === "playing" && state.guessedLetters.length > 0) {
      try {
        posthog.capture("game_abandoned", { gameId: "galgenwort", dateKey, attempts: state.guessedLetters.length });
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
          headerTitle: () => <GameHeaderTitle subtitle={dateKey} title="Galgenwort" />,
          headerTitleAlign: "center"
        }}
      />
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.kicker}>Hinweis</Text>
          <Text style={styles.clue}>{puzzle.clue}</Text>
          <View style={styles.wordRow}>
            {revealed.map((letter, index) => <Text key={index} style={styles.wordTile}>{letter ? letter.toLocaleUpperCase("de-DE") : "_"}</Text>)}
          </View>
          <Text style={styles.misses}>Fehler {wrongLetters.length} / {puzzle.maxWrongGuesses}</Text>
        </View>

        <View style={styles.statusBlock}>
          <Text style={styles.message}>{message}</Text>
          {wrongLetters.length > 0 ? <Text style={styles.wrong}>Falsch: {wrongLetters.join(" ").toLocaleUpperCase("de-DE")}</Text> : null}
          {state.status === "lost" || state.status === "revealed" ? <Text style={styles.answer}>Lösung: {puzzle.answer.toLocaleUpperCase("de-DE")}</Text> : null}
        </View>

        <KeyboardDock>
          {state.status === "playing" ? (
            <Pressable accessibilityRole="button" onPress={() => setGiveUpVisible(true)} style={styles.giveUpButton}>
              <Text style={styles.giveUpText}>Aufgeben</Text>
            </Pressable>
          ) : null}
          <WordKeyboard disabled={state.status !== "playing"} letterStates={letterStates} onBackspace={() => undefined} onLetter={guess} onSubmit={() => undefined} showBackspace={false} showSubmit={false} />
          {state.status !== "playing" ? <AppButton label="Neues Wort" onPress={startNextWord} /> : null}
        </KeyboardDock>
      </View>
      <ConfirmModal confirmLabel="Lösung zeigen" message="Die Lösung wird angezeigt und die Runde zählt nicht als geschafft." onCancel={() => setGiveUpVisible(false)} onConfirm={reveal} title="Aufgeben?" visible={giveUpVisible} />
      <HelpModal {...gameHelp.galgenwort} onClose={() => setHelpVisible(false)} visible={helpVisible} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.lg },
  card: { gap: tokens.space.md, padding: tokens.space.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.card, borderWidth: 1, borderColor: tokens.color.line },
  kicker: { color: tokens.color.primaryDark, fontSize: tokens.type.small, fontWeight: "900", textTransform: "uppercase" },
  clue: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900" },
  wordRow: { flexDirection: "row", flexWrap: "wrap", gap: tokens.space.xs, justifyContent: "center" },
  wordTile: { minWidth: 28, color: tokens.color.ink, fontSize: 30, fontWeight: "900", textAlign: "center" },
  misses: { color: tokens.color.primaryDark, fontSize: tokens.type.body, fontWeight: "900", textAlign: "center" },
  statusBlock: { flex: 1, justifyContent: "center", gap: tokens.space.sm },
  message: { color: tokens.color.muted, fontSize: tokens.type.body, textAlign: "center" },
  wrong: { color: tokens.color.ink, fontSize: tokens.type.body, fontWeight: "900", textAlign: "center" },
  answer: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900", textAlign: "center" },
  giveUpButton: { alignSelf: "flex-end", paddingHorizontal: tokens.space.sm, paddingVertical: tokens.space.xs },
  giveUpText: { color: tokens.color.muted, fontSize: tokens.type.small, fontWeight: "900" }
});
