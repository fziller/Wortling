import { useRouter, useFocusEffect } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { captureEvent } from "@/analytics/events";
import { Screen } from "@/components/Screen";
import { getBerlinDateKey } from "@/daily/date";
import { tokens } from "@/design/tokens";
import { gameRegistry } from "@/games/registry";
import { HomeTape, type TapePosition } from "@/home/HomeTape";
import { loadFreeStats, type FreeStats } from "@/stats/freeStats";
import type { GameSessionRow } from "@/stats/types";

const tapeCycle: TapePosition[] = ["topRight", "topLeft", "topCenter", "bottomRight", "bottomLeft", "topRight"];

export default function StatsScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const today = getBerlinDateKey();
  const [stats, setStats] = useState<FreeStats | null>(null);

  const load = useCallback(() => {
    loadFreeStats(today)
      .then(setStats)
      .catch(() => {});
  }, [today]);

  useFocusEffect(load);

  useEffect(() => {
    captureEvent(posthog, "screen_viewed", { screen: "stats", params: { dateKey: today } });
  }, [posthog, today]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(tokens.motion.normal)} style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Zurück</Text>
          </Pressable>
          <Text style={styles.kicker}>Wortkniff</Text>
          <Text style={styles.title}>Statistik</Text>
        </Animated.View>

        {!stats || stats.lifetime.totalSessions === 0 ? (
          <Animated.View entering={FadeInDown.delay(80).duration(tokens.motion.normal)}>
            <TapeCard tape="topRight">
              <Text style={styles.cardTitle}>Noch keine Runden</Text>
              <Text style={styles.body}>Sobald du die erste Runde spielst, sammelt Wortkniff hier deine Statistiken. Alles bleibt lokal auf deinem Gerät.</Text>
            </TapeCard>
          </Animated.View>
        ) : (
          <>
            <TapeSection delay={80} tape={tapeCycle[0]}>
              <View style={styles.grid2}>
                <View style={styles.statTileLarge}>
                  <Text style={styles.tileLabel}>Runden gespielt</Text>
                  <Text style={styles.tileValueBig}>{stats.lifetime.totalSessions}</Text>
                </View>
                <View style={styles.statTileLarge}>
                  <Text style={styles.tileLabel}>Lösungsquote</Text>
                  <Text style={[styles.tileValueBig, { color: tokens.color.success }]}>{formatPercent(stats.lifetime.solvedRate)}</Text>
                </View>
              </View>
              <View style={[styles.statTileLarge, styles.fullWidthTile]}>
                <Text style={styles.tileLabel}>Gespielte Tage</Text>
                <Text style={styles.tileValueBig}>{stats.lifetime.playedDays}</Text>
              </View>
            </TapeSection>

            <TapeSection delay={110} tape={tapeCycle[1]}>
              <Text style={styles.cardTitle}>Streaks</Text>
              <View style={styles.twoCol}>
                <View style={styles.streakTile}>
                  <Text style={styles.streakIcon}>🔥</Text>
                  <Text style={styles.tileLabel}>Aktive Serie</Text>
                  <Text style={styles.streakValue}>{stats.activityStreak.current}</Text>
                  <Text style={styles.streakBest}>Beste: {stats.activityStreak.longest}</Text>
                </View>
                <View style={styles.streakTile}>
                  <Text style={styles.streakIcon}>⭐</Text>
                  <Text style={styles.tileLabel}>Tägliches Rätsel</Text>
                  <Text style={styles.streakValue}>{stats.winDayStreak.current}</Text>
                  <Text style={styles.streakBest}>Beste: {stats.winDayStreak.longest}</Text>
                </View>
              </View>
            </TapeSection>

            <TapeSection delay={140} tape={tapeCycle[2]}>
              <Text style={styles.sectionTitle}>Ergebnisse</Text>
              <View style={styles.grid2}>
                <OutcomeTile label="Gewonnen" value={stats.lifetime.won} color={tokens.color.success} />
                <OutcomeTile label="Verloren" value={stats.lifetime.lost} color={tokens.color.danger} />
                <OutcomeTile label="Aufgedeckt" value={stats.lifetime.revealed} color={tokens.color.warning} />
                <OutcomeTile label="Abgebrochen" value={stats.lifetime.abandoned} color={tokens.color.muted} />
              </View>
            </TapeSection>

            <TapeSection delay={170} tape={tapeCycle[3]}>
              <Text style={styles.cardTitle}>Zeit & Versuche</Text>
              <View style={styles.divider} />
              <View style={styles.metricsGrid}>
                <Metric label="Aktive Zeit" value={formatDuration(stats.lifetime.totalActiveMs)} />
                <Metric label="Ø pro Runde" value={formatDuration(stats.lifetime.avgActiveMsPerSession ?? 0)} />
                <Metric label="Ø Versuche" value={formatNumber(stats.lifetime.avgAttempts)} />
                <Metric label="Ø Hinweise" value={formatNumber(stats.lifetime.avgHints)} />
              </View>
            </TapeSection>

            <TapeSection delay={200} tape={tapeCycle[4]}>
              <Text style={styles.cardTitle}>Deine Spiele</Text>
              {stats.lifetime.perGame.map((entry) => (
                <View key={entry.gameId} style={styles.listRow}>
                  <Text style={[styles.listLabel, entry.gameId === stats.lifetime.favoriteGameId && styles.favorite]}>
                    {entry.gameId === stats.lifetime.favoriteGameId ? "★ " : ""}
                    {gameRegistry[entry.gameId]?.title ?? entry.gameId}
                  </Text>
                  <Text style={styles.listValue}>{entry.sessions} · {entry.won} gewonnen</Text>
                </View>
              ))}
            </TapeSection>

            <TapeSection delay={230} tape={tapeCycle[0]}>
              <Text style={styles.cardTitle}>Wörter & Buchstaben</Text>
              <View style={styles.twoCol}>
                <View style={styles.miniTile}>
                  <Text style={styles.tileLabel}>Gültige Guesses</Text>
                  <Text style={styles.tileValue}>{stats.words.totalValidGuesses}</Text>
                </View>
                <View style={styles.miniTile}>
                  <Text style={styles.tileLabel}>Unterschiedliche Wörter</Text>
                  <Text style={styles.tileValue}>{stats.words.distinctWords}</Text>
                </View>
              </View>
              <TopList title="Häufigste Wörter" entries={stats.words.topWords} emptyFallback="–" />
              <TopList title="Häufigste Buchstaben" entries={stats.words.topLetters} emptyFallback="–" />
            </TapeSection>

            <TapeSection delay={260} tape={tapeCycle[1]}>
              <Text style={styles.cardTitle}>Wortlängen</Text>
              {Object.keys(stats.lifetime.gamesByWordLength).length === 0 ? (
                <Text style={styles.listValue}>–</Text>
              ) : (
                <View style={styles.grid2}>
                  {Object.entries(stats.lifetime.gamesByWordLength)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([length, count]) => (
                      <View key={length} style={styles.miniTile}>
                        <Text style={styles.tileLabel}>{length} Buchstaben</Text>
                        <Text style={styles.tileValue}>{count}</Text>
                      </View>
                    ))}
                </View>
              )}
            </TapeSection>

            <TapeSection delay={290} tape={tapeCycle[2]}>
              <Text style={styles.cardTitle}>Rekorde</Text>
              <RecordRow label="Schnellster Sieg" value={formatDuration(stats.records.fastestWinMs ?? 0)} />
              <RecordRow label="Wenigste Versuche (Sieg)" value={stats.records.fewestAttemptsWin === null ? "–" : String(stats.records.fewestAttemptsWin)} />
              <RecordRow label="Meiste Runden an einem Tag" value={stats.records.mostGamesInADay === null ? "–" : String(stats.records.mostGamesInADay)} />
              <RecordRow label="Meiste Siege an einem Tag" value={stats.records.mostWinsInADay === null ? "–" : String(stats.records.mostWinsInADay)} />
            </TapeSection>

            <TapeSection delay={310} tape={tapeCycle[3]}>
              <Text style={styles.cardTitle}>Letzte Runden</Text>
              {stats.recent.length === 0 ? (
                <Text style={styles.body}>Noch keine Runden.</Text>
              ) : (
                <View style={styles.recentList}>
                  {stats.recent.map((session, idx) => (
                    <View key={session.id}>
                      <RecentRow session={session} />
                      {idx < stats.recent.length - 1 ? <View style={styles.rowDivider} /> : null}
                    </View>
                  ))}
                </View>
              )}
            </TapeSection>

            <Text style={styles.footer}>Statistiken bleiben lokal auf deinem Gerät.</Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function TapeSection({ children, delay, tape }: { children: React.ReactNode; delay: number; tape: TapePosition }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(tokens.motion.normal)}>
      <TapeCard tape={tape}>{children}</TapeCard>
    </Animated.View>
  );
}

