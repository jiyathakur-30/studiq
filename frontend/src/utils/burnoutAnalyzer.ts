// src/utils/burnoutAnalyzer.ts
// Simple burnout analysis based on focus metrics.

import { FocusMetrics } from './focusIntelligenceEngine';

/**
 * Returns a human‑readable explanation for the current burnout level.
 */
export const burnoutExplanation = (metrics: FocusMetrics): string => {
  const { burnoutProbability, focusConsistencyScore, attentionSpanEstimate } = metrics;
  const reasons: string[] = [];
  if (burnoutProbability === 'High' || burnoutProbability === 'Elevated') {
    reasons.push('Weekly study hours are high');
    reasons.push('Idle time proportion is elevated');
  }
  if (focusConsistencyScore < 50) {
    reasons.push('Focus consistency has dropped');
  }
  if (attentionSpanEstimate < 30) {
    reasons.push('Average uninterrupted focus span is short');
  }
  const reasonList = reasons.length ? reasons.map(r => `• ${r}`).join('\n') : 'No strong risk factors detected.';
  return `Burnout Risk: ${burnoutProbability}\n${reasonList}`;
};

/**
 * Suggest a recovery recommendation based on burnout level.
 */
export const burnoutRecoverySuggestion = (metrics: FocusMetrics): string => {
  switch (metrics.burnoutProbability) {
    case 'High':
      return 'Consider a light study day tomorrow with extended rest breaks.';
    case 'Elevated':
      return 'Insert additional recovery gaps and reduce session intensity.';
    case 'Moderate':
      return 'Maintain current schedule but monitor idle ratios.';
    default:
      return 'Continue with current plan; risk is stable.';
  }
};
