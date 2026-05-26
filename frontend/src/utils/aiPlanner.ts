import { Subject, Attendance, Assignment, StudySession } from '../services/mockData';
import { StudyPlanningContext } from '../context/store';

// Dynamic Pool of syllabus-specific topics to ensure dynamic rotation and prevent repetitive generation
const getTopicForDayAndSession = (subjectName: string, day: number, type: 'conceptual' | 'numerical' | 'light'): string => {
  const name = subjectName.toLowerCase();
  let pool = {
    conceptual: [
      'Core Conceptual Principles & Theoretical Frameworks',
      'Lecture Notes Outline & Structural Relationship Analysis',
      'High-Level Concept Mapping & Core Definitions review',
      'Primary Architectural Concepts & Foundational Paradigms'
    ],
    numerical: [
      'Practical Study Exercises & Application Mechanics',
      'Analytical Problem-Solving & Scenario Worksheets',
      'Interactive Case Studies & Real-World Demonstrations',
      'Complex Formula Application & Numerical Drill Sets'
    ],
    light: [
      'Flashcard Active Recall & High-Speed Self-Quiz',
      'Past Year Questions (PYQs) Mock Practice Sweep',
      'Lingering Doubt Resolution & Syllabus Boundary Check',
      'Active Summary Cheat-Sheet Construction & Light Recall'
    ]
  };

  if (name.includes('architecture') || name.includes('computer org') || name.includes('systems')) {
    pool = {
      conceptual: [
        'CPU Organization & Instruction Cycles',
        'Instruction Level Parallelism & Pipelining',
        'Virtual Memory & Address Translation',
        'Flynn Classification & Multiprocessor Theory'
      ],
      numerical: [
        'Cache hit/miss rate calculations',
        'Addressing Mode Numerical Problems',
        'Floating Point Arithmetic Problems',
        'Pipeline Hazard Speedup Calculations'
      ],
      light: [
        'Previous Year Exam Questions Review',
        'Flashcard Recall on I/O DMA Transfers',
        'Addressing Modes Quick Summary',
        'Microprogram Control Units Quick Recall'
      ]
    };
  } else if (name.includes('math') || name.includes('calc') || name.includes('algebra')) {
    pool = {
      conceptual: [
        'Limits, Continuity & Mean Value Theorem',
        'Linear Dependence & Eigenvalues',
        'Differential Equations Theory',
        'Vector Calculus Theorems'
      ],
      numerical: [
        'Integration & Area Numerical Exercises',
        'Matrix Determinants & Row Reductions',
        'Vector Calculus Practice Problems',
        'Eigenvalue/Eigenvector Calculations'
      ],
      light: [
        'Past Exam Calculus Questions Sweep',
        'Rapid Matrix Properties Recall',
        'Important Formula Cheat-Sheet Review',
        'Mock Limits Questions Quiz'
      ]
    };
  } else if (name.includes('code') || name.includes('datastruct') || name.includes('algorithm') || name.includes('structures')) {
    pool = {
      conceptual: [
        'Asymptotic Time Complexity Analysis',
        'Binary Search Tree & AVL Rotations',
        'Recursion & Backtracking Graph Search',
        'Graph Traversals & DFS/BFS Theory'
      ],
      numerical: [
        'Linked List Manipulation Code Problems',
        'Two-Pointer Array Problem Solving',
        'Sorting & Searching Implementation Tasks',
        'Binary Tree Construction Problems'
      ],
      light: [
        'Dynamic Programming Conceptual Review',
        'Short Coding Interview Mock Questions',
        'Data Structures Properties Flashcards',
        'Time Complexity Cheat Sheet Check'
      ]
    };
  } else if (name.includes('dbms') || name.includes('database')) {
    pool = {
      conceptual: [
        'Relational Algebra & Schema Design',
        'Functional Dependencies & 3NF/BCNF',
        'ACID Transactions & Locking Protocols',
        'ER Diagrams & Schema Mapping'
      ],
      numerical: [
        'Complex SQL Join Query Writing',
        'Normal Form Decomposition Exercises',
        'Index Query Optimization Exercises',
        'Relational Tuple Calculus Queries'
      ],
      light: [
        'DBMS Past Year Questions Sweep',
        'Relational Model Definitions Quiz',
        'Key Constraints Summary Review',
        'Transaction Recovery Rules Quick Read'
      ]
    };
  }

  const conceptualIdx = (day - 1) % pool.conceptual.length;
  const numericalIdx = (day) % pool.numerical.length;
  const lightIdx = (day + 1) % pool.light.length;

  if (type === 'conceptual') return pool.conceptual[conceptualIdx];
  if (type === 'numerical') return pool.numerical[numericalIdx];
  return pool.light[lightIdx];
};

interface StudySessionBlock {
  name: string;
  duration: number; // in hours
  topic: string;
  focusGoal: string;
  type: 'conceptual' | 'numerical' | 'light';
}

