import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  addEvent,
  addGuess,
  createSession,
  findOpenSession,
  finishSession,
  updateSessionProgress,
} from "./repository";
import type { GameOutcome, GameSessionRow, SessionStartInput } from "./types";
import type { GameStatus } from "@/games/types";

export function isFinishedGameStatus(status: GameStatus): status is Exclude<GameOutcome, "abandoned"> {
  return status === "won" || status === "lost" || status === "revealed";
}

export type RecorderStartInput = SessionStartInput & { puzzleId: string };

export type GameRecorder = {
  start: (input: RecorderStartInput) => void;
  recordAcceptedGuess: (word?: string, gameData?: Record<string, unknown>) => void;
  recordRejectedGuess: (reason: string, word?: string) => void;
  recordHint: (metadata?: Record<string, unknown>) => void;
  finish: (outcome: GameOutcome) => void;
};

const DUPLICATE_REASONS = new Set([
  "Schon versucht.",
  "Das Wort hattest du schon.",
  "Dieses Wort hast du schon benutzt.",
]);

const IGNORED_REASONS = new Set([
  "Diese Runde ist schon beendet.",
  "Diese Runde ist schon gelöst.",
]);

export function classifyRejectReason(reason: string): "duplicate" | "invalid" | null {
  if (IGNORED_REASONS.has(reason)) return null;
  if (DUPLICATE_REASONS.has(reason)) return "duplicate";

  return "invalid";
}

type RecorderState = {
  input: RecorderStartInput | null;
  session: GameSessionRow | null;
  finished: boolean;
  attempts: number;
  hints: number;
  invalid: number;
  duplicates: number;
  sequence: number;
  activeMs: number;
  activeSince: number | null;
};

function initialState(): RecorderState {
  return {
    input: null,
    session: null,
    finished: false,
    attempts: 0,
    hints: 0,
    invalid: 0,
    duplicates: 0,
    sequence: 0,
    activeMs: 0,
    activeSince: null,
  };
}

function currentActiveMs(state: RecorderState): number {
  return state.activeMs + (state.activeSince !== null ? Math.max(0, Date.now() - state.activeSince) : 0);
}

function foldActiveSegment(state: RecorderState): void {
  if (state.activeSince === null) return;

  state.activeMs += Math.max(0, Date.now() - state.activeSince);
  state.activeSince = null;
}

function countersOf(state: RecorderState) {
  return {
    attemptCount: state.attempts,
    hintCount: state.hints,
    invalidGuessCount: state.invalid,
    duplicateGuessCount: state.duplicates,
    activeDurationMs: currentActiveMs(state),
  };
}

export function useGameRecorder(): GameRecorder {
  const stateRef = useRef<RecorderState>(initialState());
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const enqueue = (task: () => Promise<void>) => {
    queueRef.current = queueRef.current.then(task).catch(() => {
      // Stats are nice-to-have; a failing write must never surface in gameplay.
    });
  };

  const start = (input: RecorderStartInput) => {
    const state = stateRef.current;

    if (state.input && !state.finished && state.input.puzzleId === input.puzzleId) return;

    const next = initialState();
    next.input = input;
    next.activeSince = Date.now();
    stateRef.current = next;

    enqueue(async () => {
      try {
        const existing = await findOpenSession(input.gameId, input.playDate, input.puzzleId);

        if (existing) {
          next.session = existing;
          next.attempts = existing.attemptCount;
          next.hints = existing.hintCount;
          next.invalid = existing.invalidGuessCount;
          next.duplicates = existing.duplicateGuessCount;
          next.sequence = existing.attemptCount + existing.invalidGuessCount + existing.duplicateGuessCount;
          next.activeMs = existing.activeDurationMs;

          return;
        }

        next.session = await createSession(input);
      } catch {
        // Session unavailable; subsequent writes no-op but gameplay continues.
      }
    });
  };

  const recordAcceptedGuess = (word?: string, gameData?: Record<string, unknown>) => {
    const state = stateRef.current;
    if (!state.input || state.finished) return;

    enqueue(async () => {
      const sessionId = state.session?.id;
      if (!sessionId || state.finished) return;

      state.attempts += 1;
      state.sequence += 1;
      await addGuess(sessionId, {
        sequence: state.sequence,
        word,
        valid: true,
        duplicate: false,
        elapsedMs: currentActiveMs(state),
        gameData,
      });
      await updateSessionProgress(sessionId, countersOf(state));
    });
  };

  const recordRejectedGuess = (reason: string, word?: string) => {
    const kind = classifyRejectReason(reason);

    if (!kind) return;

    const state = stateRef.current;
    if (!state.input || state.finished) return;

    enqueue(async () => {
      const sessionId = state.session?.id;
      if (!sessionId || state.finished) return;

      if (kind === "duplicate") state.duplicates += 1;
      else state.invalid += 1;
      state.sequence += 1;
      await addGuess(sessionId, {
        sequence: state.sequence,
        word: kind === "duplicate" ? word : undefined,
        valid: false,
        duplicate: kind === "duplicate",
        elapsedMs: currentActiveMs(state),
      });
      await updateSessionProgress(sessionId, countersOf(state));
    });
  };

  const recordHint = (metadata?: Record<string, unknown>) => {
    const state = stateRef.current;
    if (!state.input || state.finished) return;

    enqueue(async () => {
      const sessionId = state.session?.id;
      if (!sessionId || state.finished) return;

      state.hints += 1;
      await addEvent({ sessionId, type: "hint_used", timestamp: new Date().toISOString(), metadata });
      await updateSessionProgress(sessionId, countersOf(state));
    });
  };

  const finish = (outcome: GameOutcome) => {
    const state = stateRef.current;
    if (!state.input || state.finished) return;

    state.finished = true;
    foldActiveSegment(state);

    enqueue(async () => {
      const sessionId = state.session?.id;
      if (!sessionId) return;

      await finishSession(sessionId, outcome, countersOf(state));
    });
  };

  useEffect(() => {
    const handleStatus = (status: AppStateStatus) => {
      const state = stateRef.current;
      if (!state.input || state.finished) return;

      if (status === "active") {
        if (state.activeSince === null) state.activeSince = Date.now();

        return;
      }

      foldActiveSegment(state);
      if (!state.session) return;

      enqueue(async () => {
        const sessionId = state.session?.id;
        if (!sessionId || state.finished) return;

        await updateSessionProgress(sessionId, countersOf(state));
      });
    };

    const subscription = AppState.addEventListener("change", handleStatus);

    return () => {
      subscription.remove();
      foldActiveSegment(stateRef.current);

      const state = stateRef.current;
      if (state.session && !state.finished) {
        enqueue(async () => {
          const sessionId = state.session?.id;
          if (!sessionId || state.finished) return;

          await updateSessionProgress(sessionId, countersOf(state));
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { start, recordAcceptedGuess, recordRejectedGuess, recordHint, finish };
}
