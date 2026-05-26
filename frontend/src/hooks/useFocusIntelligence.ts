import { useState, useEffect, useRef, useCallback } from 'react';
import { storage, safeParse, DEMO_USER_ID, FocusSessionLog } from '../utils/storage';

export type FocusStatus = 'inactive' | 'active' | 'paused' | 'idle' | 'distracted';

export const useFocusIntelligence = () => {
  const [status, setStatus] = useState<FocusStatus>('inactive');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [focusDuration, setFocusDuration] = useState(0);
  const [idleDuration, setIdleDuration] = useState(0);
  const [distractionCount, setDistractionCount] = useState(0);
  const [distractionDuration, setDistractionDuration] = useState(0);
  const [history, setHistory] = useState<FocusSessionLog[]>([]);

  // Refs for tracking mutable states inside intervals without causing re-renders
  const statusRef = useRef<FocusStatus>('inactive');
  const lastActivityRef = useRef<number>(Date.now());
  const blurTimeRef = useRef<number | null>(null);
  const startTimeRef = useRef<string | null>(null);
  const isBlurThresholdMetRef = useRef<boolean>(false);

  // Sync state ref
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Load history from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = storage.getItem('studiq_focus_history');
      if (stored) {
        setHistory(safeParse<FocusSessionLog[]>(stored, []));
      } else {
        const userStr = localStorage.getItem('studiq_user');
        let isDemoUser = false;
        if (userStr) {
          try {
            const u = JSON.parse(userStr);
            const userId = u?.id || u?._id;
            if (userId && userId === DEMO_USER_ID) {
              isDemoUser = true;
            }
          } catch (e) {}
        }

        if (isDemoUser) {
          // Seed default futuristic mock history so the charts look breathtaking immediately for new sessions
          const seedHistory: FocusSessionLog[] = [
            {
              id: 'focus-mock-1',
              createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
              completedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000 + 45 * 60 * 1000).toISOString(),
              startTime: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
              endTime: new Date(Date.now() - 4 * 24 * 3600 * 1000 + 45 * 60 * 1000).toISOString(),
              focusDuration: 2500,
              idleDuration: 120,
              distractionCount: 1,
              focusScore: 92,
            },
            {
              id: 'focus-mock-2',
              createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
              completedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 60 * 60 * 1000).toISOString(),
              startTime: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
              endTime: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 60 * 60 * 1000).toISOString(),
              focusDuration: 3200,
              idleDuration: 300,
              distractionCount: 4,
              focusScore: 78,
            },
            {
              id: 'focus-mock-3',
              createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
              completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 35 * 60 * 1000).toISOString(),
              startTime: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
              endTime: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 35 * 60 * 1000).toISOString(),
              focusDuration: 2000,
              idleDuration: 60,
              distractionCount: 0,
              focusScore: 98,
            },
            {
              id: 'focus-mock-4',
              createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
              completedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000 + 50 * 60 * 1000).toISOString(),
              startTime: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
              endTime: new Date(Date.now() - 1 * 24 * 3600 * 1000 + 50 * 60 * 1000).toISOString(),
              focusDuration: 2700,
              idleDuration: 180,
              distractionCount: 3,
              focusScore: 84,
            }
          ];
          storage.setItem('studiq_focus_history', JSON.stringify(seedHistory));
          setHistory(seedHistory);
        } else {
          storage.setItem('studiq_focus_history', JSON.stringify([]));
          setHistory([]);
        }
      }
    } catch (e) {
      console.error('Failed to parse focus history', e);
    }
  }, []);

  // Activity interaction monitor: Mouse Move & Key Down resets activity watchdogs
  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Resume to active status from idle state immediately
    if (statusRef.current === 'idle') {
      setStatus('active');
    }
  }, []);

  // Start deep focus session protocol
  const startSession = useCallback(() => {
    setElapsedSeconds(0);
    setFocusDuration(0);
    setIdleDuration(0);
    setDistractionCount(0);
    setDistractionDuration(0);
    
    lastActivityRef.current = Date.now();
    blurTimeRef.current = null;
    startTimeRef.current = new Date().toISOString();
    isBlurThresholdMetRef.current = false;
    
    setStatus('active');
  }, []);

  // Pause session protocol
  const pauseSession = useCallback(() => {
    if (statusRef.current === 'active' || statusRef.current === 'idle' || statusRef.current === 'distracted') {
      setStatus('paused');
    }
  }, []);

  // Resume session protocol
  const resumeSession = useCallback(() => {
    if (statusRef.current === 'paused') {
      lastActivityRef.current = Date.now();
      setStatus('active');
    }
  }, []);

  // Cancel session protocol without saving
  const cancelSession = useCallback(() => {
    setStatus('inactive');
  }, []);

  // Calculate focus score based on metrics
  const computeFocusScore = useCallback((fDuration: number, iDuration: number, dCount: number): number => {
    if (fDuration <= 0) return 0;
    const baseScore = 100;
    
    // Penalize distractions (tab switches) - 8% penalty each
    const distractionPenalty = dCount * 8;
    
    // Penalize idle states (1% penalty for every 15 seconds)
    const idlePenalty = Math.floor(iDuration / 15);
    
    // Compute efficiency ratio
    const totalSessionSeconds = fDuration + iDuration;
    const efficiencyRatio = fDuration / totalSessionSeconds;
    const ratioPenalty = Math.round((1 - efficiencyRatio) * 15);

    const finalScore = baseScore - distractionPenalty - idlePenalty - ratioPenalty;
    return Math.max(10, Math.min(100, finalScore));
  }, []);

  // Complete session protocol and commit to persistence store
  const completeSession = useCallback(() => {
    if (statusRef.current === 'inactive') return;

    const computedScore = computeFocusScore(focusDuration, idleDuration, distractionCount);
    
    const newSession: FocusSessionLog = {
      id: 'focus-' + Date.now(),
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      startTime: startTimeRef.current || new Date().toISOString(),
      endTime: new Date().toISOString(),
      focusDuration,
      idleDuration,
      distractionCount,
      focusScore: computedScore
    };

    setHistory((prev) => {
      const updated = [newSession, ...prev].slice(0, 100);
      storage.setItem('studiq_focus_history', JSON.stringify(updated));
      return updated;
    });

    setStatus('inactive');
  }, [focusDuration, idleDuration, distractionCount, computeFocusScore]);

  // Main system event handlers & time ticking engine
  useEffect(() => {
    if (status === 'inactive' || status === 'paused') return;

    // 1. Inactivity detection: keydown/mousemove watchdogs
    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });

    // 2. Tab switcher detection event handlers
    const handleTabHide = () => {
      if (document.hidden) {
        // Document invisible/backgrounded (mobile tab switch/minimizing)
        blurTimeRef.current = Date.now();
        isBlurThresholdMetRef.current = false;
      } else {
        // Tab restored
        handleReturnFromDistraction();
      }
    };

    const handleWindowBlur = () => {
      // Window blurred (user clicked onto another app on desktop)
      if (blurTimeRef.current === null) {
        blurTimeRef.current = Date.now();
        isBlurThresholdMetRef.current = false;
      }
    };

    const handleWindowFocus = () => {
      // Window focused again
      handleReturnFromDistraction();
    };

    const handleReturnFromDistraction = () => {
      if (blurTimeRef.current !== null) {
        const awayMs = Date.now() - blurTimeRef.current;
        
        // If threshold was met (i.e. they were away for > 3 seconds)
        if (isBlurThresholdMetRef.current) {
          const awaySec = Math.round(awayMs / 1000);
          setDistractionDuration((prev) => prev + awaySec);
        }
        
        // Reset watches
        blurTimeRef.current = null;
        isBlurThresholdMetRef.current = false;
        
        // Restore active focus status
        if (statusRef.current === 'distracted') {
          setStatus('active');
          lastActivityRef.current = Date.now();
        }
      }
    };

    document.addEventListener('visibilitychange', handleTabHide);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // 3. Ticking core stopwatch interval
    const intervalId = setInterval(() => {
      const currentStatus = statusRef.current;
      
      // Elapsed timer ticking
      setElapsedSeconds((prev) => prev + 1);

      // Check threshold logic for Tab blur
      if (blurTimeRef.current !== null) {
        const awaySeconds = (Date.now() - blurTimeRef.current) / 1000;
        
        // If away threshold exceeds 3 seconds (V1 Threshold protection!)
        if (awaySeconds >= 3 && !isBlurThresholdMetRef.current) {
          isBlurThresholdMetRef.current = true;
          setDistractionCount((prev) => prev + 1);
          setStatus('distracted');
        }
      }

      // Check Watchdog Inactivity (20 seconds of pure idle)
      if (currentStatus === 'active') {
        const secondsSinceInteraction = (Date.now() - lastActivityRef.current) / 1000;
        
        if (secondsSinceInteraction >= 20) {
          setStatus('idle');
        } else {
          setFocusDuration((prev) => prev + 1);
        }
      } else if (currentStatus === 'idle') {
        // Ensure screen lock or mobile browser sleep triggers are safe
        const secondsSinceInteraction = (Date.now() - lastActivityRef.current) / 1000;
        if (secondsSinceInteraction < 20) {
          setStatus('active');
          setFocusDuration((prev) => prev + 1);
        } else {
          setIdleDuration((prev) => prev + 1);
        }
      } else if (currentStatus === 'distracted') {
        // While distracted, count duration
        // Tab invisibility/blur increments absolute distraction time
      }
    }, 1000);

    // Cleanups to eliminate memory leaks and dangling watchdogs completely
    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('visibilitychange', handleTabHide);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(intervalId);
    };
  }, [status, handleUserActivity]);

  return {
    status,
    elapsedSeconds,
    focusDuration,
    idleDuration,
    distractionCount,
    distractionDuration,
    history,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession,
    completeSession,
    currentFocusScore: computeFocusScore(focusDuration, idleDuration, distractionCount),
  };
};
