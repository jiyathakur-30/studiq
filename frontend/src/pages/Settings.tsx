import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  CalendarCheck
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
  const { user, updateSettings, theme, setTheme } = useAppStore();

  const [username, setUsername] = useState(user?.username || 'SarahConnor');
  const [email, setEmail] = useState(user?.email || 'demo@studiq.com');
  const [targetAttendance, setTargetAttendance] = useState(user?.settings.targetAttendance || 75);
  const [dailyGoal, setDailyGoal] = useState(user?.settings.dailyStudyGoalMinutes || 60);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profilePicture || PROFILE_AVATARS[0]);
  const [isSaved, setIsSaved] = useState(false);

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
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto text-left">
      
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
          <Card className="bg-card space-y-6">
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
          <Card className="bg-card space-y-4">
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

          {/* Gamified Achievements Ledger */}
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
        </div>

      </div>

    </div>
  );
};
