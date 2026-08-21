export type GameStatus = "not_started" | "playing" | "won" | "lost" | "revealed";

export type GameDefinition = {
  id: string;
  title: string;
  shortDescription: string;
  route: string;
  estimatedMinutes: number;
  badge: string;
  dailyKniffEligible?: boolean;
};
