import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import {
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  Brain,
  Play,
  Pause,
  Square,
  Activity,
  Zap,
  BookOpen
} from 'lucide-react';
import { useAppStore } from '../context/store';
import { Link, useNavigate } from 'react-router-dom';
import { getGreetingByTime } from '../utils/time';
import { useFocusIntelligence } from '../hooks/useFocusIntelligence';
import { EmptyState } from '../components/common/EmptyState';
import { useFocusAnalytics } from '../context/FocusAnalyticsContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const focusAnalytics = useFocusAnalytics(); // Global adaptive analytics hook

  const {
    status,
    elapsedSeconds,
    focusDuration,
    idleDuration,
    distractionCount,
    distractionDuration,
    history,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession,
    completeSession,
    currentFocusScore
  } = useFocusIntelligence();

  const user = useAppStore((state) => state.user);
  const isLoading = useAppStore((state) => state.isLoading);
  const subjects = useAppStore((state) => state.subjects);
  const attendance = useAppStore((state) => state.attendance);
  const assignments = useAppStore((state) => state.assignments);
  const studySessions = useAppStore((state) => state.studySessions);

  const hasFocusData = useCallback((hist: any[]) => {
    return hist && hist.length > 0;
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatFriendlyDuration = useCallback((seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }, []);

  const focusHistoryData = useMemo(() => {
    if (!hasFocusData(history)) return [];
    return [...history]
      .filter((sess) => {
        const hasValidDuration = typeof sess.focusDuration === 'number' && sess.focusDuration >= 0;
        const hasValidScore = typeof sess.focusScore === 'number' && sess.focusScore >= 0;
        const hasValidTime = sess.startTime && !isNaN(new Date(sess.startTime).getTime());
        return hasValidDuration && hasValidScore && hasValidTime;
      })
      .slice(0, 5)
      .reverse()
      .map((sess) => {
        const normalizedTime = new Date(sess.startTime).getTime();
        const d = new Date(normalizedTime);
        return {
          name: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
          Score: sess.focusScore,
          Duration: Math.round(sess.focusDuration / 60),
          Distractions: sess.distractionCount
        };
      });
  }, [history, hasFocusData]);

  const averageFocusScore = useMemo(() => {
    if (!hasFocusData(history)) return 0;
    const valid = history.filter(s => typeof s.focusScore === 'number' && s.focusScore >= 0);
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((acc, curr) => acc + curr.focusScore, 0) / valid.length);
  }, [history, hasFocusData]);

  const totalDeepWorkHours = useMemo(() => {
    if (!hasFocusData(history)) return '0h';
    const valid = history.filter(s => typeof s.focusDuration === 'number' && s.focusDuration >= 0);
    const totalSec = valid.reduce((acc, curr) => acc + curr.focusDuration, 0);
    const totalMins = Math.round(totalSec / 60);
    if (totalMins < 60) return `${totalMins}m`;
    return `${(totalMins / 60).toFixed(1)}h`;
  }, [history, hasFocusData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  const focusInsights = useMemo(() => {
    if (history.length === 0) {
      return [
        { tag: 'CALIBRATION', text: "Awaiting study logs to initialize metrics." }
      ];
    }
    const totalDist = history.reduce((acc, curr) => acc + curr.distractionCount, 0);
    const avgDist = (totalDist / history.length).toFixed(1);
    
    const insights = [];
    if (averageFocusScore >= 85) {
      insights.push({ tag: 'FLOW RATIO', text: `Steady flow state logged at ${averageFocusScore}%.` });
    } else if (averageFocusScore >= 70) {
      insights.push({ tag: 'FLOW RATIO', text: `Focus stabilizes healthy at ${averageFocusScore}%.` });
    } else {
      insights.push({ tag: 'FLOW RATIO', text: `Calibrating: index registered at ${averageFocusScore}%.` });
    }

    if (Number(avgDist) > 2.5) {
      insights.push({ tag: 'WORKSPACE SHIELD', text: `Frequent context jumps identified.` });
    } else {
      insights.push({ tag: 'WORKSPACE SHIELD', text: `Minimal context switching recorded.` });
    }

    insights.push({ tag: 'CHRONO CAL', text: `Peak window verified: 6 PM – 8 PM.` });
    return insights;
  }, [history, averageFocusScore]);

  const totalFocusMinutes = useMemo(() => {
    return studySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  }, [studySessions]);
  
  const pendingAssignments = useMemo(() => {
    return assignments.filter(a => a.status !== 'done');
  }, [assignments]);

  const overdueAssignments = useMemo(() => {
    return pendingAssignments.filter(a => new Date(a.dueDate) < new Date());
  }, [pendingAssignments]);

  const overallAttendance = useMemo(() => {
    let totalClasses = 0;
    let totalAttended = 0;

    attendance.forEach((subj) => {
      subj.records.forEach((rec) => {
        if (rec.status !== 'cancelled') {
          totalClasses += 1;
          if (rec.status === 'attended') {
            totalAttended += 1;
          }
        }
      });
    });

    return totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
  }, [attendance]);

  const targetAttendance = user?.settings.targetAttendance || 75;

  const productivityScore = useMemo(() => {
    const doneTasksCount = assignments.filter(a => a.status === 'done').length;
    const totalTasksCount = assignments.length;

    let totalClasses = 0;
    attendance.forEach((subj) => {
      subj.records.forEach((rec) => {
        if (rec.status !== 'cancelled') {
          totalClasses += 1;
        }
      });
    });

    if (totalTasksCount === 0 && totalClasses === 0 && studySessions.length === 0) {
      return 0;
    }

    const taskRatio = totalTasksCount > 0 ? (doneTasksCount / totalTasksCount) * 100 : 0;
    const attendanceRatio = totalClasses > 0 ? overallAttendance : 0;
    const streakBonus = Math.min((user?.stats.studyStreak ?? 0) * 4, 20);

    return Math.min(Math.round((taskRatio * 0.4) + (attendanceRatio * 0.4) + 20 + streakBonus), 100);
  }, [assignments, overallAttendance, user, attendance, studySessions]);

  const attendanceTrend = useMemo(() => {
    let totalRecentClasses = 0;
    let totalRecentAttended = 0;
    let totalOldClasses = 0;
    let totalOldAttended = 0;

    attendance.forEach((subj) => {
      const sortedRecords = [...subj.records]
        .filter(r => r.status !== 'cancelled')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const halfCount = Math.floor(sortedRecords.length / 2);
      const oldRecords = sortedRecords.slice(0, halfCount);
      const recentRecords = sortedRecords.slice(halfCount);

      oldRecords.forEach(r => {
        totalOldClasses++;
        if (r.status === 'attended') totalOldAttended++;
      });

      recentRecords.forEach(r => {
        totalRecentClasses++;
        if (r.status === 'attended') totalRecentAttended++;
      });
    });

    if (totalRecentClasses === 0 || totalOldClasses === 0) {
      return { status: 'STABLE', explanation: 'Attendance stable' };
    }

    const recentPct = (totalRecentAttended / totalRecentClasses) * 100;
    const oldPct = (totalOldAttended / totalOldClasses) * 100;
    const diff = recentPct - oldPct;

    if (diff < -5) {
      return { 
        status: 'DECLINING', 
        explanation: `Attendance ↓ ${Math.round(Math.abs(diff))}% this week`
      };
    } else if (diff > 5) {
      return { 
        status: 'IMPROVING', 
        explanation: `Attendance ↑ ${Math.round(diff)}% this week`
      };
    } else {
      return { 
        status: 'STABLE', 
        explanation: 'Attendance stable'
      };
    }
  }, [attendance]);

  const focusConsistency = useMemo(() => {
    if (history.length === 0) {
      return { status: 'CALIBRATING', explanation: '0 sessions logged' };
    }
    
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeSessions = history.filter(s => new Date(s.startTime).getTime() > sevenDaysAgo);
    
    const uniqueDays = new Set(
      activeSessions.map(s => new Date(s.startTime).toDateString())
    ).size;

    if (uniqueDays >= 4 && averageFocusScore >= 80) {
      return { 
        status: 'HIGH', 
        explanation: `${uniqueDays} focus sessions this week`
      };
    } else if (uniqueDays >= 2) {
      return { 
        status: 'MODERATE', 
        explanation: `${uniqueDays} focus sessions logged`
      };
    } else {
      return { 
        status: 'INCONSISTENT', 
        explanation: `${uniqueDays} sessions logged`
      };
    }
  }, [history, averageFocusScore]);

  const workloadPressure = useMemo(() => {
    const pendingCount = pendingAssignments.length;
    const overdueCount = overdueAssignments.length;

    const baseScore = pendingCount * 12 + overdueCount * 28;
    const score = Math.max(10, Math.min(100, Math.round(baseScore)));

    let status = 'LOW';
    let explanation = 'Comfortable pace';

    if (overdueCount > 0) {
      status = 'CRITICAL';
      explanation = `${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} pending`;
    } else if (score >= 60) {
      status = 'HIGH';
      explanation = `${pendingCount} pending tasks`;
    } else if (score >= 30) {
      status = 'MODERATE';
      explanation = 'Moderate pressure';
    }

    return { score, status, explanation };
  }, [assignments, pendingAssignments, overdueAssignments]);

  const highestRiskAssignment = useMemo(() => {
    if (pendingAssignments.length === 0) return null;

    const sorted = [...pendingAssignments].sort((a, b) => {
      const aOverdue = new Date(a.dueDate) < new Date();
      const bOverdue = new Date(b.dueDate) < new Date();
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      const aDiff = new Date(a.dueDate).getTime() - Date.now();
      const bDiff = new Date(b.dueDate).getTime() - Date.now();
      return aDiff - bDiff;
    });

    return sorted[0];
  }, [pendingAssignments]);

  const weeklyData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: d.toDateString(),
        minutes: 0
      });
    }

    studySessions.forEach((sess) => {
      const sDateStr = new Date(sess.date).toDateString();
      const match = last7Days.find(d => d.dateStr === sDateStr);
      if (match) {
        match.minutes += sess.durationMinutes;
      }
    });

    return last7Days;
  }, [studySessions]);

  const aiSuggestions = useMemo(() => {
    const alerts = [];

    // 1. Workload Pressure
    if (workloadPressure.status === 'CRITICAL') {
      alerts.push({
        type: 'danger',
        text: workloadPressure.explanation
      });
    } else if (workloadPressure.status === 'HIGH') {
      alerts.push({
        type: 'warning',
        text: workloadPressure.explanation
      });
    }

    // 2. Attendance Trend
    if (attendanceTrend.status === 'DECLINING') {
      alerts.push({
        type: 'warning',
        text: attendanceTrend.explanation
      });
    }

    // 3. Focus Consistency
    if (focusConsistency.status === 'INCONSISTENT') {
      alerts.push({
        type: 'warning',
        text: focusConsistency.explanation
      });
    }

    // Fallback default suggestions
    if (alerts.length === 0) {
      alerts.push({
        type: 'success',
        text: `Optimal academic trajectory logged. Maintaining a ${user?.stats.studyStreak ?? 0}-day study streak boosts predicted GPA by +0.15.`
      });
      alerts.push({
        type: 'success',
        text: 'All operational parameters stable. Workload velocity and class attendance rates align perfectly with your 9.0 CGPA baseline.'
      });
    }

    return alerts.slice(0, 3);
  }, [workloadPressure, attendanceTrend, focusConsistency, user]);

  const calibrationMockData = [
    { name: 'CAL-01', Score: 20 },
    { name: 'CAL-02', Score: 40 },
    { name: 'CAL-03', Score: 30 },
    { name: 'CAL-04', Score: 65 },
    { name: 'CAL-05', Score: 45 },
    { name: 'CAL-06', Score: 80 },
    { name: 'CAL-07', Score: 60 }
  ];

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in max-w-7xl mx-auto px-4 sm:px-5 pb-12 text-left">
      
      {/* ========================================== */}
      {/* TIER 1: Greeting & Productivity Pulse     */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
           {/* Welcome Greeting Card */}
        <div className="lg:col-span-7 relative overflow-hidden rounded-2xl border border-border/80 bg-card/45 backdrop-blur-xl p-4 shadow-sm hover:shadow-md hover:border-brand-500/10 transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.99]">
          
          {/* Subtle ambient gradient depth layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/[0.035] via-transparent to-slate-900/[0.04] pointer-events-none" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/[0.025] rounded-full blur-[60px] pointer-events-none" />

          {/* Internal two-column layout: greeting left, micro-panel right */}
          <div className="relative z-10 flex flex-col lg:flex-row gap-3 lg:gap-4 h-full">

            {/* LEFT: Greeting + Actions */}
            <div className="flex flex-col justify-between gap-3 flex-1 min-w-0 py-0.5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[9px] text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded-full border border-brand-500/20 font-mono font-bold uppercase tracking-wider">
                    <span className="h-1 w-1 rounded-full bg-brand-500 animate-pulse" /> Workspace synced
                  </span>
                </div>
                
                <h2 className="font-sans font-black text-2xl sm:text-3xl text-foreground leading-tight tracking-tight mt-1">
                  {(() => {
                    const greeting = getGreetingByTime();
                    const name = user?.username || 'Sarah';
                    return greeting === 'Working late?' ? `Working late, ${name}?` : `${greeting}, ${name}!`;
                  })()}
                </h2>
                
                <p className="text-muted-foreground text-xs leading-relaxed max-w-sm">
                  Workspace synced. You have <strong className="text-foreground font-semibold">{pendingAssignments.length} active tasks</strong> requiring action.
                </p>
              </div>
              
              {/* Fast Actions */}
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <Link to="/timer" className="px-4 py-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-glow-brand transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.985] group">
                  <Clock size={12} /> Start Focus <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
                <Link to="/assignments" className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 border border-border text-foreground font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.985] group">
                  <ClipboardList size={12} /> Manage Kanban <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* RIGHT: Contextual Workspace Intelligence Panel */}
            <div className="lg:w-48 xl:w-52 shrink-0 flex flex-col gap-3 bg-slate-500/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.05] rounded-xl p-3.5 shadow-sm">

              {/* Panel header */}
              <div className="flex items-center gap-1.5 pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
                <Brain size={11} className="text-brand-500 shrink-0" />
                <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground font-bold">Workspace Intel</span>
              </div>

              {/* WORKLOAD */}
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground/70 block font-semibold">WORKLOAD</span>
                <p className="text-[11px] text-foreground font-extrabold leading-snug">
                  {workloadPressure.score}% · {workloadPressure.status}
                </p>
                <p className="text-[9px] text-muted-foreground leading-normal mt-0.5 font-medium">{workloadPressure.explanation}</p>
              </div>

              {/* ATTENDANCE */}
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground/70 block font-semibold">ATTENDANCE</span>
                <p className="text-[11px] text-foreground font-extrabold leading-snug">
                  {attendanceTrend.explanation}
                </p>
              </div>

              {/* FOCUS */}
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground/70 block font-semibold">FOCUS</span>
                <p className="text-[11px] text-foreground font-extrabold leading-snug">
                  {focusConsistency.explanation}
                </p>
              </div>

            </div>

          </div>
        </div>


        {/* Intelligent KPI Cards (Calm, Minimal, Operational) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 sm:gap-5 items-stretch">
          
          {/* Streak KPI */}
          <div className="bg-card/30 backdrop-blur-xl rounded-2xl border border-black/[0.06] dark:border-white/5 p-4 sm:p-5 flex flex-col justify-between gap-2 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] hover:shadow-md hover:border-brand-500/10 transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.985] group">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] font-mono text-muted-foreground/75 dark:text-white/35 tracking-[0.18em] uppercase block">STREAK</span>
                <span className="text-xl sm:text-2xl font-sans font-black text-foreground tracking-tight block truncate leading-none mt-1">
                  {user?.stats.studyStreak ?? 0} Days
                </span>
              </div>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                <Flame size={14} className="fill-amber-500" />
              </div>
            </div>
            <div className="border-t border-dashed border-border/40 pt-2 text-[10px] text-muted-foreground block truncate">
              Streak active • locks in 6h
            </div>
          </div>

          {/* Productivity Index KPI */}
          <div className="bg-card/30 backdrop-blur-xl rounded-2xl border border-black/[0.06] dark:border-white/5 p-4 sm:p-5 flex flex-col justify-between gap-2 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] hover:shadow-md hover:border-brand-500/10 transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.985] group">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-0.5">
                <span className="text-[9px] font-mono text-muted-foreground/75 dark:text-white/35 tracking-[0.18em] uppercase block">PRODUCTIVITY</span>
                <span className="text-xl sm:text-2xl font-sans font-black text-foreground tracking-tight block truncate leading-none mt-1">
                  {productivityScore}% Score
                </span>
              </div>
              <div className="h-8 w-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shrink-0 shadow-sm">
                <TrendingUp size={14} />
              </div>
            </div>
            <div className="border-t border-dashed border-border/40 pt-2">
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${productivityScore}%` }} />
              </div>
            </div>
          </div>

          {/* Accumulated Focus KPI */}
          <div className="bg-card/45 backdrop-blur-xl rounded-2xl border border-black/[0.06] dark:border-border/80 p-4 sm:p-5 flex flex-col justify-between gap-2 shadow-sm hover:shadow-md hover:border-brand-500/10 transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.99] group">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] font-mono text-muted-foreground/75 dark:text-white/35 tracking-[0.18em] uppercase block">FOCUS TIME</span>
                <span className="text-xl sm:text-2xl font-sans font-black text-foreground tracking-tight block truncate leading-none mt-1">
                  {totalFocusMinutes} Min
                </span>
              </div>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 shadow-sm">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="border-t border-dashed border-border/40 pt-2 text-[10px] text-muted-foreground block truncate">
              Across {studySessions.length} sessions logged
            </div>
          </div>

        </div>
      </div>

      {/* ========================================== */}
      {/* TIER 2: Cinematic Focus Command Center     */}
      {/* ========================================== */}
      <div className="min-w-0 max-w-full">
        <AnimatePresence mode="wait">
          {status !== 'inactive' ? (
            /* ACTIVE DEEP WORK OPERATIONAL SURFACE */
            <motion.div
              key="active-focus-terminal"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl border border-brand-500/15 bg-slate-900/60 p-5 sm:p-6 text-left shadow-[0_12px_40px_-15px_rgba(99,102,241,0.15)] transition-all duration-200"
            >
              {/* Atmospheric Depth layers: 1. Diagnostic Grid Overlay (3% opacity) */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.025] sm:opacity-[0.03] md:opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
              
              {/* 2. Micro Scanline Overlay (4% opacity) */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.025] sm:opacity-[0.035] md:opacity-[0.04] bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:100%_3px]" />
              
              {/* 3. Cinematic Mesh Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/85 via-slate-900/40 to-slate-950/90 pointer-events-none z-0" />
              
              {/* Ultra-subtle tactical HUD brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-brand-500/30 pointer-events-none" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-brand-500/30 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-brand-500/30 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-brand-500/30 pointer-events-none" />

              <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-[90px] z-0 pointer-events-none" />

              <div className="relative z-10 space-y-3 min-w-0 max-w-full">
                
                {/* Header Status Bar with HUD Technical Accent Labels */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative flex items-center justify-center shrink-0">
                      <span className="absolute inset-0 rounded-full bg-brand-500/25 animate-ping" />
                      <div className="h-8 w-8 rounded-lg bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-500">
                        <Brain size={14} className="animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-sans font-black text-xs text-white tracking-tight uppercase flex items-center gap-1.5">
                        STUDIQ Focus Console <span className="text-[8px] font-mono text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded opacity-75 select-none font-medium">Session active</span>
                      </h3>
                      <p className="text-[9px] font-mono text-white/45 tracking-widest uppercase">STATUS: Focus stable</p>
                    </div>
                  </div>

                  {/* Pulsing Status Indicator */}
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-muted-foreground/70 dark:text-white/35 tracking-wider hidden sm:inline">[+] Tracking active</span>
                    <div>
                      {status === 'active' && (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                        </span>
                      )}
                      {status === 'paused' && (
                        <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Paused
                        </span>
                      )}
                      {status === 'idle' && (
                        <span className="text-[9px] font-mono text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" /> Idle
                        </span>
                      )}
                      {status === 'distracted' && (
                        <span className="text-[9px] font-mono text-rose-450 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-bounce" /> Distracted
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clock & Score parameters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                  
                  {/* Timer */}
                  <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 text-center flex flex-col justify-center space-y-1 select-none">
                    <span className="text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest">Elapsed time</span>
                    <div className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight glow-text leading-none py-1.5">
                      {formatTime(elapsedSeconds)}
                    </div>
                    <span className="text-[9px] font-mono text-white/35 font-medium uppercase tracking-wider">Focus stability</span>
                  </div>

                  {/* Score */}
                  <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 text-center flex flex-col justify-center space-y-1">
                    <span className="text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest">Focus score</span>
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-4xl sm:text-5xl font-black text-brand-400 font-mono tracking-tight leading-none py-1.5 glow-text">
                        {currentFocusScore}%
                      </div>
                      <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        currentFocusScore >= 85 ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30' :
                        currentFocusScore >= 70 ? 'text-amber-400 bg-amber-500/20 border border-amber-500/30' :
                        'text-rose-450 bg-rose-500/20 border border-rose-500/30'
                      }`}>
                        {currentFocusScore >= 85 ? 'FLOW' : currentFocusScore >= 70 ? 'STABLE' : 'RISK'}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-white/35 font-medium uppercase tracking-wider">Focus logs synced</span>
                  </div>

                  {/* Telemetry Metrics Column */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 space-y-0.5 min-w-0">
                      <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest block truncate">Focus time</span>
                      <span className="text-sm font-extrabold text-white block truncate">{formatFriendlyDuration(focusDuration)}</span>
                    </div>
                    <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 space-y-0.5 min-w-0">
                      <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest block truncate">Idle timeline</span>
                      <span className="text-sm font-extrabold text-white block truncate">{formatFriendlyDuration(idleDuration)}</span>
                    </div>
                    <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 space-y-0.5 min-w-0">
                      <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest block truncate">App switches</span>
                      <span className="text-sm font-extrabold text-rose-400 block truncate">{distractionCount}</span>
                    </div>
                    <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 space-y-0.5 min-w-0">
                      <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest block truncate">Away intervals</span>
                      <span className="text-sm font-extrabold text-white block truncate">{formatFriendlyDuration(distractionDuration)}</span>
                    </div>
                  </div>

                </div>

                {/* Cyber Diagnostics Telemetry Watchdog / Alert Logs */}
                <div className={`p-4 rounded-xl border text-[11px] font-mono font-semibold leading-relaxed flex gap-3 text-left ${
                  status === 'distracted' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 animate-pulse' :
                  status === 'idle' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
                  status === 'paused' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                  'bg-brand-500/10 border-brand-500/30 text-brand-300'
                }`}>
                  <Activity size={14} className="shrink-0 mt-0.5 text-brand-400" />
                  <div>
                    {status === 'active' && (
                      <p>🔒 <strong className="text-white">Tracking active:</strong> Focus activity is actively tracked to calibrate your focus score. Brief context switches are ignored.</p>
                    )}
                    {status === 'paused' && (
                      <p>⏸️ <strong className="text-white">Tracking paused:</strong> Focus tracking is suspended. Click resume to reactivate.</p>
                    )}
                    {status === 'idle' && (
                      <p>⚠️ <strong className="text-white">Inactive state detected:</strong> No workspace activity recorded. Resume working to stabilize your score.</p>
                    )}
                    {status === 'distracted' && (
                      <p>🚨 <strong className="text-white">Focus interrupted:</strong> Window focus blurred. Return to this workspace immediately to preserve your score.</p>
                    )}
                  </div>
                </div>

                {/* Session controls actions */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {status === 'active' || status === 'idle' || status === 'distracted' ? (
                    <button
                      onClick={pauseSession}
                      className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-mono font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.985]"
                    >
                      <Pause size={10} /> Pause Tracking
                    </button>
                  ) : (
                    <button
                      onClick={resumeSession}
                      className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-mono font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.985] shadow-md hover:shadow-glow-brand"
                    >
                      <Play size={10} /> Resume Session
                    </button>
                  )}

                  <button
                    onClick={completeSession}
                    className="px-4 py-2 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-650 hover:from-brand-600 hover:to-indigo-750 text-white font-mono font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.985] shadow-md hover:shadow-glow-brand"
                  >
                    <CheckCircle2 size={10} /> Save & Complete
                  </button>

                  <button
                    onClick={cancelSession}
                    className="px-4 py-2 rounded-xl border border-rose-500/20 hover:bg-rose-500/10 text-rose-450 font-mono font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.985] ml-auto"
                  >
                    <Square size={8} /> Discard
                  </button>
                </div>

              </div>
            </motion.div>
          ) : (
            /* COHESIVE AI COGNITIVE COMMAND CENTER (UNIFIED HERO INTERFACE) */
            <motion.div
              key="closed-focus-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="relative overflow-hidden rounded-2xl border border-brand-500/25 dark:border-brand-500/15 bg-slate-950/80 p-5 sm:p-6 text-left transition-all duration-300 shadow-[0_12px_40px_-15px_rgba(99,102,241,0.08)]"
            >
              {/* Atmospheric Depth layers: 1. Diagnostic Grid Overlay (3% opacity) */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
              
              {/* 2. Micro Scanline Overlay (4% opacity) */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:100%_3px]" />
              
              {/* 3. Cinematic Mesh Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/85 via-slate-900/40 to-slate-950/90 pointer-events-none z-0" />
              
              {/* Ultra-subtle tactical HUD brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-brand-500/20 dark:border-brand-500/10 pointer-events-none" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-brand-500/20 dark:border-brand-500/10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-brand-500/20 dark:border-brand-500/10 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-brand-500/20 dark:border-brand-500/10 pointer-events-none" />

              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-500/5 rounded-full blur-[100px] z-0 pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
                
                {/* 1. Left Telemetry trigger area (4 columns) */}
                <div className="lg:col-span-4 flex flex-col justify-between min-w-0 max-w-full gap-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-brand-500 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1.5 select-none">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" /> Ready to track
                      </span>
                      <span className="text-[8px] font-mono text-white/30 tracking-wider hidden sm:inline">[+] System active</span>
                    </div>
                    
                    <h3 className="font-sans font-black text-lg text-white tracking-tight flex items-center gap-2 leading-none uppercase">
                      <Brain size={16} className="text-brand-500" /> Focus Command Center
                    </h3>
                    
                    <p className="text-xs text-white/60 leading-relaxed">
                      Activate workspace focus tracking. The engine analyzes focus signals to calibrate concentration flow in real-time.
                    </p>
                  </div>

                  {/* Mini metrics block */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-white/5">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono font-bold text-white/45 uppercase tracking-widest block">Focus index</span>
                      <span className="text-base sm:text-lg font-sans font-black text-white tracking-tight block uppercase leading-none">
                        {hasFocusData(history) ? `${averageFocusScore}%` : 'Awaiting data'}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono font-bold text-white/45 uppercase tracking-widest block">Focus duration</span>
                      <span className="text-base sm:text-lg font-sans font-black text-white tracking-tight block uppercase leading-none">
                        {totalDeepWorkHours}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={startSession}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-650 hover:from-brand-600 hover:to-indigo-750 text-white font-mono font-extrabold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-glow-brand transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.985] relative group overflow-hidden"
                  >
                    <Zap size={12} className="fill-white" />
                    {hasFocusData(history) ? 'Engage Focus Session' : 'Initialize Focus Mode'}
                  </button>
                </div>

                {/* 2. Middle Line graph area (5 columns) */}
                <div className="lg:col-span-5 flex flex-col justify-between min-w-0 max-w-full">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-4 gap-2">
                    <div>
                      <span className="font-sans font-bold text-white text-xs sm:text-sm block">Focus Stability Index</span>
                      <span className="text-[10px] text-white/40 block">Session focus progression</span>
                    </div>
                    <span className="text-[8px] font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider select-none">Stability Engine</span>
                  </div>

                  <div className="h-44 w-full min-w-0 max-w-full relative">
                    {hasFocusData(history) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={focusHistoryData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="currentColor" 
                            className="text-white/35 font-mono" 
                            fontSize={8} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            stroke="currentColor" 
                            className="text-white/35 font-mono" 
                            fontSize={8} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                  return (
                                    <div className="p-2.5 bg-slate-950/95 backdrop-blur-md border border-white/10 rounded-xl text-[9px] text-white font-mono shadow-xl text-left">
                                      <p className="font-extrabold text-white">{payload[0].payload.name}</p>
                                      <p className="mt-0.5 text-brand-400">Score: <strong className="text-white">{payload[0].value}%</strong></p>
                                      <p className="text-indigo-400">Duration: <strong className="text-white">{payload[0].payload.Duration}m</strong></p>
                                      <p className="text-rose-400">Switches: <strong className="text-white">{payload[0].payload.Distractions}</strong></p>
                                    </div>
                                  );
                              }
                              return null;
                            }}
                          />
                          <Line type="monotone" dataKey="Score" stroke="#6366f1" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      /* Guided Onboarding High-Tech Wireframe Placeholder Graph overlayed with system diagnostics message */
                      <div className="h-full w-full min-w-0 max-w-full relative rounded-xl border border-dashed border-white/10 overflow-hidden bg-white/[0.01] p-2 flex flex-col justify-between">
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 pointer-events-none select-none">
                          <Activity size={16} className="text-brand-500/50 mb-1 animate-pulse" />
                          <p className="text-[10px] font-mono font-bold text-white tracking-tight uppercase">Focus offline</p>
                          <p className="text-[9px] text-white/50 mt-1 max-w-[210px] leading-relaxed">
                            Awaiting focus logs. Start a focus session to generate workspace statistics.
                          </p>
                        </div>
                        {/* Dimmed backdrop mockup graph representing telemetry setup */}
                        <div className="absolute inset-0 opacity-[0.06] pointer-events-none select-none">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={calibrationMockData} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="2 2" stroke="currentColor" vertical={false} />
                              <XAxis dataKey="name" fontSize={7} tickLine={false} axisLine={false} />
                              <YAxis domain={[0, 100]} fontSize={7} tickLine={false} axisLine={false} />
                              <Line type="monotone" dataKey="Score" stroke="#6366f1" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Right AI Insights (Holographic Live Diagnostics Feed) */}
                <div className="lg:col-span-3 flex flex-col justify-between min-w-0 max-w-full gap-4">
                  <div className="pb-2 border-b border-white/5 mb-1 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand-500 fill-brand-500/10 shrink-0 animate-pulse" />
                    <span className="font-sans font-bold text-white text-xs sm:text-sm">Activity Feed</span>
                  </div>

                  {/* Terminal Holographic Diagnostic Rows */}
                  <div className="space-y-3.5 flex-grow text-left overflow-hidden">
                    {focusInsights.slice(0, 3).map((insight, idx) => (
                      <div key={idx} className="flex flex-col gap-1 p-2 bg-white/[0.015] border border-white/5 rounded-xl font-mono text-[10px] leading-relaxed transition-all duration-200 hover:border-brand-500/15">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-brand-400 font-bold tracking-wider">[{insight.tag}]</span>
                          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand-500/70 animate-pulse shrink-0" />
                        </div>
                        <span className="text-white/60 font-sans font-medium text-[11px] leading-snug">{insight.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/5 text-[9px] font-mono text-brand-400 font-bold uppercase tracking-widest block opacity-70">
                    System status: Active
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================== */}
      {/* TIER 3: Secondary Analytics Grid          */}
      {/* ========================================== */}
      
      {/* SECTION 1: Focus Trend & Smart Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Weekly Focus Lounge Area Chart */}
        <div className="lg:col-span-2 bg-card/45 backdrop-blur-xl rounded-2xl border border-black/[0.06] dark:border-border/80 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:border-brand-500/10 transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.99]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-sans font-bold text-base sm:text-lg text-foreground tracking-tight">Weekly Focus Trend</h3>
              <p className="text-xs text-muted-foreground">Cumulative deep focus minutes logged</p>
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 bg-muted rounded-md border border-border/60 font-mono">
              Last 7 Days
            </span>
          </div>
          
          {studySessions.length > 0 ? (
            <div className="h-56 w-full pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="currentColor" className="text-slate-400 dark:text-slate-500" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" className="text-slate-400 dark:text-slate-500" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-select)', borderColor: 'var(--border-color)', borderRadius: '12px' }}
                    labelStyle={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '600' }}
                    itemStyle={{ color: 'var(--text-main)', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="minutes" name="Focus Min" stroke="#6366f1" strokeWidth={1.5} fillOpacity={1} fill="url(#colorMinutes)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              align="left"
              size="md"
              showMockGraph={true}
              icon={<Clock size={16} />}
              title="Initialize Focus Tracking"
              description="Start your first focus session to generate productivity trends, focus insights, and workload analytics."
              actionText="Start Focus Session"
              onAction={startSession}
            >
              <div className="space-y-2.5 mt-2 opacity-[0.05] dark:opacity-[0.07] pointer-events-none select-none transition-all duration-300">
                <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider">
                  <span>Productivity telemetry idle</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                    <span>Awaiting Session data</span>
                  </span>
                </div>
                <div className="space-y-1.5 pt-0.5">
                  <div className="h-1.5 bg-foreground rounded-full w-3/4" />
                  <div className="h-1.5 bg-foreground rounded-full w-1/2" />
                  <div className="h-1.5 bg-foreground rounded-full w-5/6" />
                </div>
              </div>
            </EmptyState>
          )}
        </div>

        {/* Quiet Smart Suggestions Card */}
        <div className="bg-card/45 backdrop-blur-xl rounded-2xl border border-black/[0.06] dark:border-border/80 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:border-brand-500/10 transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.99]">
          <div className="space-y-4">
            <div>
              <h3 className="font-sans font-bold text-base text-foreground tracking-tight flex items-center gap-1.5 mb-1 text-left">
                <Sparkles size={14} className="text-brand-500 fill-brand-500/10" /> Smart Suggestions
              </h3>
              <p className="text-xs text-muted-foreground text-left">Predictive interventions based on active performance trends.</p>
            </div>
            
            <div className="space-y-3">
              {aiSuggestions.map((sug, idx) => (
                <div
                  key={idx}
                  className={`
                    p-3.5 rounded-xl border text-[11px] font-semibold leading-relaxed flex gap-3 text-left
                    ${sug.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400' : ''}
                    ${sug.type === 'danger' ? 'bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-400' : ''}
                    ${sug.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : ''}
                  `}
                >
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{sug.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-auto text-left font-mono">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">Heuristic Engine:</span>
            <span className="text-[11px] text-brand-650 dark:text-brand-400 font-semibold flex items-center gap-1 mt-1">
              🟢 Optimizing Academic Trajectory
            </span>
          </div>
        </div>

      </div>

      {/* SECTION 2: Attendance Overview & Deadline Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Attendance Summary Grid */}
        <div className="lg:col-span-2 bg-card/45 backdrop-blur-xl rounded-2xl border border-black/[0.06] dark:border-border/80 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:border-brand-500/10 transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.99]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-sans font-bold text-base text-foreground tracking-tight">Attendance Overview</h3>
              <p className="text-xs text-muted-foreground">
                Class records average: <strong className="text-brand-600 dark:text-brand-400 font-bold">{overallAttendance}%</strong>
              </p>
            </div>
            <Link to="/attendance" className="text-xs text-brand-650 dark:text-brand-400 hover:underline font-bold transition-all font-mono">
              Manage Attendance →
            </Link>
          </div>

          {subjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.slice(0, 4).map((sub) => {
                const subAtt = attendance.find(a => a.subjectId === sub.id);
                let total = 0;
                let attended = 0;
                if (subAtt) {
                  subAtt.records.forEach((r) => {
                    if (r.status !== 'cancelled') {
                      total += 1;
                      if (r.status === 'attended') attended += 1;
                    }
                  });
                }
                const pct = total > 0 ? Math.round((attended / total) * 100) : 100;
                const isWarning = pct < targetAttendance;

                return (
                  <div key={sub.id} className="p-3.5 rounded-xl border border-border/60 bg-muted/10 hover:border-brand-500/25 transition-all duration-300 text-left flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sub.color }} /> {sub.code}
                      </span>
                      <h4 className="text-xs font-extrabold text-foreground truncate max-w-[140px]">{sub.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-semibold">{attended} / {total} classes attended</p>
                    </div>
                    
                    <div className={`px-2 py-1 rounded-lg border text-[10px] font-black transition-all ${isWarning ? 'bg-red-500/10 border-red-500/20 text-red-650 dark:text-red-400 shadow-sm' : 'bg-muted border-border text-foreground'}`}>
                      {pct}%
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              align="left"
              size="sm"
              icon={<BookOpen size={14} />}
              title="Attendance tracking is ready"
              description="Add your first subject to begin monitoring attendance trends and shortage risks."
              actionText="Add Subject"
              onAction={() => navigate('/attendance')}
            />
          )}
        </div>

        {/* Task Timeline / Deadlines */}
        <div className="bg-card/45 backdrop-blur-xl rounded-2xl border border-black/[0.06] dark:border-border/80 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:border-brand-500/10 transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.99]">
          <div className="space-y-4">
            <div>
              <h3 className="font-sans font-bold text-base text-foreground tracking-tight flex items-center gap-1.5 mb-1 text-left">
                <CalendarDays size={14} className="text-brand-500" /> Deadline Warnings
              </h3>
              <p className="text-xs text-muted-foreground text-left">Urgent actions and milestone warnings.</p>
            </div>

            <div className="space-y-4">
              {assignments.length > 0 ? (
                pendingAssignments.slice(0, 3).map((task) => {
                  const sub = subjects.find(s => s.id === task.subjectId);
                  const isOverdue = new Date(task.dueDate) < new Date();

                  return (
                    <div key={task.id} className="flex gap-3 text-left">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`h-2.5 w-2.5 rounded-full border ${isOverdue ? 'bg-red-500 border-red-550/30 animate-pulse' : 'bg-muted border-border'}`} />
                        <div className="w-0.5 h-10 bg-border/80 mt-1" />
                      </div>
                      
                      <div className="space-y-0.5 overflow-hidden">
                        <h4 className="text-xs font-bold text-foreground truncate">{task.title}</h4>
                        <p className="text-[10px] text-muted-foreground font-semibold">
                          Subject: {sub?.name || 'General'}
                        </p>
                        <span className={`text-[10px] font-bold ${isOverdue ? 'text-red-650 dark:text-red-400' : 'text-muted-foreground'}`}>
                          {isOverdue ? '🚨 OVERDUE' : `📅 Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  align="left"
                  size="sm"
                  icon={<ClipboardList size={14} />}
                  title="No active tasks yet"
                  description="Create your first assignment or milestone to begin organizing your academic workflow."
                  actionText="Create Task"
                  onAction={() => navigate('/assignments')}
                />
              )}

              {assignments.length > 0 && pendingAssignments.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground font-medium">
                  🎉 All tasks completed! Great focus.
                </div>
              )}
            </div>
          </div>
          
          <Link to="/assignments" className="text-xs text-brand-650 dark:text-brand-400 hover:underline font-bold block pt-4 text-center border-t border-border mt-auto transition-all font-mono">
            Manage Board →
          </Link>
        </div>

      </div>

    </div>
  );
};
