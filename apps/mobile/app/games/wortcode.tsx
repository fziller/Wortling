import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import { ConfirmModal } from "@/components/ConfirmModal";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { GameResultModal } from "@/components/GameResultModal";
import { HelpModal } from "@/components/HelpModal";
import { SmallGameAction } from "@/components/SmallGameAction";
import { getBerlinDateKey } from "@/daily/date";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { createNextWortcodeGame, restoreWortcodePuzzle } from "@/games/wortcode/daily";
import { revealWortcodeSolution, submitWortcodeGuess, toggleWortcodeLetterMark } from "@/games/wortcode/engine";
import { WortcodeLetterMark, WortcodeState } from "@/games/wortcode/types";
import { getWordTileLayout } from "@/games/wordTileLayout";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { isStartedProgress, loadProgress, loadProgressForGames, saveProgress, type StoredProgress } from "@/storage/progress";
import { updateBadgeCount } from "@/notifications/badge";
import { isFinishedGameStatus, useGameRecorder } from "@/stats/recorder";

type WortcodeGame = ReturnType<typeof createNextWortcodeGame>;

function createEmptyInput(length: number) {
  return Array.from({ length }, () => "");
}

export default function WortcodeScreen() {
  const router = useRouter();
  const today = getBerlinDateKey();
  const stats = useGameRecorder();
  const completedAtRef = useRef<string | undefined>(undefined);
  const completedStatusRef = useRef<StoredProgress["status"] | undefined>(undefined);
  const [game, setGame] = useState<WortcodeGame>(() => createNextWortcodeGame(undefined, today));
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<WortcodeState>(game.state);
  const [inputLetters, setInputLetters] = useState(() => createEmptyInput(game.puzzle.wordLength));
  const [cursorIndex, setCursorIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [helpVisible, setHelpVisible] = useState(false);
  const [giveUpVisible, setGiveUpVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const { elapsedSeconds, reset: resetTimer } = useActiveTimer(state.status === "playing", finishedAt);

  useEffect(() => {
    loadProgress<WortcodeState>("wortcode", today).then((progress) => {
      completedAtRef.current = progress?.completedAt;
      completedStatusRef.current = progress?.completedStatus;
      const restoredPuzzle = restoreWortcodePuzzle(progress?.puzzle);
      if (isStartedProgress(progress) && restoredPuzzle && progress.state.puzzleId === restoredPuzzle.id) {
        const nextGame = { dateKey: progress.dateKey, puzzle: restoredPuzzle, state: progress.state };
        setGame(nextGame);
        setState(progress.state);
        const draft = Array.isArray(progress.draft) ? progress.draft.map(String).slice(0, nextGame.puzzle.wordLength) : [];
        setInputLetters(draft.length === nextGame.puzzle.wordLength ? draft : createEmptyInput(nextGame.puzzle.wordLength));
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

    saveProgress({
      gameId: "wortcode",
      dateKey,
      draft: inputLetters,
      completedStatus,
      puzzle,
      puzzleId: puzzle.id,
      puzzleVersion: puzzle.version,
      status: state.status,
      state,
      completedAt
    });
  }, [dateKey, inputLetters, progressLoaded, puzzle, state]);

  useEffect(() => {
    if (state.status !== "playing") {
      loadProgressForGames(games.map((g) => g.id), dateKey).then(updateBadgeCount);
    }
  }, [state.status, dateKey]);

  const canSubmit = inputLetters.every(Boolean) && state.status === "playing";
  const tileLayout = getWordTileLayout(puzzle.wordLength);
  const usedLetters = new Set(state.guesses.flatMap((guess) => Array.from(guess.value))).size;

  function addLetter(letter: string) {
    if (state.status !== "playing") return;
    setInputLetters((current) => current.map((item, index) => index === cursorIndex ? letter : item));
    setCursorIndex((current) => Math.min(current + 1, puzzle.wordLength - 1));
  }

  function backspace() {
    setInputLetters((current) => {
      if (current[cursorIndex]) {
        return current.map((item, index) => index === cursorIndex ? "" : item);
      }

      const previousIndex = Math.max(cursorIndex - 1, 0);
      setCursorIndex(previousIndex);

      return current.map((item, index) => index === previousIndex ? "" : item);
    });
  }

  function startStats() {
    stats.start({ gameId: "wortcode", playDate: dateKey, puzzleId: puzzle.id, gameVersion: puzzle.version, wordLength: puzzle.wordLength, difficulty: puzzle.difficulty });
  }

  function submit() {
    startStats();
    const result = submitWortcodeGuess(puzzle, state, inputLetters.join(""));

    setState(result.state);
    setMessage(result.ok ? result.state.status === "won" ? "Code geknackt!" : result.state.status === "lost" ? "Heute nicht geknackt." : "Weiter eingrenzen." : result.reason);
    if (result.ok) {
      const lastGuess = result.state.guesses[result.state.guesses.length - 1];

      stats.recordAcceptedGuess(lastGuess.value, { exactMatches: lastGuess.exactMatches, misplacedMatches: lastGuess.misplacedMatches });
      setInputLetters(createEmptyInput(puzzle.wordLength));
      setCursorIndex(0);
    } else {
      stats.recordRejectedGuess(result.reason, inputLetters.join(""));
    }
    if (result.ok && isFinishedGameStatus(result.state.status)) {
      stats.finish(result.state.status);
      setFinishedAt(Date.now());
      setResultVisible(true);
    }
  }

  function toggleMark(guessIndex: number, letterIndex: number) {
    setState((current) => toggleWortcodeLetterMark(current, guessIndex, letterIndex));
  }

  function reveal() {
    startStats();
    stats.finish("revealed");
    setState((current) => revealWortcodeSolution(current));
    setMessage("Lösung aufgedeckt.");
    setInputLetters(createEmptyInput(puzzle.wordLength));
    setCursorIndex(0);
    setGiveUpVisible(false);
    setFinishedAt(Date.now());
    setResultVisible(true);
  }

  function startNextWord() {
    const nextGame = createNextWortcodeGame(puzzle.answer, today);

    setGame(nextGame);
    setState(nextGame.state);
    setInputLetters(createEmptyInput(nextGame.puzzle.wordLength));
    setCursorIndex(0);
    setMessage("");
    setResultVisible(false);
    setFinishedAt(null);
    setProgressLoaded(true);
    resetTimer();
  }

  function resultTitle() {
    if (state.status === "won") return "Code geknackt.";
    if (state.status === "lost") return "Heute nicht geknackt.";

    return "Aufgelöst.";
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <GameScreenFrame
      actions={state.status === "playing" ? <SmallGameAction label="Lösung anzeigen" onPress={() => setGiveUpVisible(true)} /> : null}
      keyboard={{
        disabled: state.status !== "playing",
        onBackspace: backspace,
        onLetter: addLetter,
        onSubmit: submit,
        submitDisabled: !canSubmit,
      }}
      onBack={goBack}
      onHelp={() => setHelpVisible(true)}
      subtitle={`${dateKey} · ${puzzle.wordLength} Buchstaben`}
      title="Wortcode"
    >
      <View style={styles.wrap}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Gesucht: {puzzle.wordLength} Buchstaben</Text>
            <Text style={styles.summaryText}>Versuch {Math.min(state.guesses.length + 1, puzzle.maxAttempts)} / {puzzle.maxAttempts}</Text>
          </View>

          <View style={styles.history}>
            {state.guesses.map((guess, guessIndex) => (
              <Animated.View
                accessibilityLabel={`${guess.value}. ${guess.exactMatches} exakt. ${guess.misplacedMatches} enthalten.`}
                entering={FadeInDown.duration(tokens.motion.quick)}
                key={guess.value}
                layout={LinearTransition.springify().damping(16)}
                style={styles.guessRow}
              >
                <View style={[styles.letterRow, { gap: tileLayout.gap }]}>
                  {Array.from(guess.value).map((letter, letterIndex) => {
                    const mark = guess.marks?.[letterIndex] ?? "none";

                    return (
                      <Pressable
                        accessibilityLabel={`${letter.toUpperCase()}, ${markLabel(mark)}`}
                        accessibilityRole="button"
                        key={`${guess.value}-${letterIndex}`}
                        onPress={() => toggleMark(guessIndex, letterIndex)}
                        style={[styles.letterTile, { minHeight: tileLayout.minHeight }, mark === "included" && styles.includedTile, mark === "exact" && styles.exactTile]}
                      >
                        <Text style={[styles.letterText, { fontSize: tileLayout.fontSize - 4 }, mark === "exact" && styles.exactLetterText]}>{letter.toUpperCase()}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.feedback}>
                  <Text style={styles.feedbackText}>{guess.exactMatches} exakt</Text>
                  <Text style={styles.feedbackText}>{guess.misplacedMatches} enthalten</Text>
                </View>
              </Animated.View>
            ))}
            {state.status === "playing" ? (
              <Animated.View
                entering={FadeInDown.duration(tokens.motion.quick)}
                layout={LinearTransition.springify().damping(16)}
                style={styles.inputRow}
              >
                <View style={[styles.letterRow, { gap: tileLayout.gap }]}>
                  {inputLetters.map((letter, letterIndex) => (
                    <Pressable
                      accessibilityLabel={`Buchstabe ${letterIndex + 1}${letter ? `: ${letter.toUpperCase()}` : " leer"}`}
                      accessibilityRole="button"
                      key={`input-${letterIndex}`}
                      onPress={() => setCursorIndex(letterIndex)}
                      style={[styles.letterTile, { minHeight: tileLayout.minHeight }, letterIndex === cursorIndex && styles.activeTile]}
                    >
                      <Text style={[styles.letterText, { fontSize: tileLayout.fontSize - 4 }]}>{letter.toLocaleUpperCase("de-DE")}</Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            ) : null}
          </View>

          {state.status === "lost" || state.status === "revealed" ? <Text style={styles.answer}>Lösung: {puzzle.answer.toUpperCase()}</Text> : null}
        </ScrollView>
      </View>
      <ConfirmModal
        confirmLabel="Lösung zeigen"
        message="Die Lösung wird angezeigt und die Runde zählt nicht als geschafft."
        onCancel={() => setGiveUpVisible(false)}
        onConfirm={reveal}
        title="Lösung anzeigen?"
        visible={giveUpVisible}
      />
      <GameResultModal
        guesses={state.guesses.map((guess) => guess.value)}
        message={state.status === "won" ? "Sauber kombiniert." : "Die Lösung ist raus. Weiteres Wort?"}
        onHome={() => router.replace("/")}
        onNext={startNextWord}
        solution={puzzle.answer}
        stats={[
          { label: "Versuche", value: state.guesses.length },
          { label: "Zeit", value: `${elapsedSeconds} Sek.` },
          { label: "Buchstaben", value: usedLetters }
        ]}
        title={resultTitle()}
        visible={resultVisible && state.status !== "playing"}
      />
      <HelpModal {...gameHelp.wortcode} onClose={() => setHelpVisible(false)} visible={helpVisible} />
    </GameScreenFrame>
  );
}

function markLabel(mark: WortcodeLetterMark): string {
  if (mark === "included") return "als enthalten markiert";
  if (mark === "exact") return "als exakt markiert";

  return "nicht markiert";
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.sm },
  scrollContent: { flexGrow: 1, gap: tokens.space.md, paddingBottom: tokens.space.md },
  summaryCard: { gap: tokens.space.xs, padding: tokens.space.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.card, borderWidth: 1, borderColor: tokens.color.line },
  summaryTitle: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900" },
  summaryText: { color: tokens.color.primaryDark, fontSize: tokens.type.body, fontWeight: "900" },
  history: { flex: 1, gap: tokens.space.sm },
  guessRow: { gap: tokens.space.sm },
  inputRow: { gap: tokens.space.sm },
  letterRow: { flexDirection: "row" },
  letterTile: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", borderRadius: tokens.radius.sm, backgroundColor: "rgba(255,255,255,0.5)", borderWidth: 2, borderColor: tokens.color.line },
  activeTile: { borderColor: tokens.color.primary, backgroundColor: tokens.color.primaryLight },
  includedTile: { backgroundColor: "#FFD76A", borderColor: "#D98500" },
  exactTile: { backgroundColor: tokens.color.success, borderColor: "#127456" },
  letterText: { color: tokens.color.ink, fontSize: 18, fontWeight: "900" },
  exactLetterText: { color: "white" },
  feedback: { flexDirection: "row", gap: tokens.space.sm },
  feedbackText: { color: tokens.color.muted, fontSize: tokens.type.small, fontWeight: "900" },
  answer: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900", textAlign: "center" }
});
