import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import { captureEvent } from "@/analytics/events";
import { ConfirmModal } from "@/components/ConfirmModal";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { GameResultModal } from "@/components/GameResultModal";
import { HelpModal } from "@/components/HelpModal";
import { ShakeView } from "@/components/ShakeView";
import { SmallGameAction } from "@/components/SmallGameAction";
import { getBerlinDateKey } from "@/daily/date";
import { useNextOpenDailyKniff } from "@/dailyKniffe/continuation";
import { tokens } from "@/design/tokens";
import { createNextFormwortGame, restoreFormwortPuzzle } from "@/games/formwort/daily";
import {
  applyFormwortHint,
  applyFormwortInputLetter,
  getFormwortLetterStates,
  getFormwortRevealedLetters,
  removeFormwortInputLetter,
  revealFormwortSolution,
  submitFormwortGuess,
} from "@/games/formwort/engine";
import type { FormwortState } from "@/games/formwort/types";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { getWordTileLayout } from "@/games/wordTileLayout";
import { BucketPreset } from "@/games/wordBuckets";
import { updateBadgeCount } from "@/notifications/badge";
import { scheduleDailyReminder } from "@/notifications/scheduler";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { isStartedProgress, loadProgress, loadProgressForGames, mergeCompletedStatus, saveProgress, type StoredProgress } from "@/storage/progress";
import { getPreset, loadWordBucketSettings } from "@/storage/wordBuckets";
import { isFinishedGameStatus, useGameRecorder } from "@/stats/recorder";
import { usePacksSettings } from "@/hooks/usePacksSettings";
import { useHintWallet } from "@/hints/useHintWallet";
import { getHintPolicy, requestAdHint } from "@/hints/policy";
import { buildMarkedGridShareText } from "@/games/share/grid";

type FormwortGame = ReturnType<typeof createNextFormwortGame>;

const symbolColors = [
  "#E85D3F",
  "#246BFE",
  "#2E7D32",
  "#7B1FA2",
  "#D98500",
  "#00838F",
  "#C2185B",
  "#6D4C41",
  "#5E35B1",
  "#558B2F",
];

function createEmptyInput(length: number) {
  return Array.from({ length }, () => "");
}

function symbolColor(symbol: string): string {
  return symbolColors[Math.abs(symbol.codePointAt(0) ?? 0) % symbolColors.length];
}

function tileStyle(minHeight: number, symbol: string, colorForSymbol: (s: string) => string, mark?: string, isActive?: boolean) {
  return [
    styles.tile,
    { minHeight },
    isActive && styles.activeTile,
    symbol && !isActive && { borderColor: colorForSymbol(symbol) },
    mark === "absent" && styles.absent,
    mark === "present" && styles.present,
    mark === "correct" && styles.correct,
  ];
}

