/**
 * Pure heuristic NLP parameter extractor for STUDIQ AI Coach.
 * Extracts intent, subjects, durations, hours, and targets from user inputs.
 */

export type FlowType =
  | 'exam_plan'
  | 'attendance_help'
  | 'topic_explanation'
  | 'study_schedule'
  | 'sgpa_guidance'
  | 'productivity_help';

export interface ExtractedParams {
  intent?: FlowType;
  subject?: string; // Subject ID or free-text name
  subjectName?: string; // Display name
  durationDays?: number;
  dailyHours?: number;
  targetPercent?: number;
  conceptName?: string;
  depth?: 'simple' | 'summary' | 'code';
  subjectScope?: 'single' | 'multi_subject';
  subjectResolved?: boolean;
}

/** Match subject from search string against workspace registered subjects */
export const matchWorkspaceSubject = (
  text: string,
  workspaceSubjects: Array<{ id: string; name: string; code: string }>
): { id: string; name: string } | null => {
  const lowerText = text.toLowerCase();
  
  for (const sub of workspaceSubjects) {
    const nameLower = sub.name.toLowerCase();
    const codeLower = sub.code.toLowerCase();
    
    // Check for direct substring matches
    if (
      lowerText.includes(nameLower) ||
      nameLower.includes(lowerText) ||
      lowerText.includes(codeLower)
    ) {
      return { id: sub.id, name: sub.name };
    }
  }

  // Soft common subjects matchers if name doesn't match perfectly
  const commonSubjects = ['physics', 'chemistry', 'maths', 'mathematics', 'computer', 'systems', 'dbms', 'database', 'algorithms', 'structures'];
  for (const term of commonSubjects) {
    if (lowerText.includes(term)) {
      // Find workspace subject containing this term
      const matched = workspaceSubjects.find(s => s.name.toLowerCase().includes(term));
      if (matched) {
        return { id: matched.id, name: matched.name };
      }
    }
  }
  
  return null;
};

/** Helper to match fuzzy conversational multi-subject intent */
const matchesMultiSubjectIntent = (q: string): boolean => {
  const multiSubjectPatterns = [
    "all",
    "all subjects",
    "every subject",
    "multiple subjects",
    "all courses",
    "everything",
    "all my exams",
    "exams are coming up so for all the subjects",
    "all the subjects"
  ];
  return multiSubjectPatterns.some(pattern => q === pattern || q.includes(pattern));
};

