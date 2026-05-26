// src/utils/focusIntelligenceEngine.ts
// Core heuristic analytics for focus pattern detection.
// All functions are pure and memoizable.

export interface StudySession {
  id: string;
  subjectId: string;
  startTime: Date; // ISO string parsed to Date
  durationMinutes: number;
  idleMinutes: number; // minutes of idle within session
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
  averageScore: number; // 0-100
  recentScoreTrend: number; // slope of recent scores
}

export interface FocusMetrics {
  focusConsistencyScore: number; // 0-100
  burnoutProbability: 'Stable' | 'Moderate' | 'Elevated' | 'High';
  subjectResistanceIndex: Record<string, number>; // per subject 0-100
  optimalFocusWindow: { startHour: number; endHour: number }; // 0-23
  attentionSpanEstimate: number; // minutes
  productivityDrift: number; // 0-100 (higher = drift)
  deepWorkStability: number; // 0-100
  focusRecoveryRate: number; // % per day
}

/** Helper to compute rolling average of an array of numbers */
const rollingAverage = (arr: number[], window: number): number => {
  if (arr.length === 0) return 0;
  const slice = arr.slice(-window);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / slice.length;
};

/** Compute focus consistency as average focus quality across recent sessions */
export const computeFocusConsistencyScore = (
  sessions: StudySession[],
  window = 5
): number => {
  const qualities = sessions.map((s) => {
    // quality = proportion of focused time (duration - idle) / duration
    const focused = Math.max(0, s.durationMinutes - s.idleMinutes);
    return s.durationMinutes > 0 ? focused / s.durationMinutes : 0;
  });
  const avg = rollingAverage(qualities, window);
  return Math.round(avg * 100);
};

/** Simple burnout heuristic based on weekly hours, idle ratio, and consistency decline */
export const computeBurnoutProbability = (
  sessions: StudySession[],
  consistencyScore: number
): 'Stable' | 'Moderate' | 'Elevated' | 'High' => {
  const weeklyHours = sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
  const idleRatio =
    sessions.reduce((sum, s) => sum + s.idleMinutes, 0) /
    sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  // Heuristic thresholds
  if (weeklyHours > 30 || idleRatio > 0.4) return 'High';
  if (weeklyHours > 22 || idleRatio > 0.3) return 'Elevated';
  if (weeklyHours > 15 || consistencyScore < 40) return 'Moderate';
  return 'Stable';
};

/** Compute subject resistance – longer average session durations or many incomplete tasks */
export const computeSubjectResistanceIndex = (
  sessions: StudySession[],
  tasks: TaskLog[]
): Record<string, number> => {
  const sessionMap: Record<string, number[]> = {};
  sessions.forEach((s) => {
    if (!sessionMap[s.subjectId]) sessionMap[s.subjectId] = [];
    sessionMap[s.subjectId].push(s.durationMinutes);
  });
  const resistance: Record<string, number> = {};
  Object.entries(sessionMap).forEach(([subjectId, durations]) => {
    const avgDur = durations.reduce((a, b) => a + b, 0) / durations.length;
    const incompleteTasks = tasks.filter((t) => t.subjectId === subjectId && !t.completed).length;
    // Normalize to 0-100 where higher means more resistance (harder)
    const score = Math.min(100, Math.round((avgDur / 60) * 30 + incompleteTasks * 5));
    resistance[subjectId] = score;
  });
  return resistance;
};

