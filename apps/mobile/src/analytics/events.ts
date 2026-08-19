export type WortlingEvents = {
  game_started: { gameId: string; dateKey: string };
  game_completed: { gameId: string; dateKey: string; durationMs: number; attempts: number };
  game_abandoned: { gameId: string; dateKey: string; attempts: number };
  screen_viewed: { screen: string; params?: Record<string, string> };
  settings_changed: { key: string; value: string };
};
