import { Subject, Attendance, Assignment, StudySession } from '../services/mockData';
import { StudyPlanningContext } from '../context/store';

// Helper to determine if a course is classified in challenging technical/quantitative cluster
const isChallengingSubject = (name: string): boolean => {
  return /math|calc|alg|syst|quant|phys|chem|code|dbms|structures/i.test(name || '');
};

// Main heuristics generation function
export const generateInteractiveStudyPlan = (
  ctx: StudyPlanningContext,
  subjects: Subject[],
  attendance: Attendance[],
  assignments: Assignment[],
  studySessions: StudySession[],
  studyStreak: number = 0
): {
  planText: string;
  intensityMode: string;
  recommendedHours: number;
} => {
  const days = ctx.deadlineDays || 5;
  const availableHours = ctx.dailyAvailableHours || 4;

  // 1. COMPUTE SUBJECT PRIORITY SCORES
  const prioritizedSubjects = subjects.map(sub => {
    // A. Exam Urgency (Urgent deadline match or general focus)
    const isTarget = ctx.weakSubjects.includes(sub.name) || ctx.weakSubjects.includes(sub.id);
    let examUrgency = isTarget ? 10 : 4;
    if (days <= 3) examUrgency += 2;
    else if (days >= 14) examUrgency -= 2;

    // B. Backlog Weight (Incomplete assignment backlog value)
    const subAssignments = assignments.filter(a => a.subjectId === sub.id && a.status !== 'done');
    let backlogScore = 0;
    subAssignments.forEach(a => {
      if (a.priority === 'high') backlogScore += 3;
      else if (a.priority === 'medium') backlogScore += 2;
      else backlogScore += 1;
    });
    const backlogWeight = Math.min(10, backlogScore * 1.5);

    // C. Weak Subject Weight (Explicit tag or challenging quantitative cluster)
    const isWeak = ctx.weakSubjects.includes(sub.name) || ctx.weakSubjects.includes(sub.id);
    const isHard = isChallengingSubject(sub.name);
    const weakSubjectWeight = isWeak ? 10 : isHard ? 7 : 3;

    // D. Attendance Risk Factor
    const attRecord = attendance.find(a => a.subjectId === sub.id);
    let attendancePct = 100;
    let attendanceRisk = 0;
    if (attRecord && attRecord.records.length > 0) {
      const attended = attRecord.records.filter(r => r.status === 'attended').length;
      const total = attRecord.records.filter(r => r.status !== 'cancelled').length;
      attendancePct = total > 0 ? (attended / total) * 100 : 100;

      if (attendancePct < 75) {
        attendanceRisk = 10; // Critically under target
      } else if (attendancePct < 80) {
        attendanceRisk = 6;  // Near warning margin
      } else {
        attendanceRisk = 1;
      }
    }

    // E. Focus Consistency
    // Erratic streaks trigger a plan with higher initial structural support (habit-builder)
    const focusConsistency = Math.max(1, 10 - (studyStreak * 1.5));

    // Weighted Formula:
    // Urgency (30%) + Backlog (25%) + Subject Weakness (20%) + Attendance Risk (10%) + Focus Consistency (15%)
    const priorityScore =
      examUrgency * 0.30 +
      backlogWeight * 0.25 +
      weakSubjectWeight * 0.20 +
      attendanceRisk * 0.10 +
      focusConsistency * 0.15;

    return {
      subject: sub,
      priorityScore,
      attendancePct,
      backlogCount: subAssignments.length,
      isHard
    };
  });

  // Sort subjects by priority score descending
  prioritizedSubjects.sort((a, b) => b.priorityScore - a.priorityScore);

  // 2. CHOOSE DYNAMIC STUDY INTENSITY SYSTEM
  let intensityMode = 'Balanced Study';
  let hoursMultiplier = 1.0;

  if (ctx.targetIntensity === 'high') {
    intensityMode = 'Deep Focus Sprint';
    hoursMultiplier = 1.25;
  } else if (ctx.targetIntensity === 'light') {
    intensityMode = 'Light Revision';
    hoursMultiplier = 0.75;
  } else {
    // Auto-infer based on deadline and backlog counts
    const totalBacklog = assignments.filter(a => a.status !== 'done').length;
    if (days <= 3) {
      intensityMode = 'Exam Emergency Mode';
      hoursMultiplier = 1.5;
    } else if (days <= 7) {
      intensityMode = 'Deep Focus Sprint';
      hoursMultiplier = 1.25;
    } else if (totalBacklog >= 4) {
      intensityMode = 'Recovery & Catch-Up';
      hoursMultiplier = 1.1;
    } else if (days >= 14) {
      intensityMode = 'Light Revision';
      hoursMultiplier = 0.8;
    }
  }

  // Recommended daily study hours (capped at reasonable human threshold of 6 hours)
  const recommendedHours = Math.min(6, Math.max(1.5, Math.round(availableHours * hoursMultiplier * 2) / 2));

  // 3. STRUCTURE THE STUDY PLAN BODY
  let output = `# 📅 AI Strategic Planner: ${intensityMode}\n\n`;
  output += `> **Strategic Target**: A **${days}-day study roadmap** calibrated at **${recommendedHours} hours/day** targeting your highest academic priority courses. `;
  
  if (ctx.isPomodoroFormat) {
    output += `Formatted into structured **25/5 Pomodoro blocks** for enhanced focus preservation.\n\n`;
  } else {
    output += `Calibrated using **45-minute deep focus sessions** and cognitive rest intervals.\n\n`;
  }

  // Generate Daily Breakdown
  output += `## 🕒 Daily Study Breakdown\n\n`;
  
  for (let day = 1; day <= days; day++) {
    output += `### 🗓️ Day ${day}\n`;

    // Dynamic phase text based on progression
    const isInitial = day <= Math.ceil(days / 3);
    const isConcluding = day > Math.floor(days * 0.7);

    // Distribute daily hours across top subjects
    let remainingDailyHours = recommendedHours;
    let slotNum = 1;

    prioritizedSubjects.forEach((ps, index) => {
      if (remainingDailyHours <= 0) return;

      // Primary course gets 60% of time, secondary gets 40%
      let allocatedHours = index === 0 ? Math.ceil(recommendedHours * 0.6 * 2) / 2 : Math.floor(recommendedHours * 0.4 * 2) / 2;
      allocatedHours = Math.min(allocatedHours, remainingDailyHours);
      if (allocatedHours <= 0) return;

      remainingDailyHours -= allocatedHours;

      // Contextualize tasks based on timeline phase
      let taskAction = '';
      if (isConcluding) {
        taskAction = ps.backlogCount > 0 ? `Practice testing & overdue assignments sweep` : `High-frequency recall & full mock exam simulation`;
      } else if (isInitial) {
        taskAction = `Concept mapping, formula breakdown & core note reviews`;
      } else {
        taskAction = ps.backlogCount > 0 ? `Active assignment clearing & practice questions` : `Feynman Technique recall review & active practice sessions`;
      }

      if (ctx.isPomodoroFormat) {
        const pomodoros = Math.round((allocatedHours * 60) / 30);
        output += `- \`[ ]\` **Slot ${slotNum}**: ${ps.subject.name} – ${allocatedHours}h (${pomodoros} × 🍅 blocks) \n`;
        output += `  *Focus: ${taskAction}*\n`;
      } else {
        output += `- \`[ ]\` **Slot ${slotNum}**: ${ps.subject.name} – ${allocatedHours}h \n`;
        output += `  *Focus: ${taskAction}*\n`;
      }

      slotNum++;
    });

    // Spaced revision or Recovery gaps
    if (day % 2 === 0) {
      output += `- \`[ ]\` **Spaced Recall**: 30m rapid flashcard recall across all subjects.\n`;
    } else {
      output += `- \`[ ]\` **Cognitive Buffer**: 15m mental recovery gap between high-intensity study blocks.\n`;
    }

    output += `\n`;
  }

  // 4. EXPLAINABILITY SECTION
  output += `## 🧠 Explainability: Why this plan?\n\n`;
  output += `This structured blueprint automatically balanced the active risk vectors scanned from your profile:\n`;

  const topSubject = prioritizedSubjects[0];
  if (topSubject) {
    output += `- **Primary Priority Allocation**: **${topSubject.subject.name}** was allocated the largest focus window due to `;
    if (topSubject.attendancePct < 75) {
      output += `its critical attendance level of **${Math.round(topSubject.attendancePct)}%** (below your 75% target threshold).`;
    } else if (topSubject.backlogCount > 0) {
      output += `an active backlog of **${topSubject.backlogCount} outstanding tasks** needing immediate clearing.`;
    } else {
      output += `its classification as a challenging **${topSubject.isHard ? 'technical course' : 'academic subject'}** on your planner list.`;
    }
    output += `\n`;
  }

  // Focus habits / Streak explainability
  if (studyStreak <= 1) {
    output += `- **Habit Builder Buffer**: Recent focus streaks are irregular. Short spaced blocks are scheduled initially to reinforce study habits without causing cognitive fatigue.\n`;
  } else {
    output += `- **Streak Optimization**: Study blocks are optimized to leverage your healthy **${studyStreak}-day streak momentum**.\n`;
  }

  // Burnout check
  const totalWeeklyHours = Math.round(studySessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60);
  if (totalWeeklyHours > 12) {
    output += `- **Fatigue Recovery Guard**: Heavy study frequency (approx. **${totalWeeklyHours} hours** logged recently) was detected. Injected active recovery buffers to mitigate burnout risks.\n`;
  } else {
    output += `- **Intensity Ramp-up**: Focus hours scale progressively to matches your available daily target without overloading your schedules.\n`;
  }

  return {
    planText: output,
    intensityMode,
    recommendedHours
  };
};