// Generate structured study slots based on daily hours and progressive cognitive intensity
const generateDailySessions = (subjectName: string, day: number, hours: number): StudySessionBlock[] => {
  const blocks: StudySessionBlock[] = [];
  
  if (hours <= 3) {
    const h = hours / 2;
    blocks.push({
      name: 'Session 1',
      duration: h,
      topic: getTopicForDayAndSession(subjectName, day, 'conceptual'),
      focusGoal: 'Master key conceptual guidelines, theoretical structures, and important definitions.',
      type: 'conceptual'
    });
    blocks.push({
      name: 'Session 2',
      duration: h,
      topic: getTopicForDayAndSession(subjectName, day, 'light'),
      focusGoal: 'Run dynamic recall drills and test formulas using standard study cards.',
      type: 'light'
    });
  } else if (hours <= 5) {
    const conceptualHrs = Math.max(1.5, Math.round(hours * 0.45 * 2) / 2);
    const numericalHrs = Math.max(1, Math.round(hours * 0.35 * 2) / 2);
    const lightHrs = Math.max(0.5, hours - conceptualHrs - numericalHrs);
    
    blocks.push({
      name: 'Session 1',
      duration: conceptualHrs,
      topic: getTopicForDayAndSession(subjectName, day, 'conceptual'),
      focusGoal: 'Formulate core theoretical associations and dissect key concepts.',
      type: 'conceptual'
    });
    blocks.push({
      name: 'Session 2',
      duration: numericalHrs,
      topic: getTopicForDayAndSession(subjectName, day, 'numerical'),
      focusGoal: 'Apply algorithmic/calculus operations to solve core textbook numerical problems.',
      type: 'numerical'
    });
    blocks.push({
      name: 'Session 3',
      duration: lightHrs,
      topic: getTopicForDayAndSession(subjectName, day, 'light'),
      focusGoal: 'Complete past exam question sheets and record short recap notes.',
      type: 'light'
    });
  } else {
    // 6 hours or more (e.g., 7 hours+)
    const conceptualHrs = Math.max(1.5, Math.round(hours * 0.35 * 2) / 2);
    const numericalHrs = Math.max(1.5, Math.round(hours * 0.30 * 2) / 2);
    const lightReviewHrs = Math.max(1, Math.round(hours * 0.20 * 2) / 2);
    const pyqHrs = Math.max(0.5, hours - conceptualHrs - numericalHrs - lightReviewHrs);
    
    blocks.push({
      name: 'Session 1',
      duration: conceptualHrs,
      topic: getTopicForDayAndSession(subjectName, day, 'conceptual'),
      focusGoal: 'Analyze intensive technical principles and outline primary study schemas.',
      type: 'conceptual'
    });
    blocks.push({
      name: 'Session 2',
      duration: numericalHrs,
      topic: getTopicForDayAndSession(subjectName, day, 'numerical'),
      focusGoal: 'Work through active numerical drills and practice computational steps.',
      type: 'numerical'
    });
    blocks.push({
      name: 'Session 3',
      duration: lightReviewHrs,
      topic: getTopicForDayAndSession(subjectName, day, 'light'),
      focusGoal: 'Run quick flashcard quizzes and complete pending assignment checks.',
      type: 'light'
    });
    blocks.push({
      name: 'Session 4',
      duration: pyqHrs,
      topic: getTopicForDayAndSession(subjectName, day, 'light'),
      focusGoal: 'Sweep through high-probability exam questions under timed conditions.',
      type: 'light'
    });
  }
  
  return blocks;
};

// Helper to determine adaptive break recovery times based on daily available focus hours
const getBreakDurationText = (totalHours: number, sessionIdx: number, totalSessions: number): string => {
  if (totalHours <= 3) return '10m recovery gap';
  if (totalHours <= 6) return '15m rest break';
  
  // 7h+ intensive daily schedules feature an extended recovery midpoint gap
  const midpoint = Math.floor(totalSessions / 2);
  if (sessionIdx === midpoint) {
    return '30m extended recovery block';
  }
  return '15m standard rest gap';
};

