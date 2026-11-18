
import { createContext, useState, useEffect, useCallback } from 'react';
import request from '../api/client.js';

export const TimerContext = createContext();

export function TimerProvider({ children }) {
  const [timerState, setTimerState] = useState({
    state: 'NOT_STARTED',
    isRunning: false,
    isPaused: false,
    elapsedMs: 0,
    startedAt: null,
    stoppedAt: null
  });

  const refreshTimer = useCallback(async () => {
    try {
      const data = await request('/flags/timer');

      setTimerState({
        state: data.state,
        isRunning: data.state === 'RUNNING',
        isPaused: false,
        elapsedMs: data.elapsedMs,
        startedAt: data.startedAt,
        stoppedAt: data.stoppedAt
      });

      return data;
    } catch (err) {
      console.error('Timer fetch error:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    refreshTimer().catch(() => {});

    const interval = setInterval(() => {
      refreshTimer().catch(() => {});
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshTimer]);

  return (
    <TimerContext.Provider
      value={{
        ...timerState,
        refreshTimer
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}
