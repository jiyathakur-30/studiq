import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Plus,
  Trash2,
  TrendingUp,
  Award,
  AlertTriangle,
  Sparkles,
  Info,
  Calendar,
  Layers,
  HeartPulse,
  ChevronRight
} from 'lucide-react';
import { useAppStore, SemesterRecord } from '../context/store';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface SGPAInputCourse {
  id: string;
  name: string;
  credits: number;
  gradePoint: number;
}

// --- THEME-AWARE TYPOGRAPHY CONSTANTS ---
const TXT_PRIMARY = "text-slate-900 dark:text-white";
const TXT_SECONDARY = "text-slate-700 dark:text-slate-300";
const TXT_MUTED = "text-slate-500 dark:text-slate-400";

export const PerformanceCenter: React.FC = () => {
  const {
    semesters,
    addSemester,
    deleteSemester,
    targetGpaSettings,
    updateTargetGpaSettings,
    subjects,
    attendance,
    assignments,
    user
  } = useAppStore();

  // --- SGPA CALCULATOR STATE ---
  const [sgpaCourses, setSgpaCourses] = useState<SGPAInputCourse[]>([
    { id: '1', name: 'CS-302 Computer Architecture', credits: 4, gradePoint: 9 },
    { id: '2', name: 'CS-310 Advanced Algorithms', credits: 4, gradePoint: 8 },
    { id: '3', name: 'PHY-285 Quantum Physics', credits: 3, gradePoint: 10 },
    { id: '4', name: 'UX-104 Interaction Design', credits: 3, gradePoint: 9 }
  ]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState('3');
  const [newCourseGrade, setNewCourseGrade] = useState('9');

  // --- CGPA LEDGER INPUT STATE ---
  const [semNameInput, setSemNameInput] = useState('');
  const [semSgpaInput, setSemSgpaInput] = useState('');
  const [semCreditsInput, setSemCreditsInput] = useState('20');
  const [ledgerError, setLedgerError] = useState('');

  // --- TARGET GPA INPUT STATE ---
  const [targetGpaInput, setTargetGpaInput] = useState(targetGpaSettings.targetCgpa.toString());
  const [remainingSemestersInput, setRemainingSemestersInput] = useState(targetGpaSettings.remainingSemesters.toString());

  // --- GRADE LETTER LOOKUP SYSTEM ---
  const gradePointsMap = [
    { letter: 'O (Outstanding)', value: 10 },
    { letter: 'A+ (Excellent)', value: 9 },
    { letter: 'A (Very Good)', value: 8 },
    { letter: 'B+ (Good)', value: 7 },
    { letter: 'B (Above Average)', value: 6 },
    { letter: 'C (Average)', value: 5 },
    { letter: 'P (Pass)', value: 4 },
    { letter: 'F (Fail)', value: 0 }
  ];

  // --- MATHEMATICAL MATH ENGINES ---

  // 1. Calculate active SGPA calculator value
  const sgpaResult = useMemo(() => {
    const totalCredits = sgpaCourses.reduce((acc, c) => acc + c.credits, 0);
    if (totalCredits === 0) return 0;
    const weightedPoints = sgpaCourses.reduce((acc, c) => acc + (c.credits * c.gradePoint), 0);
    return Math.round((weightedPoints / totalCredits) * 100) / 100;
  }, [sgpaCourses]);

  // 2. Cumulative historical CGPA
  const currentCgpa = useMemo(() => {
    if (semesters.length === 0) return 0;
    const totalCredits = semesters.reduce((acc, s) => acc + s.credits, 0);
    if (totalCredits === 0) {
      // Fallback simple average if credits missing
      const sumSgpas = semesters.reduce((acc, s) => acc + s.sgpa, 0);
      return Math.round((sumSgpas / semesters.length) * 100) / 100;
    }
    const weightedSgpas = semesters.reduce((acc, s) => acc + (s.sgpa * s.credits), 0);
    return Math.round((weightedSgpas / totalCredits) * 100) / 100;
  }, [semesters]);

  const totalCreditsEarned = useMemo(() => {
    return semesters.reduce((acc, s) => acc + s.credits, 0);
  }, [semesters]);

  // 3. Target GPA Forecast calculator
  const targetForecast = useMemo(() => {
    const target = parseFloat(targetGpaInput) || 9.0;
    const remaining = parseInt(remainingSemestersInput) || 4;
    const completed = semesters.length;

    if (remaining <= 0) {
      return { requiredSgpa: 0, status: 'Invalid remaining semesters', color: 'text-rose-500' };
    }

    const totalSemesters = completed + remaining;
    
    // Total credits completed vs projected
    const avgCompletedCredits = completed > 0 ? totalCreditsEarned / completed : 20;
    const projectedTotalCredits = totalCreditsEarned + (remaining * avgCompletedCredits);
    
    // Target cumulative grade-points needed
    const totalPointsNeeded = target * projectedTotalCredits;
    const currentPointsAchieved = semesters.reduce((acc, s) => acc + (s.sgpa * s.credits), 0);
    const pointsNeeded = totalPointsNeeded - currentPointsAchieved;
    
    const totalRemainingCredits = remaining * avgCompletedCredits;
    const requiredSgpa = Math.round((pointsNeeded / totalRemainingCredits) * 100) / 100;

    let status = 'Cake Walk';
    let color = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    let desc = 'You are already in a powerful academic position. Keep the standard momentum!';

    if (requiredSgpa > 10.0) {
      status = 'Impossibility 🚫';
      color = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-glow-rose';
      desc = 'Target CGPA is mathematically unreachable in the remaining terms. Consider adjusting target or extending semesters.';
    } else if (requiredSgpa >= 9.0) {
      status = 'Elite Grind Required 🔴';
      color = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
      desc = 'Near-perfect semesters required. Focus entirely on high-credit modules and maximize active recall!';
    } else if (requiredSgpa >= 7.5) {
      status = 'High Performance Needed 🟠';
      color = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
      desc = 'Solid deep focus required. Maintain robust study streams and keep assignments verified.';
    } else if (requiredSgpa >= 6.0) {
      status = 'Comfortable 🟡';
      color = 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      desc = 'Extremely achievable. Consistent work and standard attendance compliance will carry you through.';
    }

    return {
      requiredSgpa: Math.max(0, requiredSgpa),
      status,
      color,
      desc
    };
  }, [targetGpaInput, remainingSemestersInput, semesters, totalCreditsEarned]);

  // 4. Academic Health Engine Score (0-100 Scale)
  const healthResult = useMemo(() => {
    // CGPA contributes 50%
    const cgpaScore = currentCgpa ? (currentCgpa / 10) * 100 * 0.5 : 40 * 0.5;

    // Attendance contributes 20%
    let totalClasses = 0;
    let attendedClasses = 0;
    attendance.forEach(sub => {
      sub.records.forEach(rec => {
        totalClasses++;
        if (rec.status === 'attended') attendedClasses++;
      });
    });
    const attendancePercent = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 80;
    const attendanceScore = (attendancePercent / 100) * 100 * 0.2;

    // Assignment Completion contributes 20%
    const totalTasks = assignments.length;
    const completedTasks = assignments.filter(t => t.status === 'done').length;
    const taskPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 75;
    const taskScore = (taskPercent / 100) * 100 * 0.2;

    // Study streak contributes 10%
    const streak = user?.stats?.studyStreak || 1;
    const streakScore = Math.min(10, streak) * 10; // Cap at 10 days max contribution

    const finalScore = Math.min(100, Math.round(cgpaScore + attendanceScore + taskScore + streakScore));

    let status = 'Stable';
    let colorClass = 'text-indigo-600 dark:text-indigo-400';
    let borderClass = 'border-indigo-500/20';
    let bgGradient = 'from-indigo-500/20 to-brand-500/5';
    let recommendation = 'Keep tracking your lectures and finish assignments on time to solidify your standing!';

    if (finalScore >= 88) {
      status = 'Elite 👑';
      colorClass = 'text-emerald-600 dark:text-emerald-400 shadow-glow-emerald';
      borderClass = 'border-emerald-500/30';
      bgGradient = 'from-emerald-500/20 to-teal-500/5';
      recommendation = 'Phenomenal productivity metrics! You are managing focus streams, attendance, and grades at startup founder capability.';
    } else if (finalScore >= 72) {
      status = 'Excellent 🌟';
      colorClass = 'text-emerald-600 dark:text-emerald-400';
      borderClass = 'border-emerald-500/20';
      bgGradient = 'from-emerald-500/10 to-indigo-500/5';
      recommendation = 'Highly balanced academic lifestyle. Maintain your weekly study streaks to unlock elite ratings.';
    } else if (finalScore >= 55) {
      status = 'Stable 👍';
      colorClass = 'text-indigo-600 dark:text-indigo-400';
      borderClass = 'border-indigo-500/20';
      bgGradient = 'from-indigo-500/10 to-brand-500/5';
      recommendation = 'Your metrics are secure, but focus spacing could optimize your GPA radar further. Log more Pomodoros!';
    } else if (finalScore >= 40) {
      status = 'Moderate Risk ⚠️';
      colorClass = 'text-amber-600 dark:text-amber-400';
      borderClass = 'border-amber-500/20';
      bgGradient = 'from-amber-500/10 to-card/5';
      recommendation = 'Low attendance or missed assignments are pulling down your compliance metrics. Tackle upcoming tasks in Kanban!';
    } else {
      status = 'Academic Danger 🚨';
      colorClass = 'text-rose-600 dark:text-rose-400 shadow-glow-rose animate-pulse';
      borderClass = 'border-rose-500/30';
      bgGradient = 'from-rose-500/20 to-red-500/5';
      recommendation = 'CRITICAL ALERT: Compliance indicators have entered critical boundaries. Immediate Pomodoro study locks and assignment resolution advised!';
    }

    return {
      score: finalScore,
      status,
      colorClass,
      borderClass,
      bgGradient,
      recommendation,
      attendancePercent: Math.round(attendancePercent),
      taskPercent: Math.round(taskPercent)
    };
  }, [currentCgpa, attendance, assignments, user]);

  // --- RECHARTS ANALYTICS FORMATTERS ---
  const lineChartData = useMemo(() => {
    return semesters.map((s, idx) => ({
      name: s.name,
      GPA: s.sgpa,
      Average: currentCgpa
    }));
  }, [semesters, currentCgpa]);

  const barChartData = useMemo(() => {
    return semesters.map(s => ({
      name: s.name,
      Credits: s.credits,
      GPWeight: Math.round(s.sgpa * s.credits * 10) / 10
    }));
  }, [semesters]);

  const radarChartData = useMemo(() => {
    if (subjects.length === 0) {
      return [
        { subject: 'Hardware', A: 90, B: 85, fullMark: 100 },
        { subject: 'Theory', A: 85, B: 90, fullMark: 100 },
        { subject: 'Design', A: 95, B: 80, fullMark: 100 },
        { subject: 'Physics', A: 80, B: 75, fullMark: 100 }
      ];
    }
    // Map subjects dynamically
    return subjects.map(sub => {
      const subNotes = useAppStore.getState().notes.filter(n => n.subjectId === sub.id);
      const subTasks = assignments.filter(a => a.subjectId === sub.id);
      
      // Compute a simulated score out of 100
      const compRate = subTasks.length > 0 ? (subTasks.filter(t => t.status === 'done').length / subTasks.length) * 100 : 75;
      const noteCount = subNotes.length * 20; // 5 notes maxes category
      
      const masteryScore = Math.min(100, Math.round(compRate * 0.7 + Math.min(30, noteCount)));
      return {
        subject: sub.code || sub.name.substring(0, 8),
        Mastery: masteryScore,
        fullMark: 100
      };
    });
  }, [subjects, assignments]);

  // Correlation: Focus Minutes logged vs SGPA
  const correlationData = [
    { name: 'Sem 1', StudyHours: 60, SGPA: 8.4 },
    { name: 'Sem 2', StudyHours: 85, SGPA: 8.6 },
    { name: 'Sem 3', StudyHours: 110, SGPA: 8.8 },
    { name: 'Sem 4', StudyHours: 135, SGPA: 9.0 }
  ];

  // --- CONTROLLER HANDLERS ---
  const handleAddSgpaCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    const course: SGPAInputCourse = {
      id: Date.now().toString(),
      name: newCourseName,
      credits: parseInt(newCourseCredits) || 3,
      gradePoint: parseInt(newCourseGrade) || 9
    };
    setSgpaCourses([...sgpaCourses, course]);
    setNewCourseName('');
  };

  const handleRemoveSgpaCourse = (id: string) => {
    setSgpaCourses(sgpaCourses.filter(c => c.id !== id));
  };

  const handleAddSemesterLedger = (e: React.FormEvent) => {
    e.preventDefault();
    setLedgerError('');
    if (!semNameInput.trim() || !semSgpaInput.trim()) {
      setLedgerError('Please fill out all semester fields.');
      return;
    }
    const sgpa = parseFloat(semSgpaInput);
    const credits = parseInt(semCreditsInput);
    if (isNaN(sgpa) || sgpa < 0 || sgpa > 10) {
      setLedgerError('SGPA must be a valid number between 0.0 and 10.0');
      return;
    }
    if (isNaN(credits) || credits <= 0) {
      setLedgerError('Credits must be a positive integer.');
      return;
    }
    addSemester({
      name: semNameInput,
      sgpa,
      credits
    });
    setSemNameInput('');
    setSemSgpaInput('');
  };

  const handleTargetSettingsChange = (updates: Partial<typeof targetGpaSettings>) => {
    updateTargetGpaSettings(updates);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 relative z-10">
      
      {/* 🚀 Welcome Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-glass-card p-8 rounded-2xl"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-[90px] z-0 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <GraduationCap size={32} />
            </div>
            <div className="text-left">
              <h2 className={`font-sans font-extrabold text-2xl ${TXT_PRIMARY} tracking-tight flex items-center gap-2`}>
                Academic Performance Center <span className="text-xs text-brand-500 dark:text-brand-400 bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 px-2 py-0.5 rounded-full font-bold">ALGORITHMIC INTELLIGENCE</span>
              </h2>
              <p className={`text-sm ${TXT_MUTED} mt-1 max-w-xl leading-relaxed`}>
                Analyze historical CGPAs, map future target required grades, and track your overall compliance ratings using Stripe-style analytical pipelines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className={`text-[10px] ${TXT_MUTED} uppercase font-bold tracking-wider`}>CUMULATIVE CGPA</span>
              <div className={`text-3xl font-black ${TXT_PRIMARY} tracking-tight glow-text mt-0.5`}>
                {currentCgpa ? currentCgpa.toFixed(2) : '0.00'}
              </div>
            </div>
            <div className="h-12 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block" />
            <div className="text-right">
              <span className={`text-[10px] ${TXT_MUTED} uppercase font-bold tracking-wider`}>CREDITS EARNED</span>
              <div className={`text-3xl font-black ${TXT_PRIMARY} tracking-tight mt-0.5`}>
                {totalCreditsEarned}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🚀 Main Visual Row: Health Score & Target Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module A: Academic Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 premium-glass-card"
        >
          <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-tr ${healthResult.bgGradient} rounded-full blur-[80px] z-0 pointer-events-none`} />
          
          <div className="relative z-10 flex flex-col justify-between h-full w-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-left">
                <HeartPulse size={18} className="text-brand-500" />
                <span className={`font-bold ${TXT_PRIMARY} text-sm`}>Academic Health Score</span>
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${TXT_MUTED} bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800`}>
                <Info size={12} className="text-brand-500" /> Capped dynamically
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-6">
              {/* Health Score Circle Meter */}
              <div className="md:col-span-4 flex justify-center">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-slate-200 dark:text-slate-800 stroke-current"
                      strokeWidth="8"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    />
                    <motion.circle
                      className="text-brand-500 stroke-current"
                      strokeWidth="8"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      strokeDasharray="251.2"
                      initial={{ strokeDashoffset: 251.2 }}
                      animate={{ strokeDashoffset: 251.2 - (251.2 * healthResult.score) / 100 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className={`text-3xl font-black ${TXT_PRIMARY} tracking-tighter`}>{healthResult.score}</span>
                    <span className={`text-[9px] font-bold ${TXT_MUTED} uppercase tracking-wider`}>HEALTH SCORE</span>
                  </div>
                </div>
              </div>

              {/* Health Compliance Metrics Details */}
              <div className="md:col-span-8 space-y-4 text-left">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${TXT_MUTED} uppercase font-bold`}>STATUS LEVEL:</span>
                  <span className={`text-sm font-black px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 ${healthResult.colorClass}`}>
                    {healthResult.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className={`text-[10px] ${TXT_MUTED} font-bold block`}>CGPA CONTRIBUTION</span>
                    <span className={`text-base font-extrabold ${TXT_PRIMARY}`}>{currentCgpa ? (currentCgpa).toFixed(2) : '0.00'} / 10</span>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className={`text-[10px] ${TXT_MUTED} font-bold block`}>LECTURE ATTENDANCE</span>
                    <span className={`text-base font-extrabold ${TXT_PRIMARY}`}>{healthResult.attendancePercent}%</span>
                  </div>
                </div>

                <p className={`text-xs ${TXT_SECONDARY} leading-relaxed`}>
                  🤖 <strong className={`${TXT_PRIMARY} font-extrabold`}>AI Health Advisor:</strong> {healthResult.recommendation}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Module B: Target CGPA Predictor */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="premium-glass-card flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800 text-left relative z-10">
            <TrendingUp size={18} className="text-brand-500" />
            <span className={`font-bold ${TXT_PRIMARY} text-sm`}>Target GPA Predictor</span>
          </div>

          <div className="space-y-4 py-4 text-left relative z-10">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] ${TXT_MUTED} font-bold uppercase`}>TARGET CGPA</label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  max="10"
                  value={targetGpaInput}
                  onChange={(e) => {
                    setTargetGpaInput(e.target.value);
                    handleTargetSettingsChange({ targetCgpa: parseFloat(e.target.value) || 9.0 });
                  }}
                  className={`bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm font-bold ${TXT_PRIMARY} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 transition-all`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={`text-[10px] ${TXT_MUTED} font-bold uppercase`}>REMAINING SEMS</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={remainingSemestersInput}
                  onChange={(e) => {
                    setRemainingSemestersInput(e.target.value);
                    handleTargetSettingsChange({ remainingSemesters: parseInt(e.target.value) || 4 });
                  }}
                  className={`bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm font-bold ${TXT_PRIMARY} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 transition-all`}
                />
              </div>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <span className={`text-[10px] ${TXT_MUTED} font-semibold block`}>REQUIRED FUTURE SEMESTERS SGPA</span>
              <div className={`text-3xl font-black ${targetForecast.requiredSgpa > 10.0 ? 'text-rose-500' : 'text-brand-500'} tracking-tight glow-text`}>
                {targetForecast.requiredSgpa > 10.0 ? 'IMPOSSIBLE' : targetForecast.requiredSgpa.toFixed(2)}
              </div>
              <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${targetForecast.color}`}>
                {targetForecast.status}
              </span>
            </div>

            <p className={`text-[11px] ${TXT_SECONDARY} leading-snug`}>
              {targetForecast.desc}
            </p>
          </div>
        </motion.div>

      </div>

      {/* 🚀 Interactive Calculations: SGPA & CGPA Split panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
        
        {/* Module C: Interactive SGPA Sandbox */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-glass-card flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl z-0 pointer-events-none" />
          
          <div className="relative z-10 w-full flex flex-col justify-between h-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-left">
                <Layers size={18} className="text-brand-500" />
                <span className={`font-bold ${TXT_PRIMARY} text-sm`}>Interactive SGPA Sandbox</span>
              </div>
              <div className="text-right">
                <span className={`text-[9px] ${TXT_MUTED} font-semibold uppercase block`}>PREDICTED SGPA</span>
                <span className="text-lg font-black text-brand-500 glow-text">{sgpaResult.toFixed(2)}</span>
              </div>
            </div>

            {/* Course input form */}
            <form onSubmit={handleAddSgpaCourse} className="grid grid-cols-1 sm:grid-cols-12 gap-3 py-4 items-end">
              <div className="sm:col-span-6 text-left">
                <label className={`text-[9px] font-bold ${TXT_MUTED} uppercase ml-1`}>Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. CS-312 Networks"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs ${TXT_PRIMARY} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 transition-all`}
                />
              </div>

              <div className="sm:col-span-3 text-left">
                <label className={`text-[9px] font-bold ${TXT_MUTED} uppercase ml-1`}>Credits</label>
                <select
                  value={newCourseCredits}
                  onChange={(e) => setNewCourseCredits(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs ${TXT_PRIMARY} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 transition-all`}
                >
                  <option value="1" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">1 Credit</option>
                  <option value="2" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2 Credits</option>
                  <option value="3" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">3 Credits</option>
                  <option value="4" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">4 Credits</option>
                  <option value="5" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">5 Credits</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <Button type="submit" variant="primary" className="w-full !rounded-lg py-1.5 text-xs font-bold gap-1 justify-center h-8">
                  <Plus size={12} /> Add
                </Button>
              </div>
            </form>

            {/* Course row entries */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <AnimatePresence>
                {sgpaCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 hover:border-brand-500/20 transition-all group"
                  >
                    <div className="flex flex-col text-left">
                      <span className={`text-xs font-bold ${TXT_PRIMARY}`}>{course.name}</span>
                      <span className={`text-[9px] ${TXT_MUTED}`}>{course.credits} Credits • Weighted: {course.credits * course.gradePoint}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Grade Selector dropdown */}
                      <select
                        value={course.gradePoint}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setSgpaCourses(sgpaCourses.map(c => c.id === course.id ? { ...c, gradePoint: val } : c));
                        }}
                        className={`bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-[11px] font-bold ${TXT_PRIMARY} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 transition-all`}
                      >
                        {gradePointsMap.map(gp => (
                          <option key={gp.value} value={gp.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                            {gp.letter} ({gp.value} pts)
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveSgpaCourse(course.id)}
                        className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 active:scale-95 opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 focus-visible:outline-none transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {sgpaCourses.length === 0 && (
                <div className={`text-center py-8 text-xs ${TXT_MUTED}`}>
                  No courses added. Start building a sandbox SGPA record above!
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Module D: Cumulative Semesters Ledger */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="premium-glass-card flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl z-0 pointer-events-none" />
          
          <div className="relative z-10 w-full flex flex-col justify-between h-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-left">
                <Calendar size={18} className="text-brand-500" />
                <span className={`font-bold ${TXT_PRIMARY} text-sm`}>Semesters GPA Ledger</span>
              </div>
              <div className="text-right">
                <span className={`text-[9px] ${TXT_MUTED} font-semibold uppercase block`}>COMPLETED TERMS</span>
                <span className="text-lg font-black text-brand-500">{semesters.length} Semesters</span>
              </div>
            </div>

            {/* Semester ledger inputs */}
            <form onSubmit={handleAddSemesterLedger} className="grid grid-cols-1 sm:grid-cols-12 gap-3 py-4 items-end">
              <div className="sm:col-span-5 text-left">
                <label className={`text-[9px] font-bold ${TXT_MUTED} uppercase ml-1`}>Semester Name</label>
                <input
                  type="text"
                  placeholder="e.g. Semester 5"
                  value={semNameInput}
                  onChange={(e) => setSemNameInput(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs ${TXT_PRIMARY} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 transition-all`}
                />
              </div>

              <div className="sm:col-span-4 text-left col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-[9px] font-bold ${TXT_MUTED} uppercase`}>SGPA</label>
                  <input
                     type="number"
                     step="0.05"
                     min="0"
                     max="10"
                     placeholder="8.5"
                     value={semSgpaInput}
                     onChange={(e) => setSemSgpaInput(e.target.value)}
                     className={`w-full bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs ${TXT_PRIMARY} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 transition-all`}
                  />
                </div>
                <div>
                  <label className={`text-[9px] font-bold ${TXT_MUTED} uppercase`}>Credits</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="20"
                    value={semCreditsInput}
                    onChange={(e) => setSemCreditsInput(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs ${TXT_PRIMARY} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 transition-all`}
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <Button type="submit" variant="primary" className="w-full !rounded-lg py-1.5 text-xs font-bold gap-1 justify-center h-8">
                  <Plus size={12} /> Log
                </Button>
              </div>
            </form>

            {ledgerError && <div className="text-[10px] text-rose-500 text-left pb-2 font-semibold">{ledgerError}</div>}

            {/* Semester rows ledger list */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <AnimatePresence>
                {semesters.map((sem) => (
                  <motion.div
                    key={sem.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 hover:border-brand-500/20 transition-all group"
                  >
                    <div className="flex flex-col text-left">
                      <span className={`text-xs font-bold ${TXT_PRIMARY}`}>{sem.name}</span>
                      <span className={`text-[9px] ${TXT_MUTED}`}>{sem.credits} Total Credits Earned</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-extrabold ${TXT_PRIMARY} bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded`}>
                        SGPA: {sem.sgpa.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteSemester(sem.id)}
                        className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 active:scale-95 opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 focus-visible:outline-none transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {semesters.length === 0 && (
                <div className={`text-center py-8 text-xs ${TXT_MUTED}`}>
                  No historical semesters registered. Log your first semester above!
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </div>

      {/* 🚀 Analytics & Metric Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
        
        {/* Graph 1: GPA Progress Trend Line */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="premium-glass-card text-left"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl z-0 pointer-events-none" />
          
          <div className="relative z-10 w-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <span className={`font-bold ${TXT_PRIMARY} text-sm`}>GPA Progression Trend</span>
              <span className="text-[10px] text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full font-bold">HISTORICAL LINE</span>
            </div>

            <div className="h-72 w-full">
              {semesters.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="currentColor" 
                      className="text-slate-400 dark:text-slate-500" 
                      fontSize={10} 
                      fontWeight={600}
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      stroke="currentColor" 
                      className="text-slate-400 dark:text-slate-500" 
                      fontSize={10} 
                      fontWeight={600}
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs shadow-xl text-left">
                              <p className={`font-extrabold ${TXT_PRIMARY}`}>{payload[0].payload.name}</p>
                              {payload.map((item, idx) => (
                                <p key={idx} className="mt-1" style={{ color: item.color }}>
                                  {item.name}: <strong className={`${TXT_PRIMARY}`}>{item.value}</strong>
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="GPA" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#gpaGradient)" name="Semester SGPA" />
                    <Line type="monotone" dataKey="Average" stroke="#10b981" strokeDasharray="5 5" dot={false} strokeWidth={1.5} name="Cumulative CGPA" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className={`flex items-center justify-center h-full text-xs ${TXT_MUTED}`}>
                  Log semester records to view GPA area curves.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Graph 2: Credit GPWeight bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="premium-glass-card text-left"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl z-0 pointer-events-none" />
          
          <div className="relative z-10 w-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <span className={`font-bold ${TXT_PRIMARY} text-sm`}>Semesters Weight & Credits Breakdown</span>
              <span className="text-[10px] text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full font-bold">BAR PLOT</span>
            </div>

            <div className="h-72 w-full">
              {semesters.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="currentColor" 
                      className="text-slate-400 dark:text-slate-500" 
                      fontSize={10} 
                      fontWeight={600}
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="currentColor" 
                      className="text-slate-400 dark:text-slate-500" 
                      fontSize={10} 
                      fontWeight={600}
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs shadow-xl text-left">
                              <p className={`font-extrabold ${TXT_PRIMARY}`}>{payload[0].payload.name}</p>
                              {payload.map((item, idx) => (
                                <p key={idx} className="mt-1" style={{ color: item.color }}>
                                  {item.name}: <strong className={`${TXT_PRIMARY}`}>{item.value}</strong>
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Credits" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="GPWeight" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={`flex items-center justify-center h-full text-xs ${TXT_MUTED}`}>
                  Log semester records to view credit distributions.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Graph 3: Subject Mastery Radar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="premium-glass-card text-left"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl z-0 pointer-events-none" />
          
          <div className="relative z-10 w-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <span className={`font-bold ${TXT_PRIMARY} text-sm`}>Subject Compliance & Mastery Radar</span>
              <span className="text-[10px] text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full font-bold">RADAR MESH</span>
            </div>

            <div className="h-72 w-full flex justify-center items-center">
              {subjects.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                    <PolarGrid stroke="var(--border-color)" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      stroke="currentColor" 
                      className="text-slate-400 dark:text-slate-500" 
                      fontSize={10} 
                      fontWeight={700}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      stroke="currentColor" 
                      className="text-slate-400 dark:text-slate-500" 
                      fontSize={9} 
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs shadow-xl text-left">
                              <p className={`font-extrabold ${TXT_PRIMARY}`}>{data.subject}</p>
                              <p className="text-brand-500 font-bold mt-0.5">Mastery Score: {data.Mastery}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Radar name="Mastery Level" dataKey="Mastery" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className={`flex items-center justify-center h-full text-xs ${TXT_MUTED}`}>
                  Add active subject courses to generate compliance radar meshes.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Graph 4: Study Duration vs GPA Correlation */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="premium-glass-card text-left"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl z-0 pointer-events-none" />
          
          <div className="relative z-10 w-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <span className={`font-bold ${TXT_PRIMARY} text-sm`}>Focus Spacing vs GPA Correlation</span>
              <span className="text-[10px] text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full font-bold">CORRELATION</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={correlationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="currentColor" 
                    className="text-slate-400 dark:text-slate-500" 
                    fontSize={10} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="currentColor" 
                    className="text-slate-400 dark:text-slate-500" 
                    fontSize={10} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false} 
                    label={{ 
                      value: 'Study Hours', 
                      angle: -90, 
                      position: 'insideLeft', 
                      offset: 10, 
                      style: { fill: 'currentColor', fontSize: 10, fontWeight: 600 } 
                    }} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="currentColor" 
                    className="text-slate-400 dark:text-slate-500" 
                    fontSize={10} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false} 
                    label={{ 
                      value: 'SGPA', 
                      angle: 90, 
                      position: 'insideRight', 
                      offset: 10, 
                      style: { fill: 'currentColor', fontSize: 10, fontWeight: 600 } 
                    }} 
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs shadow-xl text-left">
                            <p className={`font-extrabold ${TXT_PRIMARY}`}>{payload[0].payload.name}</p>
                            {payload.map((item, idx) => (
                              <p key={idx} className="mt-1" style={{ color: item.color }}>
                                {item.name}: <strong className={`${TXT_PRIMARY}`}>{item.value}</strong>
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="StudyHours" stroke="#06b6d4" strokeWidth={2.5} name="Study Logs (Mins)" />
                  <Line yAxisId="right" type="monotone" dataKey="SGPA" stroke="#10b981" strokeWidth={2.5} name="Achieved SGPA" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

      </div>

    </div>
  );
};

export default PerformanceCenter;
