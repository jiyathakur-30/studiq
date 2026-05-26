import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../../context/store';
import { CalendarCheck, ClipboardList, BookOpen, Clock, X, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AICoach } from './AICoach';
import { Input } from '../common/Input';
import { Select } from '../common/Select';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'attendance' | 'assignment' | 'note' | 'study'>('assignment');
  
  // Quick Add State parameters using optimized Zustand selectors to prevent unnecessary parent re-renders
  const subjects = useAppStore((state) => state.subjects);
  const addAssignment = useAppStore((state) => state.addAssignment);
  const logAttendance = useAppStore((state) => state.logAttendance);
  const addNote = useAppStore((state) => state.addNote);
  const addStudySession = useAppStore((state) => state.addStudySession);
  const isAiCoachOpen = useAppStore((state) => state.isAiCoachOpen);


  const [title, setTitle] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [duration, setDuration] = useState('25');
  const [status, setStatus] = useState<'attended' | 'missed' | 'cancelled'>('attended');
  const [notes, setNotes] = useState('');

  // Command Palette Keyboard Listeners: Ctrl+K or Cmd+K to open, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQuickAddOpen) {
        setIsQuickAddOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickAddOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickAddOpen]);

  // Handle Scroll lock on active modal open states
  useEffect(() => {
    if (isQuickAddOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isQuickAddOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quickAddType === 'assignment') {
      if (!title || !dueDate) return;
      await addAssignment({
        title,
        description: '',
        dueDate: new Date(dueDate).toISOString(),
        priority,
        status: 'todo',
        subjectId: selectedSubject || null,
        subtasks: []
      });
    } else if (quickAddType === 'attendance') {
      if (!selectedSubject) return;
      await logAttendance(selectedSubject, {
        date: new Date().toISOString(),
        status,
        note: notes
      });
    } else if (quickAddType === 'note') {
      if (!title) return;
      await addNote({
        title,
        content: '',
        isPinned: false,
        tags: [],
        subjectId: selectedSubject || null,
        flashcards: []
      });
    } else if (quickAddType === 'study') {
      await addStudySession({
        subjectId: selectedSubject || null,
        durationMinutes: Number(duration),
        mode: 'pomodoro',
        notes
      });
    }

    // Reset Parameters
    setTitle('');
    setSelectedSubject('');
    setDueDate('');
    setPriority('medium');
    setDuration('25');
    setStatus('attended');
    setNotes('');
    setIsQuickAddOpen(false);
  };

  const actionTabs = [
    { type: 'assignment', label: 'Task', icon: ClipboardList },
    { type: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { type: 'note', label: 'Note', icon: BookOpen },
    { type: 'study', label: 'Focus Log', icon: Clock }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased font-sans">
      
      {/* Elastic Collapsible Sidebar with soft focus transition */}
      <div className={`flex h-full transition-all duration-300 ${isAiCoachOpen ? 'opacity-40 blur-[1px] pointer-events-none scale-[0.99]' : ''}`}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300 ${isAiCoachOpen ? 'opacity-40 blur-[1px] pointer-events-none scale-[0.99]' : ''}`}>
        <Header onQuickAdd={() => setIsQuickAddOpen(true)} />
        
        {/* Child Outlet with responsive mobile-first padding */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Premium Command Palette Center Overlay */}
      <AnimatePresence>
        {isQuickAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Solid Elevating Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuickAddOpen(false)}
              className="fixed inset-0 bg-slate-950/60 dark:bg-black/90 backdrop-blur-[4px]"
            />

            {/* Custom Command Palette Container */}
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 400 }}
              className="relative w-full max-w-2xl z-10 overflow-hidden rounded-2xl border border-slate-200 dark:border-[#1b2230] bg-white dark:bg-[#07090e] [.cyberpunk_&]:bg-[#030305] shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.03),0_20px_40px_-6px_rgba(0,0,0,0.08),0_40px_80px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_8px_24px_rgba(0,0,0,0.6),0_32px_80px_-8px_rgba(0,0,0,0.9)] [.cyberpunk_&]:shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-slate-200/50 dark:ring-white/5 [.cyberpunk_&]:ring-cyan-500/20 will-change-transform"
            >
              {/* Dynamic top ambient visual accent glow */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
                quickAddType === 'assignment' ? 'from-brand-500 via-indigo-500 to-brand-500' :
                quickAddType === 'attendance' ? 'from-emerald-500 via-teal-500 to-emerald-500' :
                quickAddType === 'note' ? 'from-cyan-500 via-blue-500 to-cyan-500' :
                'from-amber-500 via-orange-500 to-amber-500'
              }`} />
              
              <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full filter blur-[90px] pointer-events-none transition-all duration-500 ${
                quickAddType === 'assignment' ? 'bg-brand-500/10' :
                quickAddType === 'attendance' ? 'bg-emerald-500/10' :
                quickAddType === 'note' ? 'bg-cyan-500/10' :
                'bg-amber-500/10'
              }`} />

              {/* Command Palette Title Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-[#1b2230] bg-slate-50 dark:bg-[#0d1017]">
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-black font-mono tracking-widest uppercase transition-all duration-300 ${
                  quickAddType === 'assignment' ? 'bg-brand-500/10 border border-brand-500/20 text-brand-500' :
                  quickAddType === 'attendance' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' :
                  quickAddType === 'note' ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-500' :
                  'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                }`}>
                  <Sparkles size={10} /> COMMAND
                </div>
                <span className="text-slate-400 dark:text-slate-600 text-xs">/</span>
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                  STUDIQ Action Terminal
                </h3>
                <span className="text-[9px] text-slate-750 dark:text-slate-350 font-black font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded ml-2 hidden sm:inline">
                  ⌘K to toggle
                </span>
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="ml-auto text-slate-400 dark:text-slate-550 hover:text-slate-800 dark:hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 active:scale-95 transition-all"
                  title="Close command center"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Action Tabs Row (Segmented Command Selection Control) */}
              <div className="px-6 pt-4">
                <div className="flex bg-slate-100 dark:bg-[#05060a] border border-slate-200 dark:border-[#1b2230] p-1 rounded-xl relative">
                  {actionTabs.map((tab) => {
                    const isActive = quickAddType === tab.type;
                    
                    // Dynamic highlight colors matching each type
                    const activeColorClass = 
                      tab.type === 'assignment' ? 'text-brand-600 dark:text-brand-400 font-black' :
                      tab.type === 'attendance' ? 'text-emerald-700 dark:text-emerald-400 font-black' :
                      tab.type === 'note' ? 'text-cyan-700 dark:text-cyan-400 font-black' :
                      'text-amber-700 dark:text-amber-400 font-black';

                    return (
                      <button
                        key={tab.type}
                        type="button"
                        onClick={() => setQuickAddType(tab.type as any)}
                        className={`
                          flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all relative z-10
                          ${isActive ? activeColorClass : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}
                        `}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeCommandTab"
                            className="absolute inset-0 bg-white dark:bg-[#0d1017] rounded-lg border border-slate-200 dark:border-[#20293a] shadow-sm"
                            transition={{ type: 'spring', damping: 20, stiffness: 240 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <tab.icon size={13} className={isActive ? '' : 'text-slate-500 dark:text-slate-400'} />
                          <span>{tab.label}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Command Form Parameters */}
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Context Subject Picker (Shared Parameter) */}
                  <Select
                    label="Context / Course Subject"
                    value={selectedSubject}
                    onChange={setSelectedSubject}
                    options={[
                      { value: '', label: 'No Context / General Action' },
                      ...subjects.map((sub) => ({
                        value: sub.id,
                        label: `${sub.name} (${sub.code})`
                      }))
                    ]}
                  />
                  {/* Dynamic Action Fields based on Type Selection */}
                  {quickAddType === 'assignment' && (
                    <div className="space-y-5">
                      <Input
                        label="Task / Assignment Title"
                        placeholder="Name of the upcoming assignment or milestone..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Input
                          label="Due Date"
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          required
                        />
                        <Select
                          label="Priority Status"
                          value={priority}
                          onChange={(val) => setPriority(val)}
                          options={[
                            { value: 'low', label: '🟢 Low Priority' },
                            { value: 'medium', label: '🟡 Medium Priority' },
                            { value: 'high', label: '🔴 High Priority' }
                          ]}
                        />
                      </div>
                    </div>
                  )}

                  {quickAddType === 'attendance' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Select
                        label="Mark Status"
                        value={status}
                        onChange={(val) => setStatus(val)}
                        options={[
                          { value: 'attended', label: '✔️ Attended Lecture' },
                          { value: 'missed', label: '❌ Missed Lecture' },
                          { value: 'cancelled', label: '🚫 Lecture Cancelled' }
                        ]}
                      />
                      <Input
                        label="Optional Session Note"
                        type="text"
                        placeholder="e.g. covered AVL balancing"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  )}

                  {quickAddType === 'note' && (
                    <Input
                      label="Note Title"
                      type="text"
                      placeholder="Title for your new revision note..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  )}

                  {quickAddType === 'study' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        label="Focus Duration (minutes)"
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                      />
                      <Input
                        label="Focus Session Notes"
                        type="text"
                        placeholder="e.g. read algorithm bounds"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Actions & Hotkey Footer bar */}
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-[#1b2230] pt-5 mt-6">
                    {/* Hotkey suggestions */}
                    <div className="hidden sm:flex items-center gap-3 text-[9px] font-bold text-slate-550 dark:text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 dark:bg-[#0d1017] border border-slate-200 dark:border-[#20293a] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded shadow-sm font-bold">ESC</span>
                        <span>close</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 dark:bg-[#0d1017] border border-slate-200 dark:border-[#20293a] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded shadow-sm font-bold">⌘K</span>
                        <span>toggle</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 dark:bg-[#0d1017] border border-slate-200 dark:border-[#20293a] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded shadow-sm font-bold">⏎ ENTER</span>
                        <span>execute</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => setIsQuickAddOpen(false)}
                        className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0d1017] rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`px-5 py-2 text-xs font-black text-white rounded-xl shadow-md transition-all active:scale-[0.97] hover:scale-[1.01] ${
                          quickAddType === 'assignment' ? 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20' :
                          quickAddType === 'attendance' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' :
                          quickAddType === 'note' ? 'bg-cyan-500 hover:bg-cyan-600 shadow-cyan-500/20' :
                          'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                        }`}
                      >
                        Execute Action
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Global AI Academic Coach flagship assistant workspace overlay */}
      <AICoach />
    </div>
  );
};
