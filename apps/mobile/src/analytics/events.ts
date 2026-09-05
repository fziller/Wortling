type AnalyticsValue = string | number | boolean | null | AnalyticsValue[] | { [key: string]: AnalyticsValue };
type AnalyticsProperties = Record<string, AnalyticsValue>;

export type WortkniffEvents = {
  game_started: { gameId: string; dateKey: string };
  game_completed: { gameId: string; dateKey: string; durationMs: number; attempts: number; outcome: "won" | "lost" | "revealed"; success: boolean };
  game_abandoned: { gameId: string; dateKey: string; attempts: number };
  help_opened: { gameId?: string; screen?: string; dateKey?: string };
  hint_used: { gameId: string; dateKey: string; source?: string };
  solution_revealed: { gameId: string; dateKey: string; attempts: number };
  daily_kniffe_viewed: { dateKey: string; total: number };
  daily_kniff_opened: { gameId: string; dateKey: string; completed: string };
  daily_kniff_completed: { gameId: string; dateKey: string };
  daily_kniffe_all_completed: { dateKey: string; streak: number };
  daily_streak_updated: { dateKey: string; streak: number };
  screen_viewed: { screen: string; params?: Record<string, string> };
  settings_changed: { key: string; value: string };
  result_viewed: { gameId?: string; dateKey: string; scope: "game" | "daily_kniffe"; outcome?: string; success?: boolean };
  game_feedback_submitted: { gameId: string; dateKey: string; rating: "too_easy" | "ok" | "too_hard"; outcome: string };
  result_shared: { gameId?: string; dateKey: string; scope: "game" | "daily_kniffe"; outcome?: string };
};

export type AnalyticsClient = {
  capture: (event: string, properties?: AnalyticsProperties) => void;
};

export function captureEvent<TEvent extends keyof WortkniffEvents>(client: AnalyticsClient, event: TEvent, properties: WortkniffEvents[TEvent]): void {
  try {
    client.capture(event, properties as AnalyticsProperties);
  } catch {
    // Analytics must never break offline gameplay.
  }
}
