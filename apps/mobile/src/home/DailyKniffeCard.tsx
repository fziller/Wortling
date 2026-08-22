import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import type { DailyKniffeSummary } from "@/dailyKniffe";
import { tokens } from "@/design/tokens";
import type { GameDefinition } from "@/games/types";
import { HomeTape } from "@/home/HomeTape";

type DailyKniffeCardProps = {
  completedGames: Record<string, boolean>;
  games: readonly GameDefinition[];
  onOpenGame: (gameId: string) => void;
  streakCurrent: number;
  summary: DailyKniffeSummary;
};

export function DailyKniffeCard({ completedGames, games, onOpenGame, streakCurrent, summary }: DailyKniffeCardProps) {
  return (
    <Animated.View entering={FadeInUp.duration(tokens.motion.slow)} style={styles.dailyCard}>
      <HomeTape position="dailyTopRight" />
      <View style={styles.dailyHeader}>
        <Text style={styles.dailyTitle}>Tageskniffe</Text>
        <View style={styles.dailyCountPill}>
          <Text style={styles.dailyCountText}>{summary.completed}/{summary.total || 3} ERLEDIGT</Text>
        </View>
      </View>

      <View style={styles.dailyRows}>
        {games.map((game) => {
          const complete = completedGames[game.id] === true;

          return (
            <Pressable
              accessibilityLabel={`${game.title}, ${complete ? "Tageskniff erledigt" : "offener Tageskniff"}`}
              accessibilityRole="button"
              accessibilityState={{ selected: complete }}
              key={game.id}
              onPress={() => onOpenGame(game.id)}
              style={({ pressed }) => [styles.dailyRow, complete && styles.dailyRowDone, pressed && styles.pressed]}
            >
              {complete ? (
                <View style={styles.dailyStamp}>
                  <View style={styles.dailyStampCoin}>
                    <Text style={styles.dailyStampCheck}>✓</Text>
                  </View>
                </View>
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
            : `Noch ${summary.total - summary.completed} für deine Serie`}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dailyCard: {
    gap: tokens.space.md,
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#EEE6DA",
    backgroundColor: "#FFFDF8",
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
    fontWeight: "900",
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
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  dailyRows: { gap: 9 },
  dailyRow: {
    minHeight: 50,
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE5DA",
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  dailyRowDone: {
    backgroundColor: "rgba(245, 240, 230, 0.35)",
    borderColor: "#E0D8CD",
    borderStyle: "dashed",
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: { opacity: 0.72 },
  dailyStamp: {
    width: 44,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(23, 19, 13, 0.55)",
    transform: [{ rotate: "-1deg" }],
  },
  dailyStampCoin: {
    width: 21,
    height: 21,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#FFE0B2",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  dailyStampCheck: {
    color: tokens.color.primaryDark,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 15,
  },
  dailyOpenMark: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#F5F0E6",
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 2, width: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
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
    fontWeight: "900",
  },
  dailyGameTitleDone: { color: tokens.color.ink },
  dailyDoneLabel: {
    color: "#2E7D32",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  dailyPlayPill: {
    minWidth: 72,
    alignItems: "center",
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary,
    shadowColor: tokens.color.primaryDark,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  dailyPlayText: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  dailyFooter: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontWeight: "900",
    textAlign: "center",
  },
});
