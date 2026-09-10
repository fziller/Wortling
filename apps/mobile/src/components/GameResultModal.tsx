import * as Sharing from "expo-sharing";
import { RefObject, useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";

import { tokens } from "@/design/tokens";
import { markEmoji, type ShareGuessRow } from "@/games/share/grid";
import { successHaptic, warningHaptic } from "@/haptics";

export type GameResultStat = {
  label: string;
  value: string | number;
};

export type GameFeedbackRating = "too_easy" | "ok" | "too_hard";
export type GameResultOutcome = string;

type GameResultModalProps = {
  actionLabel?: string;
  attempts?: number;
  dateKey?: string;
  durationMs?: number;
  gameId?: string;
  guesses?: readonly string[];
  message?: string;
  onFeedback?: (rating: GameFeedbackRating) => void;
  onHome: () => void;
  onNext: () => void;
  onShare?: () => void;
  onViewed?: () => void;
  outcome?: GameResultOutcome;
  shareRows?: readonly ShareGuessRow[];
  shareText?: string;
  solution?: string;
  stats?: readonly GameResultStat[];
  secondaryLabel?: string;
  success?: boolean;
  title: string;
  visible: boolean;
};

const confetti = [
  { left: "8%", top: "12%", color: tokens.color.primary, rotate: "18deg", delay: 20 },
  { left: "22%", top: "4%", color: tokens.color.success, rotate: "-24deg", delay: 80 },
  { left: "38%", top: "10%", color: tokens.color.warning, rotate: "34deg", delay: 130 },
  { left: "58%", top: "5%", color: tokens.color.primaryDark, rotate: "-16deg", delay: 50 },
  { left: "76%", top: "14%", color: tokens.color.secondary, rotate: "28deg", delay: 110 },
  { left: "90%", top: "8%", color: tokens.color.success, rotate: "-32deg", delay: 170 },
] as const;

export function GameResultModal({
  actionLabel = "Neues Wort",
  guesses = [],
  message,
  onFeedback,
  onHome,
  onNext,
  onShare,
  onViewed,
  outcome,
  shareRows = [],
  shareText,
  solution,
  stats = [],
  secondaryLabel = "Startseite",
  success,
  title,
  visible,
}: GameResultModalProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<GameFeedbackRating | null>(null);
  const [shared, setShared] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<View>(null);
  const viewedRef = useRef(false);
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = visible ? withSpring(1, { damping: 18, stiffness: 220 }) : 0;

    if (visible && !viewedRef.current) {
      viewedRef.current = true;
      if (success === true || outcome === "won") successHaptic();
      else warningHaptic();
      onViewed?.();
    }

    if (!visible) {
      viewedRef.current = false;
      setSelectedFeedback(null);
      setShared(false);
      setSheetOpen(false);
      setSharing(false);
    }
  }, [entrance, onViewed, outcome, success, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: tokens.motion.quick }),
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      { translateY: 18 * (1 - entrance.value) },
      { scale: 0.92 + 0.08 * entrance.value },
      { rotate: `${-1.5 * (1 - entrance.value)}deg` },
    ],
  }));

  function submitFeedback(rating: GameFeedbackRating) {
    if (selectedFeedback === rating) return;

    setSelectedFeedback(rating);
    onFeedback?.(rating);
  }

  async function shareResult() {
    if (!shareText || sharing) return;

    async function openNativeShare(action: () => Promise<unknown>) {
      setSheetOpen(true);
      await new Promise((resolve) => setTimeout(resolve, 0));
      return action();
    }

    setSharing(true);
    try {
      if (shareCardRef.current && await Sharing.isAvailableAsync()) {
        const uri = await captureRef(shareCardRef.current, { format: "png", quality: 1, result: "tmpfile" });
        await openNativeShare(() => Sharing.shareAsync(uri, { dialogTitle: "Wortkniff teilen", mimeType: "image/png" }));
      } else {
        await openNativeShare(() => Share.share({ message: shareText }));
      }
      setShared(true);
      onShare?.();
    } catch {
      try {
        await openNativeShare(() => Share.share({ message: shareText }));
        setShared(true);
        onShare?.();
      } catch {
        // Native share failures should not block the result flow.
      }
    } finally {
      setSheetOpen(false);
      setSharing(false);
    }
  }

  const showConfetti = success === true || outcome === "won";

  return (
    <Modal animationType="none" transparent visible={visible && !sheetOpen}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Animated.View style={[styles.card, cardStyle]}>
          {showConfetti ? <PaperConfetti /> : null}
          <ScrollView bounces={false} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sticker, stickerStyle(outcome)]}>{stickerText(outcome)}</Text>
            <Text style={styles.title}>{title}</Text>
            {solution ? <AnimatedSolution value={solution} win={showConfetti} /> : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {guesses.length > 0 ? (
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={styles.historyScroll} contentContainerStyle={styles.history}>
                {guesses.map((guess, index) => (
                  <View key={`${guess}-${index}`} style={styles.guessRow}>
                    <Text style={styles.guessNumber}>{index + 1}</Text>
                    <Text style={styles.guessValue}>{guess.toLocaleUpperCase("de-DE")}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : null}
            {stats.length > 0 ? (
              <View style={styles.stats}>
                {stats.map((stat, index) => <AnimatedStatTile index={index} key={stat.label} stat={stat} />)}
              </View>
            ) : null}
            {onFeedback ? (
              <View style={styles.feedback}>
                <Text style={styles.feedbackTitle}>Wie fühlte sich die Runde an?</Text>
                <View style={styles.feedbackButtons}>
                  <FeedbackButton label="zu leicht" rating="too_easy" selected={selectedFeedback === "too_easy"} onPress={submitFeedback} />
                  <FeedbackButton label="passt" rating="ok" selected={selectedFeedback === "ok"} onPress={submitFeedback} />
                  <FeedbackButton label="zu schwer" rating="too_hard" selected={selectedFeedback === "too_hard"} onPress={submitFeedback} />
                </View>
                {selectedFeedback ? <Text style={styles.feedbackThanks}>Danke, hilft beim Feinschliff.</Text> : null}
              </View>
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onHome} style={[styles.button, styles.secondary]}>
              <Text style={styles.secondaryText}>{secondaryLabel}</Text>
            </Pressable>
            {shareText ? (
              <Pressable accessibilityRole="button" disabled={sharing} onPress={shareResult} style={[styles.button, styles.share, sharing && styles.disabledButton]}>
                <Text style={styles.shareText}>{sharing ? "Teilt..." : shared ? "Geteilt" : "Teilen"}</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" onPress={onNext} style={[styles.button, styles.primary]}>
              <Text style={styles.primaryText}>{actionLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
        {shareText ? <ShareCard guesses={guesses} innerRef={shareCardRef} rows={shareRows} shareText={shareText} solution={solution} success={showConfetti} /> : null}
      </Animated.View>
    </Modal>
  );
}

function ShareCard({ guesses = [], innerRef, rows, shareText, solution, success }: { guesses?: readonly string[]; innerRef: RefObject<View | null>; rows: readonly ShareGuessRow[]; shareText: string; solution?: string; success: boolean }) {
  const [headline, result, ...textRows] = shareText.split("\n");
  const attempts = rows.length > 0
    ? rows.map((row) => ({ guess: row.guess, marks: row.marks.map((mark) => markEmoji[mark]).join("") }))
    : guesses.map((guess) => ({ guess, marks: "" }));
  const solutionLetters = solution?.toLocaleUpperCase("de-DE").split("") ?? [];
  const tileable = solutionLetters.length > 0 && solutionLetters.every((letter) => /[A-ZÄÖÜß]/.test(letter));

  return (
    <View collapsable={false} pointerEvents="none" ref={innerRef} style={styles.shareCard}>
      <Text style={styles.shareLogo}>WORTKNIFF</Text>
      <Text style={styles.shareHeadline}>{headline}</Text>
      <View style={styles.shareResultPill}>
        <Text style={[styles.shareResult, success && styles.shareResultWin]}>{result}</Text>
      </View>
      {solutionLetters.length > 0 ? (
        <View style={styles.shareSolutionBlock}>
          <Text style={styles.shareSectionLabel}>LÖSUNG</Text>
          {tileable ? (
            <View style={styles.shareSolutionTiles}>
              {solutionLetters.map((letter, index) => (
                <View key={`${letter}-${index}`} style={[styles.shareSolutionTile, success && styles.shareSolutionTileWin]}>
                  <Text style={styles.shareSolutionLetter}>{letter}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.shareSolutionFallback}>{solution?.toLocaleUpperCase("de-DE")}</Text>
          )}
        </View>
      ) : null}
      {attempts.length > 0 ? (
        <View style={styles.shareAttemptsBlock}>
          <Text style={styles.shareSectionLabel}>VERSUCHE · {attempts.length}</Text>
          {attempts.map((attempt, index) => (
            <View key={`${attempt.guess}-${index}`} style={styles.shareAttemptRow}>
              <Text style={styles.shareAttemptNumber}>{index + 1}</Text>
              <Text style={styles.shareGuessWord}>{attempt.guess.toLocaleUpperCase("de-DE")}</Text>
              {attempt.marks ? <Text style={styles.shareGridText}>{attempt.marks}</Text> : null}
            </View>
          ))}
        </View>
      ) : textRows.length > 0 ? (
        <View style={styles.shareGrid}>
          {textRows.map((row, index) => <Text key={`${row}-${index}`} style={styles.shareGridText}>{row}</Text>)}
        </View>
      ) : null}
    </View>
  );
}

function stickerText(outcome?: GameResultOutcome) {
  if (outcome === "revealed") return "AUFGEDECKT";
  if (outcome === "lost") return "KNAPP DANEBEN";

  return "GELÖST";
}

function stickerStyle(outcome?: GameResultOutcome) {
  if (outcome === "revealed") return styles.stickerRevealed;
  if (outcome === "lost") return styles.stickerLost;

  return styles.stickerWon;
}

function AnimatedSolution({ value, win }: { value: string; win: boolean }) {
  const letters = value.toLocaleUpperCase("de-DE").split("");

  return (
    <View style={[styles.solutionWrap, win && styles.solutionWin]}>
      {letters.map((letter, index) => <AnimatedLetter index={index} key={`${letter}-${index}`} letter={letter} />)}
    </View>
  );
}

function AnimatedLetter({ index, letter }: { index: number; letter: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(80 + index * 35, withSpring(1, { damping: 15, stiffness: 240 }));
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: 10 * (1 - progress.value) }, { scale: 0.82 + 0.18 * progress.value }],
  }));

  return <Animated.Text style={[styles.solutionLetter, style]}>{letter}</Animated.Text>;
}

function AnimatedStatTile({ index, stat }: { index: number; stat: GameResultStat }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(180 + index * 70, withTiming(1, { duration: tokens.motion.normal }));
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: 8 * (1 - progress.value) }],
  }));

  return (
    <Animated.View style={[styles.statTile, style]}>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.statValue}>{stat.value}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.statLabel}>{stat.label}</Text>
    </Animated.View>
  );
}

