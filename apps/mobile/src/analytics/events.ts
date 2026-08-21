export type WortkniffEvents = {
  game_started: { gameId: string; dateKey: string };
  game_completed: { gameId: string; dateKey: string; durationMs: number; attempts: number };
  game_abandoned: { gameId: string; dateKey: string; attempts: number };
  daily_kniffe_viewed: { dateKey: string; total: number };
  daily_kniff_opened: { gameId: string; dateKey: string; completed: string };
  daily_kniff_completed: { gameId: string; dateKey: string };
  daily_kniffe_all_completed: { dateKey: string; streak: number };
  screen_viewed: { screen: string; params?: Record<string, string> };
  settings_changed: { key: string; value: string };
};