function TapeCard({ children, tape }: { children: React.ReactNode; tape: TapePosition }) {
  return (
    <View style={styles.tapeCard}>
      <HomeTape position={tape} />
      <View style={styles.tapeCardContent}>{children}</View>
    </View>
  );
}

function OutcomeTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.outcomeTile}>
      <Text style={styles.outcomeLabel}>{label}</Text>
      <Text style={[styles.outcomeValue, { color }]}>{value}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function RecentRow({ session }: { session: GameSessionRow }) {
  const game = gameRegistry[session.gameId];
  return (
    <View style={styles.recentRow}>
      <View style={[styles.outcomeDot, { backgroundColor: outcomeDotColor(session.outcome) }]}>
        <Text style={styles.outcomeDotText}>{outcomeIcon(session.outcome)}</Text>
      </View>
      <View style={styles.recentMain}>
        <Text style={styles.recentTitle}>{game?.title ?? session.gameId} · {formatRecentDate(session)}</Text>
        <Text style={styles.recentSub}>
          {[session.wordLength ? `${session.wordLength} Buchstaben` : null, `${session.attemptCount} Versuche`, formatDurationShort(session.activeDurationMs)]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
      <View style={[styles.pill, { backgroundColor: outcomePillBg(session.outcome) }]}>
        <Text style={[styles.pillText, { color: outcomePillColor(session.outcome) }]}>{outcomeLabel(session.outcome)}</Text>
      </View>
    </View>
  );
}

function TopList({ title, entries, emptyFallback }: { title: string; entries: Array<{ word: string; count: number }>; emptyFallback: string }) {
  return (
    <View style={styles.topList}>
      <Text style={styles.subTitle}>{title}</Text>
      {entries.length === 0 ? (
        <Text style={styles.listValue}>{emptyFallback}</Text>
      ) : (
        entries.map((entry, index) => (
          <View key={entry.word} style={styles.listRow}>
            <Text style={styles.listLabel}>{index + 1}. {entry.word.toLocaleUpperCase("de-DE")}</Text>
            <Text style={styles.listValue}>{entry.count}×</Text>
          </View>
        ))
      )}
    </View>
  );
}

function RecordRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.listRow}>
      <Text style={styles.listLabel}>{label}</Text>
      <Text style={styles.listValue}>{value}</Text>
    </View>
  );
}

