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
import { generateInteractiveStudyPlan } from '../../utils/aiPlanner';
import { useFocusAnalytics } from '../../context/FocusAnalyticsContext';
import { FlowState, isFlowComplete, getNextQuestion, getContextualChips, getActiveQuestion, GenerationState } from '../../utils/conversationFlowEngine';
import { FlowType, extractParameters } from '../../utils/conversationParameterResolver';


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
  const focusAnalytics = useFocusAnalytics(); // Global adaptive analytics hook

  
  // Connect to Zustand app stores
  const {
    subjects,
    attendance,
    assignments,
    studySessions,
    semesters,
    targetGpaSettings,
    user,
    isAiCoachOpen,
    aiCoachPrefilledPrompt,
    setAiCoachOpen
  } = useAppStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(() => localStorage.getItem('studiq_ai_coach_draft') || '');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // Persist input draft on change
  useEffect(() => {
    localStorage.setItem('studiq_ai_coach_draft', input);
  }, [input]);
  
  // Conversational Flow Engine States
  const [activeFlow, setActiveFlow] = useState<FlowType | undefined>(undefined);
  const [flowState, setFlowState] = useState<FlowState>({});
  const [thinkingStepText, setThinkingStepText] = useState<string>('');
  const [generationState, setGenerationState] = useState<GenerationState>('idle');

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
        text: '👋 **Welcome to your STUDIQ AI Coach!**\n\n' +
          'I can help you create study plans, improve attendance tracking, understand difficult concepts, and organize your academic workload.\n\n' +
          'What would you like help with today?',
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

  // Hook for platform-wide contextual triggers
  useEffect(() => {
    if (isAiCoachOpen && aiCoachPrefilledPrompt) {
      handleSendMessage(aiCoachPrefilledPrompt);
      // Reset the prefilled prompt context to prevent infinite loops
      useAppStore.getState().setAiCoachOpen(true, '');
    }
  }, [isAiCoachOpen, aiCoachPrefilledPrompt]);

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

  // INTERACTION ENGINE: TRIGGER LOCAL EXPERT INFEREN  // INTERACTION ENGINE: TRIGGER LOCAL EXPERT INFERENCE
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
    localStorage.setItem('studiq_ai_coach_draft', '');

    // Synchronously calculate current ActiveQuestion before applying new parameters
    const currentActiveQuestion = activeFlow ? getActiveQuestion(activeFlow, flowState) : null;

    // Synchronously extract parameters & map intent continuation
    const extracted = extractParameters(textToSend, subjects, currentActiveQuestion);
    
    let newFlow = activeFlow;
    let newState = { ...flowState };

    const { intent, ...otherParams } = extracted;

    // 1. Silent Flow Recovery / Switching intent context
    if (intent && intent !== activeFlow) {
      newFlow = intent;
      newState = { ...otherParams };
    } else {
      if (!newFlow && intent) {
        newFlow = intent;
      }
      newState = { ...newState, ...otherParams };
    }

    // Track parameter extraction attempts and inject fallbacks if necessary
    const attempts = newState.attempts ? { ...newState.attempts } : {};

    if (newFlow && currentActiveQuestion) {
      // If there was an outstanding question, check if it was successfully resolved
      let wasResolved = false;
      if (currentActiveQuestion === 'subject' && newState.subject) wasResolved = true;
      if (currentActiveQuestion === 'durationDays' && newState.durationDays) wasResolved = true;
      if (currentActiveQuestion === 'dailyHours' && newState.dailyHours !== undefined) wasResolved = true;
      if (currentActiveQuestion === 'conceptName' && newState.conceptName) wasResolved = true;
      if (currentActiveQuestion === 'depth' && newState.depth) wasResolved = true;

      if (!wasResolved) {
        // Increment attempts for the failed question!
        attempts[currentActiveQuestion] = (attempts[currentActiveQuestion] || 0) + 1;
      }
    }

    // Now, apply conversational fallbacks based on attempt counts
    if (newFlow === 'exam_plan') {
      if (!newState.subject && (attempts.subject || 0) >= 2) {
        newState.subject = 'all';
        newState.subjectName = 'All Subjects';
        newState.subjectScope = 'multi_subject';
        newState.subjectResolved = true;
      }
      if (newState.subject && !newState.durationDays && (attempts.durationDays || 0) >= 2) {
        newState.durationDays = 5;
      }
      if (newState.subject && newState.durationDays && newState.dailyHours === undefined && (attempts.dailyHours || 0) >= 2) {
        newState.dailyHours = 4;
      }
    } else if (newFlow === 'attendance_help') {
      if (!newState.subject && (attempts.subject || 0) >= 2 && subjects.length > 0) {
        newState.subject = subjects[0].id;
        newState.subjectName = subjects[0].name;
      }
    } else if (newFlow === 'topic_explanation') {
      if (!newState.conceptName && (attempts.conceptName || 0) >= 2) {
        newState.conceptName = 'Deadlocks';
      }
      if (newState.conceptName && !newState.depth && (attempts.depth || 0) >= 2) {
        newState.depth = 'simple';
      }
    } else if (newFlow === 'study_schedule') {
      if (!newState.dailyHours && (attempts.dailyHours || 0) >= 2) {
        newState.dailyHours = 4;
      }
    }
    newState.attempts = attempts;

    // Set active question dynamically in the state
    const nextActiveQuestion = newFlow ? getActiveQuestion(newFlow, newState) : null;
    newState.activeQuestion = nextActiveQuestion || undefined;

    // Set updated states for the React rendering cycles
    setActiveFlow(newFlow);
    setFlowState(newState);

    const isComplete = newFlow ? isFlowComplete(newFlow, newState) : false;

    // Sequential Debug transition logging
    console.log("Conversational State Machine:", {
      activeFlow: newFlow,
      activeQuestion: nextActiveQuestion,
      flowState: newState,
      isComplete,
      generationState: 'idle'
    });

    if (isComplete) {
      // Transition to generating!
      setGenerationState('generating');
      setIsTyping(false);

      const steps = [
        'Analyzing subjects...',
        'Building revision structure...',
        'Balancing workload...',
        'Preparing your roadmap...'
      ];

      let stepIdx = 0;
      setThinkingStepText(steps[0]);
      const stepInterval = setInterval(() => {
        stepIdx++;
        if (stepIdx < steps.length) {
          setThinkingStepText(steps[stepIdx]);
        } else {
          clearInterval(stepInterval);
        }
      }, 500);

      // Reassurance progressive timeout fallback
      let active = true;
      const generationTimeout = setTimeout(() => {
        if (active) {
          const reassuranceMsg: Message = {
            sender: 'coach',
            text: "I'm still preparing your study plan...",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, reassuranceMsg]);
        }
      }, 4000);

      // Transition simulation
      setTimeout(() => {
        if (generationTimeout) clearTimeout(generationTimeout);
        clearInterval(stepInterval);
        active = false;

        try {
          const responseText = generateLocalAIResponse(textToSend, newFlow, newState);
          
          // Clear active flow states only after successful compilation
          setActiveFlow(undefined);
          setFlowState({});
          setGenerationState('completed');

          streamResponse(responseText);
        } catch (error) {
          console.error("AI Generation Failure:", error);
          setGenerationState('error');
          const errorText = "⚠️ Something interrupted the response generation. Please try again.";
          streamResponse(errorText);
        }
      }, 2000); // 2.0s comprehensive status spin

    } else {
      // Follow-up question state
      setIsTyping(true);
      setGenerationState('collecting');

      const isPlanningQuery = !!newFlow;
      const steps = isPlanningQuery 
        ? [
            'Structuring custom sprint topics...',
            'Analyzing assignment queues and weak subjects...',
            'Balancing revision density with rest breaks...'
          ]
        : [
            'Reviewing workspace details...',
            'Formulating practical guidance...'
          ];

      let stepIdx = 0;
      setThinkingStepText(steps[0]);
      const stepInterval = setInterval(() => {
        stepIdx++;
        if (stepIdx < steps.length) {
          setThinkingStepText(steps[stepIdx]);
        } else {
          clearInterval(stepInterval);
        }
      }, 300);

      // Fast conversational simulation
      setTimeout(() => {
        clearInterval(stepInterval);
        setThinkingStepText('');
        try {
          const responseText = generateLocalAIResponse(textToSend, newFlow, newState);
          setIsTyping(false);
          setGenerationState('idle');
          streamResponse(responseText);
        } catch (error) {
          console.error("AI Question Error:", error);
          setIsTyping(false);
          setGenerationState('error');
          streamResponse("I'm here to help, but I hit a tiny snag. Could you rephrase that?");
        }
      }, isPlanningQuery ? 1000 : 500);
    }
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

  // Context-aware dynamic response generator
  const generateLocalAIResponse = (query: string, currentFlow?: FlowType, currentState?: FlowState): string => {
    const q = query.toLowerCase();
    
    let flowToUse = currentFlow;
    let stateToUse = currentState || {};

    // 1. CHECK IF CONVERSATIONAL FLOW IS ACTIVE AND INCOMPLETE
    if (flowToUse && !isFlowComplete(flowToUse, stateToUse)) {
      return getNextQuestion(flowToUse, stateToUse, subjects);
    }

    // 2. CONVERSATION FLOW ROUTER (WHEN COMPLETE OR TRIGGERED DIRECTLY)
    if (flowToUse === 'exam_plan') {
      const userStreak = user?.stats?.studyStreak || 0;
      
      const subjectName = stateToUse.subjectName || stateToUse.subject || 'your key subjects';
      const durationDays = stateToUse.durationDays || 5;
      const dailyHours = stateToUse.dailyHours || 4;

      const ctx = {
        goalType: subjectName,
        deadlineDays: durationDays,
        dailyAvailableHours: dailyHours,
        weakSubjects: weakSubjects.map(s => s.name),
        targetIntensity: 'moderate' as const
      };

      // Reset the active flow state upon successful plan compilation to enable next interactions
      setActiveFlow(undefined);
      setFlowState({});

      const res = generateInteractiveStudyPlan(ctx as any, subjects, attendance, assignments, studySessions, userStreak);
      const timelineText = durationDays === 1 ? 'Tomorrow' : `In ${durationDays} Days`;
      return `📘 **${durationDays}-Day Study Plan — ${subjectName}**\n\n**Available Study Time**: ${dailyHours} hours daily\n**Exam**: ${timelineText}\n\n${res.planText}`;
    }

    if (flowToUse === 'attendance_help' || q.includes('attendance') || q.includes('absent') || q.includes('bunk') || q.includes('class')) {
      // Clear flow state
      setActiveFlow(undefined);
      setFlowState({});

      if (subjects.length === 0) {
        return '⚠️ **No Subjects Registered**\n' +
          'I see you don\'t have any subjects registered yet! Go ahead and add some subjects on the **Attendance** tab so I can calculate your consecutive lecture requirements.';
      }

      const targetSubjectId = stateToUse.subject;
      const filteredSubjects = targetSubjectId
        ? subjects.filter(s => s.id === targetSubjectId || s.name.toLowerCase() === targetSubjectId.toLowerCase())
        : subjects;

      if (filteredSubjects.length === 0) {
        return `I couldn't find a course matching "${targetSubjectId}". Double check that it's registered in your profile!`;
      }

      let response = '📊 **Attendance Buffer & Bunk Calculator**\n\n' +
        'Here is your current class attendance status and consecutives required to maintain the 75% goal:\n\n' +
        '| Subject | Code | Attendance | Status | Consecutive Classes Required |\n' +
        '| :--- | :--- | :--- | :--- | :--- |\n';

      filteredSubjects.forEach(sub => {
        const pct = getSubjectAttendancePercent(sub.id);
        const attRecord = attendance.find(a => a.subjectId === sub.id);
        const attended = attRecord ? attRecord.records.filter(r => r.status === 'attended').length : 0;
        const total = attRecord ? attRecord.records.filter(r => r.status !== 'cancelled').length : 0;
        
        let statusTag = '✅ Healthy';
        let recoveryClasses = '0';

        if (pct < 75) {
          statusTag = '🚨 Critical Risk';
          const required = Math.max(0, 3 * total - 4 * attended);
          recoveryClasses = `**Attend next ${required} classes**`;
        } else if (pct < 80) {
          statusTag = '⚠️ Warning Boundary';
          const required = Math.max(0, 3 * total - 4 * attended);
          recoveryClasses = required > 0 ? `Attend next ${required} classes` : 'Keep attending';
        } else {
          const canBunk = Math.max(0, Math.floor((4 * attended - 3 * total) / 3));
          recoveryClasses = canBunk > 0 ? `Can safely skip next **${canBunk}** classes` : 'Perfect attendance';
        }

        response += `| ${sub.name} | \`${sub.code}\` | **${pct}%** (${attended}/${total}) | ${statusTag} | ${recoveryClasses} |\n`;
      });

      if (weakSubjects.length > 0) {
        response += `\n\n### 💡 Recovery Advice:\n` +
          `Prioritize attending **${weakSubjects.map(s => s.name).join(', ')}** to bring your attendance back to a safe standing.`;
      } else {
        response += `\n\n### 💡 Recovery Advice:\n` +
          `Great standing! All of your subjects are currently safely above the 75% threshold.`;
      }

      return response;
    }

    if (flowToUse === 'topic_explanation' || q.includes('explain') || q.includes('concept')) {
      const concept = stateToUse.conceptName || '';
      const depth = stateToUse.depth || 'simple';

      setActiveFlow(undefined);
      setFlowState({});

      if (concept === 'deadlock') {
        let res = '# 🧠 Concept Breakdown: Operating System Deadlocks\n\n' +
          'A **Deadlock** occurs when a group of processes are unable to proceed because each holds a resource and waits for another resource held by another process.\n\n';

        if (depth === 'simple') {
          res += '### 🎭 The Real-World Analogy: "Four-Way Traffic Jam"\n' +
            'Imagine four cars reaching an intersection simultaneously. Each car occupies a lane and blocks the next one. No one can move forward or back up without someone else yielding first.\n\n' +
            '### ⚙️ The Four Necessary Conditions\n' +
            'A deadlock only happens if all four conditions occur together:\n' +
            '1. **Mutual Exclusion**: Resources cannot be shared.\n' +
            '2. **Hold and Wait**: Processes keep their resources while waiting for new ones.\n' +
            '3. **No Preemption**: Resources cannot be taken away by force.\n' +
            '4. **Circular Wait**: P0 waits for P1, who waits for P0.';
        } else if (depth === 'code') {
          res += '## 💻 Thread-Safe Lock Allocation (TypeScript)\n\n' +
            'Deadlocks are resolved by enforcing a strict, global locking sequence:\n\n' +
            TBT + 'typescript\n' +
            '// DANGEROUS: Mismatched lock order can deadlock\n' +
            'async function unsafeTask() {\n' +
            '  await acquireLock("A");\n' +
            '  await acquireLock("B");\n' +
            '}\n\n' +
            '// SAFE: Always acquire locks in alphabetical sequence\n' +
            'async function safeTask() {\n' +
            '  await acquireLock("A");\n' +
            '  await acquireLock("B");\n' +
            '}\n' +
            TBT;
        } else {
          res += '## ⚙️ Summary of OS Deadlock Prevention\n' +
            '- **Detection**: Periodically check allocation graphs.\n' +
            '- **Prevention**: Restructure code to deny circular waiting.\n' +
            '- **Enforcement**: standard resource locking order limits state deadlock.';
        }

        return res;
      }

      if (concept === 'normalization') {
        return '# 🧠 Database Normalization\n\n' +
          'Normalization organizes database tables to reduce **redundancy** and prevent **anomalies**:\n\n' +
          '- **1NF (Atomicity)**: Every column must contain single, indivisible values.\n' +
          '- **2NF (No Partial Dependency)**: In 1NF, and non-key columns must fully depend on the primary key.\n' +
          '- **3NF (No Transitive Dependency)**: In 2NF, and no non-key columns can depend on other non-key columns.';
      }

      if (concept === 'recursion') {
        return '# 🧠 Recursion in Coding\n\n' +
          'Recursion is when a function calls itself to break a large task into smaller, identical sub-tasks.\n\n' +
          '### 🏗️ Every recursive function needs:\n' +
          '1. **Base Case**: A clear stopping condition to prevent infinite loops (Stack Overflow).\n' +
          '2. **Recursive Step**: Calling itself with inputs that gradually approach the base case.';
      }

      return '# 🧠 Conceptual Explanation Engine\n\n' +
        'I can break down standard engineering concepts simply. Ask me to:\n' +
        '- **"Explain OS deadlocks"** (Concurrency & safety locks)\n' +
        '- **"Explain DB normalization"** (Database relational design)\n' +
        '- **"Explain recursion"** (Coding base cases & stack behavior)';
    }

    if (flowToUse === 'study_schedule' || q.includes('schedule') || q.includes('routine')) {
      const dailyHours = stateToUse.dailyHours || 4;

      setActiveFlow(undefined);
      setFlowState({});

      return `# 📅 Optimized ${dailyHours}-Hour Daily Focus Routine\n\n` +
        `Here is a balanced study template designed to keep you focused without burnout:\n\n` +
        `- **09:00 - 10:30 (90 min Focus block)**: High-energy tasks (e.g., Coding, Algorithms).\n` +
        `- *10:30 - 10:45 (15 min Rest block)*: Grab a drink, rest your eyes.\n` +
        `- **11:00 - 12:00 (60 min Review block)**: Clear assignments, review lectures.\n` +
        `- **15:00 - 16:30 (90 min Light block)**: Complete lab files, notes, or cards.\n\n` +
        `> [!TIP]\n` +
        `> Check your **Focus Intelligence** dashboard to align these blocks with your optimal focus hours!`;
    }

    if (flowToUse === 'sgpa_guidance' || q.includes('gpa') || q.includes('sgpa') || q.includes('cgpa')) {
      setActiveFlow(undefined);
      setFlowState({});

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

      return '# 🔮 Academic GPA Target Planning\n\n' +
        `To elevate your CGPA from **${currentCgpa}** to your goal of **${targetCgpa}** in **${remainingSems}** sems:\n\n` +
        `> **You must secure an average of ${reqSgpa} SGPA** in all remaining semesters.\n\n` +
        (isAchievable 
          ? `🟢 **Status: highly Achievable!** Try to maintain a study schedule of at least ${Math.round(reqSgpa * 8)} hours weekly.`
          : `🔴 **Status: High Target Boundary!** Hitting this target requires a ${reqSgpa} SGPA, which exceeds the 10.0 scale. Consider adjusting your goal in settings.`);
    }

    if (flowToUse === 'productivity_help' || q.includes('productivity') || q.includes('burnout') || q.includes('timer') || q.includes('fatigue')) {
      setActiveFlow(undefined);
      setFlowState({});

      const burnoutRisk = focusAnalytics?.burnoutRisk || 'Stable';
      const consistency = focusAnalytics?.focusConsistencyScore || 0;

      return `# 🧠 Study Workflow & Fatigue recovery Advice\n\n` +
        `Based on your active study behavior metrics:\n` +
        `- **Fatigue Level**: \`${burnoutRisk}\`\n` +
        `- **Consistency Score**: \`${consistency}%\`\n\n` +
        `### 💡 Recommended Actions:\n` +
        (burnoutRisk === 'Stable'
          ? `1. Your fatigue level is in a healthy range! Use an **Adaptive Pomodoro** (25/5 or 45/15) to maintain this rhythm.\n2. Dedicate blocks during your optimal focus window.`
          : `1. **Elevated fatigue detected.** I recommend taking a break and shifting to shorter Pomodoro intervals (e.g. 20m study, 10m break).\n2. Avoid back-to-back study blocks until your fatigue index returns to Stable.`);
    }

    // Dynamic Default Guidance Prompt
    return '👋 **Hello! I can help you with multiple academic tasks:**\n\n' +
      '- 📅 **Study sprinters**: Ask me to *"Create a 5-day exam plan"* for subject prep.\n' +
      '- 📉 **Attendance buffers**: Ask *"Help with my attendance"* to see consecutive class counts.\n' +
      '- 🧠 **Conceptual doubt‑solving**: Ask me to explain deadlocks, database normalization, or recursion.\n\n' +
      'What would you like help with today?';
  };

  // Conversational Quick Option Cards & Post-Plan Refinement Chips
  const renderInteractiveChips = (lastMessage: Message) => {
    return null;
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
    
    setAiCoachOpen(false);
    navigate('/timer');
  };

  // Dynamic smartActionChips selector using active flow context
  const activeChips = activeFlow ? getContextualChips(activeFlow, flowState, subjects) : [];

  const smartActionChips: Array<{ label: string; icon: any; prompt?: string; action?: () => void }> = activeChips.length > 0 
    ? activeChips.map(label => {
        let icon = Sparkles;
        if (label.includes('Timer') || label.includes('Session')) icon = Zap;
        else if (label.includes('Attendance') || label.includes('Calculator') || label.includes('Estimate') || label.includes('Bunk') || label.includes('Recovery')) icon = Calendar;
        else if (label.includes('Plan') || label.includes('Sprint') || label.includes('Focus') || label.includes('Roadmap')) icon = BookOpen;
        else if (label.includes('Target') || label.includes('GPA') || label.includes('SGPA') || label.includes('Calculator')) icon = TrendingUp;

        if (label === 'Start Focus Session' || label === 'Start Focus Timer') {
          return { label, icon, action: triggerFocusTimer };
        }
        return { label, icon, prompt: label };
      })
    : [
        { label: 'Create study plan', icon: BookOpen, prompt: 'Create study plan' },
        { label: 'Explain OS Deadlock', icon: Sparkles, prompt: 'Explain OS deadlock' },
        { label: 'Analyze Attendance', icon: Calendar, prompt: 'Analyze attendance metrics' },
        { label: 'Help improve SGPA', icon: TrendingUp, prompt: 'Help improve my SGPA' },
        { label: 'Start Focus Session', icon: Zap, action: triggerFocusTimer }
      ];

  // Add a cancel/reset chip if an active flow context is open
  if (activeFlow) {
    smartActionChips.unshift({
      label: 'Reset Chat',
      icon: X,
      action: () => {
        setActiveFlow(undefined);
        setFlowState({});
        setMessages(prev => [
          ...prev,
          {
            sender: 'coach',
            text: 'Conversational context reset. What would you like to focus on now?',
            timestamp: new Date()
          }
        ]);
      }
    });
  }

  return (
    <>
      {/* 1. FLOATING NEON AI BUTTON */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <motion.button
          drag
          dragConstraints={{ left: -window.innerWidth + 100, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setAiCoachOpen(!isAiCoachOpen)}
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
        {isAiCoachOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop Blur Layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAiCoachOpen(false)}
              className="fixed inset-0 bg-slate-950/40 dark:bg-black/80 backdrop-blur-[3px]"
            />

            {/* Main Command Workspace */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className={`relative w-full ${
                messages.filter(m => m.sender === 'user').length > 0 ? 'max-w-2xl' : 'max-w-5xl'
              } h-[85vh] md:h-[75vh] z-10 grid grid-cols-1 md:grid-cols-10 overflow-hidden rounded-2xl border border-slate-200 dark:border-[#1b2230] bg-white dark:bg-[#080b11] [.cyberpunk_&]:bg-[#030305] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.16)] dark:shadow-[0_48px_96px_-16px_rgba(0,0,0,0.95)] [.cyberpunk_&]:shadow-[0_0_25px_rgba(6,182,212,0.15)] ring-1 ring-slate-200/50 dark:ring-white/5 flex-row transition-all duration-300 ease-in-out`}
            >
              
              {/* LEFT SIDE: CHAT INTERFACE */}
              <div className={`${
                messages.filter(m => m.sender === 'user').length > 0 ? 'md:col-span-10' : 'md:col-span-6'
              } flex flex-col h-full border-r border-slate-100 dark:border-white/5 overflow-hidden`}>
                
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
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">AI Coach</h3>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setAiCoachOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Conversation Log Area */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white dark:bg-[#080b11]/40">
                  {messages.filter(m => m.sender === 'user').length === 0 ? (
                    <div className="py-6 px-4 mb-4 border border-black/[0.06] dark:border-white/[0.06] bg-card/30 rounded-2xl space-y-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] backdrop-blur-sm relative overflow-hidden text-center max-w-md mx-auto mt-4 animate-fade-in">
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.03] to-transparent pointer-events-none" />
                      
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-cyan-400 flex items-center justify-center text-white mx-auto shadow-md shadow-brand-500/20">
                        <Bot className="w-5 h-5 animate-pulse" />
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-sans font-black text-sm text-foreground tracking-tight">Conversational Assistant</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Ask me to create a study plan, calculate attendance recovery, or explain a concept.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                        <span className="text-[10px] text-slate-500 dark:text-slate-450 uppercase font-mono tracking-wider block text-left font-bold">Suggested quick prompts:</span>
                        <div className="flex flex-col gap-2">
                          {[
                            '“Create a 5-day exam plan”',
                            '“Help improve my SGPA”',
                            '“Optimize my study schedule”',
                            '“Build a Pomodoro revision routine”'
                          ].map(promptText => {
                            const cleanText = promptText.replace(/[“”"']/g, '');
                            return (
                              <button
                                key={promptText}
                                type="button"
                                onClick={() => handleSendMessage(cleanText)}
                                className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-350 hover:text-brand-500 dark:hover:text-brand-400 bg-white dark:bg-[#111726]/60 border border-slate-200 dark:border-white/5 rounded-xl hover:bg-brand-500/[0.06] active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-between group shadow-sm"
                              >
                                <span>{promptText}</span>
                                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-brand-500" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
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
                            : 'bg-slate-50 dark:bg-[#0c111c] border border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm w-full'
                        }`}>
                          {renderMarkdown(msg.text)}

                          <span className="block text-[8px] text-slate-400 dark:text-slate-500 font-extrabold mt-2 text-right">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}

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

                  {/* Premium Generation Loader */}
                  {generationState === 'generating' && (
                    <div className="flex gap-3 max-w-[85%] animate-pulse">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-brand-500/10 text-brand-500 border border-brand-500/20">
                        <Bot className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                      </div>
                      <div className="rounded-xl px-4.5 py-3.5 bg-brand-500/[0.03] dark:bg-brand-500/[0.05] border border-brand-500/20 rounded-tl-none flex flex-col gap-2.5 shadow-sm max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                          </span>
                          <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest font-mono">Generating Custom Plan...</span>
                        </div>
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold leading-normal">
                          {thinkingStepText || 'Structuring optimal revision sprint...'}
                        </span>
                        <div className="w-full bg-slate-200 dark:bg-white/10 h-1 rounded-full overflow-hidden">
                          <motion.div 
                            className="bg-brand-500 h-full rounded-full"
                            initial={{ width: "10%" }}
                            animate={{ width: "95%" }}
                            transition={{ duration: 2.0, ease: "easeInOut" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Typing Loader dots */}
                  {isTyping && (
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-brand-500/10 text-brand-500 border border-brand-500/20">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="rounded-xl px-4 py-3 bg-slate-50 dark:bg-[#0c111c] border border-slate-100 dark:border-white/5 rounded-tl-none flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        {thinkingStepText && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wide italic animate-pulse">{thinkingStepText}</span>
                        )}
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
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black text-slate-600 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 bg-white dark:bg-[#111726]/60 border border-slate-200 dark:border-white/5 rounded-xl hover:border-brand-500/30 hover:bg-brand-500/[0.02] dark:hover:bg-brand-500/5 transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.98] shadow-sm flex-shrink-0 cursor-pointer"
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
                      placeholder="Ask anything about studies, planning, attendance, or concepts..."
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
              {messages.filter(m => m.sender === 'user').length === 0 && (
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
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
