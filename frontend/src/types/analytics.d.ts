// src/types/analytics.d.ts
// Central type definitions for the AI Focus Intelligence Engine.

export interface StudySession {
  id: string;
  subjectId: string;
  startTime: Date;
  durationMinutes: number;
  idleMinutes: number;
}

export interface TaskLog {
  id: string;
  subjectId: string;
  completed: boolean;
  effortMinutes: number;
  deadline: Date;
}

export interface AttendanceRecord {
  subjectId: string;
  attendedSessions: number;
  totalSessions: number;
}

export interface SubjectPerformance {
  subjectId: string;
  averageScore: number;
  recentScoreTrend: number;
}

export interface FocusMetrics {
  focusConsistencyScore: number; // 0-100
  burnoutProbability: 'Stable' | 'Moderate' | 'Elevated' | 'High';
  subjectResistanceIndex: Record<string, number>; // per subject 0-100
  optimalFocusWindow: { startHour: number; endHour: number };
  attentionSpanEstimate: number; // minutes
  productivityDrift: number; // 0-100
  deepWorkStability: number; // 0-100
  focusRecoveryRate: number; // % per day
}