function outcomeDotColor(o: GameSessionRow["outcome"]): string {
  if (o === "won") return "rgba(16,185,129,0.14)";
  if (o === "lost") return "rgba(239,68,68,0.12)";
  if (o === "revealed") return "rgba(245,158,11,0.14)";
  return "rgba(107,114,128,0.12)";
}
function outcomeIcon(o: GameSessionRow["outcome"]): string {
  if (o === "won") return "✓";
  if (o === "lost") return "✕";
  if (o === "revealed") return "◐";
  return "–";
}
function outcomePillBg(o: GameSessionRow["outcome"]): string {
  if (o === "won") return "rgba(16,185,129,0.14)";
  if (o === "lost") return "rgba(239,68,68,0.12)";
  if (o === "revealed") return "rgba(245,158,11,0.14)";
  return "rgba(107,114,128,0.10)";
}
function outcomePillColor(o: GameSessionRow["outcome"]): string {
  if (o === "won") return tokens.color.success;
  if (o === "lost") return tokens.color.danger;
  if (o === "revealed") return tokens.color.warning;
  return tokens.color.muted;
}
function outcomeLabel(o: GameSessionRow["outcome"]): string {
  if (o === "won") return "Gewonnen";
  if (o === "lost") return "Verloren";
  if (o === "revealed") return "Aufgedeckt";
  if (o === "abandoned") return "Abgebrochen";
  return "Offen";
}

