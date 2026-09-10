import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

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
import { buildSimpleShareText } from "@/games/share/grid";
import { createNextGalgenwortGame } from "@/games/galgenwort/daily";
import { applyGalgenwortHint, getGalgenwortHintLetter, getGalgenwortLetterStates, getGalgenwortRevealedLetters, getGalgenwortWrongLetters, revealGalgenwortSolution, submitGalgenwortLetter } from "@/games/galgenwort/engine";
import type { GalgenwortState } from "@/games/galgenwort/types";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { updateBadgeCount } from "@/notifications/badge";
import { scheduleDailyReminder } from "@/notifications/scheduler";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { BucketPreset } from "@/games/wordBuckets";
import { isStartedProgress, loadProgress, loadProgressForGames, mergeCompletedStatus, saveProgress, type StoredProgress } from "@/storage/progress";
import { getPreset, loadWordBucketSettings } from "@/storage/wordBuckets";
import { isFinishedGameStatus, useGameRecorder } from "@/stats/recorder";
import { usePacksSettings } from "@/hooks/usePacksSettings";
import { getHintPolicy, requestAdHint } from "@/hints/policy";
import { useHintWallet } from "@/hints/useHintWallet";

type GalgenwortGame = ReturnType<typeof createNextGalgenwortGame>;