// Main heuristics study planner generation function
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
  
  // Strictest Time Consistency: available hours directly dictate the daily session plan totals
  const availableHours = ctx.dailyAvailableHours || 4;
  const recommendedHours = availableHours;

  const targetSubjectName = ctx.goalType || '';
  const isMultiSubject = targetSubjectName.toLowerCase().includes('all') || targetSubjectName.trim() === '';

  // 1. COMPUTE SUBJECT PRIORITY SCORES
  const prioritizedSubjects = subjects.map(sub => {
    const isTarget = !isMultiSubject && (sub.name.toLowerCase() === targetSubjectName.toLowerCase() || sub.id === targetSubjectName);
    let examUrgency = isTarget ? 20 : 4;
    if (days <= 3) examUrgency += 2;

    const subAssignments = assignments.filter(a => a.subjectId === sub.id && a.status !== 'done');
    let backlogScore = 0;
    subAssignments.forEach(a => {
      if (a.priority === 'high') backlogScore += 3;
      else if (a.priority === 'medium') backlogScore += 2;
      else backlogScore += 1;
    });
    const backlogWeight = Math.min(10, backlogScore * 1.5);

    const isWeak = ctx.weakSubjects.includes(sub.name) || ctx.weakSubjects.includes(sub.id);
    const weakSubjectWeight = isWeak ? 10 : 3;

    const attRecord = attendance.find(a => a.subjectId === sub.id);
    let attendancePct = 100;
    let attendanceRisk = 0;
    if (attRecord && attRecord.records.length > 0) {
      const attended = attRecord.records.filter(r => r.status === 'attended').length;
      const total = attRecord.records.filter(r => r.status !== 'cancelled').length;
      attendancePct = total > 0 ? (attended / total) * 100 : 100;

      if (attendancePct < 75) attendanceRisk = 10;
      else if (attendancePct < 80) attendanceRisk = 6;
    }

    const focusConsistency = Math.max(1, 10 - (studyStreak * 1.5));

    let priorityScore =
      examUrgency * 0.40 +
      backlogWeight * 0.20 +
      weakSubjectWeight * 0.20 +
      attendanceRisk * 0.10 +
      focusConsistency * 0.10;

    if (isTarget) {
      priorityScore += 100; // Unconditional prioritisation boost for explicitly requested subject
    }

    return {
      subject: sub,
      priorityScore,
      attendancePct,
      backlogCount: subAssignments.length
    };
  });

  prioritizedSubjects.sort((a, b) => b.priorityScore - a.priorityScore);

  let intensityMode = 'Balanced Study';
  if (days <= 3) intensityMode = 'Exam Emergency Mode';
  else if (days <= 7) intensityMode = 'Intensive Prep';
  else if (days >= 14) intensityMode = 'Light Revision';

  // Determine active subjects to include
  let subjectsToInclude = [prioritizedSubjects[0]];
  
  if (isMultiSubject) {
    subjectsToInclude = prioritizedSubjects.slice(0, 3);
  } else {
    // Single-Subject Allocation: Secondary courses are ONLY mapped if attendance is critically under target
    const criticalSecondaries = prioritizedSubjects.slice(1).filter(ps => ps.attendancePct < 75);
    if (criticalSecondaries.length > 0) {
      subjectsToInclude.push(criticalSecondaries[0]);
    }
  }

  // 2. BUILD DAILY SCHEDULES
  let output = '';

  for (let day = 1; day <= days; day++) {
    output += `### 🗓️ Day ${day}\n\n`;

    // Distribute hours across active subjects
    subjectsToInclude.forEach((ps, subIdx) => {
      if (!ps) return;

      // Subject weighting: Target subject receives at least 70-80% allocation
      let subjectHours = recommendedHours;
      if (subjectsToInclude.length > 1) {
        subjectHours = subIdx === 0 
          ? Math.max(1, Math.round(recommendedHours * 0.75 * 2) / 2)
          : Math.max(0.5, recommendedHours - Math.max(1, Math.round(recommendedHours * 0.75 * 2) / 2));
      }

      output += `**Subject Focus**: **${ps.subject.name}** (${subjectHours}h)\n\n`;

      const sessions = generateDailySessions(ps.subject.name, day, subjectHours);
      
      sessions.forEach((session, sIdx) => {
        const breakText = getBreakDurationText(recommendedHours, sIdx + 1, sessions.length);
        
        const clockIcons = ['🕘', '🕛', '🕒', '🕔'];
        const icon = clockIcons[sIdx % clockIcons.length];

        output += `${icon} **${session.name} — ${session.duration}h**\n`;
        output += `*${session.topic}*\n`;
        output += `*Goal: ${session.focusGoal}*\n\n`;

        if (sIdx < sessions.length - 1) {
          output += `☕ **Break — ${breakText}**\n\n`;
        }
      });
    });

    if (day < days) {
      output += `---\n\n`;
    }
  }

  // 3. CLEAN RECOMMENDATIONS BLOCK (Replaces corporate telemetry explaining graphs)
  output += `### 💡 Recommendation\n`;
  if (days <= 3) {
    output += `- Prioritize solving Past Year Questions (PYQs) and high-frequency numerical patterns tonight. Avoid starting entirely new theory topics close to the exam.\n`;
    output += `- Focus on memory recall techniques and secure a good night's sleep to maximize conceptual retention.`;
  } else {
    output += `- Tackle heavy conceptual theories in your opening session when your mental energy is peak. Save lighter assignments or recall checks for the final block.\n`;
    output += `- Maintain these consistent study sessions to lock in your daily streak and build lasting focus habits.`;
  }

  return {
    planText: output,
    intensityMode,
    recommendedHours
  };
};

