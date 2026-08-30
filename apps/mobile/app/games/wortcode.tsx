import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import { ConfirmModal } from "@/components/ConfirmModal";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { GameResultModal } from "@/components/GameResultModal";
import { HelpModal } from "@/components/HelpModal";
import { ShakeView } from "@/components/ShakeView";
import { SmallGameAction } from "@/components/SmallGameAction";
import { getBerlinDateKey } from "@/daily/date";
import { tokens } from "@/design/tokens";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { createNextWortcodeGame, restoreWortcodePuzzle } from "@/games/wortcode/daily";
import {
  applyWortcodeHint,
  getWortcodeRevealedLetters,
  revealWortcodeSolution,
  submitWortcodeGuess,
  toggleWortcodeLetterMark,
} from "@/games/wortcode/engine";
import { WortcodeLetterMark, WortcodeState } from "@/games/wortcode/types";
import { getWordTileLayout } from "@/games/wordTileLayout";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { BucketPreset } from "@/games/wordBuckets";
import { isStartedProgress, loadProgress, loadProgressForGames, saveProgress, type StoredProgress } from "@/storage/progress";
import { getPreset, loadWordBucketSettings } from "@/storage/wordBuckets";
import { updateBadgeCount } from "@/notifications/badge";
import { isFinishedGameStatus, useGameRecorder } from "@/stats/recorder";
import { usePacksSettings } from "@/hooks/usePacksSettings";
import { HintIndicator } from "@/components/HintIndicator";
import { useHintWallet } from "@/hints/useHintWallet";
import { getHintPolicy, requestAdHint, shouldShowEarnedProgress } from "@/hints/policy";
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
  const posthog = usePostHog();
  const hintWallet = useHintWallet();
  const hintPolicy = getHintPolicy();
  const revealedLetters = getWortcodeRevealedLetters(puzzle, state);
  const revealedSet = new Set(revealedLetters.map((ch, i) => (ch ? i : -1)).filter((i) => i >= 0));
  const mergeDraftWithRevealed = (draft: string[], letters: (string | null)[]) => draft.map((ch, i) => (letters[i] ? letters[i]! : ch));

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
        const revealed = getWortcodeRevealedLetters(nextGame.puzzle, progress.state as WortcodeState);
        const merged = mergeDraftWithRevealed(base, revealed);
        setInputLetters(merged);
        const firstEmpty = merged.findIndex((ch, i) => !ch && !revealed[i]);
        if (firstEmpty >= 0) setCursorIndex(firstEmpty);
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
    if (revealedSet.has(cursorIndex)) {
      let nextIdx = cursorIndex + 1;
      while (nextIdx < puzzle.wordLength && revealedSet.has(nextIdx)) nextIdx += 1;
      if (nextIdx >= puzzle.wordLength) return;
      setCursorIndex(nextIdx);
      setInputLetters((current) => current.map((item, index) => (index === nextIdx ? letter : item)));
      let after = nextIdx + 1;
      while (after < puzzle.wordLength && revealedSet.has(after)) after += 1;
      setCursorIndex(Math.min(after, puzzle.wordLength - 1));
      return;
    }
    setInputLetters((current) => current.map((item, index) => (index === cursorIndex ? letter : item)));
    let next = cursorIndex + 1;
    while (next < puzzle.wordLength && revealedSet.has(next)) next += 1;
    setCursorIndex(Math.min(next, puzzle.wordLength - 1));
  }

  function backspace() {
    if (revealedSet.has(cursorIndex)) {
      let prev = cursorIndex - 1;
      while (prev >= 0 && revealedSet.has(prev)) prev -= 1;
      if (prev >= 0) setCursorIndex(prev);
      return;
    }
    setInputLetters((current) => {
      if (current[cursorIndex]) {
        return current.map((item, index) => (index === cursorIndex ? "" : item));
      }
      let previousIndex = cursorIndex - 1;
      while (previousIndex >= 0 && revealedSet.has(previousIndex)) previousIndex -= 1;
      previousIndex = Math.max(previousIndex, 0);
      if (revealedSet.has(previousIndex)) return current;
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
      const letters = getWortcodeRevealedLetters(puzzle, next);
      setState(next);
      setInputLetters((prev) => mergeDraftWithRevealed(prev, letters));
      stats.recordHint({ source: "ad", gameId: "wortcode" });
      try { posthog.capture("hint_used", { gameId: "wortcode", dateKey, source: "ad" }); } catch {}
      setMessage("Tipp aufgedeckt.");
      return;
    }
    if (!hintWallet.canConsume) {
      setMessage(hintWallet.wallet.balance >= 3 ? "Tipp-Lager voll (3/3)." : `Keine Tipps. Gewinne noch ${3 - hintWallet.wallet.winsSinceLastHint} Runden.`);
      return;
    }
    const consumed = await hintWallet.tryConsume();
    if (!consumed) { setMessage("Keine Tipps verfügbar."); return; }
    const next = applyWortcodeHint(puzzle, state);
    if (next === state) { setMessage("Alle Buchstaben schon aufgedeckt."); return; }
    const letters = getWortcodeRevealedLetters(puzzle, next);
    setState(next);
    setInputLetters((prev) => mergeDraftWithRevealed(prev, letters));
    const firstEmpty = mergeDraftWithRevealed(inputLetters, letters).findIndex((ch, i) => !ch && !letters[i]);
    if (firstEmpty >= 0) setCursorIndex(firstEmpty);
    startStats();
    stats.recordHint({ source: "earned", gameId: "wortcode", revealedCount: next.revealedIndices?.length });
    try { posthog.capture("hint_used", { gameId: "wortcode", dateKey, source: "earned" }); } catch {}
    setMessage("Tipp: Buchstabe aufgedeckt.");
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
      const nextRevealed = getWortcodeRevealedLetters(puzzle, result.state);
      setInputLetters(mergeDraftWithRevealed(createEmptyInput(puzzle.wordLength), nextRevealed));
      const firstEmpty = nextRevealed.findIndex((ch) => !ch);
      setCursorIndex(firstEmpty >= 0 ? firstEmpty : 0);
    } else {
      stats.recordRejectedGuess(result.reason, inputLetters.join(""));
      setShakeTick((value) => value + 1);
    }
    if (result.ok && isFinishedGameStatus(result.state.status)) {
      stats.finish(result.state.status);
      if (result.state.status === "won") {
        hintWallet.onWin().then((granted) => {
          if (granted) setMessage("Tipp erhalten! 💡");
          try { posthog.capture(granted ? "hint_earned" : "hint_progress", { gameId: "wortcode", dateKey }); } catch {}
        });
      }
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
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  const hintDisabled = state.status !== "playing" || (hintPolicy !== "ads" && !hintWallet.canConsume);
  const hintLabel = hintPolicy === "ads" ? "Tipp (Werbung)" : `Tipp (${hintWallet.wallet.balance}/3)`;

  return (
    <GameScreenFrame
      actions={
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <HintIndicator balance={hintWallet.wallet.balance} winsSinceLastHint={hintWallet.wallet.winsSinceLastHint} showProgress={shouldShowEarnedProgress(hintPolicy)} />
          {state.status === "playing" ? <SmallGameAction disabled={hintDisabled} label={hintLabel} onPress={useHint} /> : null}
          {state.status === "playing" ? <SmallGameAction label="Lösung anzeigen" onPress={() => setGiveUpVisible(true)} /> : null}
        </View>
      }
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
                      const isHintLocked = revealedSet.has(letterIndex);
                      return (
                        <Pressable
                          accessibilityLabel={`Buchstabe ${letterIndex + 1}${letter ? `: ${letter.toUpperCase()}` : " leer"}${isHintLocked ? " (Tipp)" : ""}`}
                          accessibilityRole="button"
                          key={`input-${letterIndex}`}
                          disabled={isHintLocked}
                          onPress={() => {
                            if (isHintLocked) return;
                            setCursorIndex(letterIndex);
                          }}
                          style={[
                            styles.letterTile,
                            { minHeight: tileLayout.minHeight },
                            letterIndex === cursorIndex && !isHintLocked && styles.activeTile,
                            isHintLocked && styles.exactTile,
                          ]}
                        >
                          <Text style={[styles.letterText, { fontSize: tileLayout.fontSize - 4 }, isHintLocked && styles.exactLetterText]}>{letter.toLocaleUpperCase("de-DE")}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              </ShakeView>
            ) : null}
          </View>

          {message ? <Text style={styles.answer}>{message}</Text> : null}
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
  guessRow: { flexDirection: "row", alignItems: "center", gap: tokens.space.sm },
  inputRow: { gap: tokens.space.sm },
  letterRow: { flexDirection: "row" },
  letterTile: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", borderRadius: tokens.radius.sm, backgroundColor: "rgba(255,255,255,0.5)", borderWidth: 2, borderColor: tokens.color.line },
  activeTile: { borderColor: tokens.color.primary, backgroundColor: tokens.color.primaryLight },
  includedTile: { backgroundColor: "#FFD76A", borderColor: "#D98500" },
  exactTile: { backgroundColor: tokens.color.success, borderColor: "#127456" },
  letterText: { color: tokens.color.ink, fontSize: 18, fontWeight: "900" },
  exactLetterText: { color: "white" },
  feedbackBoxes: { flexDirection: "row", gap: 4, marginLeft: tokens.space.xs },
  feedbackBox: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 6, borderWidth: 1 },
  feedbackBoxGreen: { backgroundColor: tokens.color.success, borderColor: "#127456" },
  feedbackBoxYellow: { backgroundColor: "#D98500", borderColor: "#B96D00" },
  feedbackBoxRed: { backgroundColor: tokens.color.danger, borderColor: "#A92E2A" },
  feedbackBoxText: { color: "white", fontSize: 13, fontWeight: "900" },
  answer: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900", textAlign: "center" }
});