export default function GalgenwortScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const today = getBerlinDateKey();
  const stats = useGameRecorder();
  const hintWallet = useHintWallet();
  const hintPolicy = getHintPolicy();
  const completedAtRef = useRef<string | undefined>(undefined);
  const completedStatusRef = useRef<StoredProgress["status"] | undefined>(undefined);
  const [bucketPreset, setBucketPreset] = useState<BucketPreset>("klassisch");
  const { packs } = usePacksSettings();
  const [game, setGame] = useState<GalgenwortGame>(() => createNextGalgenwortGame(undefined, today, "klassisch"));

  useEffect(() => {
    loadWordBucketSettings().then((s) => setBucketPreset(getPreset(s)));
  }, []);
  const { dateKey, puzzle } = game;
  const [state, setState] = useState<GalgenwortState>(game.state);
  const [message, setMessage] = useState("");
  const [shakeTick, setShakeTick] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);
  const [giveUpVisible, setGiveUpVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const { elapsedSeconds, reset: resetTimer } = useActiveTimer(state.status === "playing", finishedAt);
  const nextDailyKniffRoute = useNextOpenDailyKniff("galgenwort", dateKey, state.status === "won");

  useEffect(() => {
    captureEvent(posthog, "screen_viewed", { screen: "galgenwort", params: { dateKey } });
    captureEvent(posthog, "game_started", { gameId: "galgenwort", dateKey });
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
    const completedStatus = mergeCompletedStatus(completedStatusRef.current, state.status !== "playing" ? state.status : undefined);
    completedAtRef.current = completedAt;
    completedStatusRef.current = completedStatus;
    saveProgress({ gameId: "galgenwort", dateKey, completedStatus, puzzle, puzzleId: puzzle.id, puzzleVersion: puzzle.version, status: state.status, state, completedAt });
  }, [dateKey, progressLoaded, puzzle, state]);

  useEffect(() => {
    if (state.status !== "playing") loadProgressForGames(games.map((g) => g.id), dateKey).then((progress) => {
      updateBadgeCount(progress);
      scheduleDailyReminder().catch(() => {});
    });
  }, [state.status, dateKey]);

  const revealed = getGalgenwortRevealedLetters(puzzle, state);
  const answerLength = Array.from(puzzle.answer).length;
  const wordTileFontSize = answerLength > 10 ? 24 : answerLength > 8 ? 28 : 34;
  const wrongLetters = getGalgenwortWrongLetters(puzzle, state);
  const letterStates = getGalgenwortLetterStates(puzzle, state);
  const hintDisabled = state.status !== "playing" || !getGalgenwortHintLetter(puzzle, state) || (hintPolicy !== "ads" && !hintWallet.canConsume);
  const hintLabel = hintPolicy === "ads" ? "💡 Hinweis (Werbung)" : `💡 Hinweis (${hintWallet.wallet.balance}/3)`;

  function startStats() {
    stats.start({ gameId: "galgenwort", playDate: dateKey, puzzleId: puzzle.id, gameVersion: puzzle.version });
  }

  function guess(letter: string) {
    startStats();
    const result = submitGalgenwortLetter(puzzle, state, letter);

    setState(result.state);
    setMessage(result.ok ? result.state.status === "won" ? "Gelöst!" : result.state.status === "lost" ? "Heute nicht gerettet." : result.correct ? "Treffer." : "Leider nicht drin." : result.reason);
    if (result.ok) {
      stats.recordAcceptedGuess(letter);
    } else {
      stats.recordRejectedGuess(result.reason, letter);
      setShakeTick((value) => value + 1);
    }
    if (result.ok && isFinishedGameStatus(result.state.status)) {
      stats.finish(result.state.status);
      if (result.state.status === "won") {
        hintWallet.onWin().then((granted) => {
          if (granted) setMessage("Hinweis erhalten! 💡");
        });
      }
      setFinishedAt(Date.now());
      setResultVisible(true);
      captureEvent(posthog, "game_completed", { gameId: "galgenwort", dateKey, durationMs: elapsedSeconds * 1000, attempts: result.state.guessedLetters.length, outcome: result.state.status, success: result.state.status === "won" });
    }
  }

  async function useHint() {
    if (state.status !== "playing") return;
    const next = applyGalgenwortHint(puzzle, state);
    if (next === state) {
      setMessage("Alle Buchstaben schon aufgedeckt.");
      return;
    }

    let source = "earned";
    if (hintPolicy === "ads") {
      const ok = await requestAdHint();
      if (!ok) {
        setMessage("Werbung gerade nicht verfügbar.");
        return;
      }
      source = "ad";
    } else {
      const consumed = await hintWallet.tryConsume();
      if (!consumed) {
        setMessage("Keine Hinweise verfügbar.");
        return;
      }
    }

    startStats();
    setState(next);
    stats.recordHint({ source, gameId: "galgenwort" });
    captureEvent(posthog, "hint_used", { gameId: "galgenwort", dateKey, source });
    setMessage(next.status === "won" ? "Gelöst!" : "Hinweis: Buchstabe aufgedeckt.");

    if (next.status === "won") {
      stats.finish("won");
      hintWallet.onWin().then((granted) => {
        if (granted) setMessage("Hinweis erhalten! 💡");
      });
      setFinishedAt(Date.now());
      setResultVisible(true);
      captureEvent(posthog, "game_completed", { gameId: "galgenwort", dateKey, durationMs: elapsedSeconds * 1000, attempts: next.guessedLetters.length, outcome: "won", success: true });
    }
  }

  function reveal() {
    stats.start({ gameId: "galgenwort", playDate: dateKey, puzzleId: puzzle.id, gameVersion: puzzle.version });
    stats.finish("revealed");
    captureEvent(posthog, "solution_revealed", { gameId: "galgenwort", dateKey, attempts: state.guessedLetters.length });
    captureEvent(posthog, "game_completed", { gameId: "galgenwort", dateKey, durationMs: elapsedSeconds * 1000, attempts: state.guessedLetters.length, outcome: "revealed", success: false });
    setState((current) => revealGalgenwortSolution(current));
    setMessage("Lösung aufgedeckt.");
    setGiveUpVisible(false);
    setFinishedAt(Date.now());
    setResultVisible(true);
  }

  function startNextWord() {
    const nextGame = createNextGalgenwortGame(puzzle.id, today, bucketPreset, packs);

    setGame(nextGame);
    setState(nextGame.state);
    setMessage("");
    setResultVisible(false);
    setFinishedAt(null);
    setProgressLoaded(true);
    resetTimer();
  }

  function resultTitle() {
    if (state.status === "won") return "Gerettet.";
    if (state.status === "lost") return "Heute nicht gerettet.";

    return "Aufgelöst.";
  }

  function goBack() {
    if (state.status === "playing" && state.guessedLetters.length > 0) {
      captureEvent(posthog, "game_abandoned", { gameId: "galgenwort", dateKey, attempts: state.guessedLetters.length });
    }
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

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
        onBackspace: () => undefined,
        onLetter: guess,
        onSubmit: () => undefined,
        showBackspace: false,
        showSubmit: false,
      }}
      onBack={goBack}
      onHelp={() => {
        captureEvent(posthog, "help_opened", { gameId: "galgenwort", dateKey });
        setHelpVisible(true);
      }}
      progressLabel={`${wrongLetters.length}/${puzzle.maxWrongGuesses} Fehler`}
      title="Galgenwort"
    >
      <View style={styles.wrap}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.kicker}>Hinweis</Text>
            <Text style={styles.lengthPill}>{answerLength} Buchstaben</Text>
          </View>
          <Text style={styles.clue}>{puzzle.clue}</Text>
          <ShakeView trigger={shakeTick}>
            <View style={styles.wordRow}>
              {revealed.map((letter, index) => letter ? (
                <Animated.Text
                  entering={FadeInDown.duration(tokens.motion.quick).springify()}
                  key={`${index}-${letter}`}
                  style={[styles.wordTile, { fontSize: wordTileFontSize }]}
                >
                  {letter.toLocaleUpperCase("de-DE")}
                </Animated.Text>
              ) : <Text key={`${index}-blank`} style={[styles.wordTile, { fontSize: wordTileFontSize }]}>_</Text>)}
            </View>
          </ShakeView>
          {wrongLetters.length > 0 ? <Text style={styles.wrong}>Falsch: {wrongLetters.join(" ").toLocaleUpperCase("de-DE")}</Text> : null}
        </View>

        {message && state.status !== "playing" ? <View style={styles.statusBlock}>
          <Text style={styles.message}>{message}</Text>
        </View> : null}
      </View>
      <ConfirmModal confirmLabel="Lösung zeigen" message="Die Lösung wird angezeigt und die Runde zählt nicht als geschafft." onCancel={() => setGiveUpVisible(false)} onConfirm={reveal} title="Lösung anzeigen?" visible={giveUpVisible} />
      <GameResultModal
        attempts={state.guessedLetters.length}
        dateKey={dateKey}
        durationMs={elapsedSeconds * 1000}
        gameId="galgenwort"
        guesses={state.guessedLetters}
        message={state.status === "won" ? "Nice, das Wort ist frei." : "Die Lösung ist raus. Weiteres Wort?"}
        onFeedback={(rating) => captureEvent(posthog, "game_feedback_submitted", { gameId: "galgenwort", dateKey, rating, outcome: state.status })}
        onHome={() => router.replace("/")}
        actionLabel={nextDailyKniffRoute ? "Nächster Tageskniff" : undefined}
        onNext={() => nextDailyKniffRoute ? router.push(nextDailyKniffRoute as never) : startNextWord()}
        onShare={() => captureEvent(posthog, "result_shared", { gameId: "galgenwort", dateKey, scope: "game", outcome: state.status })}
        onViewed={() => captureEvent(posthog, "result_viewed", { gameId: "galgenwort", dateKey, scope: "game", outcome: state.status, success: state.status === "won" })}
        outcome={state.status === "playing" ? undefined : state.status}
        shareText={buildSimpleShareText("Galgenwort", dateKey, state.status, `${state.guessedLetters.length} Buchstaben · ${elapsedSeconds} Sek.`)}
        solution={puzzle.answer}
        success={state.status === "won"}
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
  wrap: { flex: 1, gap: tokens.space.md, justifyContent: "center" },
  card: { gap: tokens.space.sm, padding: tokens.space.md, borderRadius: tokens.radius.surface, backgroundColor: tokens.surface.control },
  cardHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: tokens.space.sm },
  kicker: { color: tokens.color.primaryDark, fontSize: tokens.type.small, fontWeight: "900", textTransform: "uppercase" },
  lengthPill: { color: tokens.color.primaryDark, fontSize: tokens.type.small, fontWeight: "900" },
  clue: { color: tokens.color.ink, fontSize: tokens.type.h2, fontWeight: "900", lineHeight: 28 },
  wordRow: { flexDirection: "row", gap: 4, justifyContent: "center", marginTop: tokens.space.xs },
  wordTile: { flex: 1, minWidth: 0, color: tokens.color.ink, fontWeight: "900", textAlign: "center" },
  misses: { color: tokens.color.primaryDark, fontSize: tokens.type.body, fontWeight: "900", textAlign: "center" },
  statusBlock: { minHeight: 24, justifyContent: "center" },
  message: { color: tokens.color.muted, fontSize: tokens.type.body, textAlign: "center" },
  wrong: { color: tokens.color.ink, fontSize: tokens.type.body, fontWeight: "900", marginTop: tokens.space.xs, textAlign: "center" },
});
