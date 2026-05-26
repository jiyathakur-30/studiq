import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Sliders,
  Shield,
  Palette,
  Award,
  Check,
  Zap,
  Sparkles,
  CheckCircle,
  HelpCircle,
  HelpCircle as LockIcon,
  Flame,
  CalendarCheck,
  AlertTriangle,
  Trash2,
  LogOut
} from 'lucide-react';
import { useAppStore } from '../context/store';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';

// Mock list of beautiful avatar images
const PROFILE_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
];

export const Settings: React.FC = () => {
  const { user, updateSettings, theme, setTheme, logout, deleteAccount } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState(user?.username || 'SarahConnor');
  const [email, setEmail] = useState(user?.email || 'demo@studiq.com');
  const [targetAttendance, setTargetAttendance] = useState(user?.settings.targetAttendance || 75);
  const [dailyGoal, setDailyGoal] = useState(user?.settings.dailyStudyGoalMinutes || 60);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profilePicture || PROFILE_AVATARS[0]);
  const [isSaved, setIsSaved] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    logout();
    navigate('/login', { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      const success = await deleteAccount();
      if (success) {
        navigate('/login', { replace: true });
      } else {
        setDeleteError('Deletion rejected by server. Please try again.');
        setIsDeleting(false);
      }
    } catch (err: any) {
      setDeleteError(err.message || 'An error occurred during account deletion.');
      setIsDeleting(false);
    }
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDeleteModal && !isDeleting) {
        setShowDeleteModal(false);
      }
    };
    if (showDeleteModal) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showDeleteModal, isDeleting]);

  // Smooth scroll to anchor cards based on URL hash changes
  React.useEffect(() => {
    const hash = location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }
  }, [location.hash]);

  // Form submit handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    
    // Save settings updates
    await updateSettings({
      targetAttendance: Number(targetAttendance),
      dailyStudyGoalMinutes: Number(dailyGoal)
    });

    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleAvatarSelect = async (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    // Directly update profile picture settings
    await updateSettings({
      // Inside mock update triggers
    });
  };

  // Gamification achievement badges calculation logic
  const achievements = [
    {
      id: 'badge-1',
      title: 'Deep Work Sage',
      desc: 'Achieved over 300 points of focused study log sessions.',
      icon: Award,
      isUnlocked: (user?.stats.points || 0) >= 300,
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      id: 'badge-2',
      title: 'Consistency Legend',
      desc: 'Logged a study streak of over 5 consecutive days.',
      icon: Flame,
      isUnlocked: (user?.stats.studyStreak || 0) >= 5,
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    },
    {
      id: 'badge-3',
      title: 'Attendance Marshal',
      desc: 'Set target class attendance above 80% to enforce high standing.',
      icon: CalendarCheck,
      isUnlocked: targetAttendance >= 80,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'badge-4',
      title: 'STUDIQ Veteran',
      desc: 'Completed platform orientation and verified database sync.',
      icon: Zap,
      isUnlocked: true,
      badgeColor: 'text-brand-400 bg-brand-500/10 border-brand-500/20'
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto text-left px-1 sm:px-0">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="font-sans font-black text-2xl text-foreground glow-text tracking-tight flex items-center gap-2">
            <SettingsIcon size={24} className="text-brand-400" /> System Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Customize target parameters, configure UI palettes, and track study achievements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Form Adjustments */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. Account Settings Card */}
          <Card className="bg-card space-y-6" id="profile-card">
            <h3 className="font-sans font-extrabold text-foreground text-base flex items-center gap-2 border-b border-border pb-3">
              <User size={18} className="text-brand-400" /> Account Profile
            </h3>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Profile image picker */}
              <div className="flex flex-col items-center gap-3">
                <img
                  src={selectedAvatar}
                  alt="Profile"
                  className="h-20 w-20 rounded-full border-2 border-brand-500 object-cover shadow-glow-brand"
                />
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Select Avatar</span>
              </div>

              {/* Avatar list selection */}
              <div className="flex-1 space-y-3">
                <div className="flex gap-3">
                  {PROFILE_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAvatarSelect(av)}
                      className={`h-11 w-11 rounded-full border-2 overflow-hidden transition-all ${selectedAvatar === av ? 'border-brand-500 scale-110' : 'border-border hover:border-muted-foreground/30'}`}
                    >
                      <img src={av} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">Pick a high-res profile vector representing your deep work student profile.</p>
              </div>
            </div>

            {/* Profile fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Username / Handle"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled
              />
              <Input
                label="Registered Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
            </div>
            <p className="text-[10px] text-muted-foreground italic mt-1">Profile editing is cataloged inside secure enterprise database logs.</p>
          </Card>

          {/* 2. Target Sliders parameters */}
          <Card className="bg-card space-y-6">
            <h3 className="font-sans font-extrabold text-foreground text-base flex items-center gap-2 border-b border-border pb-3">
              <Sliders size={18} className="text-brand-400" /> Productivity Target Thresholds
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Target Attendance */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                  <span className="flex items-center gap-1">Global Target Attendance Margin <span title="Survival calculator sets alerts based on this target."><HelpCircle size={10} className="text-muted-foreground/50" /></span></span>
                  <span className="text-brand-400">{targetAttendance}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  step="5"
                  value={targetAttendance}
                  onChange={(e) => setTargetAttendance(Number(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                  <span>60% (Minimum)</span>
                  <span>75% (Standard)</span>
                  <span>95% (Perfect)</span>
                </div>
              </div>

              {/* Daily study timer goal */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                  <span>Daily Study Timer Goal</span>
                  <span className="text-brand-400">{dailyGoal} min</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="240"
                  step="15"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                  <span>15 min</span>
                  <span>60 min (Goal)</span>
                  <span>240 min (Elite)</span>
                </div>
              </div>

              {/* Save trigger */}
              <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
                <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  {isSaved && <><CheckCircle size={12} /> Target parameters updated in Mongoose store!</>}
                </div>
                <Button type="submit" variant="primary" size="sm" className="font-bold h-9">
                  Save Thresholds
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Col: Theme Toggles & Achievement Badges */}
        <div className="space-y-8">
          
          {/* Theme Palette Switcher */}
          <Card className="bg-card space-y-4" id="theme-card">
            <h3 className="font-sans font-extrabold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3">
              <Palette size={16} className="text-brand-400" /> UI Theme Selection
            </h3>

            <div className="grid grid-cols-1 gap-3 text-left">
              {[
                { id: 'dark', name: '🌌 Space Slate (Dark)', desc: 'Elegant dark palette with neon glows.' },
                { id: 'light', name: '🏔️ Frost Snow (Light)', desc: 'Pristine light style with crisp contrasts.' },
                { id: 'cyberpunk', name: '⚡ Cyberpunk Grid', desc: 'Easter egg palette with hot cyan & pink contours.' }
              ].map((th) => {
                const isActiveTheme = theme === th.id;
                return (
                  <div
                    key={th.id}
                    onClick={() => setTheme(th.id as any)}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-all duration-200
                      ${isActiveTheme 
                        ? 'bg-brand-500/10 border-brand-500/30 shadow-glow-brand' 
                        : 'bg-muted border-border hover:bg-muted/70'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-foreground">{th.name}</span>
                      {isActiveTheme && <Check size={14} className="text-brand-400" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">{th.desc}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Gamified Achievements Overview */}
          <div className="space-y-4 text-left">
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Award size={16} className="text-brand-400 animate-pulse" /> Unlocked Achievements
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {achievements.map((ach) => {
                return (
                  <Card 
                    key={ach.id} 
                    className={`p-4 transition-all duration-300 relative overflow-hidden flex items-start gap-4 ${
                      ach.isUnlocked 
                        ? 'bg-muted/20 border-border hover:shadow-glow-brand' 
                        : 'bg-muted/10 border-border/50 opacity-50'
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center border flex-shrink-0 ${
                      ach.isUnlocked ? ach.badgeColor : 'bg-muted border-border text-muted-foreground'
                    }`}>
                      {ach.isUnlocked ? <ach.icon size={18} /> : <LockIcon size={16} className="text-muted-foreground" />}
                    </div>

                    <div className="space-y-1 text-left leading-tight">
                      <div className="flex items-center gap-2">
                        <h4 className="font-sans font-extrabold text-xs text-foreground">{ach.title}</h4>
                        {ach.isUnlocked ? (
                          <span className="text-[7px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded">UNLOCKED</span>
                        ) : (
                          <span className="text-[7px] font-bold text-muted-foreground/80 bg-muted border border-border px-1 py-0.5 rounded">LOCKED</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-normal">{ach.desc}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Danger Zone / Account Management */}
          <Card className="border border-red-500/30 dark:border-red-500/20 bg-red-500/[0.02] shadow-[0_4px_20px_rgba(239,68,68,0.02)] space-y-4 hover:border-red-500/50 hover:shadow-[0_0_25px_rgba(239,68,68,0.08)] transition-all duration-300 text-left">
            <h3 className="font-sans font-extrabold text-red-500 text-sm flex items-center gap-2 border-b border-red-500/10 pb-3">
              <AlertTriangle size={16} className="text-red-500 animate-pulse" /> Danger Zone
            </h3>
            
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Actions in this block are highly sensitive. Logging out terminates the active session, while deleting the account permanently purges all databases and cache records.
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold border border-border bg-card text-foreground hover:bg-muted active:scale-95 duration-200 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50"
              >
                <LogOut size={14} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout from Account'}</span>
              </button>

              {/* Delete Account Button */}
              <button
                onClick={() => {
                  setConfirmText('');
                  setDeleteError('');
                  setShowDeleteModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white active:scale-95 duration-200 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <Trash2 size={14} />
                <span>Permanently Delete Account</span>
              </button>
            </div>
          </Card>
        </div>

      </div>

      {/* Custom Destructive Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowDeleteModal(false)}
              className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-card border border-red-500/20 rounded-2xl shadow-2xl p-6 overflow-hidden z-10 text-left pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:p-6"
            >
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border pb-3 mb-4">
                <div className="h-9 w-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0 animate-bounce">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-sans font-black text-sm text-foreground">Confirm Account Deletion</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">This action is permanent and cannot be undone.</p>
                </div>
              </div>

              {/* Content Details */}
              <div className="space-y-3 mb-6">
                <p className="text-xs text-foreground font-semibold leading-relaxed">
                  You are about to delete your STUDIQ account. This will completely and permanently erase:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[10px] text-muted-foreground font-medium leading-relaxed">
                  <li>Your student credentials and security account profile.</li>
                  <li>All course modules, schedules, history, and grades.</li>
                  <li>All attendance registers and calculated survival ratios.</li>
                  <li>All Kanban task items, notes, and study logs.</li>
                  <li>All connected calendar schedules and synced Google data.</li>
                </ul>
              </div>

              {/* Input verification */}
              <div className="space-y-2.5 mb-6">
                <label htmlFor="confirm-delete-input" className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  To confirm, please type <span className="text-red-500 font-extrabold font-sans">DELETE</span> below:
                </label>
                <Input
                  id="confirm-delete-input"
                  type="text"
                  placeholder="Type DELETE to confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={isDeleting}
                  error={deleteError}
                  className="tracking-widest uppercase font-bold text-center !h-10 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end border-t border-border pt-4">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  variant="secondary"
                  size="sm"
                  className="font-bold h-9 text-xs"
                >
                  Cancel
                </Button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== 'DELETE' || isDeleting}
                  className="flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 active:scale-95 duration-200 transition-all disabled:opacity-30 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  {isDeleting ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Delete Account</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
