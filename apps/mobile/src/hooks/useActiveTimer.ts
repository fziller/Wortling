import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export function useActiveTimer(isPlaying: boolean, finishedAt: number | null) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const activeMsRef = useRef(0);
  const activeSinceRef = useRef<number | null>(isPlaying && finishedAt === null ? Date.now() : null);
  const isPlayingRef = useRef(isPlaying);
  const finishedRef = useRef(finishedAt);

  isPlayingRef.current = isPlaying;
  finishedRef.current = finishedAt;

  const fold = useCallback(() => {
    if (activeSinceRef.current !== null) {
      activeMsRef.current += Math.max(0, Date.now() - activeSinceRef.current);
      activeSinceRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    if (isPlayingRef.current && finishedRef.current === null && activeSinceRef.current === null) {
      activeSinceRef.current = Date.now();
    }
  }, []);

  // Handle isPlaying / finished changes
  useEffect(() => {
    if (!isPlaying || finishedAt !== null) {
      fold();
    } else if (activeSinceRef.current === null) {
      activeSinceRef.current = Date.now();
    }
  }, [isPlaying, finishedAt, fold]);

  // Tick every second while playing
  useEffect(() => {
    if (!isPlaying || finishedAt !== null) return;
    const id = setInterval(() => {
      const current = activeMsRef.current + (activeSinceRef.current !== null ? Date.now() - activeSinceRef.current : 0);
      setElapsedMs(current);
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, finishedAt]);

  // Update elapsedMs immediately when folding
  useEffect(() => {
    if (!isPlaying || finishedAt !== null) {
      setElapsedMs(activeMsRef.current);
    }
  }, [isPlaying, finishedAt]);

  // AppState pause/resume
  useEffect(() => {
    const handle = (status: AppStateStatus) => {
      if (status === "active") {
        resume();
      } else {
        fold();
        setElapsedMs(activeMsRef.current);
      }
    };
    const sub = AppState.addEventListener("change", handle);
    return () => {
      sub.remove();
      fold();
    };
  }, [fold, resume]);

  const reset = useCallback(() => {
    activeMsRef.current = 0;
    activeSinceRef.current = Date.now();
    setElapsedMs(0);
  }, []);

  // Sync finished elapsed
  useEffect(() => {
    if (finishedAt !== null) {
      fold();
      setElapsedMs(activeMsRef.current);
    }
  }, [finishedAt, fold]);

  const elapsedSeconds = Math.max(0, Math.round(elapsedMs / 1000));
  return { elapsedMs, elapsedSeconds, reset };
}
