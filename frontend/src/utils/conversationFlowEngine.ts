import { FlowType, ExtractedParams } from './conversationParameterResolver';
export type ActiveQuestion =
  | 'subject'
  | 'durationDays'
  | 'dailyHours'
  | 'weakTopics'
  | 'targetAttendance'
  | 'conceptName'
  | 'depth';

export type GenerationState = 'idle' | 'collecting' | 'generating' | 'completed' | 'error';

export interface FlowState {
  subject?: string;
  subjectName?: string;
  durationDays?: number;
  dailyHours?: number;
  targetPercent?: number;
  conceptName?: string;
  depth?: 'simple' | 'summary' | 'code';
  subjectScope?: 'single' | 'multi_subject';
  subjectResolved?: boolean;
  attempts?: Record<string, number>;
  activeQuestion?: ActiveQuestion;
}
/** Get the strictly sequential active question being asked for a given flow and state */
export const getActiveQuestion = (flow: FlowType, state: FlowState): ActiveQuestion | null => {
  switch (flow) {
    case 'exam_plan':
      if (!state.subject) return 'subject';
      if (!state.durationDays) return 'durationDays';
      if (!state.dailyHours) return 'dailyHours';
      return null;

    case 'attendance_help':
      if (!state.subject) return 'subject';
      return null;

    case 'topic_explanation':
      if (!state.conceptName) return 'conceptName';
      if (!state.depth) return 'depth';
      return null;

    case 'study_schedule':
      if (!state.dailyHours) return 'dailyHours';
      return null;

    default:
      return null;
  }
};

/** Check if all mandatory variables for a specific flow are populated */
export const isFlowComplete = (flow: FlowType, state: FlowState): boolean => {
  switch (flow) {
    case 'exam_plan':
      return !!state.subject && !!state.durationDays && !!state.dailyHours;
    case 'attendance_help':
      return !!state.subject;
    case 'topic_explanation':
      return !!state.conceptName;
    case 'study_schedule':
      return !!state.dailyHours;
    case 'sgpa_guidance':
    case 'productivity_help':
      return true; // Simple heuristics that can fire immediately
    default:
      return true;
  }
};

/** Get the next friendly, natural follow-up question for the user */
export const getNextQuestion = (
  flow: FlowType,
  state: FlowState,
  workspaceSubjects: Array<{ id: string; name: string }>
): string => {
  const attempts = state.attempts || {};

  switch (flow) {
    case 'exam_plan':
      if (!state.subject) {
        if ((attempts.subject || 0) >= 2) {
          // Automatic conversational fallback to all subjects
          state.subject = 'all';
          state.subjectName = 'All Subjects';
          state.subjectScope = 'multi_subject';
          state.subjectResolved = true;
          return `Got it — you're preparing for multiple subjects.\n\nHow many days do we have until your exams?`;
        }
        return 'Which course or subject is this study plan for?';
      }
      if (!state.durationDays) {
        if ((attempts.durationDays || 0) >= 2) {
          // Automatic fallback to 5 days
          state.durationDays = 5;
          return `No problem, let's assume a standard 5-day lead time.\n\nHow many hours can you study daily?`;
        }
        return `Got it — ${state.subjectName || state.subject}. How many days do we have until your exam?`;
      }
      if (!state.dailyHours) {
        if ((attempts.dailyHours || 0) >= 2) {
          // Automatic fallback to 4 hours
          state.dailyHours = 4;
          return `Got it — let's budget a standard 4 hours daily. Creating your plan...`;
        }
        return `Understood, ${state.durationDays} days. How many hours can you study daily?`;
      }
      return '';

    case 'attendance_help':
      if (!state.subject) {
        if ((attempts.subject || 0) >= 2 && workspaceSubjects.length > 0) {
          state.subject = workspaceSubjects[0].id;
          state.subjectName = workspaceSubjects[0].name;
          return `Got it — let's focus on ${state.subjectName} to start. Calculating attendance buffer...`;
        }
        if (workspaceSubjects.length === 0) {
          return 'I can calculate your attendance buffer, but you haven\'t registered any subjects yet. Please add a subject first!';
        }
        return 'Which subject\'s attendance recovery would you like to calculate?';
      }
      return '';

    case 'topic_explanation':
      if (!state.conceptName) {
        if ((attempts.conceptName || 0) >= 2) {
          state.conceptName = 'Deadlocks';
          return `Let's explain Deadlocks as a fundamental concept.\n\nWould you prefer a simple analogy, an exam summary, or a code example?`;
        }
        return 'Which concept would you like me to explain? (e.g., Deadlocks, Normalization, Recursion, or Stacks & Queues)';
      }
      if (!state.depth) {
        if ((attempts.depth || 0) >= 2) {
          state.depth = 'simple';
          return `Let's start with a simple analogy...`;
        }
        return `I can explain ${state.conceptName.toUpperCase()}. Would you prefer a simple analogy, an exam summary, or a code example?`;
      }
      return '';

    case 'study_schedule':
      if (!state.dailyHours) {
        if ((attempts.dailyHours || 0) >= 2) {
          state.dailyHours = 4;
          return `Let's aim for a standard 4 hours daily to maintain high performance.`;
        }
        return 'How many hours are you aiming to study daily?';
      }
      return '';

    default:
      return '';
  }
};

/** Return context action chips dynamically based on the current flow status */
export const getContextualChips = (
  flow: FlowType,
  state: FlowState,
  workspaceSubjects: Array<{ id: string; name: string }>
): string[] => {
  switch (flow) {
    case 'exam_plan':
      if (!state.subject) {
        // Offer quick subject choices from their actual subjects
        return workspaceSubjects.slice(0, 3).map(s => s.name);
      }
      if (!state.durationDays) {
        return ['3 Days Sprint', '5 Days Focus', '12 Days Extensive'];
      }
      if (!state.dailyHours) {
        return ['2 Hours', '4 Hours', '6 Hours'];
      }
      return ['5-Day Intensive', 'Pomodoro Format', 'Focus Weak Topics'];

    case 'attendance_help':
      if (!state.subject) {
        return workspaceSubjects.slice(0, 3).map(s => s.name);
      }
      return ['Recovery Strategy', 'Attendance Calculator', 'Safe Bunk Estimate'];

    case 'topic_explanation':
      if (!state.conceptName) {
        return ['Explain Deadlocks', 'Explain Normalization', 'Explain Recursion'];
      }
      return ['Simple Explanation', 'Exam-Oriented Summary', 'Code Example'];

    case 'study_schedule':
      return ['2 Hours a Day', '4 Hours a Day', 'Standard Pomodoro Block'];

    case 'sgpa_guidance':
      return ['Review Target settings', 'Attendance Buffer Link', 'SGPA What-If Calculator'];

    case 'productivity_help':
      return ['Start Focus Timer', 'Burnout Recovery Tips', 'Focus Friction Radar'];

    default:
      return [];
  }
};
