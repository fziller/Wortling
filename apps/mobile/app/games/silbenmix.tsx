import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, LinearTransition, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

import { captureEvent } from "@/analytics/events";
import { useGameStarted } from "@/analytics/useGameStarted";
import { ConfirmModal } from "@/components/ConfirmModal";
import { DraggableTile } from "@/components/DraggableTile";
import { GameResultModal } from "@/components/GameResultModal";
import { GameScreenFrame } from "@/components/GameScreenFrame";
import { HelpModal } from "@/components/HelpModal";
import { ShakeView } from "@/components/ShakeView";
import { SmallGameAction } from "@/components/SmallGameAction";
import { getBerlinDateKey } from "@/daily/date";
import { useNextOpenDailyKniff } from "@/dailyKniffe/continuation";
import { tokens } from "@/design/tokens";
import { createDailySilbenmixGame, createNextSilbenmixGame, restoreSilbenmixPuzzle } from "@/games/silbenmix/daily";
import { applySilbenmixPairHint, applySilbenmixStartHint, getSilbenmixDraft, getSilbenmixTarget, moveSilbenmixTile, removeSilbenmixTile, revealSilbenmixSolution, revealSilbenmixWord, selectSilbenmixTile, submitSilbenmixWord } from "@/games/silbenmix/engine";
import type { SilbenmixState } from "@/games/silbenmix/types";
import { gameHelp } from "@/games/help";
import { games } from "@/games/registry";
import { buildSimpleShareText } from "@/games/share/grid";
import { useFirstGameHelp } from "@/games/useFirstGameHelp";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { getHintPolicy, requestAdHint } from "@/hints/policy";
import { useHintWallet } from "@/hints/useHintWallet";
import { selectionHaptic, successHaptic, warningHaptic } from "@/haptics";
import { updateBadgeCount } from "@/notifications/badge";
import { scheduleDailyReminder } from "@/notifications/scheduler";
import { rejectMessage } from "@/games/rejectMessages";
import { isStartedProgress, loadProgress, loadProgressForGames, mergeCompletedStatus, saveProgress, type StoredProgress } from "@/storage/progress";
import { useGameRecorder } from "@/stats/recorder";

const GAME_ID = "silbenmix";
type SilbenmixGame = ReturnType<typeof createDailySilbenmixGame>;
type DropRect = { height: number; width: number; x: number; y: number };

function measureInWindow(view: View): Promise<DropRect> {
  return new Promise((resolve) => view.measureInWindow((x, y, width, height) => resolve({ x, y, width, height })));
}

function difficultyLabel(value: string): string {
  return value === "easy" ? "leicht" : value === "hard" ? "schwer" : "mittel";
}

function formatElapsedTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}:${String(seconds % 60).padStart(2, "0")}` : `${seconds} Sek.`;
}

export default function SilbenmixScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const today = getBerlinDateKey();
  const stats = useGameRecorder();
  const hintWallet = useHintWallet();
  const hintPolicy = getHintPolicy();
  const completedAtRef = useRef<string | undefined>(undefined);
  const completedStatusRef = useRef<StoredProgress["status"] | undefined>(undefined);
  const draftRef = useRef<View>(null);
  const poolRef = useRef<View>(null);
  const selectedTileRefs = useRef(new Map<string, View>());
  const [game, setGame] = useState<SilbenmixGame>(() => createDailySilbenmixGame());
  const { dateKey, puzzle } = game;
  const trackGameStarted = useGameStarted(posthog, GAME_ID, dateKey);
  const [state, setState] = useState<SilbenmixState>(game.state);
  const [message, setMessage] = useState("");
  const [shakeTick, setShakeTick] = useState(0);
  const [revealVisible, setRevealVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const { elapsedSeconds, reset: resetTimer } = useActiveTimer(state.status === "playing", finishedAt);
  const nextDailyKniffRoute = useNextOpenDailyKniff(GAME_ID, dateKey, state.status === "won");
  const help = useFirstGameHelp({ enabled: progressLoaded && state.status === "playing", gameId: GAME_ID, onAutomaticOpen: () => captureEvent(posthog, "help_opened", { gameId: GAME_ID, dateKey, source: "automatic" }) });
  const selected = new Set(state.selectedTileIds);
  const used = new Set(state.usedTileIds);
  const solvedIds = new Set(state.solvedTargetIds);
  const revealedIds = new Set(state.revealedTargetIds);
  const solvedCount = state.solvedTargetIds.length + state.revealedTargetIds.length;
  const draft = getSilbenmixDraft(puzzle, state);
  const hintDisabled = state.status !== "playing" || (hintPolicy !== "ads" && !hintWallet.canConsume);
  const hintLabel = hintPolicy === "ads" ? "💡 Hinweis (Werbung)" : `💡 Hinweis (${hintWallet.wallet.balance}/3)`;

  useEffect(() => {
    captureEvent(posthog, "screen_viewed", { screen: GAME_ID, params: { dateKey } });
  }, [dateKey, posthog]);

  useEffect(() => {
    loadProgress<SilbenmixState>(GAME_ID, today).then((progress) => {
      completedAtRef.current = progress?.completedAt;
      completedStatusRef.current = progress?.completedStatus;
      const restoredPuzzle = restoreSilbenmixPuzzle(progress?.puzzle);
      if (isStartedProgress(progress) && restoredPuzzle && progress.state.puzzleId === restoredPuzzle.id) {
        setGame({ dateKey: progress.dateKey, puzzle: restoredPuzzle, state: progress.state });
        setState(progress.state);
        setFinishedAt(progress.completedAt ? Date.parse(progress.completedAt) : null);
        setResultVisible(progress.status !== "playing");
      }
      setProgressLoaded(true);
    });
  }, [today]);

  useEffect(() => {
    if (!progressLoaded) return;
    const completedAt = state.status !== "playing" ? (state.completedAt ?? new Date().toISOString()) : completedAtRef.current;
    const completedStatus = mergeCompletedStatus(completedStatusRef.current, state.status !== "playing" ? state.status : undefined);
    completedAtRef.current = completedAt;
    completedStatusRef.current = completedStatus;
    saveProgress({ gameId: GAME_ID, dateKey, completedStatus, puzzle, puzzleId: puzzle.id, puzzleVersion: puzzle.version, status: state.status, state: { ...state, startedAt: state.startedAt ?? new Date().toISOString(), completedAt }, draft: state.selectedTileIds, startedAt: state.startedAt ?? new Date().toISOString(), completedAt });
  }, [dateKey, progressLoaded, puzzle, state]);

  useEffect(() => {
    if (state.status !== "playing") loadProgressForGames(games.map((item) => item.id), dateKey).then((progress) => {
      updateBadgeCount(progress);
      scheduleDailyReminder().catch(() => {});
    });
  }, [dateKey, state.status]);

  function startStats() {
    trackGameStarted(puzzle.id);
    stats.start({ gameId: GAME_ID, playDate: dateKey, puzzleId: puzzle.id, gameVersion: puzzle.version, difficulty: puzzle.difficulty });
  }

  function finish(next: SilbenmixState, attempts: number) {
    if (next.status === "playing") return;
    const outcome = next.status === "won" ? "won" : "revealed";
    stats.finish(outcome);
    setFinishedAt(Date.now());
    setResultVisible(true);
    captureEvent(posthog, "game_completed", { gameId: GAME_ID, dateKey, durationMs: elapsedSeconds * 1000, attempts, outcome, success: outcome === "won", foundWordCount: next.solvedTargetIds.length, totalWords: puzzle.targets.length });
    if (outcome === "won") hintWallet.onWin().then((granted) => { if (granted) setMessage("Hinweis erhalten! 💡"); });
  }

  function choose(tileId: string) {
    chooseAt(tileId, state.selectedTileIds.length);
  }

  function chooseAt(tileId: string, insertIndex: number) {
    startStats();
    const next = selectSilbenmixTile(puzzle, state, tileId, insertIndex);
    if (next === state) return;
    selectionHaptic();
    setState(next);
    setMessage("");
  }

  function remove(tileId: string) {
    const next = removeSilbenmixTile(state, tileId);
    if (next === state) return;
    selectionHaptic();
    setState(next);
  }

  async function isInside(view: View | null, x: number, y: number): Promise<boolean> {
    if (!view) return false;
    const rect = await measureInWindow(view);
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  async function draftInsertIndex(x: number, y: number): Promise<number | null> {
    if (!await isInside(draftRef.current, x, y)) return null;
    const tiles = await Promise.all(state.selectedTileIds.flatMap((tileId) => {
      const view = selectedTileRefs.current.get(tileId);
      return view ? [measureInWindow(view).then((rect) => ({ tileId, rect }))] : [];
    }));
    if (!tiles.length) return 0;
    const ordered = [...tiles].sort((left, right) => left.rect.y === right.rect.y ? left.rect.x - right.rect.x : left.rect.y - right.rect.y);
    const nextIndex = ordered.findIndex(({ rect }) => y < rect.y + rect.height / 2 || (y <= rect.y + rect.height && x < rect.x + rect.width / 2));
    return nextIndex === -1 ? ordered.length : nextIndex;
  }

  function dropPoolTile(tileId: string, x: number, y: number) {
    void draftInsertIndex(x, y).then((insertIndex) => {
      if (insertIndex !== null) chooseAt(tileId, insertIndex);
    });
  }

  function dropSelectedTile(tileId: string, x: number, y: number) {
    void draftInsertIndex(x, y).then(async (insertIndex) => {
      if (insertIndex !== null) {
        const next = moveSilbenmixTile(state, tileId, insertIndex);
        if (next === state) return;
        selectionHaptic();
        setState(next);
      } else if (await isInside(poolRef.current, x, y)) {
        remove(tileId);
      }
    });
  }

  function submit() {
    startStats();
    const result = submitSilbenmixWord(puzzle, state);
    setState(result.state);
    if (!result.ok) {
      stats.recordRejectedGuess(result.reason);
      setMessage(rejectMessage(result.reason));
      setShakeTick((value) => value + 1);
      warningHaptic();
      return;
    }
    stats.recordAcceptedGuess(undefined, { targetWords: puzzle.targets.length, syllableCount: puzzle.syllableCount, difficulty: puzzle.difficulty, selfFoundWords: result.state.solvedTargetIds.length, revealedWords: result.state.revealedTargetIds.length });
    setMessage(result.state.status === "playing" ? "Wort gefunden!" : "Alle Wörter gefunden!");
    successHaptic();
    finish(result.state, result.state.solvedTargetIds.length);
  }

  async function consumeHint(kind: "start" | "pair" | "word") {
    const next = kind === "start" ? applySilbenmixStartHint(puzzle, state) : kind === "pair" ? applySilbenmixPairHint(puzzle, state) : revealSilbenmixWord(puzzle, state);
    if (next === state) { setMessage("Dafür ist gerade kein Hinweis offen."); return; }
    let source = "earned";
    if (hintPolicy === "ads") {
      if (!await requestAdHint()) {
        captureEvent(posthog, "hint_unavailable", { gameId: GAME_ID, dateKey, reason: "ad_unavailable" });
        setMessage("Werbung gerade nicht verfügbar.");
        return;
      }
      source = "ad";
    } else if (!await hintWallet.tryConsume()) { setMessage("Keine Hinweise verfügbar."); return; }
    startStats();
    setState(next);
    stats.recordHint({ source, gameId: GAME_ID, kind, targetWords: puzzle.targets.length, syllableCount: puzzle.syllableCount });
    captureEvent(posthog, "hint_used", { gameId: GAME_ID, dateKey, source });
    setMessage(kind === "start" ? "Startsilbe markiert." : kind === "pair" ? "Silbenpaar markiert." : "Ein Wort ist aufgedeckt.");
    finish(next, next.solvedTargetIds.length);
  }

  function reveal() {
    startStats();
    const next = revealSilbenmixSolution(puzzle, state);
    stats.finish("revealed");
    captureEvent(posthog, "solution_revealed", { gameId: GAME_ID, dateKey, attempts: state.solvedTargetIds.length, foundWordCount: state.solvedTargetIds.length });
    setState(next);
    setRevealVisible(false);
    setMessage("Lösung aufgedeckt.");
    finish(next, next.solvedTargetIds.length);
  }

  function nextGame() {
    const next = createNextSilbenmixGame(puzzle.id, today);
    setGame(next); setState(next.state); setMessage(""); setResultVisible(false); setRevealVisible(false); setFinishedAt(null); resetTimer();
  }

  function goBack() {
    if (state.status === "playing" && (state.selectedTileIds.length || solvedCount)) captureEvent(posthog, "game_abandoned", { gameId: GAME_ID, dateKey, attempts: state.solvedTargetIds.length, foundWordCount: state.solvedTargetIds.length });
    if (router.canGoBack()) router.back(); else router.replace("/");
  }

  return (
    <GameScreenFrame
      actions={state.status === "playing" ? <View style={styles.actions}>
        <SmallGameAction disabled={hintDisabled} label={`${hintLabel}: Start`} onPress={() => consumeHint("start")} />
        <SmallGameAction disabled={hintDisabled} label="💡 Paar" onPress={() => consumeHint("pair")} />
        <SmallGameAction disabled={hintDisabled} label="💡 Wort" onPress={() => consumeHint("word")} />
        <SmallGameAction label="Lösung anzeigen" onPress={() => setRevealVisible(true)} size="large" variant="reveal" />
      </View> : null}
      keyboard={{ disabled: state.status !== "playing", onBackspace: () => undefined, onLetter: () => undefined, onSubmit: submit, showBackspace: false, showLetters: false, showSubmit: true, submitDisabled: !state.selectedTileIds.length }}
      onBack={goBack}
      onHelp={() => { captureEvent(posthog, "help_opened", { gameId: GAME_ID, dateKey, source: "manual" }); help.open(); }}
      progressLabel={`${solvedCount} / ${puzzle.targets.length} Wörter`}
      subtitle={`${puzzle.syllableCount} Silben · ${difficultyLabel(puzzle.difficulty)}`}
      title="Silbenmix"
    >
      <View style={styles.wrap}>
        <Text style={styles.sectionLabel}>DEIN WORT</Text>
        <ShakeView trigger={shakeTick}><Animated.View collapsable={false} layout={LinearTransition.springify().damping(18).stiffness(220)} ref={draftRef} style={styles.draft}>
          {state.selectedTileIds.length ? state.selectedTileIds.map((tileId) => {
            const tile = puzzle.tiles.find((item) => item.id === tileId);
            return tile ? <View collapsable={false} key={tile.id} ref={(view) => { if (view) selectedTileRefs.current.set(tile.id, view); else selectedTileRefs.current.delete(tile.id); }}><DraggableTile onDrop={(x, y) => dropSelectedTile(tile.id, x, y)}><SyllableTile label={tile.syllable} onPress={() => remove(tile.id)} selected /></DraggableTile></View> : null;
          }) : <Text style={styles.emptyDraft}>Tippe unten Silben an.</Text>}
        </Animated.View></ShakeView>
        <Text style={styles.sectionLabel}>SILBENPOOL</Text>
        <View collapsable={false} ref={poolRef} style={styles.pool}>
          {puzzle.tiles.map((tile) => { const disabled = used.has(tile.id) || selected.has(tile.id) || state.status !== "playing"; return <DraggableTile disabled={disabled} key={tile.id} onDrop={(x, y) => dropPoolTile(tile.id, x, y)}><SyllableTile disabled={disabled} hinted={state.hintedTileIds.includes(tile.id)} label={tile.syllable} onPress={() => choose(tile.id)} /></DraggableTile>; })}
        </View>
        <Text style={styles.sectionLabel}>GEFUNDEN</Text>
        <ScrollView contentContainerStyle={styles.foundList} style={styles.foundScroll} showsVerticalScrollIndicator={false}>
          {puzzle.targets.map((target) => {
            const found = solvedIds.has(target.id) || revealedIds.has(target.id);
            return <Animated.View key={target.id} layout={LinearTransition.springify().damping(18).stiffness(220)} style={[styles.targetRow, found && styles.targetFound, revealedIds.has(target.id) && styles.targetRevealed]}>
              <Text style={[styles.targetText, solvedIds.has(target.id) && styles.targetFoundText]}>{found ? target.word.toLocaleUpperCase("de-DE") : "• • •"}</Text>
              {revealedIds.has(target.id) ? <Text style={styles.revealedMark}>aufgedeckt</Text> : null}
            </Animated.View>;
          })}
        </ScrollView>
      </View>
      <ConfirmModal confirmLabel="Lösung zeigen" message="Alle fehlenden Wörter werden aufgedeckt. Die Runde zählt nicht als geschafft." onCancel={() => setRevealVisible(false)} onConfirm={reveal} title="Lösung anzeigen?" visible={revealVisible} />
      <GameResultModal actionLabel={nextDailyKniffRoute ? "Nächster Tageskniff" : "Neuer Mix"} attempts={state.solvedTargetIds.length} dateKey={dateKey} durationMs={elapsedSeconds * 1000} gameId={GAME_ID} guesses={state.solvedTargetIds.map((id) => getSilbenmixTarget(puzzle, id)?.word ?? "")} message={state.status === "won" ? "Alle Wörter sauber zusammengesetzt." : "Die fehlenden Wörter sind aufgedeckt."} onFeedback={(rating) => captureEvent(posthog, "game_feedback_submitted", { gameId: GAME_ID, dateKey, rating, outcome: state.status })} onHome={() => router.replace("/")} onNext={() => { setResultVisible(false); if (nextDailyKniffRoute) setTimeout(() => router.replace(nextDailyKniffRoute as never), 0); else nextGame(); }} onShare={() => captureEvent(posthog, "result_shared", { gameId: GAME_ID, dateKey, scope: "game", outcome: state.status })} onViewed={() => captureEvent(posthog, "result_viewed", { gameId: GAME_ID, dateKey, scope: "game", outcome: state.status, success: state.status === "won" })} outcome={state.status === "playing" ? undefined : state.status} shareText={buildSimpleShareText("Silbenmix", dateKey, state.status, `${state.solvedTargetIds.length}/${puzzle.targets.length} selbst gefunden · ${formatElapsedTime(elapsedSeconds)}`)} solution={puzzle.targets.map((target) => target.word).join(" · ")} stats={[{ label: "Wörter", value: `${state.solvedTargetIds.length}/${puzzle.targets.length}` }, { label: "Hinweise", value: state.hintedTileIds.length ? "genutzt" : "–" }, { label: "Zeit", value: formatElapsedTime(elapsedSeconds) }]} success={state.status === "won"} title={state.status === "won" ? "Geschafft!" : "Aufgedeckt."} visible={resultVisible && state.status !== "playing"} wordList={puzzle.targets.map((target) => ({ word: target.word, found: solvedIds.has(target.id) }))} />
      <HelpModal {...gameHelp.silbenmix} onClose={help.close} visible={help.visible} />
    </GameScreenFrame>
  );
}

function SyllableTile({ disabled = false, hinted = false, label, onPress, selected = false }: { disabled?: boolean; hinted?: boolean; label: string; onPress: () => void; selected?: boolean }) {
  const progress = useSharedValue(disabled ? 1 : 0);
  const hint = useSharedValue(hinted ? 1 : 0);
  useEffect(() => { progress.value = withTiming(disabled ? 1 : 0, { duration: tokens.motion.quick }); hint.value = withSpring(hinted ? 1 : 0, { damping: 18, stiffness: 220 }); }, [disabled, hint, hinted, progress]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value * 0.7, transform: [{ scale: 1 + hint.value * 0.06 }] }));
  return <Pressable accessibilityLabel={`Silbe ${label.toLocaleUpperCase("de-DE")}`} accessibilityRole="button" disabled={disabled} onPress={onPress}><Animated.View style={[styles.tile, selected && styles.tileSelected, hinted && styles.tileHinted, animatedStyle]}><Text style={[styles.tileText, selected && styles.tileSelectedText]}>{label.toLocaleUpperCase("de-DE")}</Text></Animated.View></Pressable>;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.sm },
  actions: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  sectionLabel: { color: tokens.color.muted, fontFamily: tokens.font.ui.semibold, fontSize: 10, letterSpacing: 1.1, textAlign: "center" },
  draft: { alignItems: "center", borderColor: tokens.color.line, borderRadius: tokens.radius.tile, borderStyle: "dashed", borderWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: 7, justifyContent: "center", minHeight: 56, padding: tokens.space.sm },
  emptyDraft: { color: tokens.color.muted, fontFamily: tokens.font.ui.medium, fontSize: 14 },
  pool: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 7, justifyContent: "center" },
  tile: { backgroundColor: tokens.surface.control, borderColor: tokens.border.control, borderRadius: tokens.radius.sm, borderWidth: 2, minHeight: 42, justifyContent: "center", paddingHorizontal: 11 },
   tileSelected: { backgroundColor: tokens.semantic.correct, borderColor: tokens.semantic.correct },
  tileHinted: { borderColor: tokens.semantic.partial, shadowColor: tokens.semantic.partial, shadowOpacity: 0.2, shadowRadius: 6 },
  tileText: { color: tokens.color.ink, fontFamily: tokens.font.ui.semibold, fontSize: 16, letterSpacing: 0.7 },
   tileSelectedText: { color: tokens.text.inverse },
  message: { color: tokens.color.ink, fontFamily: tokens.font.ui.semibold, fontSize: tokens.type.body, minHeight: 20, textAlign: "center" },
  foundScroll: { flex: 1, minHeight: 0 },
  foundList: { gap: 6, paddingBottom: tokens.space.xs },
  targetRow: { alignItems: "center", backgroundColor: tokens.surface.subdued, borderColor: tokens.color.line, borderRadius: tokens.radius.sm, borderWidth: 1, flexDirection: "row", justifyContent: "center", minHeight: 36, paddingHorizontal: tokens.space.sm },
   targetFound: { backgroundColor: tokens.semantic.correct, borderColor: tokens.semantic.correct },
  targetRevealed: { backgroundColor: "rgba(217, 133, 0, 0.12)", borderColor: "rgba(217, 133, 0, 0.32)" },
   targetText: { color: tokens.color.ink, fontFamily: tokens.font.ui.semibold, fontSize: 15, letterSpacing: 1.1 },
   targetFoundText: { color: tokens.text.inverse },
  revealedMark: { color: tokens.color.muted, fontFamily: tokens.font.ui.medium, fontSize: 10, marginLeft: 8 },
});