/** Extract parameters from partial user messages */
export const extractParameters = (
  input: string,
  workspaceSubjects: Array<{ id: string; name: string; code: string }> = [],
  activeQuestion?: string | null
): ExtractedParams => {
  const q = input.toLowerCase().trim();
  const params: ExtractedParams = {};

  // 1. Intent Detection - always runs to allow "Silent Flow Recovery" (switching intents)
  if (q.includes('roadmap') || q.includes('exam') || q.includes('test') || q.includes('revision') || q.includes('plan')) {
    params.intent = 'exam_plan';
  } else if (q.includes('attendance') || q.includes('absent') || q.includes('bunk') || q.includes('present') || q.includes('class')) {
    params.intent = 'attendance_help';
  } else if (q.includes('explain') || q.includes('concept') || q.includes('deadlock') || q.includes('normalization') || q.includes('recursion') || q.includes('stack') || q.includes('queue') || q.includes('difference')) {
    params.intent = 'topic_explanation';
  } else if (q.includes('schedule') || q.includes('routine') || q.includes('hours') || q.includes('available')) {
    params.intent = 'study_schedule';
  } else if (q.includes('gpa') || q.includes('sgpa') || q.includes('cgpa') || q.includes('forecast') || q.includes('marksheet')) {
    params.intent = 'sgpa_guidance';
  } else if (q.includes('productivity') || q.includes('burnout') || q.includes('focus') || q.includes('timer') || q.includes('pomodoro') || q.includes('fatigue')) {
    params.intent = 'productivity_help';
  }

  // Debug lock log
  console.log("extractParameters lock status:", { activeQuestion, detectedIntent: params.intent });

  // 2. Active Question Lock / Selective Parsing
  // If we have an active question, we only parse that specific parameter to avoid field assignment collision.
  // Exception: If a new intent is detected in the input, we bypass the lock to allow silent flow recovery/intent switching!
  if (activeQuestion && !params.intent) {
    if (activeQuestion === 'durationDays') {
      const daysMatch = q.match(/(\d+)\s*(?:day|days)/);
      if (daysMatch) {
        params.durationDays = parseInt(daysMatch[1], 10);
      } else if (q.includes('next week')) {
        params.durationDays = 7;
      } else if (q.includes('few days') || q.includes('couple of days')) {
        params.durationDays = 3;
      } else if (q.includes('tomorrow')) {
        params.durationDays = 1;
      } else if (q.includes('this weekend')) {
        params.durationDays = 2;
      } else if (q.includes('soon')) {
        params.durationDays = 5;
      } else if (q.includes('next month')) {
        params.durationDays = 30;
      } else {
        const rawNumberMatch = q.match(/^(\d+)$/);
        if (rawNumberMatch) {
          params.durationDays = parseInt(rawNumberMatch[1], 10);
        }
      }
      return params;
    }

    if (activeQuestion === 'dailyHours') {
      const hoursMatch = q.match(/(\d+)\s*(?:hour|hours|h)\s*(?:daily|a day|day)?/);
      if (hoursMatch) {
        params.dailyHours = parseInt(hoursMatch[1], 10);
      } else if (q.includes('few hours') || q.includes('a couple of hours') || q.includes('some hours')) {
        params.dailyHours = 3;
      } else if (q.includes('a lot') || q.includes('intense') || q.includes('maximum') || q.includes('all day')) {
        params.dailyHours = 6;
      } else if (q.includes('little') || q.includes('low') || q.includes('minimal') || q.includes('hardly')) {
        params.dailyHours = 2;
      } else if (q.includes('standard') || q.includes('medium') || q.includes('normal') || q.includes('average')) {
        params.dailyHours = 4;
      } else if (q.includes('full day') || q.includes('whole day')) {
        params.dailyHours = 8;
      } else {
        const rawNumberMatch = q.match(/^(\d+)$/);
        if (rawNumberMatch) {
          params.dailyHours = parseInt(rawNumberMatch[1], 10);
        }
      }
      return params;
    }

    if (activeQuestion === 'subject') {
      if (matchesMultiSubjectIntent(q)) {
        params.subjectScope = "multi_subject";
        params.subject = "all";
        params.subjectName = "All Subjects";
        params.subjectResolved = true;
      } else {
        const subjectMatch = matchWorkspaceSubject(q, workspaceSubjects);
        if (subjectMatch) {
          params.subject = subjectMatch.id;
          params.subjectName = subjectMatch.name;
          params.subjectScope = "single";
          params.subjectResolved = true;
        } else {
          // Catch generic subject names
          const commonSubjects = ['physics', 'chemistry', 'maths', 'dbms', 'operating systems', 'algorithms', 'data structures'];
          for (const sub of commonSubjects) {
            if (q.includes(sub)) {
              params.subject = sub;
              params.subjectName = sub.charAt(0).toUpperCase() + sub.slice(1);
              params.subjectScope = "single";
              params.subjectResolved = true;
              break;
            }
          }
        }
      }
      return params;
    }

    if (activeQuestion === 'conceptName') {
      if (q.includes('deadlock')) {
        params.conceptName = 'deadlock';
      } else if (q.includes('normalization')) {
        params.conceptName = 'normalization';
      } else if (q.includes('recursion')) {
        params.conceptName = 'recursion';
      } else if (q.includes('stack') && q.includes('queue')) {
        params.conceptName = 'stack_and_queue';
      }
      return params;
    }

    if (activeQuestion === 'depth') {
      if (q.includes('simple') || q.includes('beginner')) {
        params.depth = 'simple';
      } else if (q.includes('code') || q.includes('example')) {
        params.depth = 'code';
      } else if (q.includes('summary') || q.includes('exam')) {
        params.depth = 'summary';
      }
      return params;
    }
  }

  // 3. Fallback: Generic, Unlocked Parsing (used when initiating a flow or unlocked)
  
  // Duration Days
  const daysMatch = q.match(/(\d+)\s*(?:day|days)/);
  if (daysMatch) {
    params.durationDays = parseInt(daysMatch[1], 10);
  } else if (q.includes('next week')) {
    params.durationDays = 7;
  } else if (q.includes('few days') || q.includes('couple of days')) {
    params.durationDays = 3;
  } else if (q.includes('tomorrow')) {
    params.durationDays = 1;
  } else if (q.includes('this weekend')) {
    params.durationDays = 2;
  } else if (q.includes('soon')) {
    params.durationDays = 5;
  } else if (q.includes('next month')) {
    params.durationDays = 30;
  } else {
    const rawNumberMatch = q.match(/^(\d+)$/);
    if (rawNumberMatch) {
      params.durationDays = parseInt(rawNumberMatch[1], 10);
    }
  }

  // Daily Hours
  const hoursMatch = q.match(/(\d+)\s*(?:hour|hours|h)\s*(?:daily|a day|day)?/);
  if (hoursMatch) {
    params.dailyHours = parseInt(hoursMatch[1], 10);
  } else if (q.includes('few hours') || q.includes('a couple of hours') || q.includes('some hours')) {
    params.dailyHours = 3;
  } else if (q.includes('a lot') || q.includes('intense') || q.includes('maximum') || q.includes('all day')) {
    params.dailyHours = 6;
  } else if (q.includes('little') || q.includes('low') || q.includes('minimal') || q.includes('hardly')) {
    params.dailyHours = 2;
  } else if (q.includes('standard') || q.includes('medium') || q.includes('normal') || q.includes('average')) {
    params.dailyHours = 4;
  } else if (q.includes('full day') || q.includes('whole day')) {
    params.dailyHours = 8;
  }

  // Target Percent
  const percentMatch = q.match(/(\d+)\s*(?:%|percent)/);
  if (percentMatch) {
    params.targetPercent = parseInt(percentMatch[1], 10);
  }

  // Subject matching
  if (matchesMultiSubjectIntent(q)) {
    params.subjectScope = "multi_subject";
    params.subject = "all";
    params.subjectName = "All Subjects";
    params.subjectResolved = true;
  } else {
    const subjectMatch = matchWorkspaceSubject(q, workspaceSubjects);
    if (subjectMatch) {
      params.subject = subjectMatch.id;
      params.subjectName = subjectMatch.name;
      params.subjectScope = "single";
      params.subjectResolved = true;
    } else {
      const commonSubjects = ['physics', 'chemistry', 'maths', 'dbms', 'operating systems', 'algorithms', 'data structures'];
      for (const sub of commonSubjects) {
        if (q.includes(sub)) {
          params.subject = sub;
          params.subjectName = sub.charAt(0).toUpperCase() + sub.slice(1);
          params.subjectScope = "single";
          params.subjectResolved = true;
          break;
        }
      }
    }
  }

  // Concept
  if (q.includes('deadlock')) {
    params.conceptName = 'deadlock';
  } else if (q.includes('normalization')) {
    params.conceptName = 'normalization';
  } else if (q.includes('recursion')) {
    params.conceptName = 'recursion';
  } else if (q.includes('stack') && q.includes('queue')) {
    params.conceptName = 'stack_and_queue';
  }

  // Depth
  if (q.includes('simple') || q.includes('beginner')) {
    params.depth = 'simple';
  } else if (q.includes('code') || q.includes('example')) {
    params.depth = 'code';
  } else if (q.includes('summary') || q.includes('exam')) {
    params.depth = 'summary';
  }

  return params;
};
