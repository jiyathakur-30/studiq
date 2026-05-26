// src/context/FocusAnalyticsContext.tsx
import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useAppStore } from './store';
import {
  computeAllMetrics,
  FocusMetrics,
  StudySession,
  TaskLog,
  AttendanceRecord,
  SubjectPerformance,
} from '../utils/focusIntelligenceEngine';
import { burnoutExplanation, burnoutRecoverySuggestion } from '../utils/burnoutAnalyzer';
import { computeProductivityInsights } from '../utils/productivityPredictor';

// Types for context value
export interface FocusAnalyticsContextValue {
  // Nested compatibility fields
  metrics: FocusMetrics | null;
  burnoutExplanation: string | null;
  burnoutSuggestion: string | null;
  productivityInsights: {
    completionProb: number;
    declineScore: number;
    message: string;
  } | null;

  // Flat root-level metrics (Phase 2 requirement)
  focusConsistencyScore: number;
  burnoutRisk: 'Stable' | 'Moderate' | 'Elevated' | 'High';
  subjectResistance: Record<string, number>;
  optimalFocusWindow: { startHour: number; endHour: number };
  attentionSpan: number;
  productivityDrift: number;
  deepWorkStability: number;
  focusRecoveryRate: number;
  adaptivePomodoroCycle: string;
  adaptivePomodoroExplanation: string;
  behavioralInsights: string[];
}

const FocusAnalyticsContext = createContext<FocusAnalyticsContextValue | undefined>(undefined);

export const FocusAnalyticsProvider = ({ children }: { children: ReactNode }) => {
  // Pull raw data from the global zustand store
  const rawSessions = useAppStore((s) => s.studySessions) || [];
  const rawAssignments = useAppStore((s) => s.assignments) || [];
  const rawAttendance = useAppStore((s) => s.attendance) || [];

  // Transform rawSessions to match StudySession in focusIntelligenceEngine.ts
  const studySessions = useMemo<StudySession[]>(() => {
    return rawSessions.map((s: any) => ({
      id: s.id,
      subjectId: s.subjectId || '',
      startTime: s.date ? new Date(s.date) : new Date(),
      durationMinutes: s.durationMinutes || 0,
      idleMinutes: s.idleMinutes || 0,
    }));
  }, [rawSessions]);

  // Transform rawAssignments to match TaskLog in focusIntelligenceEngine.ts
  const assignments = useMemo<TaskLog[]>(() => {
    return rawAssignments.map((a: any) => ({
      id: a.id,
      subjectId: a.subjectId || '',
      completed: a.status === 'done',
      effortMinutes: a.status === 'done' ? 45 : 15,
      deadline: a.dueDate ? new Date(a.dueDate) : new Date(),
    }));
  }, [rawAssignments]);

  // Transform rawAttendance to match AttendanceRecord in focusIntelligenceEngine.ts
  const attendance = useMemo<AttendanceRecord[]>(() => {
    return rawAttendance.map((att: any) => {
      const recordsList = att.records || [];
      const total = recordsList.filter((r: any) => r.status !== 'cancelled').length;
      const attended = recordsList.filter((r: any) => r.status === 'attended').length;
      return {
        subjectId: att.subjectId,
        attendedSessions: attended,
        totalSessions: total,
      };
    });
  }, [rawAttendance]);

  // Subject performance is not stored yet – fallback to empty array
  const subjectPerformance = [] as SubjectPerformance[];


  // Memoize the ENTIRE exposed context value under a single hook to prevent redundant consumer rerenders
  const value = useMemo<FocusAnalyticsContextValue>(() => {
    if (!studySessions?.length) {
      return {
        metrics: null,
        burnoutExplanation: null,
        burnoutSuggestion: null,
        productivityInsights: null,

        focusConsistencyScore: 0,
        burnoutRisk: 'Stable',
        subjectResistance: {},
        optimalFocusWindow: { startHour: 9, endHour: 11 },
        attentionSpan: 25,
        productivityDrift: 0,
        deepWorkStability: 0,
        focusRecoveryRate: 0,

        adaptivePomodoroCycle: '25/5',
        adaptivePomodoroExplanation: 'Standard Pomodoro interval.',
        behavioralInsights: [],
      };
    }

    const metrics = computeAllMetrics(studySessions, assignments, attendance, subjectPerformance);
    const burnoutExp = burnoutExplanation(metrics);
    const burnoutSug = burnoutRecoverySuggestion(metrics);
    const productivity = computeProductivityInsights(
      assignments,
      studySessions,
      metrics.focusConsistencyScore,
      [metrics.focusConsistencyScore] // simple placeholder for daily consistency trend
    );

    // Adaptive pomodoro logic – simple heuristic
    let pomodoro = '25/5';
    let explanation = 'Standard Pomodoro interval.';
    if (metrics.attentionSpanEstimate >= 45 && metrics.burnoutProbability === 'Stable') {
      pomodoro = '45/15';
      explanation = 'Longer focus span and low fatigue – extended work block.';
    } else if (metrics.attentionSpanEstimate >= 35 && metrics.burnoutProbability !== 'High') {
      pomodoro = '35/10';
      explanation = 'Balanced cycle matching attention span and moderate fatigue.';
    } else if (metrics.burnoutProbability === 'Elevated' || metrics.burnoutProbability === 'High') {
      pomodoro = '20/10';
      explanation = 'Shorter work periods to aid recovery from fatigue indicators.';
    }

    // Simple behavioral insights generation
    const insights: string[] = [];
    const { optimalFocusWindow, attentionSpanEstimate, burnoutProbability } = metrics;
    insights.push(
      `Your strongest focus window is ${optimalFocusWindow.startHour}:00‑${optimalFocusWindow.endHour}:00.`
    );
    insights.push(`Average uninterrupted focus span is about ${attentionSpanEstimate} min.`);
    if (burnoutProbability !== 'Stable') {
      insights.push('Consider incorporating recovery gaps to avoid fatigue accumulation.');
    }

    return {
      metrics,
      burnoutExplanation: burnoutExp,
      burnoutSuggestion: burnoutSug,
      productivityInsights: productivity,

      focusConsistencyScore: metrics.focusConsistencyScore,
      burnoutRisk: metrics.burnoutProbability,
      subjectResistance: metrics.subjectResistanceIndex,
      optimalFocusWindow: metrics.optimalFocusWindow,
      attentionSpan: metrics.attentionSpanEstimate,
      productivityDrift: metrics.productivityDrift,
      deepWorkStability: metrics.deepWorkStability,
      focusRecoveryRate: metrics.focusRecoveryRate,

      adaptivePomodoroCycle: pomodoro,
      adaptivePomodoroExplanation: explanation,
      behavioralInsights: insights,
    };
  }, [studySessions, assignments, attendance]);

  // Persist metrics updates to localStorage for persistence across reloads
  useEffect(() => {
    if (value.metrics) {
      try {
        const payload = {
          metrics: value.metrics,
          adaptivePomodoroCycle: value.adaptivePomodoroCycle,
          behavioralInsights: value.behavioralInsights,
        };
        localStorage.setItem('studiq_focus_analytics', JSON.stringify(payload));
      } catch (e) {
        // ignore storage errors in offline mode
      }
    }
  }, [value]);

  return (
    <FocusAnalyticsContext.Provider value={value}>
      {children}
    </FocusAnalyticsContext.Provider>
  );
};

// Hook for consumers
export const useFocusAnalytics = () => {
  const ctx = useContext(FocusAnalyticsContext);
  if (ctx === undefined) {
    throw new Error('useFocusAnalytics must be used within a FocusAnalyticsProvider');
  }
  return ctx;
};