/** Determine optimal focus window based on start hours of high‑quality sessions */
export const computeOptimalFocusWindow = (
  sessions: StudySession[],
  windowHours = 2
): { startHour: number; endHour: number } => {
  // Bin sessions by hour of day
  const hourBins: Record<number, number[]> = {};
  sessions.forEach((s) => {
    if (!s || !s.startTime) return;
    const dateObj = typeof s.startTime.getHours === 'function' ? s.startTime : new Date(s.startTime);
    if (isNaN(dateObj.getTime())) return;
    const hour = dateObj.getHours();
    const quality = s.durationMinutes > 0 ? (s.durationMinutes - s.idleMinutes) / s.durationMinutes : 0;
    if (!hourBins[hour]) hourBins[hour] = [];
    hourBins[hour].push(quality);
  });

  // Compute average quality per hour
  const hourScores = Object.entries(hourBins).map(([hourStr, quals]) => {
    const avg = quals.reduce((a, b) => a + b, 0) / quals.length;
    return { hour: parseInt(hourStr, 10), score: avg };
  });
  // Sort by score descending and take top contiguous window
  hourScores.sort((a, b) => b.score - a.score);
  const topHours = hourScores.slice(0, windowHours).map((h) => h.hour).sort((a, b) => a - b);
  const startHour = topHours[0];
  const endHour = topHours[topHours.length - 1] + 1; // exclusive end
  return { startHour, endHour };
};

/** Estimate attention span as average uninterrupted focus block length */
export const estimateAttentionSpan = (sessions: StudySession[]): number => {
  const spans = sessions.map((s) => s.durationMinutes - s.idleMinutes);
  if (spans.length === 0) return 0;
  const avg = spans.reduce((a, b) => a + b, 0) / spans.length;
  // Round to nearest 5 minutes for UI friendliness
  return Math.round(avg / 5) * 5;
};

/** Detect productivity drift – decline in completed tasks per day */
export const detectProductivityDrift = (
  tasks: TaskLog[],
  days = 7
): number => {
  // Group tasks by day (based on deadline)
  const today = new Date();
  const dayCounts: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const count = tasks.filter(
      (t) => t.completed && Math.abs(t.deadline.getTime() - day.getTime()) < 24 * 60 * 60 * 1000
    ).length;
    dayCounts.push(count);
  }
  // Simple linear regression slope (last minus first) normalized
  const diff = dayCounts[dayCounts.length - 1] - dayCounts[0];
  const drift = diff / days; // negative means decline
  // Convert to 0-100 where higher = more drift (decline)
  const score = Math.max(0, Math.min(100, Math.round((-drift / Math.max(1, dayCounts[0] || 1)) * 100)));
  return score;
};

/** Deep‑work stability – proportion of sessions longer than attention span */
export const computeDeepWorkStability = (
  sessions: StudySession[],
  attentionSpan: number
): number => {
  if (sessions.length === 0) return 0;
  const deepCount = sessions.filter((s) => s.durationMinutes - s.idleMinutes >= attentionSpan).length;
  return Math.round((deepCount / sessions.length) * 100);
};

/** Focus recovery rate – improvement of consistency score day over day */
export const computeFocusRecoveryRate = (
  dailyConsistency: number[] // ordered newest to oldest
): number => {
  if (dailyConsistency.length < 2) return 0;
  const diffs = [] as number[];
  for (let i = 0; i < dailyConsistency.length - 1; i++) {
    diffs.push(dailyConsistency[i] - dailyConsistency[i + 1]);
  }
  const avgGain = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return Math.round(avgGain * 100);
};

/** Aggregate all metrics into a single object */
export const computeAllMetrics = (
  sessions: StudySession[],
  tasks: TaskLog[],
  attendance: AttendanceRecord[],
  performances: SubjectPerformance[]
): FocusMetrics => {
  const focusConsistencyScore = computeFocusConsistencyScore(sessions);
  const burnoutProbability = computeBurnoutProbability(sessions, focusConsistencyScore);
  const subjectResistanceIndex = computeSubjectResistanceIndex(sessions, tasks);
  const optimalFocusWindow = computeOptimalFocusWindow(sessions);
  const attentionSpanEstimate = estimateAttentionSpan(sessions);
  const productivityDrift = detectProductivityDrift(tasks);
  const deepWorkStability = computeDeepWorkStability(sessions, attentionSpanEstimate);
  const focusRecoveryRate = computeFocusRecoveryRate([focusConsistencyScore]); // placeholder single value
  return {
    focusConsistencyScore,
    burnoutProbability,
    subjectResistanceIndex,
    optimalFocusWindow,
    attentionSpanEstimate,
    productivityDrift,
    deepWorkStability,
    focusRecoveryRate,
  };
};
