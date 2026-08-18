import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { AppCard } from "@/components/AppCard";
import { AppButton } from "@/components/AppButton";
import { Screen } from "@/components/Screen";
import { getBerlinDateKey } from "@/daily/date";
import { tokens } from "@/design/tokens";
import { games } from "@/games/registry";
import { GameStatus } from "@/games/types";
import { loadProgressForGames, StoredProgress } from "@/storage/progress";

function statusLabel(status?: GameStatus): string {
  if (status === "won") return "Geschafft";
  if (status === "lost") return "Verloren";
  if (status === "revealed") return "Aufgedeckt";
  if (status === "playing") return "Begonnen";

  return "Offen";
}

export default function HomeScreen() {
  const dateKey = getBerlinDateKey();
  const [progressByGame, setProgressByGame] = useState<
    Record<string, StoredProgress | null>
  >({});

  useEffect(() => {
    let mounted = true;

    loadProgressForGames(
      games.map((game) => game.id),
      dateKey,
    ).then((progress) => {
      if (mounted) setProgressByGame(progress);
    });

    return () => {
      mounted = false;
    };
  }, [dateKey]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeInUp.duration(tokens.motion.slow)}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.kicker}>Heute</Text>
              <Text style={styles.title}>Wortling</Text>
            </View>
            <Link href="/settings" asChild>
              <Pressable
                accessibilityLabel="Open settings"
                accessibilityRole="button"
                style={styles.settingsButton}
              >
                <Text style={styles.settingsButtonText}>⚙</Text>
              </Pressable>
            </Link>
          </View>
          <Text style={styles.subtitle}>
            Kurze deutsche Worträtsel. Kein Account, kein Kram.
          </Text>
        </Animated.View>

        <View style={styles.gameList}>
          {games.map((game, index) => {
            const status = progressByGame[game.id]?.status;

            return (
              <Animated.View
                entering={FadeInDown.delay(90 + index * 45).duration(
                  tokens.motion.slow,
                )}
                key={game.id}
              >
                <AppCard>
                  <View style={styles.cardTop}>
                    <Text style={styles.badge}>{game.badge}</Text>
                    <Text style={styles.minutes}>
                      {statusLabel(status)} · {game.estimatedMinutes} Min.
                    </Text>
                  </View>
                  <Text style={styles.cardTitle}>{game.title}</Text>
                  <Text style={styles.cardText}>{game.shortDescription}</Text>
                  <Link href={game.route as never} asChild>
                    <AppButton
                      label={status === "playing" ? "Weiterspielen" : status ? "Öffnen" : "Spielen"}
                      onPress={() => undefined}
                    />
                  </Link>
                </AppCard>
              </Animated.View>
            );
          })}
        </View>

        <Text style={styles.footer}>Heute · {dateKey}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    gap: tokens.space.lg,
    paddingBottom: tokens.space.xl,
  },
  hero: {
    paddingTop: tokens.space.xl,
    gap: tokens.space.sm,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.space.md,
  },
  settingsButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.62)",
  },
  settingsButtonText: {
    color: tokens.color.ink,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24,
  },
  kicker: {
    color: tokens.color.primaryDark,
    fontSize: tokens.type.small,
    fontWeight: "900",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.type.title,
    fontWeight: "900",
    letterSpacing: -1.8,
  },
  subtitle: {
    color: tokens.color.muted,
    fontSize: tokens.type.body,
    lineHeight: 24,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: tokens.space.lg,
  },
  badge: {
    overflow: "hidden",
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.xs,
    borderRadius: tokens.radius.pill,
    backgroundColor: "#FFE2D4",
    color: tokens.color.primaryDark,
    fontWeight: "900",
  },
  minutes: {
    color: tokens.color.muted,
    fontWeight: "800",
  },
  gameList: {
    gap: tokens.space.md,
  },
  cardTitle: {
    color: tokens.color.ink,
    fontSize: tokens.type.h1,
    fontWeight: "900",
  },
  cardText: {
    marginTop: tokens.space.sm,
    marginBottom: tokens.space.lg,
    color: tokens.color.muted,
    fontSize: tokens.type.body,
    lineHeight: 24,
  },
  footer: {
    marginTop: "auto",
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    textAlign: "center",
  },
});
