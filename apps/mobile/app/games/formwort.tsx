import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";

import { ConfirmModal } from "@/components/ConfirmModal";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { GameResultModal } from "@/components/GameResultModal";
import { HelpModal } from "@/components/HelpModal";
import { LetterInputTiles } from "@/components/LetterInputTiles";
import { SmallGameAction } from "@/components/SmallGameAction";
import { getBerlinDateKey } from "@/daily/date";
import { tokens } from "@/design/tokens";
import { createPracticeFormwortGame } from "@/games/formwort/daily";
import { applyFormwortInputLetter, getFormwortLetterStates, removeFormwortInputLetter, revealFormwortSolution, submitFormwortGuess } from "@/games/formwort/engine";
import type { FormwortState } from "@/games/formwort/types";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { updateBadgeCount } from "@/notifications/badge";
import { isStartedProgress, loadProgress, loadProgressForGames, saveProgress } from "@/storage/progress";

type FormwortGame = ReturnType<typeof createPracticeFormwortGame>;

function createEmptyInput(length: number) {
  return Array.from({ length }, () => "");
}

export default function FormwortScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const today = getBerlinDateKey();
  const completedAtRef = useRef<string | undefined>(undefined);
  const [game, setGame] = useState<FormwortGame>(() => createPracticeFormwortGame(undefined, today));
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<FormwortState>(game.state);
  const [inputLetters, setInputLetters] = useState(() => createEmptyInput(game.puzzle.wordLength));
  const [cursorIndex, setCursorIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [helpVisible, setHelpVisible] = useState(false);
  const [giveUpVisible, setGiveUpVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      posthog.capture("screen_viewed", { screen: "formwort", params: { dateKey } });
      posthog.capture("game_started", { gameId: "formwort", dateKey });
    } catch {
      // Analytics must never break offline gameplay.
    }
  }, [dateKey, posthog]);

  useEffect(() => {
    loadProgress<FormwortState>("formwort", today).then((progress) => {
      completedAtRef.current = progress?.completedAt;
      if (isStartedProgress(progress)) {
        const nextGame = { dateKey: progress.dateKey, puzzle: progress.puzzle as FormwortGame["puzzle"], state: progress.state };
        setGame(nextGame);
        setState(progress.state);
        setInputLetters(Array.isArray(progress.draft) ? progress.draft.map(String) : createEmptyInput(nextGame.puzzle.wordLength));
      }
      setProgressLoaded(true);
    });
  }, [today]);

  useEffect(() => {
    if (!progressLoaded) return;

    const completedAt = state.status !== "playing" ? new Date().toISOString() : completedAtRef.current;
    completedAtRef.current = completedAt;
    saveProgress({ gameId: "formwort", dateKey, draft: inputLetters, puzzle, puzzleId: puzzle.id, puzzleVersion: puzzle.version, status: state.status, state, completedAt });
  }, [dateKey, inputLetters, progressLoaded, puzzle, state]);

  useEffect(() => {
    if (state.status !== "playing") loadProgressForGames(games.map((g) => g.id), dateKey).then(updateBadgeCount);
  }, [state.status, dateKey]);

  const canSubmit = inputLetters.every(Boolean) && state.status === "playing";
  const letterStates = getFormwortLetterStates(state);
  const elapsedSeconds = Math.max(0, Math.round(((finishedAt ?? Date.now()) - startedAt) / 1000));
  const usedLetters = new Set(state.guesses.flatMap((guess) => Array.from(guess.value))).size;

  function addLetter(letter: string) {
    if (state.status !== "playing") return;
    setInputLetters((current) => {
      const next = applyFormwortInputLetter(puzzle.symbols, current, cursorIndex, letter);
      setCursorIndex(next.cursorIndex);

      return next.letters;
    });
  }

  function backspace() {
    setInputLetters((current) => {
      const next = removeFormwortInputLetter(puzzle.symbols, current, cursorIndex);

      setCursorIndex(next.cursorIndex);

      return next.letters;
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
      setFinishedAt(Date.now());
      setResultVisible(true);
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
    setFinishedAt(Date.now());
    setResultVisible(true);
  }

  function startPracticeWord() {
    const nextGame = createPracticeFormwortGame(puzzle.answer, today);

    setGame(nextGame);
    setState(nextGame.state);
    setInputLetters(createEmptyInput(nextGame.puzzle.wordLength));
    setCursorIndex(0);
    setMessage("");
    setResultVisible(false);
    setFinishedAt(null);
    setProgressLoaded(true);
    setStartedAt(Date.now());
  }

  function resultTitle() {
    if (state.status === "won") return "Form geknackt.";
    if (state.status === "lost") return "Heute nicht geknackt.";

    return "Aufgelöst.";
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
    <GameScreenFrame
      actions={state.status === "playing" ? <SmallGameAction label="Lösung anzeigen" onPress={() => setGiveUpVisible(true)} /> : null}
      inputPreview={<LetterInputTiles cursorIndex={cursorIndex} disabled={state.status !== "playing"} letters={inputLetters} onCursorChange={setCursorIndex} />}
      keyboard={{
        disabled: state.status !== "playing",
        letterStates,
        onBackspace: backspace,
        onLetter: addLetter,
        onSubmit: submit,
        submitDisabled: !canSubmit,
      }}
      onBack={goBack}
      onHelp={() => setHelpVisible(true)}
      subtitle={dateKey}
      title="Formwort"
    >
      <View style={styles.wrap}>
        <View style={styles.board}>
          {Array.from({ length: puzzle.maxAttempts }).map((_, rowIndex) => {
            const guess = state.guesses[rowIndex];
            const letters = guess ? Array.from(guess.value) : rowIndex === state.guesses.length ? inputLetters : createEmptyInput(puzzle.wordLength);

            return (
              <View key={rowIndex} style={styles.tileRow}>
                {letters.map((letter, letterIndex) => {
                  const mark = guess?.marks[letterIndex];
                  const symbol = !guess && rowIndex === state.guesses.length && !letter ? puzzle.symbols[letterIndex] : "";

                  return (
                    <Pressable disabled key={`${rowIndex}-${letterIndex}`} style={[styles.tile, mark && styles[mark]]}>
                      <Text style={[styles.tileText, symbol && styles.symbolText, mark && styles.markedTileText]}>{letter ? letter.toLocaleUpperCase("de-DE") : symbol}</Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
        {state.status === "lost" || state.status === "revealed" ? <Text style={styles.answer}>Lösung: {puzzle.answer.toLocaleUpperCase("de-DE")}</Text> : null}
      </View>
      <ConfirmModal confirmLabel="Lösung zeigen" message="Die Lösung wird angezeigt und die Runde zählt nicht als geschafft." onCancel={() => setGiveUpVisible(false)} onConfirm={reveal} title="Lösung anzeigen?" visible={giveUpVisible} />
      <GameResultModal
        message={state.status === "won" ? "Alle Formen sitzen." : "Die Lösung ist raus. Weiteres Wort?"}
        onHome={() => router.replace("/")}
        onNext={startPracticeWord}
        solution={puzzle.answer}
        stats={[
          { label: "Versuche", value: state.guesses.length },
          { label: "Zeit", value: `${elapsedSeconds} Sek.` },
          { label: "Buchstaben", value: usedLetters }
        ]}
        title={resultTitle()}
        visible={resultVisible && state.status !== "playing"}
      />
      <HelpModal {...gameHelp.formwort} onClose={() => setHelpVisible(false)} visible={helpVisible} />
    </GameScreenFrame>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.sm },
  board: { flex: 1, justifyContent: "center", gap: 6 },
  tileRow: { flexDirection: "row", gap: 7 },
  tile: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: tokens.color.line, borderRadius: tokens.radius.sm, backgroundColor: "rgba(255,255,255,0.5)" },
  tileText: { color: tokens.color.ink, fontSize: 25, fontWeight: "900" },
  symbolText: { color: "#E99B88", fontSize: 24 },
  markedTileText: { color: "white" },
  absent: { backgroundColor: "#7B736A", borderColor: "#7B736A" },
  present: { backgroundColor: "#D98500", borderColor: "#D98500" },
  correct: { backgroundColor: tokens.color.success, borderColor: tokens.color.success },
  message: { color: tokens.color.muted, fontSize: tokens.type.body, textAlign: "center" },
  answer: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900", textAlign: "center" },
});
