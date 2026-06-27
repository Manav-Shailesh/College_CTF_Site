import { createContext, useState, useEffect } from 'react';
import { request } from '../api/client.js';

export const TimerContext = createContext();

export function TimerProvider({ children }) {
  const [timerState, setTimerState] = useState({
    isRunning: false,
    isPaused: false,
    elapsedMs: 0,
    startTime: null
  });

  // Poll timer every second
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await request('/flags/timer');
        setTimerState({
          isRunning: data.isRunning,
          isPaused: data.isPaused,
          elapsedMs: data.elapsedMs,
          startTime: data.startTime
        });
      } catch (err) {
        console.error('Timer fetch error:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TimerContext.Provider value={timerState}>
      {children}
    </TimerContext.Provider>
  );
}