// src/utils/productivityPredictor.ts
// Predictive analytics for productivity drift and assignment completion trends.

import { TaskLog, StudySession } from './focusIntelligenceEngine';

/**
 * Estimate assignment completion probability based on recent task completion rate
 * and focus consistency.
 */
export const estimateCompletionProbability = (
  tasks: TaskLog[],
  recentConsistency: number // 0-100
): number => {
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const baseRate = total ? completed / total : 0;
  // Adjust by consistency (higher consistency boosts probability)
  const adjusted = baseRate * (0.5 + recentConsistency / 200); // scale 0.5-1
  return Math.round(adjusted * 100);
};

/**
 * Predict upcoming productivity decline based on task backlog growth and
 * decreasing focus consistency over the last N days.
 */
export const predictProductivityDecline = (
  tasks: TaskLog[],
  dailyConsistency: number[] // newest to oldest
): { declineScore: number; message: string } => {
  const backlogGrowth = tasks.filter(t => !t.completed).length;
  const consistencyTrend = dailyConsistency.length >= 2 ? dailyConsistency[0] - dailyConsistency[1] : 0;
  // Simple heuristic: higher backlog and falling consistency increase declineScore
  const score = Math.min(100, Math.round((backlogGrowth * 5 + Math.max(0, -consistencyTrend) * 3)));
  let message = 'Productivity is stable.';
  if (score > 70) message = 'High risk of productivity decline detected.';
  else if (score > 40) message = 'Moderate risk of productivity drift.';
  return { declineScore: score, message };
};

/**
 * Aggregate productivity predictions into a single object.
 */
export const computeProductivityInsights = (
  tasks: TaskLog[],
  sessions: StudySession[],
  consistencyScore: number,
  dailyConsistency: number[]
) => {
  const completionProb = estimateCompletionProbability(tasks, consistencyScore);
  const { declineScore, message } = predictProductivityDecline(tasks, dailyConsistency);
  return { completionProb, declineScore, message };
};
