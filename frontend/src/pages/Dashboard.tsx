import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  ClipboardList
} from 'lucide-react';
import { useAppStore } from '../context/store';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Link } from 'react-router-dom';
import { getGreetingByTime } from '../utils/time';

export const Dashboard: React.FC = () => {
  // Use optimized selectors to target state sub-modules, preventing re-renders from irrelevant store modifications
  const user = useAppStore((state) => state.user);
  const subjects = useAppStore((state) => state.subjects);
  const attendance = useAppStore((state) => state.attendance);
  const assignments = useAppStore((state) => state.assignments);
  const studySessions = useAppStore((state) => state.studySessions);

  // Memoize total focus minutes to prevent repeated reduce traversals
  const totalFocusMinutes = useMemo(() => {
    return studySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  }, [studySessions]);
  
  // Memoize assignment arrays
  const pendingAssignments = useMemo(() => {
    return assignments.filter(a => a.status !== 'done');
  }, [assignments]);

  const overdueAssignments = useMemo(() => {
    return pendingAssignments.filter(a => new Date(a.dueDate) < new Date());
  }, [pendingAssignments]);

  // Memoize overall attendance average
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

    return totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 100;
  }, [attendance]);

  const targetAttendance = user?.settings.targetAttendance || 75;

  // Memoize productivity score
  const productivityScore = useMemo(() => {
    const doneTasksCount = assignments.filter(a => a.status === 'done').length;
    const totalTasksCount = assignments.length;
    const taskRatio = totalTasksCount > 0 ? (doneTasksCount / totalTasksCount) * 100 : 80;
    const attendanceRatio = overallAttendance;
    const streakBonus = Math.min((user?.stats.studyStreak || 0) * 4, 20);

    return Math.min(Math.round((taskRatio * 0.4) + (attendanceRatio * 0.4) + 20 + streakBonus), 100);
  }, [assignments, overallAttendance, user]);

  // Memoize Recharts weekly data based on studySessions
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

  // Memoize AI suggestions recommendations list
  const aiSuggestions = useMemo(() => {
    const alerts = [];
    
    // Check low attendance classes
    subjects.forEach((sub) => {
      const subAtt = attendance.find(a => a.subjectId === sub.id);
      if (subAtt) {
        let total = 0;
        let attended = 0;
        subAtt.records.forEach(r => {
          if (r.status !== 'cancelled') {
            total += 1;
            if (r.status === 'attended') attended += 1;
          }
        });
        const pct = total > 0 ? (attended / total) * 100 : 100;
        if (pct < targetAttendance) {
          alerts.push({
            type: 'warning',
            text: `Critical! Your attendance in ${sub.name} is currently ${Math.round(pct)}%. You must attend upcoming classes to clear the ${targetAttendance}% limit.`
          });
        }
      }
    });

    // Check overdue assignments
    if (overdueAssignments.length > 0) {
      alerts.push({
        type: 'danger',
        text: `Urgent: You have ${overdueAssignments.length} overdue task(s). Resolve "${overdueAssignments[0].title}" immediately to preserve consistency.`
      });
    }

    // Default encouragement
    if (alerts.length === 0) {
      alerts.push({
        type: 'success',
        text: `⚡ Optimal Performance! All study indexes are healthy. Schedule a 25-minute Pomodoro block to maintain your 5-day streak!`
      });
    }

    return alerts;
  }, [subjects, attendance, targetAttendance, overdueAssignments]);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      
      {/* 1. Welcome Greeting Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="text-left space-y-2.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20 font-bold uppercase tracking-wider">
              Operating Terminal Active
            </span>
            {user ? (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-0.5">
                <Sparkles size={8} /> {user.stats.points} Points Unlocked
              </span>
            ) : null}
          </div>
          <h2 className="font-sans font-extrabold text-3xl md:text-4xl text-foreground leading-tight tracking-tight">
            {(() => {
              const greeting = getGreetingByTime();
              if (greeting === 'Working late?') {
                return `Working late, ${user?.username || 'Sarah'}? 🎯`;
              }
              return `${greeting}, ${user?.username || 'Sarah'}! 🎯`;
            })()}
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
            Your system analytics are stable. You have <strong className="text-foreground font-bold">{pendingAssignments.length} pending academic tasks</strong>. Keep the momentum going!
          </p>
        </div>
        
        {/* Fast Study Actions Grid */}
        <div className="grid grid-cols-2 gap-3 w-full md:w-auto relative z-10">
          <Link to="/timer" className="px-4 py-3 rounded-xl bg-brand-500/10 hover:bg-brand-500/15 border border-brand-500/20 hover:border-brand-500/40 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center gap-2 shadow-sm transition-all duration-200 active:scale-95 group">
            <Clock size={14} /> Start Focus Session <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <Link to="/assignments" className="px-4 py-3 rounded-xl bg-muted hover:bg-muted/80 border border-border text-foreground font-bold text-xs flex items-center gap-2 shadow-sm transition-all duration-200 active:scale-95 group">
            <ClipboardList size={14} /> Manage Kanban <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* 2. KPI Score Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Streaks Widget */}
        <Card className="flex items-center justify-between">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Study Streak</span>
            <h3 className="font-sans font-extrabold text-2xl text-foreground tracking-tight">{user?.stats.studyStreak || 5} Consecutive Days</h3>
            <p className="text-xs text-muted-foreground">Studied today • Streak locks in 6 hours</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm animate-float">
            <Flame size={20} className="fill-amber-500 text-amber-500" />
          </div>
        </Card>

        {/* Productivity Index */}
        <Card className="flex items-center justify-between">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Productivity Score</span>
            <h3 className="font-sans font-extrabold text-2xl text-foreground tracking-tight">{productivityScore}% Index</h3>
            <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${productivityScore}%` }} />
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shadow-sm">
            <TrendingUp size={20} />
          </div>
        </Card>

        {/* Focus Minutes */}
        <Card className="flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Accumulated Focus</span>
            <h3 className="font-sans font-extrabold text-2xl text-foreground tracking-tight">{totalFocusMinutes} Minutes</h3>
            <p className="text-xs text-muted-foreground">Across {studySessions.length} total sessions</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm">
            <CheckCircle2 size={20} />
          </div>
        </Card>

      </div>

      {/* 3. Recharts Graph & AI Suggestions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Study Area Graph */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="text-left">
              <h3 className="font-sans font-bold text-lg text-foreground tracking-tight">Focus Lounge Trend</h3>
              <p className="text-xs text-muted-foreground">Total deep focus minutes logged this week</p>
            </div>
            <Badge variant="brand">Last 7 Days</Badge>
          </div>
          
          <div className="h-56 w-full pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-select)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600' }}
                  itemStyle={{ color: 'var(--text-main)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="minutes" name="Focus Min" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorMinutes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Recommendations Panel */}
        <Card className="flex flex-col h-full justify-between">
          <div>
            <h3 className="font-sans font-bold text-lg text-foreground tracking-tight flex items-center gap-1.5 mb-2">
              <Sparkles size={16} className="text-brand-500 fill-brand-500/10" /> Smart Suggestions
            </h3>
            <p className="text-xs text-muted-foreground mb-6">Real-time predictive suggestions based on student data trends.</p>
            
            <div className="space-y-4">
              {aiSuggestions.map((sug, idx) => (
                <div
                  key={idx}
                  className={`
                    p-4 rounded-xl border text-xs font-semibold leading-relaxed flex gap-3 text-left
                    ${sug.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400' : ''}
                    ${sug.type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400' : ''}
                    ${sug.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : ''}
                  `}
                >
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{sug.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-border mt-6 text-left">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-bold">Heuristic Engine Status:</span>
            <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1 mt-1">
              • AI Engine Active & Optimizing
            </span>
          </div>
        </Card>

      </div>

      {/* 4. Attendance Gauges & Overdue Assignments timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Summary Grid */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6 text-left">
            <div>
              <h3 className="font-sans font-bold text-base text-foreground tracking-tight">Active Attendance Overview</h3>
              <p className="text-xs text-muted-foreground">
                Class records average: <strong className="text-brand-600 dark:text-brand-400 font-bold">{overallAttendance}%</strong>
              </p>
            </div>
            <Link to="/attendance" className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold transition-all">
              Manage Ledger →
            </Link>
          </div>

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
                <div key={sub.id} className="p-4 rounded-xl border border-border bg-muted/20 hover:border-brand-500/30 transition-all duration-300 text-left flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sub.color }} /> {sub.code}
                    </span>
                    <h4 className="text-xs font-extrabold text-foreground truncate max-w-[160px]">{sub.name}</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold">{attended} / {total} Lectures Attended</p>
                  </div>
                  
                  <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-black transition-all ${isWarning ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 shadow-glow-rose' : 'bg-muted border-border text-foreground'}`}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Task Timeline / Deadlines */}
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-bold text-base text-foreground tracking-tight flex items-center gap-1.5 mb-2 text-left">
              <CalendarDays size={16} className="text-brand-500" /> Deadline Warnings
            </h3>
            <p className="text-xs text-muted-foreground mb-6 text-left">Upcoming and overdue assignment tasks.</p>

            <div className="space-y-3.5">
              {pendingAssignments.slice(0, 3).map((task) => {
                const sub = subjects.find(s => s.id === task.subjectId);
                const isOverdue = new Date(task.dueDate) < new Date();

                return (
                  <div key={task.id} className="flex gap-3 text-left">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`h-2.5 w-2.5 rounded-full border ${isOverdue ? 'bg-red-500 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-muted border-border'}`} />
                      <div className="w-0.5 h-10 bg-border mt-1" />
                    </div>
                    
                    <div className="space-y-0.5 overflow-hidden">
                      <h4 className="text-xs font-bold text-foreground truncate">{task.title}</h4>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        Subject: {sub?.name || 'General'}
                      </p>
                      <span className={`text-[10px] font-bold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                        {isOverdue ? '🚫 OVERDUE' : `📅 Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                );
              })}

              {pendingAssignments.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground font-medium">
                  🎉 No pending task deadlines! Nice job.
                </div>
              )}
            </div>
          </div>
          
          <Link to="/assignments" className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold block pt-4 text-center border-t border-border mt-4 transition-all">
            Manage Assignments Board →
          </Link>
        </Card>

      </div>

    </div>
  );
};
