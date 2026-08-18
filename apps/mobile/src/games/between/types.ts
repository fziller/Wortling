export type GuessDirection = "before" | "after" | "hit";

export type Guess = {
  word: string;
  direction: GuessDirection;
};

export type GameStatus = "playing" | "won";

export type BetweenState = {
  targetWord: string;
  lowerBound: string;
  upperBound: string;
  guesses: Guess[];
  status: GameStatus;
};

export type GuessResult =
  | { ok: true; state: BetweenState; guess: Guess }
  | { ok: false; state: BetweenState; reason: string };
