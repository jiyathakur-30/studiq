import React, { useState, useEffect } from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
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
  GraduationCap,
  Calculator,
  Calendar,
  User,
  LogOut,
  Bell,
  Brain,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../context/store';
import { Button } from '../common/Button';
import { Logo } from '../common/Logo';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  onQuickAdd: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onQuickAdd }) => {
  const user = useAppStore((state) => state.user);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const logout = useAppStore((state) => state.logout);
  const isOffline = useAppStore((state) => state.isOffline);
  const syncStatus = useAppStore((state) => state.syncStatus);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = React.useRef<HTMLDivElement>(null);

  // Read notifications unread count dynamically
  useEffect(() => {
    const checkNotifs = () => {
      const stored = localStorage.getItem('studiq_notifications');
      if (stored) {
        try {
          const list = JSON.parse(stored);
          const active = list.filter((n: any) => !n.dismissed && (!n.snoozedUntil || n.snoozedUntil < Date.now()));
          setUnreadCount(active.length);
        } catch (e) {}
      }
    };
    checkNotifs();
    const interval = setInterval(checkNotifs, 3000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close notifications dropdown
  useEffect(() => {
    const handleOutsideClickNotif = (e: MouseEvent | TouchEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener('mousedown', handleOutsideClickNotif);
      document.addEventListener('touchstart', handleOutsideClickNotif);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClickNotif);
      document.removeEventListener('touchstart', handleOutsideClickNotif);
    };
  }, [notifOpen]);

  // Close dropdown on click outside, Escape key, or mobile overlay adjustments
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('keydown', handleEscapeKey);
      
      // Prevent body scroll on mobile overlay mode to avoid background scroll bleed
      if (window.innerWidth < 640) {
        document.body.style.overflow = 'hidden';
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [dropdownOpen]);

  // Automatically close mobile menu when path changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open to prevent background scroll bleed
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (!dropdownRef.current) return;
    const focusableElements = dropdownRef.current.querySelectorAll(
      'a, button, [tabindex="0"]'
    );
    const elements = Array.from(focusableElements) as HTMLElement[];
    const activeIndex = elements.indexOf(document.activeElement as HTMLElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (activeIndex + 1) % elements.length;
      elements[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (activeIndex - 1 + elements.length) % elements.length;
      elements[prevIndex]?.focus();
    }
  };

  // Map path to friendly page titles
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Workspace Dashboard';
      case '/attendance': return 'Attendance Overview';
      case '/assignments': return 'Assignments Kanban';
      case '/notes': return 'Notes Workspace';
      case '/timer': return 'Pomodoro Lounge';
      case '/performance': return 'Focus Intelligence';
      case '/sgpa-calculator': return 'Academic Forecasts';
      case '/scheduler': return 'AI Smart Scheduler';
      case '/settings': return 'Operating Settings';
      default: return 'STUDIQ OS';
    }
  };
  const themes: ('light' | 'dark' | 'cyberpunk')[] = ['light', 'dark', 'cyberpunk'];
  const themeIcons = {
    light: <Sun size={13} className="sm:w-[15px] sm:h-[15px] flex-shrink-0" />,
    dark: <Moon size={13} className="sm:w-[15px] sm:h-[15px] flex-shrink-0" />,
    cyberpunk: <Sparkles size={13} className="sm:w-[15px] sm:h-[15px] flex-shrink-0" />
  };

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Attendance', to: '/attendance', icon: CalendarCheck },
    { name: 'Assignments', to: '/assignments', icon: ClipboardList },
    { name: 'Notes', to: '/notes', icon: BookOpen },
    { name: 'Study Timer', to: '/timer', icon: Clock },
    { name: 'Focus Intelligence', to: '/performance', icon: Brain },
    { name: 'SGPA Calculator', to: '/sgpa-calculator', icon: Calculator },
    { name: 'AI Scheduler', to: '/scheduler', icon: Calendar },
    { name: 'Settings', to: '/settings', icon: SettingsIcon }
  ];

  return (
    <>
      {isOffline && (
        <div className="bg-amber-500 dark:bg-amber-600/95 text-white text-[10px] font-mono tracking-wide font-extrabold text-center py-1.5 px-4 flex items-center justify-center gap-2 border-b border-amber-500/20 select-none relative z-30">
          <CloudOff size={11} className="animate-pulse" />
          <span>You are offline. Changes saved locally. Sync will resume automatically.</span>
        </div>
      )}
      <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between relative z-20 flex-shrink-0">
        
        {/* Left Side: Mobile Hamburger & Page Header */}
        <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-slate-900 dark:text-slate-100 cyberpunk:text-cyan-400 hover:text-brand-500 dark:hover:text-brand-400 cyberpunk:hover:text-cyan-300 hover:bg-brand-500/10 dark:hover:bg-brand-500/20 cyberpunk:hover:bg-cyan-500/10 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-brand-500/40"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
          
          <h1 className="font-sans font-extrabold text-foreground text-base tracking-tight hidden md:block glow-text">
            {getPageTitle()}
          </h1>

          {/* Calm Sync Status Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 ml-2.5 px-2.5 py-1 rounded-md bg-muted/40 border border-border/40 text-[9px] font-mono select-none">
            {isOffline ? (
              <>
                <CloudOff size={11} className="text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400 font-bold">Offline · Changes cached</span>
              </>
            ) : syncStatus === 'pending' ? (
              <>
                <RefreshCw size={11} className="text-brand-500 animate-spin" />
                <span className="text-brand-600 dark:text-brand-400 font-bold">Sync pending...</span>
              </>
            ) : (
              <>
                <Cloud size={11} className="text-emerald-500" />
                <span className="text-muted-foreground font-semibold">Synced</span>
              </>
            )}
          </div>

          <Logo size="sm" className="md:hidden ml-0.5" />
        </div>

        {/* Right Side: Quick Action, Streak, Theme, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
          
          {/* Quick Action Button */}
          <Button
            onClick={onQuickAdd}
            variant="primary"
            size="sm"
            className="shadow-md !rounded-lg text-xs gap-1.5 font-bold h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3.5 flex items-center justify-center flex-shrink-0"
            title="Quick Add Action"
          >
            <Plus size={14} className="flex-shrink-0" />
            <span className="hidden sm:inline">Quick Add</span>
          </Button>

          {/* Streak Indicator Widget */}
          {user ? (
            <div className="flex items-center gap-0.5 sm:gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black animate-float shadow-[0_0_15px_rgba(245,158,11,0.05)] flex-shrink-0">
              <Flame size={12} className="fill-amber-500 text-amber-500 flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
              <span className="hidden sm:inline">{user.stats.studyStreak} Day Streak</span>
              <span className="sm:hidden">{user.stats.studyStreak}d</span>
            </div>
          ) : null}

          {/* Notification Center Trigger */}
          {user ? (
            <div className="relative flex-shrink-0" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-1.5 rounded-lg text-slate-900 dark:text-slate-100 cyberpunk:text-cyan-400 hover:bg-brand-500/10 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-brand-500/40 h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center border border-border bg-card flex-shrink-0 relative"
                title="Notifications"
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                )}
              </button>
              
              <AnimatePresence>
                {notifOpen && (
                  <NotificationCenter onClose={() => setNotifOpen(false)} />
                )}
              </AnimatePresence>
            </div>
          ) : null}

          {/* Multi-Theme Switcher Toggles (Desktop only) */}
          <div className="hidden sm:flex items-center bg-card border border-border p-0.5 rounded-lg h-9 flex-shrink-0">
            {themes.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`
                  p-1.5 rounded-md transition-all text-xs flex items-center justify-center
                  ${theme === t 
                    ? (theme === 'light' 
                        ? 'bg-slate-200 text-black shadow-md' 
                        : 'bg-brand-500 text-white shadow-md')
                    : (theme === 'light'
                        ? 'text-slate-700 hover:text-black'
                        : 'text-muted-foreground hover:text-foreground')
                  }
                `}
                title={`${t.charAt(0).toUpperCase() + t.slice(1)} Mode`}
              >
                {themeIcons[t]}
              </button>
            ))}
          </div>

          {/* Single Cycle Button Theme Switcher (Mobile only) */}
          <button
            onClick={cycleTheme}
            className="sm:hidden p-1.5 rounded-lg text-slate-900 dark:text-slate-100 cyberpunk:text-cyan-400 hover:bg-brand-500/10 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-brand-500/40 h-8 w-8 flex items-center justify-center border border-border bg-card flex-shrink-0"
            title={`Active Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}. Tap to cycle.`}
          >
            {themeIcons[theme]}
          </button>

          {/* Collapsed Header Avatar & Accessible Dropdown */}
          {user ? (
            <div className="relative" ref={dropdownRef} onKeyDown={handleDropdownKeyDown}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-controls="profile-menu"
                className="flex items-center justify-center h-8 w-8 rounded-full border border-border hover:border-brand-500/70 focus:outline-none focus:ring-2 focus:ring-brand-500 active:scale-95 duration-200 transition-all overflow-hidden shadow-sm"
                title="User Account Menu"
                id="profile-menu-trigger"
              >
                <img
                  src={user.profilePicture.startsWith('http') ? user.profilePicture : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    key="profile-menu-dropdown"
                    id="profile-menu"
                    role="menu"
                    aria-labelledby="profile-menu-trigger"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="fixed sm:absolute top-16 sm:top-full right-3 sm:right-0 left-3 sm:left-auto sm:mt-2 w-auto sm:w-64 min-w-[220px] max-w-[95vw] sm:max-w-none rounded-xl border border-border bg-card shadow-2xl z-[9999] p-2 flex flex-col"
                  >
                    {/* User Quick Info Header */}
                    <div className="flex items-center gap-3 p-3 border-b border-border mb-1.5">
                      <img
                        src={user.profilePicture.startsWith('http') ? user.profilePicture : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                        alt="Avatar"
                        className="h-9 w-9 rounded-full border border-border object-cover"
                      />
                      <div className="flex flex-col text-left overflow-hidden">
                        <span className="text-xs font-black text-foreground truncate leading-none mb-0.5">{user.username}</span>
                        <span className="text-[10px] text-muted-foreground truncate leading-none">{user.email}</span>
                      </div>
                    </div>

                    {/* Nav Links */}
                    <div className="space-y-0.5" role="none">
                      <NavLink
                        to="/settings#profile-card"
                        onClick={() => setDropdownOpen(false)}
                        role="menuitem"
                        className={({ isActive }) => `
                          flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left w-full
                          ${isActive && location.hash === '#profile-card'
                            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-brand-500/5'}
                        `}
                      >
                        <User size={14} className="text-brand-500" />
                        <span>Edit Profile</span>
                      </NavLink>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                          navigate('/login', { replace: true });
                        }}
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/5 transition-all text-left w-full mt-1 border-t border-border pt-2"
                      >
                        <LogOut size={14} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : null}
        </div>
      </header>

      {/* Mobile Drawer Drawer */}
      {/* Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/30 dark:bg-black/75 backdrop-blur-sm z-40 cursor-pointer md:hidden"
        />
      )}

      {/* Sidebar drawer content */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-card border-r border-border p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] flex flex-col h-full z-50 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Header inside drawer */}
        <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
          <Logo size="md" />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="relative z-[9999] text-muted-foreground hover:text-foreground hover:bg-brand-500/10 active:scale-95 transition-all duration-150 rounded-lg p-1.5 outline-none focus:ring-2 focus:ring-brand-500/40 pointer-events-auto"
            aria-label="Close navigation menu"
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
                  : 'text-muted-foreground hover:text-foreground hover:bg-brand-500/5'}
              `}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>


    </>
  );
};
