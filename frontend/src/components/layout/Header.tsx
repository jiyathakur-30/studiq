import React, { useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Flame,
  Plus,
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  CalendarCheck,
  ClipboardList,
  BookOpen,
  Clock,
  Settings as SettingsIcon,
  GraduationCap
} from 'lucide-react';
import { useAppStore } from '../../context/store';
import { Button } from '../common/Button';

interface HeaderProps {
  onQuickAdd: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onQuickAdd }) => {
  const user = useAppStore((state) => state.user);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Map path to friendly page titles
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Workspace Dashboard';
      case '/attendance': return 'Attendance Ledger';
      case '/assignments': return 'Assignments Kanban';
      case '/notes': return 'Notes Workspace';
      case '/timer': return 'Pomodoro Lounge';
      case '/performance': return 'Academic Performance Center';
      case '/settings': return 'Operating Settings';
      default: return 'STUDIQ OS';
    }
  };

  const themes: ('light' | 'dark' | 'cyberpunk')[] = ['light', 'dark', 'cyberpunk'];
  const themeIcons = {
    light: <Sun size={15} />,
    dark: <Moon size={15} />,
    cyberpunk: <Sparkles size={15} />
  };

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Attendance', to: '/attendance', icon: CalendarCheck },
    { name: 'Assignments', to: '/assignments', icon: ClipboardList },
    { name: 'Notes', to: '/notes', icon: BookOpen },
    { name: 'Study Timer', to: '/timer', icon: Clock },
    { name: 'Performance', to: '/performance', icon: GraduationCap },
    { name: 'Settings', to: '/settings', icon: SettingsIcon }
  ];

  return (
    <>
      <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md px-6 flex items-center justify-between relative z-20 flex-shrink-0">
        
        {/* Left Side: Mobile Hamburger & Page Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-brand-500/10 active:scale-95 transition-all"
          >
            <Menu size={20} />
          </button>
          
          <h1 className="font-sans font-extrabold text-foreground text-base tracking-tight hidden md:block glow-text">
            {getPageTitle()}
          </h1>
          <span className="font-sans font-bold text-foreground text-sm md:hidden">
            STUDIQ
          </span>
        </div>

        {/* Right Side: Quick Action, Streak, Theme, Profile */}
        <div className="flex items-center gap-4">
          
          {/* Quick Action Button */}
          <Button
            onClick={onQuickAdd}
            variant="primary"
            size="sm"
            className="shadow-md !rounded-lg text-xs gap-1.5 font-bold h-9"
          >
            <Plus size={14} /> <span className="hidden sm:inline">Quick Add</span>
          </Button>

          {/* Streak Indicator Widget */}
          {user ? (
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1.5 rounded-lg text-xs font-bold animate-float shadow-[0_0_15px_rgba(245,158,11,0.05)]">
              <Flame size={14} className="fill-amber-500 text-amber-500" />
              <span>{user.stats.studyStreak} Day Streak</span>
            </div>
          ) : null}

          {/* Multi-Theme Switcher Toggles */}
          <div className="flex items-center bg-card border border-border p-0.5 rounded-lg h-9">
            {themes.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`
                  p-1.5 rounded-md transition-all text-xs
                  ${theme === t 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'text-muted hover:text-foreground'}
                `}
                title={`${t.charAt(0).toUpperCase() + t.slice(1)} Mode`}
              >
                {themeIcons[t]}
              </button>
            ))}
          </div>

          {/* Collapsed Header Avatar */}
          {user ? (
            <img
              src={user.profilePicture.startsWith('http') ? user.profilePicture : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
              alt="Avatar"
              className="h-8 w-8 rounded-full border border-border object-cover hidden sm:block shadow-sm"
            />
          ) : null}
        </div>
      </header>

      {/* Mobile Drawer Drawer */}
      <AnimatePresence>
        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-50 md:hidden flex justify-start">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/30 dark:bg-black/75 backdrop-blur-sm"
            />

            {/* Sidebar drawer content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 bg-card border-r border-border p-6 flex flex-col h-full z-10 shadow-2xl"
            >
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <span className="font-bold text-foreground">STUDIQ OS</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation lists in drawer */}
              <nav className="space-y-1.5 flex-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group
                      ${isActive 
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-bold shadow-glow-brand' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
                    `}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