function formatRecentDate(s: GameSessionRow): string {
  const d = new Date(s.completedAt ?? s.updatedAt);
  const today = getBerlinDateKey();
  const key = getBerlinDateKey(d);
  const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  if (key === today) return `Heute, ${time}`;
  const yesterday = new Date(`${today}T12:00:00.000Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);
  if (key === yKey) return `Gestern, ${time}`;
  return `${d.toLocaleDateString("de-DE")} ${time}`;
}

function formatPercent(v: number | null): string { return v === null ? "–" : `${Math.round(v * 100)} %`; }
function formatNumber(v: number | null): string {
  if (v === null) return "–";
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toLocaleString("de-DE", { maximumFractionDigits: 1 });
}
function formatDuration(ms: number): string {
  if (ms <= 0) return "0 Min.";
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min} Min.`;
  return `${h} h ${min} Min.`;
}
function formatDurationShort(ms: number): string {
  if (ms <= 0) return "";
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} Min`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min === 0 ? `${h}h` : `${h}h ${min}Min`;
}

const styles = StyleSheet.create({
  scroll: { gap: 20, paddingBottom: 34, paddingTop: 16 },
  header: { gap: 10, paddingTop: 8 },
  backButton: { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: tokens.border.subtle, borderRadius: tokens.radius.md, backgroundColor: tokens.surface.raised },
  backButtonText: { color: tokens.color.ink, fontFamily: tokens.font.ui.semibold },
  kicker: { color: tokens.color.primaryDark, fontFamily: tokens.font.ui.semibold, fontSize: 13, letterSpacing: 1.6, textTransform: "uppercase" },
  title: { color: tokens.color.ink, fontFamily: tokens.font.ui.semibold, fontSize: tokens.type.title, letterSpacing: -1.8 },
  // tape card — same look as GameCard
  tapeCard: { backgroundColor: tokens.surface.raised, borderColor: tokens.border.subtle, borderRadius: tokens.radius.lg, borderWidth: 1, overflow: "visible" as const, padding: 20, shadowColor: tokens.shadow.raised.color, shadowOffset: tokens.shadow.raised.offset, shadowOpacity: tokens.shadow.raised.opacity, shadowRadius: tokens.shadow.raised.radius, elevation: tokens.shadow.raised.elevation },
  tapeCardContent: { gap: 12 },
  cardTitle: { color: tokens.color.ink, fontFamily: tokens.font.ui.semibold, fontSize: 22 },
  sectionTitle: { color: tokens.color.ink, fontFamily: tokens.font.ui.semibold, fontSize: 20 },
  body: { color: tokens.color.muted, ...tokens.typography.uiBody },
  footer: { color: tokens.color.muted, fontSize: 13, fontWeight: "600", textAlign: "center", marginTop: 4 },
  grid2: { flexDirection: "row", gap: 12, flexWrap: "wrap" as const },
  twoCol: { flexDirection: "row", gap: 12 },
  statTileLarge: { flex: 1, minWidth: 140, backgroundColor: "rgba(255,255,255,0.55)", borderWidth: 1, borderColor: tokens.color.line, borderRadius: 16, padding: 14, gap: 4 },
  fullWidthTile: { flexBasis: "100%" as unknown as number },
  tileLabel: { color: tokens.color.muted, fontFamily: tokens.font.ui.semibold, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase" as const },
  tileValueBig: { color: tokens.color.ink, fontFamily: tokens.font.ui.semibold, fontSize: 36, letterSpacing: -1, fontVariant: ["tabular-nums"] as const },
  tileValue: { color: tokens.color.ink, fontFamily: tokens.font.ui.semibold, fontSize: 22, fontVariant: ["tabular-nums"] as const },
  streakTile: { flex: 1, alignItems: "center", backgroundColor: "rgba(255,255,255,0.55)", borderWidth: 1, borderColor: tokens.color.line, borderRadius: 16, padding: 14, gap: 2 },
  streakIcon: { fontSize: 20 },
  streakValue: { color: tokens.color.primaryDark, fontSize: 36, fontWeight: "900" },
  streakBest: { color: tokens.color.muted, fontSize: 12, fontWeight: "700" },
  outcomeTile: { flex: 1, minWidth: 120, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.55)", borderWidth: 1, borderColor: tokens.color.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  outcomeLabel: { color: tokens.color.ink, fontSize: 14, fontWeight: "800" },
  outcomeValue: { fontSize: 18, fontWeight: "900" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap" as const, gap: 16 },
  metricLabel: { color: tokens.color.muted, fontSize: 11, fontWeight: "800", textTransform: "uppercase" as const, marginBottom: 2 },
  metricValue: { color: tokens.color.ink, fontSize: 16, fontWeight: "900" },
  divider: { height: 1, backgroundColor: tokens.color.line, opacity: 0.6 },
  miniTile: { flex: 1, minWidth: 120, backgroundColor: "rgba(255,255,255,0.55)", borderWidth: 1, borderColor: tokens.color.line, borderRadius: 14, padding: 12, gap: 2 },
  // lists
  topList: { gap: 6, marginTop: 4 },
  subTitle: { color: tokens.color.muted, fontSize: 11, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase" as const, marginTop: 8 },
  listRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 2 },
  listLabel: { color: tokens.color.ink, fontSize: 15, fontWeight: "800", flexShrink: 1 },
  favorite: { color: tokens.color.secondary },
  listValue: { color: tokens.color.muted, fontSize: 14, fontWeight: "800" },
  recentList: { gap: 0, backgroundColor: "rgba(255,255,255,0.55)", borderWidth: 1, borderColor: tokens.color.line, borderRadius: 16, padding: 4, overflow: "hidden" },
  recentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 8, paddingVertical: 10 },
  outcomeDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  outcomeDotText: { fontSize: 16, fontWeight: "900", color: tokens.color.ink },
  recentMain: { flex: 1, gap: 2 },
  recentTitle: { color: tokens.color.ink, fontSize: 14, fontWeight: "800" },
  recentSub: { color: tokens.color.muted, fontSize: 12, fontWeight: "600" },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "800" },
  rowDivider: { height: 1, backgroundColor: tokens.color.line, opacity: 0.5, marginHorizontal: 8 },
});
