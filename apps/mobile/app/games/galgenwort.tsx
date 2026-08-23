import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";

import { ConfirmModal } from "@/components/ConfirmModal";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { GameResultModal } from "@/components/GameResultModal";
import { HelpModal } from "@/components/HelpModal";
import { SmallGameAction } from "@/components/SmallGameAction";
import { getBerlinDateKey } from "@/daily/date";
import { tokens } from "@/design/tokens";
import { createPracticeGalgenwortGame } from "@/games/galgenwort/daily";
import { getGalgenwortLetterStates, getGalgenwortRevealedLetters, getGalgenwortWrongLetters, revealGalgenwortSolution, submitGalgenwortLetter } from "@/games/galgenwort/engine";
import type { GalgenwortState } from "@/games/galgenwort/types";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { updateBadgeCount } from "@/notifications/badge";
import { isStartedProgress, loadProgress, loadProgressForGames, saveProgress, type StoredProgress } from "@/storage/progress";

type GalgenwortGame = ReturnType<typeof createPracticeGalgenwortGame>;

export default function GalgenwortScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const today = getBerlinDateKey();
  const completedAtRef = useRef<string | undefined>(undefined);
  const completedStatusRef = useRef<StoredProgress["status"] | undefined>(undefined);
  const [game, setGame] = useState<GalgenwortGame>(() => createPracticeGalgenwortGame(undefined, today));
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<GalgenwortState>(game.state);
  const [message, setMessage] = useState("");
  const [helpVisible, setHelpVisible] = useState(false);
  const [giveUpVisible, setGiveUpVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      posthog.capture("screen_viewed", { screen: "galgenwort", params: { dateKey } });
      posthog.capture("game_started", { gameId: "galgenwort", dateKey });
    } catch {
      // Analytics must never break offline gameplay.
    }
  }, [dateKey, posthog]);

  useEffect(() => {
    loadProgress<GalgenwortState>("galgenwort", today).then((progress) => {
      completedAtRef.current = progress?.completedAt;
      completedStatusRef.current = progress?.completedStatus;
      if (isStartedProgress(progress)) {
        setGame({ dateKey: progress.dateKey, puzzle: progress.puzzle as GalgenwortGame["puzzle"], state: progress.state });
        setState(progress.state);
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
    saveProgress({ gameId: "galgenwort", dateKey, completedStatus, puzzle, puzzleId: puzzle.id, puzzleVersion: puzzle.version, status: state.status, state, completedAt });
  }, [dateKey, progressLoaded, puzzle, state]);

  useEffect(() => {
    if (state.status !== "playing") loadProgressForGames(games.map((g) => g.id), dateKey).then(updateBadgeCount);
  }, [state.status, dateKey]);

  const revealed = getGalgenwortRevealedLetters(puzzle, state);
  const answerLength = Array.from(puzzle.answer).length;
  const wordTileFontSize = answerLength > 10 ? 22 : answerLength > 8 ? 26 : 30;
  const wrongLetters = getGalgenwortWrongLetters(puzzle, state);
  const letterStates = getGalgenwortLetterStates(puzzle, state);
  const elapsedSeconds = Math.max(0, Math.round(((finishedAt ?? Date.now()) - startedAt) / 1000));

  function guess(letter: string) {
    const result = submitGalgenwortLetter(puzzle, state, letter);

    setState(result.state);
    setMessage(result.ok ? result.state.status === "won" ? "Gelöst!" : result.state.status === "lost" ? "Heute nicht gerettet." : result.correct ? "Treffer." : "Leider nicht drin." : result.reason);
    if (result.ok && result.state.status !== "playing") {
      setFinishedAt(Date.now());
      setResultVisible(true);
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
    setFinishedAt(Date.now());
    setResultVisible(true);
  }

  function startPracticeWord() {
    const nextGame = createPracticeGalgenwortGame(puzzle.id, today);

    setGame(nextGame);
    setState(nextGame.state);
    setMessage("");
    setResultVisible(false);
    setFinishedAt(null);
    setProgressLoaded(true);
    setStartedAt(Date.now());
  }

  function resultTitle() {
    if (state.status === "won") return "Gerettet.";
    if (state.status === "lost") return "Heute nicht gerettet.";

    return "Aufgelöst.";
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
    <GameScreenFrame
      actions={state.status === "playing" ? <SmallGameAction label="Lösung anzeigen" onPress={() => setGiveUpVisible(true)} /> : null}
      keyboard={{
        disabled: state.status !== "playing",
        letterStates,
        onBackspace: () => undefined,
        onLetter: guess,
        onSubmit: () => undefined,
        showBackspace: false,
        showSubmit: false,
      }}
      onBack={goBack}
      onHelp={() => setHelpVisible(true)}
      subtitle={dateKey}
      title="Galgenwort"
    >
      <View style={styles.wrap}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.kicker}>Hinweis</Text>
            <Text style={styles.lengthPill}>{answerLength} Buchstaben</Text>
          </View>
          <Text style={styles.clue}>{puzzle.clue}</Text>
          <View style={styles.wordRow}>
            {revealed.map((letter, index) => <Text key={index} style={[styles.wordTile, { fontSize: wordTileFontSize }]}>{letter ? letter.toLocaleUpperCase("de-DE") : "_"}</Text>)}
          </View>
          <Text style={styles.misses}>Fehler {wrongLetters.length} / {puzzle.maxWrongGuesses}</Text>
        </View>

        <View style={styles.statusBlock}>
          {message && state.status !== "playing" ? <Text style={styles.message}>{message}</Text> : null}
          {wrongLetters.length > 0 ? <Text style={styles.wrong}>Falsch: {wrongLetters.join(" ").toLocaleUpperCase("de-DE")}</Text> : null}
          {state.status === "lost" || state.status === "revealed" ? <Text style={styles.answer}>Lösung: {puzzle.answer.toLocaleUpperCase("de-DE")}</Text> : null}
        </View>
      </View>
      <ConfirmModal confirmLabel="Lösung zeigen" message="Die Lösung wird angezeigt und die Runde zählt nicht als geschafft." onCancel={() => setGiveUpVisible(false)} onConfirm={reveal} title="Lösung anzeigen?" visible={giveUpVisible} />
      <GameResultModal
        guesses={state.guessedLetters}
        message={state.status === "won" ? "Nice, das Wort ist frei." : "Die Lösung ist raus. Weiteres Wort?"}
        onHome={() => router.replace("/")}
        onNext={startPracticeWord}
        solution={puzzle.answer}
        stats={[
          { label: "Buchstaben", value: state.guessedLetters.length },
          { label: "Fehler", value: wrongLetters.length },
          { label: "Zeit", value: `${elapsedSeconds} Sek.` }
        ]}
        title={resultTitle()}
        visible={resultVisible && state.status !== "playing"}
      />
      <HelpModal {...gameHelp.galgenwort} onClose={() => setHelpVisible(false)} visible={helpVisible} />
    </GameScreenFrame>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.lg },
  card: { gap: tokens.space.md, padding: tokens.space.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.card, borderWidth: 1, borderColor: tokens.color.line },
  cardHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: tokens.space.sm },
  kicker: { color: tokens.color.primaryDark, fontSize: tokens.type.small, fontWeight: "900", textTransform: "uppercase" },
  lengthPill: { color: tokens.color.primaryDark, fontSize: tokens.type.small, fontWeight: "900" },
  clue: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900" },
  wordRow: { flexDirection: "row", gap: 4, justifyContent: "center" },
  wordTile: { flex: 1, minWidth: 0, color: tokens.color.ink, fontWeight: "900", textAlign: "center" },
  misses: { color: tokens.color.primaryDark, fontSize: tokens.type.body, fontWeight: "900", textAlign: "center" },
  statusBlock: { flex: 1, justifyContent: "center", gap: tokens.space.sm },
  message: { color: tokens.color.muted, fontSize: tokens.type.body, textAlign: "center" },
  wrong: { color: tokens.color.ink, fontSize: tokens.type.body, fontWeight: "900", textAlign: "center" },
  answer: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900", textAlign: "center" }
});
