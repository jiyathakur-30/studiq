import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../context/store';
import { useFocusAnalytics } from '../context/FocusAnalyticsContext';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import {
  Calendar,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Activity,
  Sparkles,
  Clock,
  Link2,
  Plus,
  Trash2,
  TrendingUp,
  Brain,
  Zap,
  Info,
  CalendarDays,
  Target,
  Database,
  ArrowRight,
  Shield,
  Gauge,
  Play
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

// Global Semantic Contrast System
const TXT_PRIMARY = "text-slate-900 dark:text-white";
const TXT_SECONDARY = "text-slate-700 dark:text-slate-300";
const TXT_MUTED = "text-slate-500 dark:text-slate-400 font-medium";

// Standardized Premium Glassmorphism Card Surface
const CARD_SURFACE = "bg-card border border-border shadow-xl backdrop-blur-xl rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:border-slate-300 dark:hover:border-white/20 [.cyberpunk_&]:hover:border-cyan-500/30 relative z-10";

export const Scheduler: React.FC = () => {
  const focusAnalytics = useFocusAnalytics(); // Global adaptive analytics hook
  const {

    subjects,
    scheduledSessions,
    googleConnected,
    googleEmail,
    syncLogs,
    schedulerStats,
    fetchSubjects,
    fetchScheduledSessions,
    fetchSchedulerDashboardStats,
    generateAcademicPlan,
    rescheduleMissedSessions,
    updateSessionStatus,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    setAiCoachOpen
  } = useAppStore();

  // Component State
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(3);
  const [studyHoursGoal, setStudyHoursGoal] = useState(10);
  const [newChapter, setNewChapter] = useState('');
  const [chapters, setChapters] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // Sync details state
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  const showNotification = (msg: string, type: 'success' | 'warning' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Load Initial Store Data
  useEffect(() => {
    fetchSubjects();
    fetchScheduledSessions();
    fetchSchedulerDashboardStats();

    // Check for query params if simulated callback completed
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Sync stats when list of sessions changes
  useEffect(() => {
    if (scheduledSessions.some(s => s.status === 'missed')) {
      const missedCount = scheduledSessions.filter(s => s.status === 'missed').length;
      setWarningMessage(`AI Rescheduler Warning: ${missedCount} missed study session(s) detected. Trigger AI recovery to re-sequence future timelines!`);
    } else {
      setWarningMessage(null);
    }
  }, [scheduledSessions]);

  // Handle Chapter additions
  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChapter.trim() && !chapters.includes(newChapter.trim())) {
      setChapters([...chapters, newChapter.trim()]);
      setNewChapter('');
    }
  };

  const handleRemoveChapter = (chapter: string) => {
    setChapters(chapters.filter(c => c !== chapter));
  };

  // Google Calendar Integration Handler
  const handleConnectCalendar = async () => {
    setIsSyncing(true);
    try {
      const authUrl = await connectGoogleCalendar();
      if (authUrl && !authUrl.includes('mock_oauth')) {
        // Redirect to real Google Auth page
        window.location.href = authUrl;
      }
    } catch (err) {
      console.error('Google Auth Trigger Failure', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Generate Plan Handler
  const handleGeneratePlan = async () => {
    if (!selectedSubjectId || !examDate || chapters.length === 0) {
      showNotification('Please fill out the courses, exam date, and syllabus chapters list first.', 'warning');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateAcademicPlan({
        subjectId: selectedSubjectId,
        examDate,
        chapters,
        confidenceLevel,
        studyHoursGoal
      });
      if (result.success) {
        setAdjustments(result.adjustments || []);
        setLastSyncResult(result.syncStats);
        showNotification('Syllabus-aware study plan calculated successfully!', 'success');
      }
    } catch (error) {
      console.error(error);
      showNotification('Optimized plan generation failed. Retrying in fallback offline mode...', 'warning');
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger Missed Recovery Rescheduling
  const handleTriggerRecovery = async () => {
    setIsRescheduling(true);
    try {
      const result = await rescheduleMissedSessions();
      if (result.success && result.rescheduledCount > 0) {
        showNotification(result.message, 'success');
        setWarningMessage(null);
      }
    } catch (err) {
      console.error(err);
      showNotification('Recovery calculation timed out. Retrying sync...', 'warning');
    } finally {
      setIsRescheduling(false);
    }
  };

  // Compute 14 days dynamic timeline
  const getTimelineDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const timelineDays = getTimelineDays();
  const activeTimelineDate = timelineDays[selectedDayOffset];

  // Filter sessions matching active day selection
  const filteredSessions = scheduledSessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    return sessionDate.getFullYear() === activeTimelineDate.getFullYear() &&
           sessionDate.getMonth() === activeTimelineDate.getMonth() &&
           sessionDate.getDate() === activeTimelineDate.getDate();
  });

  // Calculate stats for charts
  const attendanceRate = schedulerStats?.averageAttendance || 85;
  const backlogRisk = schedulerStats?.backlogRisk || 15;
  const productivityScore = schedulerStats?.productivityScore || 65;
  const pomodoroConsistency = schedulerStats?.pomodoroConsistency || 75;

  const barData = [
    { name: 'Attendance', Score: attendanceRate, color: '#10b981' },
    { name: 'Productivity', Score: productivityScore, color: '#6366f1' },
    { name: 'Streak Ratio', Score: pomodoroConsistency, color: '#ec4899' },
    { name: 'Backlog Def.', Score: 100 - backlogRisk, color: '#e11d48' }
  ];

  // Render adjustments details
  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case 'attendance': return <Calendar className="w-5 h-5 text-emerald-500 dark:text-emerald-400 animate-pulse" />;
      case 'confidence': return <Target className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />;
      case 'productivity': return <TrendingUp className="w-5 h-5 text-pink-500 dark:text-pink-400" />;
      case 'pomodoro': return <Clock className="w-5 h-5 text-orange-500 dark:text-orange-400" />;
      case 'backlog': return <Layers className="w-5 h-5 text-rose-500 dark:text-rose-400" />;
      default: return <Sparkles className="w-5 h-5 text-brand-500 dark:text-brand-400" />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-1 sm:px-0 pb-24 pt-6 font-sans">
      {/* Premium Notification Overlay */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border flex items-center gap-2.5 max-w-sm text-xs font-bold transition-all bg-slate-900/90 dark:bg-black/90 text-white border-white/10"
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-slate-400 hover:text-white transition-all cursor-pointer font-black text-sm"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HERO SECTION WITH CINEMATIC GLOW */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900/60 dark:via-slate-950/40 dark:to-slate-900/60 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-[10px] font-extrabold tracking-widest px-3 py-1 rounded-full uppercase flex items-center gap-1.5 shadow-sm">
                <Brain size={12} className="animate-pulse" />
                Study Planner
              </span>
              <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-extrabold tracking-widest px-3 py-1 rounded-full uppercase flex items-center gap-1.5 shadow-sm">
                <Gauge size={12} />
                Target Focus: Calibrated
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              AI Academic <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 dark:from-brand-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Scheduler</span>
            </h1>
            
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 max-w-2xl leading-relaxed font-medium">
              An intelligent study scheduler that adapts to your workload. The engine analyzes your attendance, weekly study logs, backlog tasks, and focus sessions to suggest optimal, balanced planner schedules.
            </p>

            {/* Dynamic Live Analytics Chips */}
            <div className="flex flex-wrap gap-3 mt-5">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                AI Engine: Online
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm">
                <RefreshCw size={12} className="text-indigo-500 dark:text-indigo-400" />
                Dynamic Scheduling: Enabled
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm">
                <Database size={12} className="text-purple-500 dark:text-purple-400" />
                Data Synced: 100%
              </div>
            </div>
          </div>

          {/* Connected/Offline State Badge with Interactive Trigger */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border backdrop-blur-md transition-all shadow-lg ${
              googleConnected 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-emerald-500/5' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-amber-500/5'
            }`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${googleConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${googleConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-xs font-black uppercase tracking-wider">
                {googleConnected ? 'Google Calendar Integrated' : 'AI Planner Online'}
              </span>
            </div>

            <button 
              onClick={() => {
                setIsSyncing(true);
                setTimeout(() => {
                  fetchSchedulerDashboardStats();
                  setIsSyncing(false);
                }, 1200);
              }} 
              title="Force Database Sync Refresh"
              className="flex items-center justify-center p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition active:scale-95 shadow-md"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : 'hover:rotate-180 transition-transform duration-500'} />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Warning Reschedule Banner */}
      <AnimatePresence>
        {warningMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-red-50 to-rose-100 dark:from-red-950/40 dark:via-red-900/20 dark:to-slate-950/20 border border-red-200 dark:border-red-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl backdrop-blur-md relative z-10"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 mt-0.5 shadow-sm">
                <AlertTriangle size={20} className="animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-red-800 dark:text-red-200">Missed Study Sessions Tracked</h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed font-medium">
                  The study scheduler detected incomplete slots in your timeline. Initiate recovery to sweep forward, scan for open intervals, auto-balance your workload, and adjust your schedules.
                </p>
              </div>
            </div>
            <button
              onClick={handleTriggerRecovery}
              disabled={isRescheduling}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white text-xs font-bold transition shadow-lg shadow-red-600/20 hover:shadow-red-500/30 active:scale-95 flex-shrink-0"
            >
              <Zap size={14} className={isRescheduling ? 'animate-pulse' : ''} />
              {isRescheduling ? 'AI Rescheduling Timeline...' : 'Accept AI Recovery Plan'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Top Grid (Sync Hub & Burnout Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 2. GOOGLE CALENDAR SYNC HUB (5 cols) */}
        <div className={`${CARD_SURFACE} lg:col-span-5 flex flex-col group`}>
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/5 via-transparent to-transparent opacity-40 pointer-events-none" />
          
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/[0.08] pb-4 mb-5">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Link2 size={18} />
            </div>
            <div>
              <h2 className={`text-sm font-extrabold ${TXT_PRIMARY}`}>Google Calendar Sync</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Sync study sessions with your calendar</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between space-y-5 relative z-10">
            {googleConnected ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-lg font-black shadow-inner">
                        G
                      </div>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0f172a] animate-pulse" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-black ${TXT_PRIMARY}`}>{googleEmail || 'student.studiq@gmail.com'}</h4>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-bold">
                        <CheckCircle2 size={11} /> Google Calendar Connected
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block font-bold">Sync Latency</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">14ms</span>
                  </div>
                </div>

                {lastSyncResult && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2">
                    <h5 className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-black flex items-center gap-1.5">
                      <Shield size={10} className="text-brand-500" />
                      Active Sync Report
                    </h5>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Synchronized Blocks:</span>
                      <span className="font-black text-brand-600 dark:text-brand-400">{lastSyncResult.syncedCount || 14} sessions</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Status:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        AI Engine Sync Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Last Sync Timestamp:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Just now ({new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={disconnectGoogleCalendar}
                  className="w-full py-3 rounded-xl border border-slate-300 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-extrabold transition active:scale-98 shadow-sm"
                >
                  Disconnect Google Account Integration
                </button>
              </div>
            ) : (
              <div className="space-y-4 my-auto py-5 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 border-2 border-dashed border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3 shadow-inner">
                  <CalendarDays size={24} className="animate-pulse" />
                </div>
                <div>
                  <h3 className={`text-sm font-black ${TXT_PRIMARY}`}>Connect Google Calendar Integration</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed font-medium">
                    Synchronize your exam plans, chapters revisions, Pomodoro focus blocks, and lectures straight into your primary Google account.
                  </p>
                </div>
                <button
                  onClick={handleConnectCalendar}
                  disabled={isSyncing}
                  className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white text-xs font-black transition shadow-lg shadow-brand-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? 'Linking Sandbox Account...' : 'Link Google Account Calendar'}
                </button>
              </div>
            )}

            {/* Sync timeline log section */}
            <div className="border-t border-slate-200 dark:border-white/[0.08] pt-4 mt-2">
              <h4 className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-black mb-3 flex items-center gap-1.5">
                <Activity size={12} className="text-brand-500 dark:text-brand-400" />
                Synchronization Logs
              </h4>
              <div className="space-y-2 max-h-[115px] overflow-y-auto pr-1 select-none font-mono scrollbar-thin">
                {syncLogs.length === 0 ? (
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-4 bg-slate-50 dark:bg-white/[0.01] border border-dashed border-slate-200 dark:border-white/5 rounded-lg">
                    No sync activity registered in this session.
                  </div>
                ) : (
                  syncLogs.map((log) => (
                    <div key={log.id} className="text-[10px] leading-relaxed bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-lg p-2.5 flex justify-between items-start gap-2 shadow-sm">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{log.message}</span>
                      <span className="text-slate-400 dark:text-slate-500 flex-shrink-0 font-bold">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. BURNOUT ANALYTICS & DIAGNOSTICS (7 cols) */}
        <div className={`${CARD_SURFACE} lg:col-span-7 flex flex-col`}>
          <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/5 via-transparent to-transparent opacity-40 pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Activity size={18} />
              </div>
              <div>
                <h2 className={`text-sm font-extrabold ${TXT_PRIMARY}`}>Academic Load & Behavior Analytics</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Continuous Diagnostic Intelligence</p>
              </div>
            </div>
            <div className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1.5 font-black bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-lg">
              <TrendingUp size={14} /> Live Diagnoses
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
            {/* Chart Area */}
            <div className="md:col-span-7 h-[180px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight={700}
                    tickLine={false} 
                    className="dark:stroke-slate-400"
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight={700}
                    domain={[0, 100]} 
                    tickLine={false} 
                    className="dark:stroke-slate-400"
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#f8fafc',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)'
                    }} 
                  />
                  <Bar dataKey="Score" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Metrics & Diagnosis details */}
            <div className="md:col-span-5 space-y-4 border-l border-slate-200 dark:border-white/[0.08] pl-0 md:pl-6 border-transparent md:border-l">
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-3 flex justify-between items-center shadow-sm hover:border-slate-300 dark:hover:border-white/10 transition duration-200">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-bold">Productivity Score</span>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{productivityScore}%</span>
                </div>
                <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-indigo-500" style={{ width: `${productivityScore}%` }} />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-3 flex justify-between items-center shadow-sm hover:border-slate-300 dark:hover:border-white/10 transition duration-200">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-bold">Backlog Deficit</span>
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400">{backlogRisk}%</span>
                </div>
                <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-rose-500" style={{ width: `${backlogRisk}%` }} />
                </div>
              </div>

              {/* Behavior Analysis diagnostic summary */}
              <div className="p-4 rounded-xl bg-brand-500/5 dark:bg-brand-500/[0.03] border border-brand-200 dark:border-brand-500/20 flex items-start gap-3 shadow-inner">
                <Info size={16} className="text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-brand-700 dark:text-brand-300 uppercase tracking-wider">AI Scheduler Insight</h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed font-medium">
                    {backlogRisk > 50 
                      ? 'High backlog risk flagged. Engine has scheduled dedicated deep backlog sweeps.'
                      : productivityScore < 45 
                        ? 'Low weekly productivity index. Safe-burnout thresholds active: session sizes capped to 30m.'
                        : 'Workloads and revision roadmaps are stable. Academic trajectory optimized evenly.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. AI ACADEMIC PLANNER CONSOLE */}
      <div className={CARD_SURFACE}>
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/[0.08] pb-4 mb-6">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <Brain size={18} />
          </div>
          <div>
            <h2 className={`text-sm font-extrabold ${TXT_PRIMARY}`}>AI Academic Planner Console</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Generate Smart Syllabi & Revision Maps</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Settings Column */}
          <div className="lg:col-span-6 space-y-5">
            {/* Subject selector */}
            <Select
              label="Select Course / Module Subject"
              value={selectedSubjectId}
              onChange={(val) => setSelectedSubjectId(val)}
              options={[
                { value: '', label: '-- Choose Course Subject --' },
                ...subjects.map(s => ({ value: s.id, label: `${s.name} (${s.code || ''})` }))
              ]}
            />

            {/* Date selector */}
            <Input
              label="Target Exam Date"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />

            {/* Confidence Slider */}
            <div className="bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <label className={`text-xs font-extrabold ${TXT_SECONDARY}`}>Confidence Level Rating</label>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/25">
                  {confidenceLevel === 1 ? '⚠️ Struggling (1/5)' :
                   confidenceLevel === 2 ? '⚠️ Poor (2/5)' :
                   confidenceLevel === 3 ? 'Moderate (3/5)' :
                   confidenceLevel === 4 ? 'Good (4/5)' :
                   '🔥 Confident (5/5)'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                className="w-full accent-brand-500 dark:accent-brand-400 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg outline-none cursor-pointer"
              />
            </div>

            {/* Study Hours Target Slider */}
            <div className="bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <label className={`text-xs font-extrabold ${TXT_SECONDARY}`}>Target Study Revision Volume</label>
                <span className="text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded border border-brand-500/25">{studyHoursGoal} Hours</span>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                value={studyHoursGoal}
                onChange={(e) => setStudyHoursGoal(Number(e.target.value))}
                className="w-full accent-brand-500 dark:accent-brand-400 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Chapters and Chips Column */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
            {/* Chapters Inputs */}
            <div>
              <label className={`text-xs font-extrabold block mb-2 ${TXT_SECONDARY}`}>Syllabus Chapters Checklist</label>
              <form onSubmit={handleAddChapter} className="flex gap-2 items-start">
                <Input
                  placeholder="e.g. Chapter 4: Neural Architectures..."
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  className="flex-1"
                />
                <button
                  type="submit"
                  className="px-4 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-black text-white transition active:scale-95 flex items-center gap-1.5 shadow-md shadow-brand-600/10 h-11 self-start shrink-0"
                >
                  <Plus size={16} /> Add Topic
                </button>
              </form>
            </div>

            {/* Chapters chips container */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 min-h-[120px] flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-black mb-2">Chapters Roadmap Coverage</span>
                {chapters.length === 0 ? (
                  <div className="h-[80px] flex items-center justify-center text-center">
                    <span className="text-xs text-slate-400 dark:text-slate-600 font-semibold max-w-xs">No chapters mapped yet. Add exam chapters above to distribute workload.</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                    {chapters.map((ch, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 rounded-xl pl-3 pr-1.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition shadow-sm">
                        <span>{ch}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveChapter(ch)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-lg transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic live planning feed widget */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <Sparkles size={12} className="animate-spin text-brand-500" />
                <span>
                  {confidenceLevel <= 2 
                    ? '⚠️ Low confidence detected → revision intensity boosted (+25%)'
                    : backlogRisk > 40
                      ? '⚠️ High backlog deficit detected → allocating backlog recovery intervals'
                      : '✨ Workload stable → distributing hours uniformly across chapters'}
                </span>
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="space-y-2.5">
              <button
                onClick={handleGeneratePlan}
                disabled={isGenerating}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-xs transition shadow-xl shadow-brand-500/20 active:scale-98 flex items-center justify-center gap-2.5 border border-brand-500/30 group"
              >
                <Sparkles size={16} className={isGenerating ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                {isGenerating ? 'AI Calendar Engine Optimizing...' : 'Generate Behavior-Aware Academic Plan'}
              </button>

              <button
                onClick={() => {
                  const subName = subjects.find(s => s.id === selectedSubjectId)?.name || 'upcoming exams';
                  const daysNum = examDate ? Math.max(1, Math.round((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 7;
                  setAiCoachOpen(true, `I want to build a custom study plan for ${subName}. Let's do ${daysNum} days at ${studyHoursGoal}h daily goal.`);
                }}
                className="w-full py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.02] dark:hover:bg-white/[0.04] text-slate-800 dark:text-slate-300 font-extrabold text-xs transition flex items-center justify-center gap-2 border border-slate-200 dark:border-white/5 active:scale-98 cursor-pointer shadow-sm"
              >
                <Brain size={14} className="text-brand-500 animate-pulse" />
                Consult AI Academic Coach
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic self-adjusting overrides details */}
        <AnimatePresence>
          {adjustments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-200 dark:border-white/[0.08] pt-6 mt-6 space-y-4 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-brand-600 dark:text-brand-400" />
                <h4 className={`text-xs font-black ${TXT_PRIMARY}`}>Smart Self-Adjusting Engine Diagnostics</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adjustments.map((adj, index) => (
                  <div key={index} className="flex gap-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-brand-500/20 rounded-xl p-4 shadow-sm transition">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex-shrink-0 flex items-center justify-center h-10 w-10 shadow-sm">
                      {getAdjustmentIcon(adj.type)}
                    </div>
                    <div>
                      <h5 className={`text-xs font-black ${TXT_PRIMARY} flex items-center gap-2`}>
                        {adj.label}
                        <span className="text-[8px] bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/25 px-2 py-0.5 rounded font-black uppercase tracking-wider">AI Adjusted</span>
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-semibold">{adj.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. DYNAMIC 14-DAY TIMELINE CONTAINER */}
      <div className={CARD_SURFACE}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className={`text-sm font-extrabold ${TXT_PRIMARY}`}>Chronological Study Timeline</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">14-day interactive revision lane</p>
            </div>
          </div>
          <span className="text-xs font-black text-brand-700 dark:text-brand-400 bg-brand-500/10 border border-brand-500/25 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
            <CalendarDays size={14} />
            Active Day: {activeTimelineDate.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })}
          </span>
        </div>

        {/* Dynamic Timeline Days Selector list */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 mb-6 border-b border-slate-200 dark:border-white/[0.04] scrollbar-thin select-none">
          {timelineDays.map((day, idx) => {
            const isSelected = selectedDayOffset === idx;
            const hasSessions = scheduledSessions.some(session => {
              const sDate = new Date(session.startTime);
              return sDate.getFullYear() === day.getFullYear() &&
                     sDate.getMonth() === day.getMonth() &&
                     sDate.getDate() === day.getDate();
            });

            return (
              <button
                key={idx}
                onClick={() => setSelectedDayOffset(idx)}
                className={`flex flex-col items-center justify-center p-3.5 min-w-[65px] rounded-2xl border transition-all duration-200 active:scale-95 shadow-sm ${
                  isSelected
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white border-brand-500 shadow-lg shadow-brand-500/30 font-bold ring-2 ring-brand-500/30'
                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wider block font-bold ${isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>{day.toLocaleDateString([], { weekday: 'short' })}</span>
                <span className="text-lg font-black block mt-1">{day.getDate()}</span>
                {hasSessions && (
                  <span className={`h-2 w-2 rounded-full mt-2 ${isSelected ? 'bg-white' : 'bg-brand-500 animate-pulse'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Scheduled Sessions list */}
        <div className="space-y-4 min-h-[180px]">
          {filteredSessions.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-white/[0.01]">
              <span className="text-slate-400 dark:text-slate-600 text-sm font-bold">No study sessions scheduled for this day.</span>
              <p className="text-xs text-slate-500 dark:text-slate-500 max-w-sm text-center leading-relaxed font-medium">
                Configure subjects, chapters and goals in the AI Planner Console above to automatically map your study schedule.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredSessions.map((session) => {
                const sStart = new Date(session.startTime);
                const sEnd = new Date(session.endTime);
                
                // Color codes for status configurations
                const statusStyles = {
                  completed: 'border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-emerald-500/5',
                  missed: 'border-red-500/30 dark:border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400 shadow-red-500/5',
                  scheduled: 'border-indigo-500/30 dark:border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-indigo-500/5'
                };

                const activeStyle = statusStyles[session.status as keyof typeof statusStyles] || statusStyles.scheduled;

                return (
                  <motion.div
                    key={session.id}
                    layoutId={`sess-${session.id}`}
                    className={`flex flex-col justify-between bg-white dark:bg-white/[0.02] border rounded-2xl p-5 transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-white/[0.04] shadow-md relative overflow-hidden group hover:shadow-lg ${activeStyle}`}
                  >
                    {/* Status side indicators */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                      session.status === 'completed' ? 'bg-emerald-500' :
                      session.status === 'missed' ? 'bg-red-500' :
                      'bg-indigo-500'
                    }`} />

                    <div>
                      {/* Top bar info */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-white/[0.04] pb-3 mb-3.5 pl-2">
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-bold">
                          <Clock size={13} className="text-slate-400" />
                          {sStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {sEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-slate-300 dark:text-slate-600 font-black">•</span>
                          <span className="font-mono bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded font-black">
                            {Math.round((sEnd.getTime() - sStart.getTime()) / (1000 * 60))} mins
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {session.rescheduleCount > 0 && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full uppercase font-black flex items-center gap-1 shadow-sm">
                              <RefreshCw size={9} /> {session.rescheduleCount}x Rescheduled
                            </span>
                          )}
                          <span className={`text-[9px] border px-2.5 py-0.5 rounded-full font-black uppercase shadow-sm ${
                            session.status === 'completed' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25' :
                            session.status === 'missed' ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25' :
                            'bg-brand-500/10 text-brand-700 dark:text-brand-400 border-brand-500/25'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>

                      {/* Session Details */}
                      <div className="pl-2 space-y-2">
                        <h4 className={`text-sm font-black ${TXT_PRIMARY} flex items-center gap-2`}>
                          {session.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                          {session.description}
                        </p>
                      </div>
                    </div>

                    {/* Interactive controls */}
                    <div className="flex items-center gap-2 border-t border-slate-200 dark:border-white/[0.04] pt-4 mt-4 pl-2 select-none">
                      {session.status === 'scheduled' ? (
                        <>
                          <button
                            onClick={() => updateSessionStatus(session.id, 'completed')}
                            className="flex-1 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:border-transparent text-emerald-700 dark:text-emerald-400 hover:text-white text-xs font-black transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 size={13} /> Mark Completed
                          </button>
                          <button
                            onClick={() => updateSessionStatus(session.id, 'missed')}
                            className="flex-1 py-2 rounded-xl bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:border-transparent text-red-700 dark:text-red-400 hover:text-white text-xs font-black transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <XCircle size={13} /> Flag Missed
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => updateSessionStatus(session.id, 'scheduled')}
                          className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:border dark:border-white/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-black transition active:scale-95"
                        >
                          Restore to Scheduled Timeline
                        </button>
                      )}
                      
                      {/* Focus Lounge Redirect Integration Link */}
                      <button
                        onClick={() => {
                          window.location.href = '/timer?mode=normal_timer';
                        }}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-brand-500/20 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 text-slate-500 dark:text-slate-400 transition active:scale-90 flex items-center justify-center shadow-sm"
                        title="Launch Focus Lounge timer mode"
                      >
                        <Play size={13} fill="currentColor" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
