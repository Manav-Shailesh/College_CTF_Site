
import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';

import request from '../api/client.js';

export const TimerContext = createContext();

const initialTimerState = {
  state: 'NOT_STARTED',
  isRunning: false,
  isPaused: false,
  elapsedMs: 0,
  startedAt: null,
  stoppedAt: null,

  // Current competition information
  sessionId: null,
  sessionNumber: null,
  sessionName: null,
  hasSession: false
};

export function TimerProvider({ children }) {
  const [timerState, setTimerState] = useState(initialTimerState);

  const requestInProgress = useRef(false);

  const refreshTimer = useCallback(async () => {
    if (requestInProgress.current) return;

    requestInProgress.current = true;

    try {
      const data = await request('/sessions/current');

      const currentSession = data.session;

      if (!currentSession) {
        setTimerState(initialTimerState);
        return data;
      }

      setTimerState({
        state: currentSession.state,
        isRunning: currentSession.state === 'RUNNING',
        isPaused: false,
        elapsedMs: currentSession.elapsedMs || 0,
        startedAt: currentSession.startedAt,
        stoppedAt: currentSession.stoppedAt,

        sessionId: currentSession._id,
        sessionNumber: currentSession.sessionNumber,
        sessionName: currentSession.name,
        hasSession: true
      });

      return data;

    } catch (err) {
      console.error('Session timer fetch error:', err);
      throw err;

    } finally {
      requestInProgress.current = false;
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
