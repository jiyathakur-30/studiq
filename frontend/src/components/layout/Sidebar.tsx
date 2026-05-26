import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarCheck,
  ClipboardList,
  BookOpen,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  GraduationCap,
  Calculator,
  Calendar,
  Brain
} from 'lucide-react';
import { useAppStore } from '../../context/store';
import { Logo } from '../common/Logo';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const logout = useAppStore((state) => state.logout);
  const user = useAppStore((state) => state.user);
  const theme = useAppStore((state) => state.theme);

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Attendance', to: '/attendance', icon: CalendarCheck },
    { name: 'Assignments', to: '/assignments', icon: ClipboardList },
    { name: 'Notes', to: '/notes', icon: BookOpen },
    { name: 'Study Timer', to: '/timer', icon: Clock },
    { name: 'Focus Intelligence', to: '/performance', icon: Brain },
    { name: 'SGPA Calculator', to: '/sgpa-calculator', icon: Calculator },
    { name: 'AI Scheduler', to: '/scheduler', icon: Calendar },
    { name: 'Settings', to: '/settings', icon: Settings }
  ];

  return (
    <motion.div
      animate={{ width: isCollapsed ? '72px' : '260px' }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="hidden md:flex flex-col h-screen bg-card backdrop-blur-xl border-r border-border text-muted relative z-30 flex-shrink-0"
    >
      {/* Brand Logo Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border h-16">
        {!isCollapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center"
          >
            <Logo size="md" />
          </motion.div>
        ) : (
          <Logo iconOnly size="md" className="mx-auto" />
        )}

        {/* Collapse Toggle Trigger */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            absolute -right-3 top-5 w-6 h-6 rounded-full border shadow-md active:scale-90 transition-all z-40 flex items-center justify-center
            ${theme === 'light'
              ? 'bg-slate-200 border-slate-400 text-black hover:bg-slate-300 hover:text-black'
              : 'bg-card border-border hover:border-brand-500/50 text-muted-foreground hover:text-foreground'
            }
          `}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.98] group relative
              ${isActive 
                ? 'bg-brand-500/[0.04] text-brand-600 dark:text-brand-400 font-semibold' 
                : 'text-muted-foreground hover:text-foreground hover:bg-brand-500/[0.02]'}
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="activeSidebarIndicator"
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-brand-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon size={18} className={isActive ? 'text-brand-600 dark:text-brand-400' : 'text-muted-foreground group-hover:text-foreground transition-colors'} />
                {!isCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>{item.name}</motion.span>}
                
                {/* Collapsed Tooltips */}
                {isCollapsed && (
                  <div className="absolute left-16 bg-background border border-border text-foreground text-xs px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-250 shadow-xl font-medium whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile Block */}
      <div className="p-3 border-t border-border">
        {!isCollapsed && user ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between p-2 rounded-lg bg-background border border-border"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={user.profilePicture.startsWith('http') ? user.profilePicture : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                alt="Sarah"
                className="h-8 w-8 rounded-full border border-border object-cover"
              />
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-xs font-bold text-foreground truncate">{user.username}</span>
                <span className="text-[10px] text-muted truncate flex items-center gap-0.5">
                  <Sparkles size={8} className="text-brand-500" /> {user.stats.points} pts
                </span>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </motion.div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex justify-center py-2.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all group relative"
          >
            <LogOut size={18} />
            {isCollapsed && (
              <div className="absolute left-16 bg-background border border-border text-foreground text-xs px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-250 shadow-xl whitespace-nowrap z-50">
                Sign Out
              </div>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};
