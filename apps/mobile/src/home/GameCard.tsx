import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { tokens } from "@/design/tokens";
import type { GameDefinition, GameStatus } from "@/games/types";
import { GamePreview } from "@/home/GamePreview";
import { gameMeta, HomeGameId } from "@/home/homeMeta";

type GameCardProps = {
  dailyKniffComplete: boolean;
  hasDailyKniff: boolean;
  inProgress: boolean;
  game: GameDefinition;
  index: number;
  onPress: () => void;
  status?: GameStatus;
};

export function GameCard({ dailyKniffComplete, game, hasDailyKniff, inProgress, index, onPress }: GameCardProps) {
  const gameId = game.id as HomeGameId;
  const meta = gameMeta[gameId];
  const showResume = inProgress;
  const showDailyChip = hasDailyKniff && !inProgress;
  const showDailySubtle = hasDailyKniff && inProgress;

  return (
    <Animated.View entering={FadeInDown.delay(90 + index * 45).duration(tokens.motion.slow)}>
      <Pressable
        accessibilityLabel={`${game.title} öffnen`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          { transform: [{ rotate: meta.rotate }, { scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text adjustsFontSizeToFit minimumFontScale={0.86} numberOfLines={1} style={styles.cardTitle}>{game.title}</Text>
            <View style={[styles.gameDot, { backgroundColor: meta.dot }]} />
          </View>
        </View>
        {showResume ? <Text style={styles.resumeBadge}>Weiterspielen</Text> : null}
        {showDailyChip ? (
          <Text style={[styles.dailyBadge, dailyKniffComplete && styles.dailyBadgeDone]}>
            {dailyKniffComplete ? "✓ Tageskniff" : "✦ Tageskniff"}
          </Text>
        ) : null}
        {showDailySubtle ? (
          <Text style={styles.dailySubtle}>{dailyKniffComplete ? "✓ Tageskniff" : "✦ Tageskniff"}</Text>
        ) : null}
        <Text style={styles.cardText}>{meta.description}</Text>
        <GamePreview color={meta.color} gameId={gameId} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.surface.raised,
    borderRadius: tokens.radius.surface,
    minHeight: 158,
    overflow: "visible",
    padding: 20,
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 1,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    minWidth: 0,
  },
  titleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
    minWidth: 0,
  },
  cardTitle: {
    color: tokens.color.ink,
    fontFamily: tokens.font.ui.semibold,
    flexShrink: 1,
    fontSize: 20,
    letterSpacing: -0.7,
    lineHeight: 28,
    minWidth: 0,
  },
  gameDot: {
    borderRadius: 999,
    flexShrink: 0,
    height: 9,
    width: 9,
  },
  cardText: {
    color: tokens.semantic.secondaryText,
    fontSize: 14,
    fontFamily: tokens.font.ui.regular,
    marginTop: 4,
  },
  dailyBadge: {
    alignSelf: "flex-start",
    marginTop: tokens.space.xs,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 3,
    borderRadius: tokens.radius.badge,
    backgroundColor: tokens.surface.chip,
    color: tokens.color.primaryDark,
    fontSize: tokens.type.small,
    fontFamily: tokens.font.ui.semibold,
  },
  dailyBadgeDone: {
    backgroundColor: "rgba(33, 166, 122, 0.14)",
    color: tokens.semantic.correct,
  },
  resumeBadge: {
    alignSelf: "flex-start",
    marginTop: tokens.space.xs,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 3,
    borderRadius: tokens.radius.badge,
    backgroundColor: tokens.surface.chip,
    color: tokens.color.primaryDark,
    fontSize: tokens.type.small,
    fontFamily: tokens.font.ui.semibold,
  },
  dailySubtle: {
    alignSelf: "flex-start",
    marginTop: tokens.space.xs,
    color: tokens.semantic.secondaryText,
    fontSize: tokens.type.small,
    fontFamily: tokens.font.ui.medium,
  },
});
