import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { tokens } from "@/design/tokens";
import type { GameDefinition, GameStatus } from "@/games/types";
import { GamePreview } from "@/home/GamePreview";
import { HomeTape } from "@/home/HomeTape";
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

export function GameCard({ dailyKniffComplete, game, hasDailyKniff, inProgress, index, onPress, status }: GameCardProps) {
  const gameId = game.id as HomeGameId;
  const meta = gameMeta[gameId];

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
        <HomeTape position={meta.tape} />
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{game.title}</Text>
            <View style={[styles.statusDot, { backgroundColor: statusDotColor(status, meta.dot) }]} />
          </View>
        </View>
        {hasDailyKniff ? (
          <Text style={[styles.dailyBadge, dailyKniffComplete && styles.dailyBadgeDone]}>
            {dailyKniffComplete ? "✓ Tageskniff" : "✦ Tageskniff"}
          </Text>
        ) : null}
        {inProgress ? <Text style={styles.resumeBadge}>Weiterspielen</Text> : null}
        <Text style={styles.cardText}>{meta.description}</Text>
        <GamePreview color={meta.color} gameId={gameId} />
      </Pressable>
    </Animated.View>
  );
}

function statusDotColor(status?: GameStatus, fallback: string = tokens.color.primary): string {
  if (status === "won") return tokens.color.success;
  if (status === "playing") return "#FBC02D";
  if (status === "lost" || status === "revealed") return tokens.color.danger;

  return fallback;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.surface.raised,
    borderColor: tokens.border.subtle,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    minHeight: 158,
    overflow: "visible",
    padding: 20,
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 9, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  cardTitle: {
    color: tokens.color.ink,
    fontSize: 22,
    ...tokens.typography.display,
    letterSpacing: -0.7,
  },
  statusDot: {
    borderRadius: 999,
    height: 9,
    shadowColor: "#000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    width: 9,
  },
  cardText: {
    color: "#5F6368",
    fontSize: 14,
    fontFamily: tokens.font.ui.medium,
    marginTop: 4,
  },
  dailyBadge: {
    alignSelf: "flex-start",
    marginTop: tokens.space.xs,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(255, 107, 53, 0.12)",
    color: tokens.color.primaryDark,
    fontSize: tokens.type.small,
    fontFamily: tokens.font.ui.semibold,
  },
  dailyBadgeDone: {
    backgroundColor: "rgba(33, 166, 122, 0.14)",
    color: tokens.color.success,
  },
  resumeBadge: {
    alignSelf: "flex-start",
    marginTop: tokens.space.xs,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(36, 107, 254, 0.12)",
    color: tokens.color.secondary,
    fontSize: tokens.type.small,
    fontFamily: tokens.font.ui.semibold,
  },
});
