import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  ArrowRight, 
  AlertTriangle, 
  BookOpen, 
  TrendingUp, 
  Calendar, 
  CheckSquare, 
  Zap,
  Activity
} from 'lucide-react';
import { useAppStore } from '../../context/store';
import { useNavigate } from 'react-router-dom';

interface Message {
  sender: 'coach' | 'user';
  text: string;
  timestamp: Date;
}

// Generate backticks dynamically to prevent compiler escaping conflicts
const BT = String.fromCharCode(96); // `
const TBT = BT + BT + BT; // ```

export const AICoach: React.FC = () => {
  const navigate = useNavigate();
  
  // Connect to Zustand app stores
  const {
    subjects,
    attendance,
    assignments,
    studySessions,
    semesters,
    targetGpaSettings,
    user
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typewriterIntervalRef = useRef<any>(null);

  // Seed default chat history on mount
  useEffect(() => {
    const savedChat = localStorage.getItem('studiq_ai_coach_history');
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
        return;
      } catch (e) {
        console.error(e);
      }
    }
    
    // Initial welcome prompt
    setMessages([
      {
        sender: 'coach',
        text: '🚀 **Welcome to your STUDIQ AI Academic Coach!**\n\n' +
          'I am your futuristic academic strategist. Unlike simple chatbots, I am deeply integrated with your **live database** of attendance records, SGPA history, study streaks, and assignment deadlines.\n\n' +
          'Here is what I can do for you:\n' +
          '- 📅 **Roadmaps**: Type ' + BT + '“I have DBMS exam in 12 days”' + BT + ' or click the chip below to get a custom revision sprint.\n' +
          '- 📉 **Attendance Recovery**: Find out exactly how many classes you must attend consecutively to cross the 75% boundary.\n' +
          '- 🎯 **What-if Forecasts**: Estimate the exact grades needed in your remaining credits to hit your goal CGPA.\n' +
          '- 🧠 **Doubt Solving**: Get conceptual, beginner-friendly breakdowns of core concepts with sample code.\n\n' +
          'How can I help you dominate your semesters today?',
        timestamp: new Date()
      }
    ]);
  }, []);

  // Save chat to localStorage on change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('studiq_ai_coach_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom when messages update or streaming occurs
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, streamingText]);

  // CALCULATE ACADEMIC STATS FOR RIGHT PANEL
  const totalSubjects = subjects.length;
  
  // Calculate average attendance across subjects
  const getSubjectAttendancePercent = (subId: string) => {
    const record = attendance.find(a => a.subjectId === subId);
    if (!record || record.records.length === 0) return 100; // default to perfect if no entries
    const attended = record.records.filter(r => r.status === 'attended').length;
    const total = record.records.filter(r => r.status !== 'cancelled').length;
    return total > 0 ? Math.round((attended / total) * 100) : 100;
  };

  const avgAttendance = totalSubjects > 0
    ? Math.round(subjects.reduce((acc, s) => acc + getSubjectAttendancePercent(s.id), 0) / totalSubjects)
    : 85; // fallback baseline

  // Calculate outstanding assignments completion ratio
  const completedAssignments = assignments.filter(a => a.status === 'done').length;
  const totalAssignments = assignments.length;
  const assignmentRatio = totalAssignments > 0 ? completedAssignments / totalAssignments : 1;

  // Calculate overall Academic Health Score
  // Weighted: 40% Attendance, 40% Assignments, 20% Streak/Study points
  const studyStreak = user?.stats.studyStreak || 0;
  const streakPoints = Math.min(100, studyStreak * 10 + 50); // normalize streak into a score component
  
  const rawHealthScore = Math.round(
    (avgAttendance * 0.4) + 
    ((assignmentRatio * 100) * 0.4) + 
    (streakPoints * 0.2)
  );
  const healthScore = Math.max(20, Math.min(100, rawHealthScore));

  // Determine risk alerts
  const weakSubjects = subjects.filter(s => getSubjectAttendancePercent(s.id) < 75);
  const pendingHighPriority = assignments.filter(a => a.status !== 'done' && a.priority === 'high');

  // INTERACTION ENGINE: TRIGGER LOCAL EXPERT INFERENCE
  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI generation time
    setTimeout(() => {
      const responseText = generateLocalAIResponse(textToSend);
      setIsTyping(false);
      streamResponse(responseText);
    }, 1200);
  };

  // Stream text character by character
  const streamResponse = (fullText: string) => {
    if (typewriterIntervalRef.current) clearInterval(typewriterIntervalRef.current);
    
    let currentIdx = 0;
    setStreamingText('');

    typewriterIntervalRef.current = setInterval(() => {
      if (currentIdx < fullText.length) {
        const nextBatchSize = fullText.length - currentIdx > 8 ? 8 : 1;
        const slice = fullText.substring(0, currentIdx + nextBatchSize);
        setStreamingText(slice);
        currentIdx += nextBatchSize;
      } else {
        clearInterval(typewriterIntervalRef.current);
        const finalMsg: Message = {
          sender: 'coach',
          text: fullText,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, finalMsg]);
        setStreamingText('');
      }
    }, 15);
  };

  // Heuristic engine to parse user intents using strictly single quoted strings
  const generateLocalAIResponse = (query: string): string => {
    const q = query.toLowerCase();

    // 1. ATTENDANCE INQUIRY & RECOVERY CALCULATOR
    if (q.includes('attendance') || q.includes('absent') || q.includes('bunk') || q.includes('present') || q.includes('survival') || q.includes('class')) {
      if (subjects.length === 0) {
        return '⚠️ **Data Sync Notice**\n' +
          'I see you don\'t have any academic subjects registered in your profile yet! Head over to the **Attendance page** to create your courses so I can run my calculations.\n\n' +
          'However, here is how my **Survival Calculator Heuristics** work:\n' +
          '- I monitor your Target Attendance (e.g. ' + BT + '75%' + BT + ').\n' +
          '- When you drop below, I run a linear recovery equation:\n' +
          '  Classes to Attend = (Target * Total - Attended) / (1 - Target)\n' +
          '- I will calculate the exact class count required to secure your exam hall ticket. Add a subject to try it!';
      }

      let response = '📊 **Academic Attendance Recovery Diagnostics**\n\n' +
        'I have scanned your courses and evaluated your current standing against your required target attendance:\n\n' +
        '| Subject | Code | Attendance | Status | Consecutive Classes Required |\n' +
        '| :--- | :--- | :--- | :--- | :--- |\n';

      subjects.forEach(sub => {
        const pct = getSubjectAttendancePercent(sub.id);
        const attRecord = attendance.find(a => a.subjectId === sub.id);
        const attended = attRecord ? attRecord.records.filter(r => r.status === 'attended').length : 0;
        const total = attRecord ? attRecord.records.filter(r => r.status !== 'cancelled').length : 0;
        
        let statusTag = '✅ Healthy';
        let recoveryClasses = '0';

        if (pct < 75) {
          statusTag = '🚨 Critical Risk';
          const required = Math.max(0, 3 * total - 4 * attended);
          recoveryClasses = '**Attend next ' + required + ' classes**';
        } else if (pct < 80) {
          statusTag = '⚠️ Warning Boundary';
          const required = Math.max(0, 3 * total - 4 * attended);
          recoveryClasses = required > 0 ? 'Attend next ' + required + ' classes' : 'Keep attending';
        } else {
          const canBunk = Math.max(0, Math.floor((4 * attended - 3 * total) / 3));
          recoveryClasses = canBunk > 0 ? 'Can safely skip next **' + canBunk + '** classes' : 'Perfect attendance';
        }

        response += '| ' + sub.name + ' | ' + BT + sub.code + BT + ' | **' + pct + '%** (' + attended + '/' + total + ') | ' + statusTag + ' | ' + recoveryClasses + ' |\n';
      });

      response += '\n\n### 💡 Smart Strategy Recommendations:\n' +
        '1. ' + (weakSubjects.length > 0 
          ? 'Prioritize attending **' + weakSubjects.map(s => s.name).join(', ') + '** immediately. Your attendance is in the critical zone.'
          : 'Excellent work! All subjects are currently above the 75% bar. Keep your streak alive.') + '\n' +
        '2. Leverage the **What-If Attendance Simulator** in the Focus Lounge or SGPA Calculator pages to map hypothetical absentees.';

      return response;
    }

    // 2. STUDY ROADMAP / REVISION PLAN GENERATOR
    if (q.includes('roadmap') || q.includes('plan') || q.includes('revision') || q.includes('exam') || q.includes('test') || q.includes('days') || q.includes('schedule')) {
      let matchedSubject = subjects[0]?.name || "DBMS & Systems";
      for (const s of subjects) {
        if (q.includes(s.name.toLowerCase()) || q.includes(s.code.toLowerCase())) {
          matchedSubject = s.name;
          break;
        }
      }

      const daysMatch = q.match(/(\d+)\s*day/);
      const days = daysMatch ? parseInt(daysMatch[1], 10) : 7;

      return '# 🏁 Elite Revision Sprint: ' + matchedSubject + ' (' + days + ' Days)\n\n' +
        'I have crafted a highly optimized **academic recovery roadmap** designed to maximize active recall and cognitive retention over the next **' + days + ' days**.\n\n' +
        '> **Strategic Focus**: Because exams measure conceptual synthesis, we will use a **1:2 Ratio** of review to active testing, paired with **45-minute Pomodoro intervals**.\n\n' +
        '## 📅 Daily Execution Schedule\n\n' +
        '### ☀️ Phase 1: Foundations & Concept Mapping (Days 1-' + Math.max(1, Math.floor(days/3)) + ')\n' +
        '- **Task**: Deep-dive into core theory. Re-read your saved notes in **STUDIQ Notes**.\n' +
        '- **Study Session**: 2 x 45-minute Deep Work focus blocks daily.\n' +
        '- **Goal**: Generate conceptual flashcards for weak points.\n' +
        '- *Tip*: Write summaries in your own words rather than passive re-reading.\n\n' +
        '### ⚡ Phase 2: Active Recall & Active Testing (Days ' + (Math.max(2, Math.floor(days/3) + 1)) + '-' + Math.max(2, Math.floor(days * 0.7)) + ')\n' +
        '- **Task**: Take practice quizzes, solve sample papers, and explain concepts aloud (Feynman Technique).\n' +
        '- **Study Session**: 3 x 45-minute sessions daily. Focus on weak subjects.\n' +
        '- **Goal**: Clear out backlogged assignments and subtasks.\n\n' +
        '### 🚀 Phase 3: High-Frequency Review & Simulation (Days ' + (Math.max(3, Math.floor(days * 0.7) + 1)) + '-' + days + ')\n' +
        '- **Task**: Solve past exam papers under strict time constraints.\n' +
        '- **Study Session**: 2 x 45-minute mock simulation blocks.\n' +
        '- **Goal**: Review the generated flashcards and target errors made in Phase 2.\n\n' +
        '## 🛠️ Action Recommendations:\n' +
        '- Click **"Start Focus Session"** below to set a custom **45-minute deep focus timer** for your weakest subject immediately.\n' +
        '- Use our built-in Markdown split-editor to write cheat-sheets!';
    }

    // 3. GRADE prediction / WHAT-IF FORECASTS
    if (q.includes('predict') || q.includes('gpa') || q.includes('sgpa') || q.includes('cgpa') || q.includes('forecast') || q.includes('grades') || q.includes('marksheet')) {
      const targetCgpa = targetGpaSettings?.targetCgpa || 9.0;
      const remainingSems = targetGpaSettings?.remainingSemesters || 4;
      
      let currentCgpa = 8.5;
      let totalCredits = 0;
      let totalWeightedSgpa = 0;

      if (semesters && semesters.length > 0) {
        semesters.forEach(s => {
          totalCredits += s.credits;
          totalWeightedSgpa += s.sgpa * s.credits;
        });
        currentCgpa = totalCredits > 0 ? Math.round((totalWeightedSgpa / totalCredits) * 100) / 100 : 8.5;
      }

      const assumedRemainingCredits = remainingSems * 20;
      const totalEstimatedCredits = totalCredits + assumedRemainingCredits;
      const targetWeighted = targetCgpa * totalEstimatedCredits;
      const requiredWeightedRemaining = targetWeighted - totalWeightedSgpa;
      const reqSgpa = assumedRemainingCredits > 0
        ? Math.round((requiredWeightedRemaining / assumedRemainingCredits) * 100) / 100
        : targetCgpa;

      const isAchievable = reqSgpa <= 10.0 && reqSgpa >= 4.0;

      return '# 🔮 AI Academic Grade Forecast & Target Strategy\n\n' +
        'I have integrated with the **AI Academic Forecast Engine** and scanned your historical CGPA profile.\n\n' +
        '## 📈 Your Performance Ledger\n' +
        '- **Completed Semesters**: ' + BT + semesters.length + BT + '\n' +
        '- **Current Cumulative GPA (CGPA)**: **' + currentCgpa + '**\n' +
        '- **Target CGPA Goal**: **' + targetCgpa + '**\n' +
        '- **Remaining Semesters**: ' + BT + remainingSems + BT + ' (approx. ' + BT + assumedRemainingCredits + BT + ' credits)\n\n' +
        '## 🎯 The Required Strategy\n' +
        'To successfully elevate your CGPA from **' + currentCgpa + '** to your goal of **' + targetCgpa + '**, you must secure:\n' +
        '> **An average of ' + reqSgpa + ' SGPA** across your remaining semesters.\n\n' +
        (isAchievable 
          ? '🟢 **Feasibility: highly Achievable!** This target is well within your grasp based on your historical trajectory.\n\n' +
            '### 🛠️ AI Tactical Plan:\n' +
            '1. **Increase Workload**: Aim to study at least **' + Math.round(reqSgpa * 8) + ' hours weekly** in structured deep focus timer segments.\n' +
            '2. **Assignments Target**: Turn in **100%** of high-priority assignments on time. Assignments count for up to 40% of internal grading rubrics.\n' +
            '3. **Attendance Buffer**: Maintain attendance above **80%** to lock in maximum internal points.'
          : '🔴 **Feasibility: Critical Boundary!** Hitting this target requires a hypothetical SGPA of **' + reqSgpa + '**, which exceeds the 10.0 scale.\n\n' +
            '### 🛠️ Emergency Recovery Plan:\n' +
            '- Consider revising your Target CGPA slightly (e.g. to ' + BT + '8.8' + BT + ') in the **Academic Performance Center** settings.\n' +
            '- Request extra credit assignments from your professors for courses like **' + (subjects[0]?.name || 'Systems') + '**.');
    }

    // 4. TECHNICAL DOUBT SOLVING
    if (q.includes('explain') || q.includes('concept') || q.includes('deadlock') || q.includes('normalization') || q.includes('recursion') || q.includes('stack') || q.includes('queue') || q.includes('difference')) {
      if (q.includes('deadlock')) {
        return '# 🧠 Conceptual Explanation: Operating System Deadlock\n\n' +
          'A **Deadlock** is a state where a set of processes are blocked because each process is holding a resource and waiting for another resource held by some other process.\n\n' +
          '### 🎭 The Real-World Analogy: "The Intersection Jam"\n' +
          'Imagine four cars arriving at a four-way intersection at the same time. Each car holds its quadrant of the road and is waiting for the car ahead of it to move. None can move forward, and none can back up.\n\n' +
          '---\n\n' +
          '## ⚙️ The Four Coffman Conditions\n' +
          'For a deadlock to occur, all four conditions must hold simultaneously:\n\n' +
          '1. **Mutual Exclusion**: Only one process can use a resource at a time (e.g., a printer).\n' +
          '2. **Hold and Wait**: A process holding allocated resources can request additional resources without releasing its current ones.\n' +
          '3. **No Preemption**: Resources cannot be forcibly taken from a process; they must be released voluntarily.\n' +
          '4. **Circular Wait**: A closed chain of processes exists, where each process holds resources needed by the next (P0 waits for P1, P1 waits for P2... Pn waits for P0).\n\n' +
          '---\n\n' +
          '## 💻 Prevention Code Concept (Resource Allocation)\n' +
          'In software development, we prevent circular wait by ordering lock acquisitions:\n\n' +
          TBT + 'typescript\n' +
          '// Lock order mismatch deadlock risk\n' +
          'async function processA() {\n' +
          '  await acquireLock("Resource_1");\n' +
          '  await acquireLock("Resource_2");\n' +
          '}\n' +
          'async function processB() {\n' +
          '  await acquireLock("Resource_2"); // Process B locks 2, Process A locks 1\n' +
          '  await acquireLock("Resource_1"); // Mutual Lockout occurs!\n' +
          '}\n\n' +
          '// SECURE PATTERN: Enforce global lock ordering\n' +
          'async function processA_Safe() {\n' +
          '  await acquireLock("Resource_1");\n' +
          '  await acquireLock("Resource_2");\n' +
          '}\n' +
          'async function processB_Safe() {\n' +
          '  await acquireLock("Resource_1"); // Acquires Resource 1 first!\n' +
          '  await acquireLock("Resource_2");\n' +
          '}\n' +
          TBT + '\n\n' +
          '## 📚 Summary:\n' +
          'Always acquire locks in a standardized, globally defined sequence. Use timeouts if lock holding times are non-deterministic.';
      }

      if (q.includes('normalization')) {
        return '# 🧠 Conceptual Explanation: Database Normalization\n\n' +
          '**Database Normalization** is a systematic process of organizing fields and tables of a relational database to minimize **data redundancy** (duplication) and prevent **dependency anomalies** (insertion, update, and deletion anomalies).\n\n' +
          '---\n\n' +
          '## 📐 The Three Primary Normal Forms (1NF, 2NF, 3NF)\n\n' +
          '### 1️⃣ First Normal Form (1NF): Atomicity\n' +
          '* **Rule**: All columns must contain only **atomic** (indivisible) values. No repeating groups or multi-valued cells.\n' +
          '* *Example Violation*: Storing multiple phone numbers separated by commas in a single ' + BT + 'Phone' + BT + ' column.\n' +
          '* *Fix*: Separate row entries or split phone numbers into individual rows/tables.\n\n' +
          '### 2️⃣ Second Normal Form (2NF): No Partial Dependencies\n' +
          '* **Rule**: Must be in **1NF**, and all non-key columns must be **fully functionally dependent** on the primary key. No partial dependencies on a composite primary key.\n' +
          '* *Example Violation*: In a table with composite key ' + BT + '(StudentID, SubjectID)' + BT + ', storing a ' + BT + 'ProfessorOfficeAddress' + BT + ' column. Since office address depends *only* on ' + BT + 'SubjectID' + BT + ' (part of key), it violates 2NF.\n' +
          '* *Fix*: Split into two tables: ' + BT + 'StudentAssignments(StudentID, SubjectID)' + BT + ' and ' + BT + 'Subjects(SubjectID, ProfessorOfficeAddress)' + BT + '.\n\n' +
          '### 3️⃣ Third Normal Form (3NF): No Transitive Dependencies\n' +
          '* **Rule**: Must be in **2NF**, and no non-key column can depend transitively on the primary key through another non-key column.\n' +
          '* *Example Violation*: Table has primary key ' + BT + 'StudentID' + BT + '. Columns are ' + BT + 'ExamID' + BT + ' and ' + BT + 'ExamMaxMarks' + BT + '. Since ' + BT + 'ExamMaxMarks' + BT + ' depends on ' + BT + 'ExamID' + BT + ', which in turn depends on ' + BT + 'StudentID' + BT + ', this is a transitive dependency.\n' +
          '* *Fix*: Split into ' + BT + 'StudentExams(StudentID, ExamID)' + BT + ' and ' + BT + 'Exams(ExamID, ExamMaxMarks)' + BT + '.';
      }

      if (q.includes('recursion')) {
        return '# 🧠 Conceptual Explanation: Recursion in Data Structures\n\n' +
          '**Recursion** is a programming technique where a function solves a problem by calling itself, breaking down a complex problem into smaller, identical sub-problems.\n\n' +
          '---\n\n' +
          '## 🏗️ The Anatomy of a Recursive Function\n' +
          'Every correct recursive function must contain two essential components:\n' +
          '1. **Base Case**: The termination condition that stops the recursion. Without this, the function will call itself infinitely, leading to a ' + BT + 'Stack Overflow' + BT + ' error.\n' +
          '2. **Recursive Step (Reduction)**: The call to the function itself, with arguments that bring the input closer to the base case.\n\n' +
          '---\n\n' +
          '## 💻 Sample Implementation: Fibonacci Sequence\n' +
          'Here is a premium TypeScript implementation calculating Fibonacci terms:\n\n' +
          TBT + 'typescript\n' +
          '/**\n' +
          ' * Calculates the Nth term in the Fibonacci sequence.\n' +
          ' * Time Complexity: O(2^n) without memoization\n' +
          ' */\n' +
          'function fibonacci(n: number): number {\n' +
          '  // 1. Base Cases\n' +
          '  if (n <= 0) return 0;\n' +
          '  if (n === 1) return 1;\n' +
          '  \n' +
          '  // 2. Recursive Step\n' +
          '  return fibonacci(n - 1) + fibonacci(n - 2);\n' +
          '}\n\n' +
          '// Execute call\n' +
          'const result = fibonacci(6); // Returns 8\n' +
          'console.log("6th Fibonacci term: " + result);\n' +
          TBT + '\n\n' +
          '## 🌀 Stack Execution Trace (N = 3)\n' +
          TBT + 'text\n' +
          'fibonacci(3)\n' +
          ' ├── fibonacci(2)\n' +
          ' │    ├── fibonacci(1) => returns 1\n' +
          ' │    └── fibonacci(0) => returns 0\n' +
          ' │    └── sum = 1 + 0 = 1\n' +
          ' └── fibonacci(1) => returns 1\n' +
          ' └── sum = 1 + 1 = 2\n' +
          TBT + '\n\n' +
          '## 📚 Summary:\n' +
          'Always guarantee that the recursive path steadily converges toward the base case, and utilize **memoization** (caching) for heavy overlaps!';
      }

      return '# 🧠 Conceptual Explanation Engine\n\n' +
        'I can break down standard engineering, mathematical, or coding concepts. Select one of the key topics below by asking me directly:\n' +
        '- **"Explain OS Deadlock"** (Concurrency & Locking locks)\n' +
        '- **"Explain Database Normalization"** (Relational schemas 1NF, 2NF, 3NF)\n' +
        '- **"Explain Recursion"** (Data structures, base cases & call stacks)\n' +
        '- **"Difference between stack and queue"** (Linear collections)\n\n' +
        'Type any of the above terms for a detailed breakdown!';
    }

    // 5. START FOCUS SESSION / REDIRECT TIMERS
    if (q.includes('timer') || q.includes('start') || q.includes('session') || q.includes('sprint') || q.includes('pomodoro')) {
      const weakest = weakSubjects[0] || subjects[0];
      const subjectName = weakest ? weakest.name : 'your academic goals';
      const subjectId = weakest ? weakest.id : '';

      return '# ⏱️ Setup Focus Session Sprint\n\n' +
        'I have analyzed your workload. To optimize your learning curve, I recommend starting an **active deep study sprint**:\n\n' +
        '- **Recommended Subject**: **' + subjectName + '** ' + (weakest && getSubjectAttendancePercent(weakest.id) < 75 ? '🚨 (Urgent Attendance Recovery Needed)' : '') + '\n' +
        '- **Duration**: **45 Minutes** (Ideal cognitive focus threshold)\n' +
        '- **Timer Style**: **Normal Countdown Timer**\n\n' +
        '---\n\n' +
        '## ⚡ Direct Quick-Launch Hook Available!\n' +
        'Click **"Start Focus Session"** in the action chips or the sub-action below, and I will:\n' +
        '1. Programmatically write custom sprint parameters to your device storage.\n' +
        '2. Automatically redirect your app workspace to the **Focus Lounge**.\n' +
        '3. Intercept your session configurations on-mount and immediately start the timer.\n\n' +
        '> [!TIP]\n' +
        '> Make sure to grab water and minimize tabs before launching the deep study block!';
    }

    // 6. DEFAULT GENERAL DIAGNOSTICS & SUMMARY
    return '# 🎓 AI Academic Heuristic Diagnostics\n\n' +
      'I have scanned your active student profile inside STUDIQ. Here is your current overall academic standing:\n\n' +
      '## 📊 Quick Statistics\n' +
      '- **Overall Academic Health Score**: **' + healthScore + '%**\n' +
      '- **Average Attendance**: **' + avgAttendance + '%**\n' +
      '- **Pending Assignments**: ' + BT + assignments.filter(a => a.status !== 'done').length + BT + ' outstanding\n' +
      '- **Active Study Streak**: ' + BT + studyStreak + BT + ' days 🔥\n\n' +
      '## ⚠️ Academic Risk Vectors\n' +
      '- ' + (weakSubjects.length > 0 
        ? '🚨 **Critical Attendance Risk**: You have ' + BT + weakSubjects.length + BT + ' subject(s) below the 75% boundary: **' + weakSubjects.map(s => s.name + ' (' + getSubjectAttendancePercent(s.id) + '%)').join(', ') + '**.'
        : '✅ **Attendance Health**: All registered courses are safely above the 75% target threshold.') + '\n' +
      '- ' + (pendingHighPriority.length > 0
        ? '⚠️ **High Priority Tasks**: You have ' + BT + pendingHighPriority.length + BT + ' high-priority assignment(s) waiting for submission.'
        : '✅ **Assignment Status**: No outstanding high-priority tasks pending.') + '\n\n' +
      '## ⚡ Immediate Recommendations:\n' +
      '1. ' + (weakSubjects.length > 0
        ? 'Click **"Analyze Attendance"** to see the exact class recovery breakdown to avoid bunk limitations.'
        : 'Click **"Generate Roadmap"** to build a structured prep sprint for your upcoming finals.') + '\n' +
      '2. Start a **45-minute Focus Session** targeting your weakest course.\n\n' +
      'How would you like to proceed? Ask me a direct question or click one of the quick actions!';
  };

  // INLINE CUSTOM MARKDOWN PARSER
  const renderMarkdown = (text: string) => {
    // Dynamic Regex matching code blocks using string constructor to avoid escape bugs
    const codeBlockRegex = new RegExp('(' + TBT + '[\\s\\S]*?' + TBT + ')', 'g');
    const parts = text.split(codeBlockRegex);

    return parts.map((part, index) => {
      if (part.startsWith(TBT)) {
        const codeLines = part.slice(3, -3).trim().split('\n');
        const lang = codeLines[0].match(/^[a-zA-Z0-9_-]+$/) ? codeLines[0] : '';
        const code = lang ? codeLines.slice(1).join('\n') : codeLines.join('\n');
        return (
          <pre key={index} className="my-3 p-3 bg-slate-950 dark:bg-black/90 rounded-lg text-emerald-400 dark:text-cyan-400 font-mono text-xs overflow-x-auto border border-slate-200 dark:border-white/5 shadow-inner leading-relaxed select-text">
            {lang && <div className="text-[10px] text-slate-500 font-extrabold uppercase mb-1.5 tracking-wider">{lang}</div>}
            <code>{code}</code>
          </pre>
        );
      }
      
      const lines = part.split('\n');
      return lines.map((line, lIdx) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h4 key={`${index}-${lIdx}`} className="text-xs font-black text-slate-900 dark:text-white mt-3 mb-1.5 uppercase tracking-wide flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-brand-500" /> {line.replace('### ', '')}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={`${index}-${lIdx}`} className="text-sm font-extrabold text-slate-900 dark:text-white mt-4 mb-2 border-b border-slate-200/50 dark:border-white/5 pb-1 uppercase tracking-wider">{line.replace('## ', '')}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={`${index}-${lIdx}`} className="text-base font-black text-brand-500 dark:text-brand-400 mt-4 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-500" /> {line.replace('# ', '')}</h2>;
        }
        
        // Blockquotes / Alerts
        if (line.startsWith('> ')) {
          return (
            <blockquote key={`${index}-${lIdx}`} className="my-2 pl-3 border-l-2 border-brand-500 bg-brand-500/5 py-1 px-2.5 rounded-r text-[11px] text-slate-700 dark:text-slate-300 italic leading-relaxed">
              {line.replace('> ', '')}
            </blockquote>
          );
        }
        
        // List items
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const cleanLine = line.replace(/^\s*[-*]\s+/, '');
          return (
            <li key={`${index}-${lIdx}`} className="ml-4 list-disc text-xs text-slate-700 dark:text-slate-300 my-1 leading-relaxed">
              {parseInlineStyles(cleanLine)}
            </li>
          );
        }
        
        // Table parsing
        if (line.startsWith('|')) {
          if (line.includes('---')) return null;
          
          const cells = line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
          const isHeader = lIdx === 2 || line.toLowerCase().includes('subject');
          
          return (
            <div key={`${index}-${lIdx}`} className={`flex border-b border-slate-100 dark:border-white/5 text-[11px] py-1.5 px-1 ${isHeader ? 'bg-slate-50 dark:bg-slate-900/40 font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
              {cells.map((cell, cIdx) => (
                <div key={cIdx} className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap px-1">
                  {parseInlineStyles(cell)}
                </div>
              ))}
            </div>
          );
        }
        
        // Empty line
        if (line.trim() === '') {
          return <div key={`${index}-${lIdx}`} className="h-2" />;
        }
        
        // Normal paragraph text
        return (
          <p key={`${index}-${lIdx}`} className="text-xs text-slate-700 dark:text-slate-300 my-1.5 leading-relaxed">
            {parseInlineStyles(line)}
          </p>
        );
      });
    });
  };

  const parseInlineStyles = (text: string) => {
    const boldRegex = /\*\*([\s\S]+?)\*\*/g;
    const inlineCodeRegex = new RegExp(BT + '([^' + BT + ']+)' + BT, 'g');
    
    let parts = [];
    const elements: { index: number; length: number; element: React.ReactNode }[] = [];
    
    const bolds = [...text.matchAll(boldRegex)];
    bolds.forEach(m => {
      elements.push({
        index: m.index!,
        length: m[0].length,
        element: <strong key={`b-${m.index}`} className="font-black text-slate-950 dark:text-white">{m[1]}</strong>
      });
    });
    
    const codes = [...text.matchAll(inlineCodeRegex)];
    codes.forEach(m => {
      elements.push({
        index: m.index!,
        length: m[0].length,
        element: <code key={`c-${m.index}`} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-white/5 font-mono text-[10px] text-pink-500 dark:text-cyan-400">{m[1]}</code>
      });
    });
    
    elements.sort((a, b) => a.index - b.index);
    
    let currentIdx = 0;
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (el.index < currentIdx) continue;
      
      if (el.index > currentIdx) {
        parts.push(text.substring(currentIdx, el.index));
      }
      
      parts.push(el.element);
      currentIdx = el.index + el.length;
    }
    
    if (currentIdx < text.length) {
      parts.push(text.substring(currentIdx));
    }
    
    return parts.length > 0 ? parts : text;
  };

  // Launch a focus timer for the weakest subject
  const triggerFocusTimer = () => {
    const weakest = weakSubjects[0] || subjects[0];
    const subjectId = weakest ? weakest.id : '';
    
    // Write configurations to localStorage
    localStorage.setItem('studiq_pending_timer_duration', '2700'); // 45 minutes (2700s)
    if (subjectId) {
      localStorage.setItem('studiq_pending_timer_subject', subjectId);
    }
    
    setIsOpen(false);
    navigate('/timer');
  };

  const smartActionChips = [
    { label: 'Generate Roadmap', icon: BookOpen, prompt: 'Generate academic revision roadmap plan for this semester' },
    { label: 'Explain OS Deadlock', icon: Sparkles, prompt: 'Explain deadlock in OS' },
    { label: 'Analyze Attendance', icon: Calendar, prompt: 'Analyze attendance metrics and calculate recovery' },
    { label: 'Predict SGPA', icon: TrendingUp, prompt: 'Predict SGPA requirements to reach my target CGPA' },
    { label: 'Start Focus Session', icon: Zap, action: triggerFocusTimer }
  ];

  return (
    <>
      {/* 1. FLOATING NEON AI BUTTON */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <motion.button
          drag
          dragConstraints={{ left: -window.innerWidth + 100, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(prev => !prev)}
          className="relative group p-3.5 rounded-full flex items-center justify-center bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] dark:shadow-[0_0_25px_rgba(99,102,241,0.6)] cursor-pointer overflow-hidden border border-white/20 will-change-transform"
        >
          {/* Animated pulse layer */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="absolute inset-[-4px] rounded-full border border-indigo-400/40 blur-[2px] pointer-events-none"
          />
          
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
        </motion.button>
      </div>

      {/* 2. EXPANDABLE AI PANEL OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop Blur Layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/40 dark:bg-black/80 backdrop-blur-[3px]"
            />

            {/* Main Command Workspace */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="relative w-full max-w-5xl h-[85vh] md:h-[75vh] z-10 grid grid-cols-1 md:grid-cols-10 overflow-hidden rounded-2xl border border-slate-200 dark:border-[#1b2230] bg-white dark:bg-[#080b11] [.cyberpunk_&]:bg-[#030305] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.16)] dark:shadow-[0_48px_96px_-16px_rgba(0,0,0,0.95)] [.cyberpunk_&]:shadow-[0_0_25px_rgba(6,182,212,0.15)] ring-1 ring-slate-200/50 dark:ring-white/5 flex-row"
            >
              
              {/* LEFT SIDE (60%): CHAT INTERFACE */}
              <div className="md:col-span-6 flex flex-col h-full border-r border-slate-100 dark:border-white/5 overflow-hidden">
                
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-[#0c1018] [.cyberpunk_&]:bg-[#09090c]">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-white dark:border-slate-950 rounded-full animate-ping" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-white dark:border-slate-950 rounded-full" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">STUDIQ AI Academic Coach</h3>
                      <p className="text-[10px] text-emerald-500 font-extrabold tracking-widest uppercase flex items-center gap-1 mt-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" /> Cognitive Engine Online
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Conversation Log Area */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white dark:bg-[#080b11]/40">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                        msg.sender === 'user' 
                          ? 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200' 
                          : 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                      }`}>
                        {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      {/* Bubbles */}
                      <div className={`rounded-xl px-3.5 py-2.5 text-left text-xs ${
                        msg.sender === 'user'
                          ? 'bg-slate-100 dark:bg-[#1a2230] text-slate-900 dark:text-slate-100 rounded-tr-none'
                          : 'bg-slate-50 dark:bg-[#0c111c] border border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
                      }`}>
                        {renderMarkdown(msg.text)}
                        <span className="block text-[8px] text-slate-400 dark:text-slate-500 font-extrabold mt-1 text-right">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typewriter Stream */}
                  {streamingText && (
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-brand-500/10 text-brand-500 border border-brand-500/20">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="rounded-xl px-3.5 py-2.5 text-left text-xs bg-slate-50 dark:bg-[#0c111c] border border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm">
                        {renderMarkdown(streamingText)}
                        <span className="inline-block w-1.5 h-3 bg-brand-500 animate-pulse ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Typing Loader dots */}
                  {isTyping && (
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-brand-500/10 text-brand-500 border border-brand-500/20">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="rounded-xl px-4 py-3 bg-slate-50 dark:bg-[#0c111c] border border-slate-100 dark:border-white/5 rounded-tl-none flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input Bar & Smart Actions */}
                <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0d15]/50 flex flex-col gap-3">
                  
                  {/* Smart Actions Horizontal Roller */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-2 px-2 scroll-smooth">
                    {smartActionChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => chip.action ? chip.action() : handleSendMessage(chip.prompt || '')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black text-slate-600 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 bg-white dark:bg-[#111726]/60 border border-slate-200 dark:border-white/5 rounded-xl hover:border-brand-500/30 hover:bg-brand-500/[0.02] dark:hover:bg-brand-500/5 transition-all shadow-sm flex-shrink-0 cursor-pointer active:scale-95"
                      >
                        <chip.icon className="w-3 h-3 flex-shrink-0" />
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage(input);
                    }}
                    className="flex gap-2 relative items-center"
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask your Academic strategist anything..."
                      className="flex-1 bg-white dark:bg-[#111622] text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-3 pr-10 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 dark:focus:border-brand-500/50 shadow-sm transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isTyping}
                      className="absolute right-2 p-1.5 text-white disabled:opacity-30 bg-gradient-to-tr from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-lg shadow-sm cursor-pointer transition-all active:scale-[0.95]"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>

              {/* RIGHT SIDE (40%): INTELLIGENCE PANEL */}
              <div className="md:col-span-4 flex flex-col h-full bg-slate-50/30 dark:bg-[#090c14]/40 overflow-y-auto px-5 py-5 space-y-5 text-left border-t md:border-t-0 border-slate-100 dark:border-white/5">
                
                {/* Score Header */}
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">Academic Health Index</h3>
                  <div className="flex items-center gap-4 bg-white dark:bg-[#0c111d]/90 border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    
                    {/* Floating Glow Dot */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-500/10 to-indigo-500/5 rounded-full blur-2xl" />

                    {/* Circular Score Gauge */}
                    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          className="stroke-slate-100 dark:stroke-slate-800"
                          strokeWidth="4.5"
                          fill="transparent"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          className={
                            healthScore >= 80 ? "stroke-emerald-500 shadow-glow-emerald" :
                            healthScore >= 60 ? "stroke-amber-500" :
                            "stroke-rose-500"
                          }
                          strokeWidth="4.5"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={2 * Math.PI * 26 * (1 - healthScore / 100)}
                        />
                      </svg>
                      <span className="absolute text-xs font-black text-slate-900 dark:text-white">{healthScore}%</span>
                    </div>

                    <div>
                      <div className="text-[11px] font-black text-slate-900 dark:text-slate-100">
                        {healthScore >= 80 ? '👑 Elite Performance' : healthScore >= 65 ? '⚡ Balanced Standing' : '🚨 Immediate Attention Needed'}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Calculated from attendance trends, assignment turnaround, and focus activity logs.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Warning Alerts */}
                {(weakSubjects.length > 0 || pendingHighPriority.length > 0) && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Active Risk Warnings</h3>
                    <div className="bg-rose-500/[0.04] dark:bg-rose-500/[0.02] border border-rose-500/25 dark:border-rose-500/10 rounded-2xl p-3.5 space-y-2">
                      {weakSubjects.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>{sub.name} attendance:</span>
                          </div>
                          <span className="font-extrabold text-rose-500">{getSubjectAttendancePercent(sub.id)}% / 75% target</span>
                        </div>
                      ))}
                      {pendingHighPriority.map(asg => (
                        <div key={asg.id} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="truncate max-w-[150px]">{asg.title}:</span>
                          </div>
                          <span className="font-extrabold text-amber-500">Overdue Task</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weak Subjects Ledger */}
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-brand-500" /> Weak Subject Tracker</h3>
                  {subjects.length === 0 ? (
                    <div className="text-[10px] text-slate-400 py-4 text-center">No subjects registered yet.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {subjects.map(sub => {
                        const pct = getSubjectAttendancePercent(sub.id);
                        return (
                          <div 
                            key={sub.id} 
                            className="flex items-center justify-between bg-white dark:bg-[#0c111d]/90 border border-slate-200/50 dark:border-white/5 rounded-xl px-3 py-2 shadow-sm"
                          >
                            <span className="text-[10px] text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{sub.name}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                              pct >= 75 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                            }`}>
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Study Recommendations */}
                <div className="flex-1 flex flex-col justify-end min-h-[120px]">
                  <div className="bg-brand-500/[0.04] dark:bg-brand-500/[0.02] border border-brand-500/15 dark:border-brand-500/5 rounded-2xl p-4 space-y-3 relative overflow-hidden mt-auto">
                    
                    {/* Sparkle background decoration */}
                    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-brand-500/5 rounded-full blur-xl pointer-events-none" />

                    <h4 className="text-[11px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> AI Focus Recommendations
                    </h4>
                    
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {weakSubjects.length > 0 
                        ? `Your attendance in **${weakSubjects[0].name}** is low. We recommend starting an active deep-focus study sprint immediately to secure conceptual mastery before exams.`
                        : "Your attendance stats look healthy. Run a 45m deep focus sprint today to complete pending assignments and build study streak points."}
                    </p>

                    <button
                      onClick={triggerFocusTimer}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-[10px] font-black text-white bg-gradient-to-tr from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <span>Start Focus Sprint</span>
                      <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                    </button>
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