export default function FormwortScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const today = getBerlinDateKey();
  const stats = useGameRecorder();
  const completedAtRef = useRef<string | undefined>(undefined);
  const completedStatusRef = useRef<StoredProgress["status"] | undefined>(undefined);
  const [bucketPreset, setBucketPreset] = useState<BucketPreset>("klassisch");
  const { packs } = usePacksSettings();
  const [game, setGame] = useState<FormwortGame>(() => createNextFormwortGame(undefined, today, "klassisch"));

  useEffect(() => {
    loadWordBucketSettings().then((s) => setBucketPreset(getPreset(s)));
  }, []);
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<FormwortState>(game.state);
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
  const nextDailyKniffRoute = useNextOpenDailyKniff("formwort", dateKey, state.status === "won");
  const hintWallet = useHintWallet();
  const hintPolicy = getHintPolicy();
  const revealedLetters = getFormwortRevealedLetters(puzzle, state);

  useEffect(() => {
    captureEvent(posthog, "screen_viewed", { screen: "formwort", params: { dateKey } });
    captureEvent(posthog, "game_started", { gameId: "formwort", dateKey });
  }, [dateKey, posthog]);

  useEffect(() => {
    loadProgress<FormwortState>("formwort", today).then((progress) => {
      completedAtRef.current = progress?.completedAt;
      completedStatusRef.current = progress?.completedStatus;
      const restoredPuzzle = restoreFormwortPuzzle(progress?.puzzle);
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
    saveProgress({ gameId: "formwort", dateKey, draft: inputLetters, completedStatus, puzzle, puzzleId: puzzle.id, puzzleVersion: puzzle.version, status: state.status, state, completedAt });
  }, [dateKey, inputLetters, progressLoaded, puzzle, state]);

  useEffect(() => {
    if (state.status !== "playing") loadProgressForGames(games.map((g) => g.id), dateKey).then((progress) => {
      updateBadgeCount(progress);
      scheduleDailyReminder().catch(() => {});
    });
  }, [state.status, dateKey]);

  const canSubmit = inputLetters.every(Boolean) && state.status === "playing";
  const letterStates = getFormwortLetterStates(state);
  const tileLayout = getWordTileLayout(puzzle.wordLength);
  const usedLetters = new Set(state.guesses.flatMap((guess) => Array.from(guess.value))).size;
  const visibleRows = state.guesses.length + (state.status === "playing" ? 1 : 0);

  function addLetter(letter: string) {
    if (state.status !== "playing") return;
    setInputLetters((current) => {
      const next = applyFormwortInputLetter(puzzle.symbols, current, cursorIndex, letter);
      setCursorIndex(next.cursorIndex);
      return next.letters as string[];
    });
  }

  function backspace() {
    setInputLetters((current) => {
      const next = removeFormwortInputLetter(puzzle.symbols, current, cursorIndex);
      setCursorIndex(next.cursorIndex);
      return next.letters as string[];
    });
  }

  async function useHint() {
    if (state.status !== "playing") return;
    if (hintPolicy === "ads") {
      const ok = await requestAdHint();
      if (!ok) { setMessage("Werbung gerade nicht verfügbar."); return; }
      const next = applyFormwortHint(puzzle, state);
      if (next === state) { setMessage("Alle Buchstaben schon aufgedeckt."); return; }
      setState(next);
      stats.recordHint({ source: "ad", gameId: "formwort" });
      captureEvent(posthog, "hint_used", { gameId: "formwort", dateKey, source: "ad" });
      setMessage("Hinweis aufgedeckt.");
      return;
    }
    if (!hintWallet.canConsume) {
      setMessage(hintWallet.wallet.balance >= 3 ? "Hinweis-Lager voll (3/3)." : `Keine Hinweise. Gewinne noch ${3 - hintWallet.wallet.winsSinceLastHint} Runden.`);
      return;
    }
    const next = applyFormwortHint(puzzle, state);
    if (next === state) { setMessage("Alle Buchstaben schon aufgedeckt."); return; }
    const consumed = await hintWallet.tryConsume();
    if (!consumed) { setMessage("Keine Hinweise verfügbar."); return; }
    setState(next);
    startStats();
    stats.recordHint({ source: "earned", gameId: "formwort", revealedCount: next.revealedIndices?.length });
    captureEvent(posthog, "hint_used", { gameId: "formwort", dateKey, source: "earned" });
    setMessage("Hinweis: Buchstabe aufgedeckt.");
  }

  function startStats() {
    stats.start({ gameId: "formwort", playDate: dateKey, puzzleId: puzzle.id, gameVersion: puzzle.version, wordLength: puzzle.wordLength });
  }

  function submit() {
    startStats();
    const result = submitFormwortGuess(puzzle, state, inputLetters.join(""));

    setState(result.state);
    setMessage(result.ok ? result.state.status === "won" ? "Form geknackt!" : result.state.status === "lost" ? "Heute nicht geknackt." : "" : result.reason);
    if (result.ok) {
      stats.recordAcceptedGuess(result.guess.value, { marks: [...result.guess.marks] });
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
          try { posthog.capture(granted ? "hint_earned" : "hint_progress", { gameId: "formwort", dateKey }); } catch {}
        });
      }
      setFinishedAt(Date.now());
      setResultVisible(true);
      captureEvent(posthog, "game_completed", { gameId: "formwort", dateKey, durationMs: elapsedSeconds * 1000, attempts: result.state.guesses.length, outcome: result.state.status, success: result.state.status === "won" });
    }
  }

  function reveal() {
    startStats();
    stats.finish("revealed");
    captureEvent(posthog, "solution_revealed", { gameId: "formwort", dateKey, attempts: state.guesses.length });
    captureEvent(posthog, "game_completed", { gameId: "formwort", dateKey, durationMs: elapsedSeconds * 1000, attempts: state.guesses.length, outcome: "revealed", success: false });
    setState((current) => revealFormwortSolution(current));
    setMessage("Lösung aufgedeckt.");
    setInputLetters(createEmptyInput(puzzle.wordLength));
    setCursorIndex(0);
    setGiveUpVisible(false);
    setFinishedAt(Date.now());
    setResultVisible(true);
  }

  function startNextWord() {
    const nextGame = createNextFormwortGame(puzzle.answer, today, bucketPreset, packs);

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
    if (state.status === "won") return "Form geknackt.";
    if (state.status === "lost") return "Heute nicht geknackt.";

    return "Aufgelöst.";
  }

  function goBack() {
    if (state.status === "playing" && state.guesses.length > 0) {
      captureEvent(posthog, "game_abandoned", { gameId: "formwort", dateKey, attempts: state.guesses.length });
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
          {state.status === "playing" ? <SmallGameAction label="Lösung anzeigen" onPress={() => setGiveUpVisible(true)} /> : null}
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
        captureEvent(posthog, "help_opened", { gameId: "formwort", dateKey });
        setHelpVisible(true);
      }}
      subtitle={`${puzzle.wordLength} Buchstaben`}
      title="Formwort"
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.wrap}>
          <View style={styles.board}>
            {Array.from({ length: visibleRows }).map((_, rowIndex) => {
              const guess = state.guesses[rowIndex];
              const inputRow = state.status === "playing" && rowIndex === state.guesses.length;
              const letters = guess ? Array.from(guess.value) : inputRow ? inputLetters : createEmptyInput(puzzle.wordLength);

              const rowContent = (
                <Animated.View
                  entering={FadeInDown.duration(tokens.motion.quick)}
                  key={rowIndex}
                  layout={LinearTransition.springify().damping(16)}
                  style={[styles.tileRow, { gap: tileLayout.gap }]}
                >
                  {letters.map((letter, letterIndex) => {
                    const mark = guess?.marks[letterIndex];
                    const placeholder = inputRow && !letter ? revealedLetters[letterIndex] : null;
                    const symbol = inputRow && !letter ? puzzle.symbols[letterIndex] : "";
                    const isActive = inputRow && !guess && letterIndex === cursorIndex && state.status === "playing";

                    return (
                      <Pressable
                        disabled={Boolean(guess)}
                        key={`${rowIndex}-${letterIndex}`}
                        onPress={() => {
                          if (inputRow) setCursorIndex(letterIndex);
                        }}
                        style={tileStyle(tileLayout.minHeight, symbol, symbolColor, mark, isActive)}
                      >
                        <Text
                          style={[
                            styles.tileText,
                            { fontSize: tileLayout.fontSize },
                            symbol && !placeholder && styles.symbolText,
                            symbol && !placeholder && { color: symbolColor(symbol), fontSize: tileLayout.symbolFontSize },
                            placeholder && styles.placeholderText,
                            mark && styles.markedTileText,
                          ]}
                        >
                          {(letter || placeholder || symbol).toLocaleUpperCase("de-DE")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </Animated.View>
              );

              if (inputRow) {
                return (
                  <ShakeView key={rowIndex} trigger={shakeTick}>
                    {rowContent}
                  </ShakeView>
                );
              }

              return rowContent;
            })}
          </View>

          {message ? <Text style={styles.answer}>{message}</Text> : null}
          {state.status === "lost" || state.status === "revealed" ? <Text style={styles.answer}>Lösung: {puzzle.answer.toLocaleUpperCase("de-DE")}</Text> : null}
        </View>
      </ScrollView>
      <ConfirmModal confirmLabel="Lösung zeigen" message="Die Lösung wird angezeigt und die Runde zählt nicht als geschafft." onCancel={() => setGiveUpVisible(false)} onConfirm={reveal} title="Lösung anzeigen?" visible={giveUpVisible} />
      <GameResultModal
        attempts={state.guesses.length}
        dateKey={dateKey}
        durationMs={elapsedSeconds * 1000}
        gameId="formwort"
        guesses={state.guesses.map((guess) => guess.value)}
        message={state.status === "won" ? "Alle Formen sitzen." : "Die Lösung ist raus. Weiteres Wort?"}
        onFeedback={(rating) => captureEvent(posthog, "game_feedback_submitted", { gameId: "formwort", dateKey, rating, outcome: state.status })}
        onHome={() => router.replace("/")}
        actionLabel={nextDailyKniffRoute ? "Nächster Tageskniff" : undefined}
        onNext={() => nextDailyKniffRoute ? router.push(nextDailyKniffRoute as never) : startNextWord()}
        onShare={() => captureEvent(posthog, "result_shared", { gameId: "formwort", dateKey, scope: "game", outcome: state.status })}
        onViewed={() => captureEvent(posthog, "result_viewed", { gameId: "formwort", dateKey, scope: "game", outcome: state.status, success: state.status === "won" })}
        outcome={state.status === "playing" ? undefined : state.status}
        shareRows={state.guesses.map((guess) => ({ guess: guess.value, marks: guess.marks }))}
        shareText={buildMarkedGridShareText("Formwort", dateKey, state.status, state.guesses.map((guess) => ({ guess: guess.value, marks: guess.marks })), puzzle.answer)}
        solution={puzzle.answer}
        success={state.status === "won"}
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
  scrollContent: { flexGrow: 1, paddingBottom: tokens.space.md },
  wrap: { gap: tokens.space.sm },
  board: { gap: 5 },
  tileRow: { flexDirection: "row" },
  tile: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: tokens.color.line, borderRadius: tokens.radius.sm, backgroundColor: "rgba(255,255,255,0.5)" },
  activeTile: { borderColor: tokens.color.primary, backgroundColor: tokens.color.primaryLight },
  tileText: { color: tokens.color.ink, fontSize: 25, fontWeight: "900" },
  symbolText: { color: "#E99B88", fontSize: 24 },
  placeholderText: { color: tokens.color.muted, opacity: 0.45 },
  markedTileText: { color: "white" },
  absent: { backgroundColor: "#7B736A", borderColor: "#7B736A" },
  present: { backgroundColor: "#D98500", borderColor: "#D98500" },
  correct: { backgroundColor: tokens.color.success, borderColor: tokens.color.success },
  answer: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900", textAlign: "center" },
});
