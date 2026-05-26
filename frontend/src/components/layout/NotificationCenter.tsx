import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Clock, AlertTriangle, Calendar, HelpCircle, Activity } from 'lucide-react';
import { useAppStore } from '../../context/store';
import { useFocusAnalytics } from '../../context/FocusAnalyticsContext';

export interface AppNotification {
  id: string;
  type: 'attendance' | 'deadline' | 'focus' | 'exam';
  title: string;
  message: string;
  timestamp: number;
  dismissed: boolean;
  snoozedUntil?: number;
}

interface NotificationCenterProps {
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const focusAnalytics = useFocusAnalytics(); // Global adaptive analytics hook
  const { subjects, attendance, assignments, scheduledSessions } = useAppStore();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Hydrate notifications from localStorage and generate dynamic ones if empty
  useEffect(() => {
    const stored = localStorage.getItem('studiq_notifications');
    let list: AppNotification[] = stored ? JSON.parse(stored) : [];

    // Let's generate contextual academic notifications based on active store data
    const newList: AppNotification[] = [];

    // 1. Attendance warning
    subjects.forEach((sub) => {
      const subAtt = attendance.find(a => a.subjectId === sub.id);
      if (subAtt) {
        let total = 0;
        let attended = 0;
        subAtt.records.forEach((r) => {
          if (r.status !== 'cancelled') {
            total++;
            if (r.status === 'attended') attended++;
          }
        });
        const pct = total > 0 ? (attended / total) * 100 : 100;
        if (pct < 75 && total > 0) {
          const id = `att-${sub.id}`;
          if (!list.some(n => n.id === id)) {
            newList.push({
              id,
              type: 'attendance',
              title: 'Attendance Alert',
              message: `You're approaching the attendance threshold for ${sub.name} (${Math.round(pct)}%).`,
              timestamp: Date.now(),
              dismissed: false
            });
          }
        }
      }
    });

    // 2. Assignment deadline alert (due within 48 hours)
    assignments.forEach((task) => {
      if (task.status !== 'done') {
        const diffMs = new Date(task.dueDate).getTime() - Date.now();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours > 0 && diffHours <= 48) {
          const id = `dl-${task.id}`;
          if (!list.some(n => n.id === id)) {
            newList.push({
              id,
              type: 'deadline',
              title: 'Upcoming Deadline',
              message: `"${task.title}" is due in ${Math.round(diffHours)} hours. Plan a study sprint now.`,
              timestamp: Date.now(),
              dismissed: false
            });
          }
        }
      }
    });

    // 3. Focus timer consistency alert
    const timerHistory = useAppStore.getState().studySessions || [];
    const hasRecentTimer = timerHistory.some((sess) => {
      const diffMs = Date.now() - new Date(sess.date).getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 3;
    });

    if (timerHistory.length > 0 && !hasRecentTimer) {
      const id = 'focus-drop';
      if (!list.some(n => n.id === id)) {
        newList.push({
          id,
          type: 'focus',
          title: 'Focus Rhythm Shift',
          message: 'Your recent study consistency has dropped slightly. Consider launching a 25m Pomodoro to restore flow.',
          timestamp: Date.now(),
          dismissed: false
        });
      }
    }

    // Combine previous state list with brand new contextual notifications
    const combined = [...newList, ...list].sort((a, b) => b.timestamp - a.timestamp);
    setNotifications(combined);
    localStorage.setItem('studiq_notifications', JSON.stringify(combined));
  }, [subjects, attendance, assignments, scheduledSessions]);

  // Handle Dismiss action
  const handleDismiss = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, dismissed: true } : n);
    setNotifications(updated);
    localStorage.setItem('studiq_notifications', JSON.stringify(updated));
  };

  // Handle Snooze action (1 hour silence)
  const handleSnooze = (id: string) => {
    const snoozedUntil = Date.now() + 60 * 60 * 1000;
    const updated = notifications.map(n => n.id === id ? { ...n, snoozedUntil } : n);
    setNotifications(updated);
    localStorage.setItem('studiq_notifications', JSON.stringify(updated));
  };

  // Active visible notifications filter
  const activeNotifications = notifications.filter(
    n => !n.dismissed && (!n.snoozedUntil || n.snoozedUntil < Date.now())
  );

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'attendance':
        return <AlertTriangle size={13} className="text-amber-500" />;
      case 'deadline':
        return <Calendar size={13} className="text-brand-500" />;
      case 'focus':
        return <Activity size={13} className="text-emerald-500" />;
      default:
        return <HelpCircle size={13} className="text-blue-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="fixed sm:absolute top-16 sm:top-full right-3 sm:right-0 left-3 sm:left-auto sm:mt-2 w-auto sm:w-80 min-w-[260px] max-w-[95vw] sm:max-w-none rounded-xl border border-border bg-card shadow-2xl z-[9999] p-3 flex flex-col gap-2.5 text-left"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground font-bold flex items-center gap-1.5">
          <Bell size={10} className="text-brand-500" /> Notifications Drawer
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all outline-none"
        >
          <X size={12} />
        </button>
      </div>

      {/* Inbox List */}
      <div className="max-h-72 overflow-y-auto space-y-2 pr-0.5">
        {activeNotifications.length > 0 ? (
          <AnimatePresence initial={false}>
            {activeNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-muted/40 hover:bg-muted/65 border border-border/60 rounded-lg flex flex-col gap-1.5 transition-all relative overflow-hidden group/item"
              >
                {/* Upper line: icon + title + actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {getNotifIcon(notif.type)}
                    <span className="text-[10px] font-extrabold text-foreground uppercase tracking-wide">
                      {notif.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleSnooze(notif.id)}
                      className="p-1 rounded bg-card border border-border text-muted-foreground hover:text-foreground active:scale-90 transition-all"
                      title="Snooze for 1h"
                    >
                      <Clock size={9} />
                    </button>
                    <button
                      onClick={() => handleDismiss(notif.id)}
                      className="p-1 rounded bg-brand-500 text-white hover:bg-brand-600 active:scale-90 transition-all"
                      title="Dismiss alert"
                    >
                      <Check size={9} />
                    </button>
                  </div>
                </div>

                {/* Message copy */}
                <p className="text-[11px] text-muted-foreground leading-normal font-semibold">
                  {notif.message}
                </p>

                {/* Timestamp */}
                <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 uppercase mt-0.5">
                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-8 text-center space-y-1">
            <Check size={18} className="text-emerald-500 mx-auto" />
            <p className="text-xs text-muted-foreground font-semibold">Inbox fully clear</p>
            <p className="text-[10px] text-slate-400">All academic pipelines are currently optimal.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
