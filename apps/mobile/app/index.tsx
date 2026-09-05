import { useFocusEffect, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Screen } from "@/components/Screen";
import { captureEvent } from "@/analytics/events";
import { getBerlinDateKey } from "@/daily/date";
import { generateDailyKniffe, getDailyKniffeSummary, isDailyKniffCompleted } from "@/dailyKniffe";
import { tokens } from "@/design/tokens";
import { gameRegistry, games } from "@/games/registry";
import { DailyKniffeCard } from "@/home/DailyKniffeCard";
import { DailyKniffeRewardModal } from "@/home/DailyKniffeRewardModal";
import { GameCard } from "@/home/GameCard";
import { HOME_HEADER_BACKGROUND, HomeTopBar } from "@/home/HomeTopBar";
import { homeOrder } from "@/home/homeMeta";
import { updateBadgeCount } from "@/notifications/badge";
import { loadDailyKniffeSeedOverride } from "@/storage/dailyKniffeDev";
import { loadCurrentWinDayStreak } from "@/stats/freeStats";
import { isStartedProgress, loadProgressForGames, type StoredProgress } from "@/storage/progress";

export default function HomeScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const dateKey = getBerlinDateKey();
  const [progressByGame, setProgressByGame] = useState<Record<string, StoredProgress | null>>({});
  const [dailyRewardVisible, setDailyRewardVisible] = useState(false);
  const [winDayStreak, setWinDayStreak] = useState({ current: 0, longest: 0, todayIsWinDay: false });
  const [seedOverride, setSeedOverride] = useState<number | undefined>();
  const completedEventIds = useRef(new Set<string>());
  const celebratedDateKeys = useRef(new Set<string>());
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
    captureEvent(posthog, "screen_viewed", { screen: "home", params: { dateKey } });
    captureEvent(posthog, "daily_kniffe_viewed", { dateKey, total: dailySummary.total });
  }, [dateKey, dailySummary.total, posthog]);

  useFocusEffect(useCallback(() => {
    let mounted = true;

    Promise.all([loadDailyKniffeSeedOverride(), loadCurrentWinDayStreak()]).then(([nextSeedOverride, nextStreak]) => {
      if (!mounted) return;
      setSeedOverride(nextSeedOverride);
      setWinDayStreak(nextStreak);
    }).catch(() => {
      // Streak display is nice-to-have; home must stay offline-safe.
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
      captureEvent(posthog, "daily_kniff_completed", { dateKey, gameId: kniff.gameId });
    }
  }, [dateKey, dailyKniffe, posthog, progressByGame]);

  useEffect(() => {
    if (!dailySummary.isComplete || !winDayStreak.todayIsWinDay || celebratedDateKeys.current.has(dateKey)) return;

    celebratedDateKeys.current.add(dateKey);
    captureEvent(posthog, "daily_kniffe_all_completed", { dateKey, streak: winDayStreak.current });
    captureEvent(posthog, "daily_streak_updated", { dateKey, streak: winDayStreak.current });
    setDailyRewardVisible(true);
  }, [dateKey, dailySummary.isComplete, posthog, winDayStreak]);

  function openDailyKniff(gameId: string) {
    const game = gameRegistry[gameId];
    if (!game) return;

    captureEvent(posthog, "daily_kniff_opened", {
      dateKey,
      gameId,
      completed: String(isDailyKniffCompleted(progressByGame[gameId])),
    });

    router.push(game.route as never);
  }

  return (
    <Screen header={<HomeTopBar />} headerBackgroundColor={HOME_HEADER_BACKGROUND}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <DailyKniffeCard
          completedGames={dailyKniffCompletedGames}
          games={dailyKniffGames}
          onOpenGame={openDailyKniff}
          streakCurrent={winDayStreak.current}
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
      <DailyKniffeRewardModal
        dateKey={dateKey}
        onClose={() => setDailyRewardVisible(false)}
        onShare={() => captureEvent(posthog, "result_shared", { dateKey, scope: "daily_kniffe", outcome: "won" })}
        onViewed={() => captureEvent(posthog, "result_viewed", { dateKey, scope: "daily_kniffe", outcome: "won", success: true })}
        streak={winDayStreak.current}
        total={dailySummary.total || 3}
        visible={dailyRewardVisible}
      />
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
