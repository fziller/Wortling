import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import type { DailyKniffeSummary } from "@/dailyKniffe";
import { tokens } from "@/design/tokens";
import type { GameDefinition } from "@/games/types";
import { HomeTape } from "@/home/HomeTape";

type DailyKniffeCardProps = {
  completedGames: Record<string, boolean>;
  games: readonly GameDefinition[];
  onContinue?: () => void;
  onOpenGame: (gameId: string) => void;
  streakCurrent: number;
  summary: DailyKniffeSummary;
};

export function DailyKniffeCard({ completedGames, games, onContinue, onOpenGame, streakCurrent, summary }: DailyKniffeCardProps) {
  const openCount = Math.max(0, summary.total - summary.completed);

  return (
    <Animated.View entering={FadeInUp.duration(tokens.motion.slow)} style={styles.dailyCard}>
      <HomeTape position="dailyTopRight" />
      <View style={styles.dailyHeader}>
        <Text style={styles.dailyTitle}>{summary.completed > 0 && !summary.isComplete ? `Noch ${openCount} offen` : "Tageskniffe"}</Text>
        <View style={styles.dailyCountPill}>
          <Text style={styles.dailyCountText}>{summary.completed}/{summary.total || 3} ERLEDIGT</Text>
        </View>
      </View>

      {openCount > 0 && summary.completed > 0 ? (
        <Pressable accessibilityRole="button" onPress={onContinue} style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
          <Text style={styles.continueButtonText}>Weitermachen</Text>
        </Pressable>
      ) : null}

      <View style={styles.dailyRows}>
        {games.map((game, index) => {
          const complete = completedGames[game.id] === true;

          return (
            <Pressable
              accessibilityLabel={`${game.title}, ${complete ? "Tageskniff erledigt" : "offener Tageskniff"}`}
              accessibilityRole="button"
              accessibilityState={{ selected: complete }}
              key={game.id}
              onPress={() => onOpenGame(game.id)}
              style={({ pressed }) => [styles.dailyRow, index > 0 && styles.dailyRowDivider, complete && styles.dailyRowDone, pressed && styles.pressed]}
            >
              {complete ? (
                <Text style={styles.dailyCheck}>✓</Text>
              ) : (
                <View style={styles.dailyOpenMark}>
                  <View style={styles.dailyOpenDot} />
                </View>
              )}
              <Text style={[styles.dailyGameTitle, complete && styles.dailyGameTitleDone]}>{game.title}</Text>
              {complete ? (
                <Text style={styles.dailyDoneLabel}>ABGESCHLOSSEN</Text>
              ) : (
                <View style={styles.dailyPlayPill}>
                  <Text style={styles.dailyPlayText}>SPIELEN</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.dailyFooter}>
        {summary.isComplete
          ? `Tageskniffe geschafft · Serie ${streakCurrent || 1}`
          : summary.total < 3
            ? "Noch nicht genug Spiele freigegeben."
            : `Noch ${openCount} für deine Serie`}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dailyCard: {
    gap: tokens.space.md,
    padding: tokens.space.lg,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.subtle,
    backgroundColor: tokens.surface.raised,
    overflow: "visible",
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.09,
    shadowRadius: 22,
    elevation: 4,
    transform: [{ rotate: "-1deg" }],
  },
  dailyHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: tokens.space.sm,
    marginBottom: tokens.space.xs,
  },
  dailyTitle: {
    color: tokens.color.ink,
    flexShrink: 1,
    fontSize: 19,
    fontFamily: tokens.font.ui.semibold,
    letterSpacing: -0.6,
  },
  dailyCountPill: {
    alignItems: "center",
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 5,
    borderRadius: tokens.radius.pill,
    backgroundColor: "#FFE0B2",
  },
  dailyCountText: {
    color: tokens.color.primaryDark,
    fontSize: 11,
    fontFamily: tokens.font.ui.semibold,
    letterSpacing: 0.4,
  },
  dailyRows: { gap: 0 },
  continueButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.primary,
  },
  continueButtonText: {
    color: "white",
    fontSize: tokens.type.body,
    fontFamily: tokens.font.ui.semibold,
  },
  dailyRow: {
    minHeight: 50,
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 11,
  },
  dailyRowDivider: {
    borderTopColor: tokens.border.subtle,
    borderTopWidth: 1,
  },
  dailyRowDone: {
    opacity: 0.78,
  },
  pressed: { opacity: 0.72 },
  dailyCheck: {
    width: 32,
    color: tokens.color.success,
    fontSize: 26,
    fontFamily: tokens.font.ui.semibold,
    lineHeight: 28,
    textAlign: "center",
  },
  dailyOpenMark: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#F5F0E6",
  },
  dailyOpenDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: tokens.color.primary,
  },
  dailyGameTitle: {
    color: tokens.color.ink,
    flex: 1,
    fontSize: 16,
    fontFamily: tokens.font.ui.semibold,
  },
  dailyGameTitleDone: { color: tokens.color.ink },
  dailyDoneLabel: {
    color: "#2E7D32",
    fontSize: 10,
    fontFamily: tokens.font.ui.medium,
    letterSpacing: 0.4,
  },
  dailyPlayPill: {
    minWidth: 72,
    alignItems: "center",
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary,
  },
  dailyPlayText: {
    color: "white",
    fontSize: 11,
    fontFamily: tokens.font.ui.semibold,
    letterSpacing: 0.3,
  },
  dailyFooter: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontFamily: tokens.font.ui.medium,
    textAlign: "center",
  },
});
