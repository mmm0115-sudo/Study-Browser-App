import { useCallback, useEffect, useRef, useState } from "react";

export type TimerStatus = "idle" | "running" | "paused";

interface PersistedState {
  status: TimerStatus;
  goalSeconds: number;
  label: string;
  accumulatedMs: number;
  segmentStart: number | null; // 現在動いている区間の開始時刻(epoch ms)
  sessionStartedAt: number | null;
}

const STORAGE_KEY = "studyquest.timer.v1";

const initial: PersistedState = {
  status: "idle",
  goalSeconds: 25 * 60,
  label: "",
  accumulatedMs: 0,
  segmentStart: null,
  sessionStartedAt: null,
};

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as PersistedState;
    return { ...initial, ...parsed };
  } catch {
    return initial;
  }
}

/**
 * 経過時間を Date.now() の差分から計算するタイマー。
 * タブが非アクティブでも正確で、リロードしても状態を復元する。
 */
export function useStudyTimer() {
  const [state, setState] = useState<PersistedState>(load);
  const [, forceTick] = useState(0);
  const rafRef = useRef<number | null>(null);

  // 永続化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // 動作中のみ表示を更新（250msごと）
  useEffect(() => {
    if (state.status !== "running") return;
    const id = window.setInterval(() => forceTick((n) => n + 1), 250);
    return () => window.clearInterval(id);
  }, [state.status]);

  // タブ復帰時に即時更新
  useEffect(() => {
    const onVisible = () => forceTick((n) => n + 1);
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const elapsedMs =
    state.accumulatedMs +
    (state.status === "running" && state.segmentStart
      ? Date.now() - state.segmentStart
      : 0);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  const start = useCallback((goalSeconds: number, label: string) => {
    setState({
      status: "running",
      goalSeconds,
      label,
      accumulatedMs: 0,
      segmentStart: Date.now(),
      sessionStartedAt: Date.now(),
    });
  }, []);

  const pause = useCallback(() => {
    setState((s) => {
      if (s.status !== "running" || !s.segmentStart) return s;
      return {
        ...s,
        status: "paused",
        accumulatedMs: s.accumulatedMs + (Date.now() - s.segmentStart),
        segmentStart: null,
      };
    });
  }, []);

  const resume = useCallback(() => {
    setState((s) => {
      if (s.status !== "paused") return s;
      return { ...s, status: "running", segmentStart: Date.now() };
    });
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({ ...initial, goalSeconds: s.goalSeconds, label: s.label }));
  }, []);

  const setGoal = useCallback((goalSeconds: number) => {
    setState((s) => (s.status === "idle" ? { ...s, goalSeconds } : s));
  }, []);

  const setLabel = useCallback((label: string) => {
    setState((s) => ({ ...s, label }));
  }, []);

  const extendGoal = useCallback((seconds: number) => {
    setState((s) => ({
      ...s,
      goalSeconds: Math.min(4 * 60 * 60, s.goalSeconds + Math.max(0, seconds)),
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    status: state.status,
    goalSeconds: state.goalSeconds,
    label: state.label,
    elapsedSeconds,
    sessionStartedAt: state.sessionStartedAt,
    start,
    pause,
    resume,
    reset,
    setGoal,
    setLabel,
    extendGoal,
  };
}
