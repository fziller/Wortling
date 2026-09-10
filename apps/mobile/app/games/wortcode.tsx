import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import { captureEvent } from "@/analytics/events";
import { ConfirmModal } from "@/components/ConfirmModal";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { GameResultModal } from "@/components/GameResultModal";
import { GrowingGuessBoard } from "@/components/GrowingGuessBoard";
import { HelpModal } from "@/components/HelpModal";
import { ShakeView } from "@/components/ShakeView";
import { SmallGameAction } from "@/components/SmallGameAction";
import type { KeyboardLetterState } from "@/components/WordKeyboard";
import { getBerlinDateKey } from "@/daily/date";
import { useNextOpenDailyKniff } from "@/dailyKniffe/continuation";
import { tokens } from "@/design/tokens";
import { buildSimpleShareText } from "@/games/share/grid";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { createNextWortcodeGame, restoreWortcodePuzzle } from "@/games/wortcode/daily";
import {
  applyWortcodeHint,
  getWortcodeRevealedLetters,
  getWortcodeEffectiveMarks,
  revealWortcodeSolution,
  submitWortcodeGuess,
  toggleWortcodeLetterMark,
} from "@/games/wortcode/engine";
import { WortcodeLetterMark, WortcodeState } from "@/games/wortcode/types";
import { getWordTileLayout } from "@/games/wordTileLayout";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { BucketPreset } from "@/games/wordBuckets";
import { isStartedProgress, loadProgress, loadProgressForGames, mergeCompletedStatus, saveProgress, type StoredProgress } from "@/storage/progress";
import { getPreset, loadWordBucketSettings } from "@/storage/wordBuckets";
import { updateBadgeCount } from "@/notifications/badge";
import { scheduleDailyReminder } from "@/notifications/scheduler";
import { isFinishedGameStatus, useGameRecorder } from "@/stats/recorder";
import { rejectMessage } from "@/games/rejectMessages";
import { usePacksSettings } from "@/hooks/usePacksSettings";
import { useHintWallet } from "@/hints/useHintWallet";
import { getHintPolicy, requestAdHint } from "@/hints/policy";
import { usePostHog } from "posthog-react-native";

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
  const [bucketPreset, setBucketPreset] = useState<BucketPreset>("klassisch");
  const { packs } = usePacksSettings();
  const [game, setGame] = useState<WortcodeGame>(() => createNextWortcodeGame(undefined, today, "klassisch"));

  useEffect(() => {
    loadWordBucketSettings().then((s) => setBucketPreset(getPreset(s)));
  }, []);
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<WortcodeState>(game.state);
  const [inputLetters, setInputLetters] = useState(() => createEmptyInput(game.puzzle.wordLength));
  const [cursorIndex, setCursorIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [shakeTick, setShakeTick] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);
  const [giveUpVisible, setGiveUpVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const { elapsedSeconds, reset: resetTimer } = useActiveTimer(state.status === "playing", finishedAt);
  const nextDailyKniffRoute = useNextOpenDailyKniff("wortcode", dateKey, state.status === "won");
  const posthog = usePostHog();
  const hintWallet = useHintWallet();
  const hintPolicy = getHintPolicy();
  const revealedLetters = getWortcodeRevealedLetters(puzzle, state);

  useEffect(() => {
    captureEvent(posthog, "screen_viewed", { screen: "wortcode", params: { dateKey } });
    captureEvent(posthog, "game_started", { gameId: "wortcode", dateKey });
  }, [dateKey, posthog]);

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
        const base = draft.length === nextGame.puzzle.wordLength ? draft : createEmptyInput(nextGame.puzzle.wordLength);
        setInputLetters(base);
        const firstEmpty = base.findIndex((ch) => !ch);
        if (firstEmpty >= 0) setCursorIndex(firstEmpty);
      }
      setProgressLoaded(true);
    });
  }, [today]);

  useEffect(() => {
    if (!progressLoaded) return;

    const completedAt = state.status !== "playing" ? new Date().toISOString() : completedAtRef.current;
    const completedStatus = mergeCompletedStatus(completedStatusRef.current, state.status !== "playing" ? state.status : undefined);
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
      loadProgressForGames(games.map((g) => g.id), dateKey).then((progress) => {
        updateBadgeCount(progress);
        scheduleDailyReminder().catch(() => {});
      });
    }
  }, [state.status, dateKey]);

  const canSubmit = inputLetters.every(Boolean) && state.status === "playing";
  const tileLayout = getWordTileLayout(puzzle.wordLength);
  const effectiveMarks = getWortcodeEffectiveMarks(state);
  const letterStates = getLetterStates(effectiveMarks, state);

  function addLetter(letter: string) {
    if (state.status !== "playing") return;
    setInputLetters((current) => current.map((item, index) => (index === cursorIndex ? letter : item)));
    setCursorIndex((current) => Math.min(current + 1, puzzle.wordLength - 1));
  }

  function backspace() {
    setInputLetters((current) => {
      if (current[cursorIndex]) {
        return current.map((item, index) => (index === cursorIndex ? "" : item));
      }
      const previousIndex = Math.max(cursorIndex - 1, 0);
      setCursorIndex(previousIndex);
      return current.map((item, index) => (index === previousIndex ? "" : item));
    });
  }

  async function useHint() {
    if (state.status !== "playing") return;
    if (hintPolicy === "ads") {
      const ok = await requestAdHint();
      if (!ok) { setMessage("Werbung gerade nicht verfügbar."); return; }
      const next = applyWortcodeHint(puzzle, state);
      if (next === state) { setMessage("Alle Buchstaben schon aufgedeckt."); return; }
      setState(next);
      stats.recordHint({ source: "ad", gameId: "wortcode" });
      captureEvent(posthog, "hint_used", { gameId: "wortcode", dateKey, source: "ad" });
      setMessage("Hinweis aufgedeckt.");
      return;
    }
    if (!hintWallet.canConsume) {
      setMessage(hintWallet.wallet.balance >= 3 ? "Hinweis-Lager voll (3/3)." : `Keine Hinweise. Gewinne noch ${3 - hintWallet.wallet.winsSinceLastHint} Runden.`);
      return;
    }
    const next = applyWortcodeHint(puzzle, state);
    if (next === state) { setMessage("Alle Buchstaben schon aufgedeckt."); return; }
    const consumed = await hintWallet.tryConsume();
    if (!consumed) { setMessage("Keine Hinweise verfügbar."); return; }
    setState(next);
    startStats();
    stats.recordHint({ source: "earned", gameId: "wortcode", revealedCount: next.revealedIndices?.length });
    captureEvent(posthog, "hint_used", { gameId: "wortcode", dateKey, source: "earned" });
    setMessage("Hinweis: Buchstabe aufgedeckt.");
  }

  function startStats() {
    stats.start({ gameId: "wortcode", playDate: dateKey, puzzleId: puzzle.id, gameVersion: puzzle.version, wordLength: puzzle.wordLength, difficulty: puzzle.difficulty });
  }

  function submit() {
    startStats();
    const result = submitWortcodeGuess(puzzle, state, inputLetters.join(""));

    setState(result.state);
    setMessage(result.ok ? result.state.status === "won" ? "Code geknackt!" : result.state.status === "lost" ? "Heute nicht geknackt." : "" : rejectMessage(result.reason));
    if (result.ok) {
      const lastGuess = result.state.guesses[result.state.guesses.length - 1];

      stats.recordAcceptedGuess(lastGuess.value, { exactMatches: lastGuess.exactMatches, misplacedMatches: lastGuess.misplacedMatches });
      setInputLetters(createEmptyInput(puzzle.wordLength));
      setCursorIndex(0);
    } else {
      stats.recordRejectedGuess(result.reason, inputLetters.join(""));
      setShakeTick((value) => value + 1);
    }
    if (result.ok && isFinishedGameStatus(result.state.status)) {
      stats.finish(result.state.status);
      if (result.state.status === "won") {
        hintWallet.onWin().then((granted) => {
          if (granted) setMessage("Hinweis erhalten! 💡");
          try { posthog.capture(granted ? "hint_earned" : "hint_progress", { gameId: "wortcode", dateKey }); } catch {}
        });
      }
      setFinishedAt(Date.now());
      setResultVisible(true);
      captureEvent(posthog, "game_completed", {
        gameId: "wortcode",
        dateKey,
        durationMs: elapsedSeconds * 1000,
        attempts: result.state.guesses.length,
        outcome: result.state.status,
        success: result.state.status === "won",
      });
    }
  }

  function toggleMark(guessIndex: number, letterIndex: number) {
    setState((current) => toggleWortcodeLetterMark(current, guessIndex, letterIndex));
  }

  function reveal() {
    startStats();
    stats.finish("revealed");
    captureEvent(posthog, "solution_revealed", { gameId: "wortcode", dateKey, attempts: state.guesses.length });
    captureEvent(posthog, "game_completed", {
      gameId: "wortcode",
      dateKey,
      durationMs: elapsedSeconds * 1000,
      attempts: state.guesses.length,
      outcome: "revealed",
      success: false,
    });
    setState((current) => revealWortcodeSolution(current));
    setMessage("Lösung aufgedeckt.");
    setInputLetters(createEmptyInput(puzzle.wordLength));
    setCursorIndex(0);
    setGiveUpVisible(false);
    setFinishedAt(Date.now());
    setResultVisible(true);
  }

  function startNextWord() {
    const nextGame = createNextWortcodeGame(puzzle.answer, today, bucketPreset, packs);

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
    if (state.status === "playing" && state.guesses.length > 0) {
      captureEvent(posthog, "game_abandoned", { gameId: "wortcode", dateKey, attempts: state.guesses.length });
    }
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  const hintDisabled = state.status !== "playing" || (hintPolicy !== "ads" && !hintWallet.canConsume);
  const hintLabel = hintPolicy === "ads" ? "💡 Hinweis (Werbung)" : `💡 Hinweis (${hintWallet.wallet.balance}/3)`;

  return (
    <GameScreenFrame
      actions={
        <View style={{ flexDirection: "row", flexShrink: 1, flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "center" }}>
          {state.status === "playing" ? <SmallGameAction disabled={hintDisabled} label={hintLabel} onPress={useHint} /> : null}
          {state.status === "playing" ? <SmallGameAction label="Lösung anzeigen" onPress={() => setGiveUpVisible(true)} variant="reveal" /> : null}
        </View>
      }
      keyboard={{
        disabled: state.status !== "playing",
        letterStates,
        onBackspace: backspace,
        onLetter: addLetter,
        onSubmit: submit,
        submitDisabled: !canSubmit,
      }}
      onBack={goBack}
      onHelp={() => {
        captureEvent(posthog, "help_opened", { gameId: "wortcode", dateKey });
        setHelpVisible(true);
      }}
      progressLabel={`${state.guesses.length}/${puzzle.maxAttempts} Versuche`}
      subtitle={`${puzzle.wordLength} Buchstaben`}
      title="Wortcode"
    >
      <View style={styles.wrap}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <GrowingGuessBoard compactRows={5} maxRows={puzzle.maxAttempts} rowGap={tokens.space.sm} rowMinHeight={tileLayout.minHeight} style={styles.history}>
            {state.guesses.map((guess, guessIndex) => {
              const absent = puzzle.wordLength - guess.exactMatches - guess.misplacedMatches;

              return (
                <Animated.View
                  accessibilityLabel={`${guess.value}. ${guess.exactMatches} exakt, ${guess.misplacedMatches} enthalten, ${absent} falsch.`}
                  entering={FadeInDown.duration(tokens.motion.quick)}
                  key={guess.value}
                  layout={LinearTransition.springify().damping(16)}
                  style={styles.guessRow}
                >
                  <View style={[styles.letterRow, { gap: tileLayout.gap, flex: 1 }]}>
                    {Array.from(guess.value).map((letter, letterIndex) => {
                      const mark = effectiveMarks[guessIndex]?.[letterIndex] ?? "none";

                      return (
                        <Pressable
                          accessibilityLabel={`${letter.toUpperCase()}, ${markLabel(mark)}`}
                          accessibilityRole="button"
                          key={`${guess.value}-${letterIndex}`}
                          onPress={() => toggleMark(guessIndex, letterIndex)}
                          style={[styles.letterTile, { minHeight: tileLayout.minHeight }, mark === "included" && styles.includedTile, mark === "exact" && styles.exactTile, mark === "excluded" && styles.excludedTile]}
                        >
                          <Text style={[styles.letterText, { fontSize: tileLayout.fontSize - 4, minWidth: 12, textAlign: "center" }, (mark === "exact" || mark === "excluded") && styles.markedLetterText]}>{letter.toUpperCase()}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.feedbackBoxes}>
                    <View style={[styles.feedbackBox, styles.feedbackBoxGreen]}>
                      <Text style={styles.feedbackBoxText}>{guess.exactMatches}</Text>
                    </View>
                    <View style={[styles.feedbackBox, styles.feedbackBoxYellow]}>
                      <Text style={styles.feedbackBoxText}>{guess.misplacedMatches}</Text>
                    </View>
                    <View style={[styles.feedbackBox, styles.feedbackBoxRed]}>
                      <Text style={styles.feedbackBoxText}>{absent}</Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
            {state.status === "playing" ? (
              <ShakeView trigger={shakeTick}>
                <Animated.View
                  entering={FadeInDown.duration(tokens.motion.quick)}
                  layout={LinearTransition.springify().damping(16)}
                  style={styles.inputRow}
                >
                  <View style={[styles.letterRow, { gap: tileLayout.gap }]}>
                    {inputLetters.map((letter, letterIndex) => {
                      const placeholder = !letter ? revealedLetters[letterIndex] : null;
                      return (
                        <Pressable
                          accessibilityLabel={`Buchstabe ${letterIndex + 1}${letter ? `: ${letter.toUpperCase()}` : placeholder ? `, Hinweis ${placeholder.toUpperCase()}` : " leer"}`}
                          accessibilityRole="button"
                          key={`input-${letterIndex}`}
                          onPress={() => setCursorIndex(letterIndex)}
                          style={[
                            styles.letterTile,
                            { minHeight: tileLayout.minHeight },
                            letterIndex === cursorIndex && styles.activeTile,
                          ]}
                        >
                          <Text style={[styles.letterText, { fontSize: tileLayout.fontSize - 4, minWidth: 12, textAlign: "center" }, placeholder && styles.placeholderText]}>{(letter || placeholder || "").toUpperCase()}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              </ShakeView>
            ) : null}
          </GrowingGuessBoard>

          {message ? <Text style={styles.answer}>{message}</Text> : null}
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
        attempts={state.guesses.length}
        dateKey={dateKey}
        durationMs={elapsedSeconds * 1000}
        gameId="wortcode"
        guesses={state.guesses.map((guess) => guess.value)}
        message={state.status === "won" ? "Sauber kombiniert." : "Die Lösung ist raus. Weiteres Wort?"}
        onFeedback={(rating) => captureEvent(posthog, "game_feedback_submitted", { gameId: "wortcode", dateKey, rating, outcome: state.status })}
        onHome={() => router.replace("/")}
        actionLabel={nextDailyKniffRoute ? "Nächster Tageskniff" : undefined}
        onNext={() => nextDailyKniffRoute ? router.push(nextDailyKniffRoute as never) : startNextWord()}
        onShare={() => captureEvent(posthog, "result_shared", { gameId: "wortcode", dateKey, scope: "game", outcome: state.status })}
        onViewed={() => captureEvent(posthog, "result_viewed", { gameId: "wortcode", dateKey, scope: "game", outcome: state.status, success: state.status === "won" })}
        outcome={state.status === "playing" ? undefined : state.status}
        shareText={buildSimpleShareText("Wortcode", dateKey, state.status, `${state.guesses.length} Versuche · ${elapsedSeconds} Sek.`)}
        solution={puzzle.answer}
        success={state.status === "won"}
        stats={[
          { label: "Versuche", value: state.guesses.length },
          { label: "Zeit", value: `${elapsedSeconds} Sek.` },
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
  if (mark === "excluded") return "als falsch markiert";

  return "nicht markiert";
}

function getLetterStates(marks: WortcodeLetterMark[][], state: WortcodeState): Record<string, KeyboardLetterState> {
  const letterStates: Record<string, KeyboardLetterState> = {};

  state.guesses.forEach((guess, guessIndex) => {
    Array.from(guess.value).forEach((letter, letterIndex) => {
      if (marks[guessIndex]?.[letterIndex] === "excluded") letterStates[letter] = "absent";
    });
  });

  return letterStates;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.sm },
  scrollContent: { flexGrow: 1, gap: tokens.space.md, paddingBottom: tokens.space.md },
  history: { flex: 1 },
  guessRow: { flexDirection: "row", alignItems: "center", gap: tokens.space.sm },
  inputRow: { gap: tokens.space.sm },
  letterRow: { flexDirection: "row" },
  letterTile: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", borderRadius: tokens.radius.sm, backgroundColor: tokens.surface.control, borderWidth: 2, borderColor: tokens.color.line },
  activeTile: { borderColor: tokens.color.primary, backgroundColor: tokens.color.primaryLight },
  includedTile: { backgroundColor: tokens.semantic.partial, borderColor: tokens.semantic.partial },
  exactTile: { backgroundColor: tokens.semantic.correct, borderColor: tokens.semantic.correct },
  excludedTile: { backgroundColor: tokens.semantic.wrong, borderColor: tokens.semantic.wrong },
  letterText: { color: tokens.color.ink, fontSize: 18, ...tokens.typography.gameLetter },
  placeholderText: { color: tokens.color.muted, opacity: 0.45 },
  markedLetterText: { color: "white" },
  feedbackBoxes: { flexDirection: "row", gap: 4, marginLeft: tokens.space.xs },
  feedbackBox: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 6, borderWidth: 1 },
  feedbackBoxGreen: { backgroundColor: tokens.semantic.correct, borderColor: tokens.semantic.correct },
  feedbackBoxYellow: { backgroundColor: tokens.semantic.partial, borderColor: tokens.semantic.partial },
  feedbackBoxRed: { backgroundColor: tokens.semantic.wrong, borderColor: tokens.semantic.wrong },
  feedbackBoxText: { color: "white", fontSize: 13, fontWeight: "900" },
  answer: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900", textAlign: "center" }
});
