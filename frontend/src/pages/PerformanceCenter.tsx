import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EmptyState } from '../components/common/EmptyState';
import {
  Brain,
  Info,
  HeartPulse,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../context/store';
import { useFocusAnalytics } from '../context/FocusAnalyticsContext';
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
  Legend
} from 'recharts';

// --- THEME-AWARE TYPOGRAPHY CONSTANTS ---
const TXT_PRIMARY = "text-slate-900 dark:text-white";
const TXT_SECONDARY = "text-slate-700 dark:text-slate-300";
const TXT_MUTED = "text-slate-500 dark:text-slate-400";

export const PerformanceCenter: React.FC = () => {
  const navigate = useNavigate();
  const { studySessions, subjects } = useAppStore();

  const {
    metrics,
    burnoutExplanation: fatigueExplanation,
    burnoutSuggestion: fatigueSuggestion,
    productivityInsights,
    adaptivePomodoroCycle,
    adaptivePomodoroExplanation,
    behavioralInsights
  } = useFocusAnalytics();

  const hasStudyData = useMemo(() => {
    return studySessions && studySessions.length > 0;
  }, [studySessions]);

  // --- CALM FATIGUE TERMINOLOGY MAPPER ---
  const fatigueLevel = useMemo(() => {
    if (!metrics) return { label: 'Stable', colorClass: 'text-emerald-600 dark:text-emerald-400', bgGradient: 'from-emerald-500/10 to-teal-500/5', borderClass: 'border-emerald-500/20' };
    
    switch (metrics.burnoutProbability) {
      case 'High':
        return {
          label: 'Elevated Fatigue',
          colorClass: 'text-amber-600 dark:text-amber-400 font-black animate-pulse',
          bgGradient: 'from-amber-500/20 to-orange-500/5',
          borderClass: 'border-amber-500/30'
        };
      case 'Elevated':
        return {
          label: 'Elevated Fatigue',
          colorClass: 'text-amber-600 dark:text-amber-400 font-bold',
          bgGradient: 'from-amber-500/15 to-orange-500/5',
          borderClass: 'border-amber-500/20'
        };
      case 'Moderate':
        return {
          label: 'Recovery Suggested',
          colorClass: 'text-indigo-600 dark:text-indigo-400 font-bold',
          bgGradient: 'from-indigo-500/15 to-brand-500/5',
          borderClass: 'border-indigo-500/20'
        };
      default:
        return {
          label: 'Stable',
          colorClass: 'text-emerald-600 dark:text-emerald-400 font-bold',
          bgGradient: 'from-emerald-500/10 to-teal-500/5',
          borderClass: 'border-emerald-500/20'
        };
    }
  }, [metrics]);

  // --- RECHARTS TELEMETRY DATA PREPARATORS ---

  // 1. Focus Timeline (Area Chart - focused vs idle minutes)
  const focusTimelineData = useMemo(() => {
    if (!studySessions) return [];
    // Sort studySessions oldest to newest, take last 8 sessions for premium high-clarity graph
    const sorted = [...studySessions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-8);

    return sorted.map((s, idx) => {
      const duration = s.durationMinutes || 0;
      // Heuristic fallback for idleMinutes if undefined
      const idle = (s as any).idleMinutes ?? Math.round(duration * (s.mode === 'pomodoro' ? 0.12 : 0.2));
      const focused = Math.max(0, duration - idle);
      const dateObj = new Date(s.date);
      const label = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      return {
        name: s.notes ? (s.notes.length > 12 ? s.notes.substring(0, 12) + '...' : s.notes) : `${label}`,
        Focused: focused,
        Idle: idle,
        Total: duration
      };
    });
  }, [studySessions]);

  // 2. Workload Stability (Bar Chart - study minutes spent per subject)
  const workloadStabilityData = useMemo(() => {
    if (!studySessions) return [];
    const minutesMap: Record<string, number> = {};
    studySessions.forEach(s => {
      if (s.subjectId) {
        minutesMap[s.subjectId] = (minutesMap[s.subjectId] || 0) + s.durationMinutes;
      }
    });

    return Object.entries(minutesMap).map(([subId, mins]) => {
      const sub = subjects.find(s => s.id === subId);
      return {
        name: sub?.code || sub?.name?.substring(0, 10) || 'General',
        Minutes: mins,
        fill: sub?.color || '#6366f1'
      };
    });
  }, [studySessions, subjects]);

  // 3. Focus Friction Analysis (Radar Chart - relative course friction index)
  const frictionRadarData = useMemo(() => {
    if (!metrics?.subjectResistanceIndex) return [];
    return Object.entries(metrics.subjectResistanceIndex).map(([subId, score]) => {
      const sub = subjects.find(s => s.id === subId);
      return {
        subject: sub?.code || sub?.name?.substring(0, 8) || 'General',
        Friction: score,
        fullMark: 100
      };
    });
  }, [metrics, subjects]);

  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-8 max-w-7xl mx-auto px-1 sm:px-0 pb-16 relative z-10 overflow-x-hidden min-w-0 max-w-full">
      
      {!hasStudyData ? (
        <div className="py-12 px-4 sm:px-6">
          <EmptyState
            align="center"
            size="lg"
            icon={<Brain size={24} className="text-brand-500" />}
            title="Focus analytics will activate after your first study session."
            description="Log Pomodoro cycles or deep work sessions in the timer, and STUDIQ will model your focus trends, fatigue boundaries, and optimal productivity hours."
            actionText="Open Study Timer"
            onAction={() => navigate('/timer')}
          />
        </div>
      ) : (
        <>
          {/* 🧠 Welcome Focus Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-glass-card p-4 sm:p-6 md:p-8 rounded-2xl overflow-hidden min-w-0 max-w-full transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.08)] hover:border-brand-500/20"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-[90px] z-0 pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 relative z-10 min-w-0 max-w-full">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                  <Brain size={24} className="sm:hidden" />
                  <Brain size={32} className="hidden sm:block" />
                </div>
                <div className="text-left min-w-0">
                  <h2 className={`font-sans font-extrabold text-base sm:text-xl md:text-2xl ${TXT_PRIMARY} tracking-tight flex flex-wrap items-center gap-1.5 min-w-0`}>
                    <span className="truncate">Focus Intelligence</span>
                    <span className="text-[9px] sm:text-[10px] text-brand-500 dark:text-brand-400 bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 max-w-full truncate whitespace-nowrap">BEHAVIORAL INSIGHTS</span>
                  </h2>
                  <p className={`text-[11px] sm:text-xs md:text-sm ${TXT_MUTED} mt-1 max-w-xl leading-relaxed`}>
                    Observational productivity metrics, focus consistency, and workflow rhythm mapping.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-6 shrink-0 mt-2 md:mt-0 min-w-0">
                <div className="text-right min-w-0">
                  <span className={`text-[8px] sm:text-[9px] md:text-[10px] ${TXT_MUTED} uppercase font-bold tracking-wider block truncate`}>FOCUS RATIO</span>
                  <div className={`text-xl sm:text-2xl md:text-3xl font-black ${TXT_PRIMARY} tracking-tight glow-text mt-0.5 truncate`}>
                    {metrics?.focusConsistencyScore ?? 0}%
                  </div>
                </div>
                <div className="h-8 sm:h-12 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="text-right min-w-0">
                  <span className={`text-[8px] sm:text-[9px] md:text-[10px] ${TXT_MUTED} uppercase font-bold tracking-wider block truncate`}>ATTENTION SPAN</span>
                  <div className={`text-xl sm:text-2xl md:text-3xl font-black ${TXT_PRIMARY} tracking-tight mt-0.5 truncate`}>
                    {metrics?.attentionSpanEstimate ?? 0}m
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ⚡ Telemetry Grid: 4 Premium Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6 min-w-0 max-w-full">
            
            {/* Card 1: Focus Consistency */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="premium-glass-card p-3 sm:p-5 md:p-6 rounded-xl flex flex-col justify-between hover:shadow-[0_0_20px_rgba(99,102,241,0.05)] hover:border-brand-500/20 duration-300 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] sm:text-[10px] md:text-[11px] ${TXT_MUTED} uppercase font-extrabold tracking-wider`}>Focus Consistency</span>
                <Activity size={16} className="text-indigo-500" />
              </div>
              <div className="mt-4 sm:mt-6">
                <div className={`text-xl sm:text-2xl md:text-3xl font-black ${TXT_PRIMARY} tracking-tighter`}>
                  {metrics?.focusConsistencyScore ?? 0}%
                </div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 mt-1 sm:mt-2 leading-relaxed">
                  Ratio of active deep work focus vs total logged minutes.
                </p>
              </div>
            </motion.div>

            {/* Card 2: Fatigue Level */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="premium-glass-card p-3 sm:p-5 md:p-6 rounded-xl flex flex-col justify-between hover:shadow-[0_0_20px_rgba(99,102,241,0.05)] hover:border-brand-500/20 duration-300 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] sm:text-[10px] md:text-[11px] ${TXT_MUTED} uppercase font-extrabold tracking-wider`}>Fatigue Status</span>
                <HeartPulse size={16} className={fatigueLevel.colorClass.includes('emerald') ? 'text-emerald-500' : fatigueLevel.colorClass.includes('amber') ? 'text-amber-500' : 'text-indigo-500'} />
              </div>
              <div className="mt-4 sm:mt-6">
                <div className={`text-base sm:text-lg md:text-xl font-extrabold truncate ${fatigueLevel.colorClass}`}>
                  {fatigueLevel.label}
                </div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 mt-1 sm:mt-2 leading-relaxed">
                  Calibrated based on weekly study velocity and recovery periods.
                </p>
              </div>
            </motion.div>

            {/* Card 3: Productivity Drift */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="premium-glass-card p-3 sm:p-5 md:p-6 rounded-xl flex flex-col justify-between hover:shadow-[0_0_20px_rgba(99,102,241,0.05)] hover:border-brand-500/20 duration-300 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] sm:text-[10px] md:text-[11px] ${TXT_MUTED} uppercase font-extrabold tracking-wider`}>Productivity Drift</span>
                {metrics && metrics.productivityDrift > 40 ? (
                  <TrendingDown size={16} className="text-amber-500" />
                ) : (
                  <TrendingUp size={16} className="text-emerald-500" />
                )}
              </div>
              <div className="mt-4 sm:mt-6">
                <div className={`text-xl sm:text-2xl md:text-3xl font-black ${TXT_PRIMARY} tracking-tighter`}>
                  {metrics?.productivityDrift ?? 0}%
                </div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 mt-1 sm:mt-2 leading-relaxed">
                  Identifies changes in workload velocity and completed tasks.
                </p>
              </div>
            </motion.div>

            {/* Card 4: Adaptive Pomodoro Target */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="premium-glass-card p-3 sm:p-5 md:p-6 rounded-xl flex flex-col justify-between hover:shadow-[0_0_20px_rgba(99,102,241,0.05)] hover:border-brand-500/20 duration-300 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] sm:text-[10px] md:text-[11px] ${TXT_MUTED} uppercase font-extrabold tracking-wider`}>Adaptive Target</span>
                <Clock size={16} className="text-brand-500" />
              </div>
              <div className="mt-4 sm:mt-6">
                <div className={`text-xl sm:text-2xl md:text-3xl font-black ${TXT_PRIMARY} tracking-tighter`}>
                  {adaptivePomodoroCycle}
                </div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 mt-1 sm:mt-2 leading-relaxed truncate" title={adaptivePomodoroExplanation}>
                  {adaptivePomodoroExplanation}
                </p>
              </div>
            </motion.div>

          </div>

          {/* 📊 AI Stamina & Adaptive Insights Panel */}
          <div className="min-w-0 max-w-full">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="premium-glass-card p-4 sm:p-6 md:p-8 overflow-hidden min-w-0 max-w-full text-left transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.08)] hover:border-brand-500/20"
            >
              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-tr ${fatigueLevel.bgGradient} rounded-full blur-[80px] z-0 pointer-events-none`} />
              
              <div className="relative z-10 flex flex-col justify-between h-full w-full min-w-0 max-w-full">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-left min-w-0">
                    <Sparkles size={18} className="text-brand-500 shrink-0" />
                    <span className={`font-bold ${TXT_PRIMARY} text-xs sm:text-sm md:text-base truncate`}>Adaptive Study Insights</span>
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-semibold ${TXT_MUTED} bg-slate-50/80 dark:bg-slate-900/60 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 shrink-0 max-w-full truncate`}>
                    <Info size={10} className="text-brand-500 shrink-0" /> Observational calibration
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center py-4 sm:py-6 min-w-0 max-w-full">
                  {/* Radial Stamina Score */}
                  <div className="md:col-span-4 flex justify-center shrink-0">
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
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
                          animate={{ strokeDashoffset: 251.2 - (251.2 * (metrics?.focusConsistencyScore ?? 75)) / 100 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className={`text-2xl sm:text-3xl font-black ${TXT_PRIMARY} tracking-tighter`}>
                          {metrics?.focusConsistencyScore ?? 0}
                        </span>
                        <span className={`text-[8px] sm:text-[9px] font-bold ${TXT_MUTED} uppercase tracking-wider`}>STAMINA LEVEL</span>
                      </div>
                    </div>
                  </div>

                  {/* Adaptive Observations details */}
                  <div className="md:col-span-8 space-y-4 text-left min-w-0 max-w-full">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className={`text-[10px] sm:text-xs ${TXT_MUTED} uppercase font-bold tracking-wider shrink-0`}>Fatigue Threshold:</span>
                      <span className={`text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 truncate ${fatigueLevel.colorClass}`}>
                        {fatigueLevel.label}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className={`text-[9px] sm:text-[10px] ${TXT_MUTED} font-bold block uppercase tracking-wider`}>AI Observations</span>
                      <div className="space-y-1.5">
                        {behavioralInsights && behavioralInsights.length > 0 ? (
                          behavioralInsights.map((insight, idx) => (
                            <p key={idx} className={`text-xs ${TXT_SECONDARY} flex items-start gap-1.5`}>
                              <span className="text-brand-500 select-none">✦</span>
                              <span>{insight}</span>
                            </p>
                          ))
                        ) : (
                          <p className={`text-xs ${TXT_MUTED} italic`}>Analyzing daily study telemetry...</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <p className={`text-[11px] sm:text-xs ${TXT_SECONDARY} leading-relaxed`}>
                        🤖 <strong className={`${TXT_PRIMARY} font-bold`}>Focus Advisor:</strong> {fatigueSuggestion || 'Maintain a balanced study spacing schedule and log Pomodoros.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 📊 Selective Visual Analytics Grid (3 charts total) */}
          <div className="space-y-5 sm:space-y-6 md:space-y-8 min-w-0 max-w-full">
            
            {/* Chart 1: Focus Window Timeline (Area Chart - full width) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="premium-glass-card p-4 sm:p-6 overflow-hidden min-w-0 max-w-full text-left transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.08)] hover:border-brand-500/20"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl z-0 pointer-events-none" />
              
              <div className="relative z-10 w-full min-w-0 max-w-full">
                <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 flex-wrap">
                  <div className="text-left min-w-0">
                    <span className={`font-bold ${TXT_PRIMARY} text-sm sm:text-base block truncate`}>Focus Timeline</span>
                    <span className={`text-[10px] sm:text-xs ${TXT_MUTED} block mt-0.5`}>Active focused time vs idle time across recent study blocks</span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-brand-500 bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 max-w-full truncate">FOCUS RATIO MAP</span>
                </div>

                <div className="h-60 sm:h-72 md:h-80 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={focusTimelineData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="focusedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="idleGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="currentColor" 
                        className="text-slate-400 dark:text-slate-500" 
                        fontSize={9} 
                        fontWeight={600}
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="currentColor" 
                        className="text-slate-400 dark:text-slate-500" 
                        fontSize={9} 
                        fontWeight={600}
                        tickLine={false} 
                        axisLine={false} 
                        width={25}
                      />
                      <Tooltip
                        cursor={{ stroke: 'rgba(99, 102, 241, 0.15)', strokeWidth: 1.5 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="p-3 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-200/20 dark:border-slate-800/80 rounded-xl text-[11px] shadow-2xl text-left min-w-[130px] max-w-[200px] break-words">
                                <p className="font-extrabold text-white">{payload[0].payload.name}</p>
                                {payload.map((item, idx) => (
                                  <p key={idx} className="mt-1 flex justify-between items-center gap-4" style={{ color: item.color }}>
                                    <span className="opacity-90">{item.name}:</span>
                                    <strong className="text-white font-extrabold">{item.value} min</strong>
                                  </p>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Area type="monotone" dataKey="Focused" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#focusedGrad)" name="Focused Minutes" />
                      <Area type="monotone" dataKey="Idle" stroke="#ec4899" strokeWidth={1.5} fillOpacity={1} fill="url(#idleGrad)" name="Idle/Break Minutes" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* Split row for Workload Stability and Focus Friction Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0 max-w-full">
              
              {/* Chart 2: Workload Stability (Bar Chart - Bottom Left) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="premium-glass-card p-4 sm:p-6 overflow-hidden min-w-0 max-w-full text-left transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.08)] hover:border-brand-500/20"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl z-0 pointer-events-none" />
                
                <div className="relative z-10 w-full min-w-0 max-w-full">
                  <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 flex-wrap">
                    <div className="text-left min-w-0">
                      <span className={`font-bold ${TXT_PRIMARY} text-sm sm:text-base block truncate`}>Workload Stability</span>
                      <span className={`text-[10px] sm:text-xs ${TXT_MUTED} block mt-0.5`}>Time allocation and study minutes spent per subject</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-brand-500 bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 max-w-full truncate">TIME DISTRIBUTION</span>
                  </div>

                  <div className="h-56 sm:h-72 w-full min-w-0">
                    {workloadStabilityData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workloadStabilityData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="currentColor" 
                            className="text-slate-400 dark:text-slate-500" 
                            fontSize={9} 
                            fontWeight={600}
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <YAxis 
                            stroke="currentColor" 
                            className="text-slate-400 dark:text-slate-500" 
                            fontSize={9} 
                            fontWeight={600}
                            tickLine={false} 
                            axisLine={false} 
                            width={25}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="p-3 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-200/20 dark:border-slate-800/80 rounded-xl text-[11px] shadow-2xl text-left min-w-[120px] max-w-[200px] break-words">
                                    <p className="font-extrabold text-white">{payload[0].payload.name}</p>
                                    <p className="mt-1 flex justify-between items-center text-brand-400 gap-4">
                                      <span className="opacity-90">Total Duration:</span>
                                      <strong className="text-white font-extrabold">{payload[0].value} min</strong>
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="Minutes" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={`flex flex-col items-center justify-center h-full text-center p-6 text-xs ${TXT_MUTED}`}>
                        <span className="text-base mb-1">⏱️</span>
                        Add study timer sessions to map course efforts.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Chart 3: Focus Friction Analysis (Radar Chart - Bottom Right) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="premium-glass-card p-4 sm:p-6 overflow-hidden min-w-0 max-w-full text-left transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.08)] hover:border-brand-500/20"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl z-0 pointer-events-none" />
                
                <div className="relative z-10 w-full min-w-0 max-w-full">
                  <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 flex-wrap">
                    <div className="text-left min-w-0">
                      <span className={`font-bold ${TXT_PRIMARY} text-sm sm:text-base block truncate`}>Focus Friction Analysis</span>
                      <span className={`text-[10px] sm:text-xs ${TXT_MUTED} block mt-0.5`}>Relative study friction mapped against task backlog and time effort</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-brand-500 bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 max-w-full truncate">FRICTION SPECTRUM</span>
                  </div>

                  <div className="h-56 sm:h-72 w-full flex justify-center items-center min-w-0">
                    {frictionRadarData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={frictionRadarData}>
                          <PolarGrid stroke="var(--border-color)" />
                          <PolarAngleAxis 
                            dataKey="subject" 
                            stroke="currentColor" 
                            className="text-slate-400 dark:text-slate-500" 
                            fontSize={9} 
                            fontWeight={700}
                          />
                          <PolarRadiusAxis 
                            angle={30} 
                            domain={[0, 100]} 
                            stroke="currentColor" 
                            className="text-slate-400 dark:text-slate-500" 
                            fontSize={8} 
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="p-3 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-200/20 dark:border-slate-800/80 rounded-xl text-[11px] shadow-2xl text-left min-w-[120px] max-w-[200px] break-words">
                                    <p className="font-extrabold text-white">{data.subject}</p>
                                    <p className="text-brand-500 font-bold mt-1 flex justify-between items-center gap-4">
                                      <span className="opacity-90 text-slate-300">Friction Score:</span>
                                      <strong className="text-white font-extrabold">{data.Friction}/100</strong>
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Radar name="Friction Index" dataKey="Friction" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={`flex flex-col items-center justify-center h-full text-center p-6 text-xs ${TXT_MUTED}`}>
                        <span className="text-base mb-1">🕸️</span>
                        Friction spectrum will calibrate once subjects have logged study sessions.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default PerformanceCenter;