function FeedbackButton({ label, onPress, rating, selected }: { label: string; onPress: (rating: GameFeedbackRating) => void; rating: GameFeedbackRating; selected: boolean }) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(selected ? 1 : 0, { damping: 18, stiffness: 220 });
  }, [progress, selected]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.04 }],
  }));

  return (
    <Animated.View style={[styles.feedbackButtonWrap, style]}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={() => onPress(rating)} style={[styles.feedbackButton, selected && styles.feedbackButtonSelected]}>
        <Text style={[styles.feedbackButtonText, selected && styles.feedbackButtonTextSelected]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function PaperConfetti() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {confetti.map((piece, index) => <ConfettiPiece index={index} key={`${piece.left}-${piece.top}`} piece={piece} />)}
    </View>
  );
}

function ConfettiPiece({ index, piece }: { index: number; piece: (typeof confetti)[number] }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(piece.delay, withTiming(1, { duration: tokens.motion.slow }));
  }, [piece.delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, progress.value - 0.72) * 3.4,
    transform: [
      { translateY: -10 - progress.value * (18 + index * 2) },
      { scale: 0.7 + progress.value * 0.3 },
      { rotate: piece.rotate },
    ],
  }));

  return <Animated.View style={[styles.confettiPiece, { backgroundColor: piece.color, left: piece.left, top: piece.top }, style]} />;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: tokens.space.lg,
    backgroundColor: "rgba(23, 19, 13, 0.54)",
  },
  card: {
    maxHeight: "88%",
    padding: tokens.space.sm,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.58)",
    backgroundColor: tokens.surface.raised,
    overflow: "hidden",
  },
  content: {
    gap: tokens.space.xs,
    paddingBottom: tokens.space.xs,
  },
  sticker: {
    alignSelf: "center",
    paddingHorizontal: tokens.space.md,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    fontSize: 12,
    fontFamily: tokens.font.ui.semibold,
    letterSpacing: 1.2,
    overflow: "hidden",
    transform: [{ rotate: "-3deg" }],
  },
  stickerWon: { backgroundColor: "rgba(33, 166, 122, 0.16)", color: tokens.color.success },
  stickerLost: { backgroundColor: "rgba(199, 62, 58, 0.14)", color: tokens.color.danger },
  stickerRevealed: { backgroundColor: "rgba(217, 133, 0, 0.15)", color: tokens.color.warning },
  title: {
    color: tokens.color.ink,
    fontSize: 24,
    ...tokens.typography.brand,
    textAlign: "center",
  },
  solutionWrap: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 5,
    borderRadius: tokens.radius.md,
  },
  solutionWin: {
    backgroundColor: "rgba(33, 166, 122, 0.1)",
  },
  solutionLetter: {
    color: tokens.color.ink,
    fontSize: 27,
    ...tokens.typography.gameLetter,
    letterSpacing: 1.6,
    textAlign: "center",
  },
  message: {
    color: tokens.color.muted,
    fontFamily: tokens.font.ui.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  history: {
    gap: 4,
    paddingVertical: tokens.space.xs,
    paddingHorizontal: tokens.space.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: "rgba(36, 107, 254, 0.08)",
  },
  historyScroll: {
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: 150,
    borderRadius: tokens.radius.md,
  },
  guessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    paddingVertical: 2,
  },
  guessNumber: {
    width: 22,
    color: tokens.color.primaryDark,
    fontSize: tokens.type.small,
    fontFamily: tokens.font.ui.semibold,
    textAlign: "center",
  },
  guessValue: {
    color: tokens.color.ink,
    fontSize: 16,
    fontFamily: tokens.font.ui.semibold,
    letterSpacing: 1,
  },
  stats: {
    flexDirection: "row",
    gap: tokens.space.xs,
  },
  shareCard: {
    position: "absolute",
    left: 0,
    top: 0,
    transform: [{ translateX: -10000 }],
    width: 390,
    gap: 8,
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.22)",
    backgroundColor: "#FFFDF8",
  },
  shareLogo: {
    color: tokens.color.primaryDark,
    fontSize: 12,
    fontFamily: tokens.font.ui.semibold,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  shareHeadline: {
    color: tokens.color.ink,
    fontSize: 16,
    fontFamily: tokens.font.ui.semibold,
    textAlign: "center",
  },
  shareResultPill: {
    alignSelf: "center",
    paddingHorizontal: tokens.space.md,
    paddingVertical: 4,
    borderRadius: tokens.radius.md,
    backgroundColor: "rgba(23, 19, 13, 0.06)",
  },
  shareResult: {
    color: tokens.color.muted,
    fontSize: 14,
    fontFamily: tokens.font.ui.semibold,
    textAlign: "center",
  },
  shareResultWin: {
    color: tokens.color.success,
  },
  shareSectionLabel: {
    color: tokens.color.muted,
    fontSize: 11,
    fontFamily: tokens.font.ui.semibold,
    letterSpacing: 1.4,
    textAlign: "center",
  },
  shareSolutionBlock: {
    gap: 6,
    paddingTop: 4,
  },
  shareSolutionTiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  shareSolutionTile: {
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: tokens.color.ink,
  },
  shareSolutionTileWin: {
    backgroundColor: tokens.color.success,
  },
  shareSolutionLetter: {
    color: "white",
    fontSize: 20,
    fontFamily: tokens.font.ui.semibold,
  },
  shareSolutionFallback: {
    color: tokens.color.ink,
    fontSize: 18,
    fontFamily: tokens.font.ui.semibold,
    textAlign: "center",
  },
  shareAttemptsBlock: {
    gap: 4,
    paddingTop: 4,
  },
  shareAttemptRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(23, 19, 13, 0.05)",
  },
  shareAttemptNumber: {
    width: 20,
    color: tokens.color.muted,
    fontSize: 12,
    fontFamily: tokens.font.ui.semibold,
    textAlign: "center",
  },
  shareGrid: {
    gap: 6,
    paddingTop: 6,
  },
  shareGuessWord: {
    color: tokens.color.ink,
    flex: 1,
    fontSize: 17,
    fontFamily: tokens.font.ui.semibold,
    letterSpacing: 1,
  },
  shareGridText: {
    color: tokens.color.ink,
    fontSize: 18,
    fontFamily: tokens.font.ui.semibold,
    letterSpacing: 1,
    textAlign: "right",
  },
  statTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    padding: tokens.space.xs,
    borderRadius: tokens.radius.md,
    backgroundColor: "rgba(36, 107, 254, 0.1)",
  },
  statValue: {
    color: tokens.color.ink,
    fontFamily: tokens.font.ui.semibold,
    fontSize: 21,
    lineHeight: 24,
    textAlign: "center",
  },
  statLabel: {
    color: tokens.color.muted,
    fontSize: 12,
    fontFamily: tokens.font.ui.semibold,
    textAlign: "center",
  },
  feedback: {
    gap: tokens.space.xs,
    paddingTop: tokens.space.xs,
  },
  feedbackTitle: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontFamily: tokens.font.ui.semibold,
    textAlign: "center",
  },
  feedbackButtons: {
    flexDirection: "row",
    gap: tokens.space.xs,
  },
  feedbackButtonWrap: { flex: 1 },
  feedbackButton: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.line,
    backgroundColor: "white",
  },
  feedbackButtonSelected: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primaryLight,
  },
  feedbackButtonText: {
    color: tokens.color.ink,
    fontSize: 12,
    fontFamily: tokens.font.ui.semibold,
    textAlign: "center",
  },
  feedbackButtonTextSelected: { color: tokens.color.primaryDark },
  feedbackThanks: {
    color: tokens.color.success,
    fontSize: 12,
    fontFamily: tokens.font.ui.semibold,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: tokens.space.sm,
    marginTop: tokens.space.xs,
  },
  button: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.md,
  },
  secondary: {
    borderWidth: 1,
    borderColor: tokens.color.line,
    backgroundColor: "white",
  },
  share: {
    borderWidth: 1,
    borderColor: "rgba(36, 107, 254, 0.28)",
    backgroundColor: "rgba(36, 107, 254, 0.1)",
  },
  primary: {
    backgroundColor: tokens.color.primary,
  },
  disabledButton: {
    opacity: 0.58,
  },
  secondaryText: {
    color: tokens.color.ink,
    fontSize: 15,
    fontFamily: tokens.font.ui.semibold,
    textAlign: "center",
  },
  shareText: {
    color: tokens.color.secondary,
    fontSize: 15,
    fontFamily: tokens.font.ui.semibold,
    textAlign: "center",
  },
  primaryText: {
    color: "white",
    fontSize: 15,
    fontFamily: tokens.font.ui.semibold,
    textAlign: "center",
  },
  confettiPiece: {
    position: "absolute",
    width: 9,
    height: 15,
    borderRadius: 3,
  },
});
