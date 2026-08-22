import { useFocusEffect, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Screen } from "@/components/Screen";
import { getBerlinDateKey } from "@/daily/date";
import { generateDailyKniffe, getDailyKniffeSummary, isDailyKniffCompleted } from "@/dailyKniffe";
import { tokens } from "@/design/tokens";
import { gameRegistry, games } from "@/games/registry";
import { DailyKniffeCard } from "@/home/DailyKniffeCard";
import { GameCard } from "@/home/GameCard";
import { HomeTopBar } from "@/home/HomeTopBar";
import { homeOrder } from "@/home/homeMeta";
import { updateBadgeCount } from "@/notifications/badge";
import { loadDailyKniffeSeedOverride } from "@/storage/dailyKniffeDev";
import { completeDailyStreak, loadDailyStreak, type DailyStreak } from "@/storage/dailyStreak";
import { isStartedProgress, loadProgressForGames, type StoredProgress } from "@/storage/progress";

export default function HomeScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const dateKey = getBerlinDateKey();
  const [progressByGame, setProgressByGame] = useState<Record<string, StoredProgress | null>>({});
  const [dailyStreak, setDailyStreak] = useState<DailyStreak>({ current: 0, best: 0 });
  const [seedOverride, setSeedOverride] = useState<number | undefined>();
  const completedEventIds = useRef(new Set<string>());
  const orderedGames = homeOrder
    .map((id) => games.find((game) => game.id === id))
    .filter((game): game is (typeof games)[number] => Boolean(game));
  const dailyKniffe = useMemo(() => generateDailyKniffe({
    dateKey,
    devConfig: { seedOverride },
    games,
  }), [dateKey, seedOverride]);
  const dailyKniffeByGame = useMemo(() => new Map(dailyKniffe.map((kniff) => [kniff.gameId, kniff])), [dailyKniffe]);
  const dailyKniffGames = dailyKniffe
    .map((kniff) => gameRegistry[kniff.gameId])
    .filter((game): game is (typeof games)[number] => Boolean(game));
  const dailyKniffCompletedGames = useMemo(() => Object.fromEntries(
    dailyKniffe.map((kniff) => [kniff.gameId, isDailyKniffCompleted(progressByGame[kniff.gameId])]),
  ), [dailyKniffe, progressByGame]);
  const dailySummary = getDailyKniffeSummary(dailyKniffe, progressByGame);

  useEffect(() => {
    try {
      posthog.capture("screen_viewed", { screen: "home", params: { dateKey } });
      posthog.capture("daily_kniffe_viewed", { dateKey, total: dailySummary.total });
    } catch {}
  }, [dateKey, dailySummary.total, posthog]);

  useFocusEffect(useCallback(() => {
    let mounted = true;

    Promise.all([loadDailyKniffeSeedOverride(), loadDailyStreak()]).then(([nextSeedOverride, nextStreak]) => {
      if (!mounted) return;
      setSeedOverride(nextSeedOverride);
      setDailyStreak(nextStreak);
    });

    return () => {
      mounted = false;
    };
  }, []));

  useEffect(() => {
    let mounted = true;

    loadProgressForGames(
      games.map((game) => game.id),
      dateKey,
    ).then((progress) => {
      if (mounted) {
        setProgressByGame(progress);
        updateBadgeCount(progress, dateKey, seedOverride);
      }
    });

    return () => {
      mounted = false;
    };
  }, [dateKey, seedOverride]);

  useEffect(() => {
    for (const kniff of dailyKniffe) {
      if (!isDailyKniffCompleted(progressByGame[kniff.gameId]) || completedEventIds.current.has(kniff.id)) continue;

      completedEventIds.current.add(kniff.id);
      try {
        posthog.capture("daily_kniff_completed", { dateKey, gameId: kniff.gameId });
      } catch {}
    }
  }, [dateKey, dailyKniffe, posthog, progressByGame]);

  useEffect(() => {
    if (!dailySummary.isComplete || dailyStreak.lastCompletedDateKey === dateKey) return;

    completeDailyStreak(dateKey).then((nextStreak) => {
      setDailyStreak(nextStreak);
      try {
        posthog.capture("daily_kniffe_all_completed", { dateKey, streak: nextStreak.current });
      } catch {}
    });
  }, [dailyStreak.lastCompletedDateKey, dailySummary.isComplete, dateKey, posthog]);

  function openDailyKniff(gameId: string) {
    const game = gameRegistry[gameId];
    if (!game) return;

    try {
      posthog.capture("daily_kniff_opened", {
        dateKey,
        gameId,
        completed: String(isDailyKniffCompleted(progressByGame[gameId])),
      });
    } catch {}

    router.push(game.route as never);
  }

  return (
    <Screen header={<HomeTopBar />}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <DailyKniffeCard
          completedGames={dailyKniffCompletedGames}
          games={dailyKniffGames}
          onOpenGame={openDailyKniff}
          streakCurrent={dailyStreak.current}
          summary={dailySummary}
        />

        <View style={styles.gameList}>
          {orderedGames.map((game, index) => {
            const dailyKniff = dailyKniffeByGame.get(game.id);

            return (
              <GameCard
                dailyKniffComplete={isDailyKniffCompleted(progressByGame[game.id])}
                game={game}
                hasDailyKniff={Boolean(dailyKniff)}
                inProgress={isStartedProgress(progressByGame[game.id])}
                index={index}
                key={game.id}
                onPress={() => router.push(game.route as never)}
                status={progressByGame[game.id]?.status}
              />
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 22,
    paddingBottom: tokens.space.xl,
    paddingTop: tokens.space.lg,
  },
  gameList: {
    gap: 20,
  },
});
