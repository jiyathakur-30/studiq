import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Music,
  Flame,
  Award,
  Plus,
  Compass,
  CheckCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  History,
  BookOpen
} from 'lucide-react';
import { useAppStore } from '../context/store';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';

// Free stream ambient loops for high-end SaaS feel
const AMBIENT_TRACKS = [
  { id: 'lofi', name: 'Lofi Chill beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'rain', name: 'Rain Storm loop', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'cafe', name: 'Library / Cafe Hum', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' }
];

export const StudyTimer: React.FC = () => {
  const {
    studySessions,
    subjects,
    addStudySession,
    user
  } = useAppStore();

  // Mode and Preset configurations
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'short_break' | 'long_break' | 'normal_timer'>('pomodoro');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [customDurationSeconds, setCustomDurationSeconds] = useState(25 * 60);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [customSliderVal, setCustomSliderVal] = useState(25);

  // HH:MM:SS custom inputs
  const [inputHours, setInputHours] = useState('0');
  const [inputMinutes, setInputMinutes] = useState('25');
  const [inputSeconds, setInputSeconds] = useState('0');

  // Focus Log Fields
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [focusStyle, setFocusStyle] = useState<'pomodoro' | 'deep_work'>('pomodoro');

  // Ambient Audio State
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer Interval Reference
  const intervalRef = useRef<any>(null);

  const isCustomTimer = timerMode === 'normal_timer';

  // Calculate SVG Progress Ring Bounds
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const initialDurationSeconds = isCustomTimer
    ? customDurationSeconds
    : durationMinutes * 60;
  const progressOffset = initialDurationSeconds > 0 
    ? circumference - (timeRemaining / initialDurationSeconds) * circumference
    : circumference;

  // Handle Preset updates
  const setPreset = (mode: 'pomodoro' | 'short_break' | 'long_break', minutes: number) => {
    setIsActive(false);
    setTimerMode(mode);
    setDurationMinutes(minutes);
    setTimeRemaining(minutes * 60);
    setCustomSliderVal(minutes);
  };

  const setPresetNormalTimer = () => {
    setIsActive(false);
    setTimerMode('normal_timer');
    setTimeRemaining(customDurationSeconds);
  };

  const handleTimeInputChange = (type: 'hours' | 'minutes' | 'seconds', val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const numVal = Number(cleaned || '0');
    
    let newHours = Number(inputHours || '0');
    let newMinutes = Number(inputMinutes || '0');
    let newSeconds = Number(inputSeconds || '0');

    if (type === 'hours') {
      const capped = numVal > 99 ? 99 : numVal;
      setInputHours(cleaned === '' ? '' : capped.toString());
      newHours = capped;
    } else if (type === 'minutes') {
      const capped = numVal > 59 ? 59 : numVal;
      setInputMinutes(cleaned === '' ? '' : capped.toString());
      newMinutes = capped;
    } else if (type === 'seconds') {
      const capped = numVal > 59 ? 59 : numVal;
      setInputSeconds(cleaned === '' ? '' : capped.toString());
      newSeconds = capped;
    }

    const totalSeconds = (newHours * 3600) + (newMinutes * 60) + newSeconds;
    setCustomDurationSeconds(totalSeconds);
    if (!isActive) {
      setTimeRemaining(totalSeconds);
    }
  };

  const handleTimeInputBlur = (type: 'hours' | 'minutes' | 'seconds') => {
    if (type === 'hours' && !inputHours) setInputHours('0');
    if (type === 'minutes' && !inputMinutes) setInputMinutes('0');
    if (type === 'seconds' && !inputSeconds) setInputSeconds('0');
  };

  const handleToggleActive = () => {
    if (!isActive && timeRemaining <= 0) {
      alert("Please set a duration greater than 0 seconds.");
      return;
    }
    setIsActive(!isActive);
  };

  // Intercept custom study sessions scheduled by the AI Coach
  useEffect(() => {
    const pendingDuration = localStorage.getItem('studiq_pending_timer_duration');
    const pendingSubjectId = localStorage.getItem('studiq_pending_timer_subject');
    
    if (pendingDuration) {
      const durationSeconds = parseInt(pendingDuration, 10);
      if (!isNaN(durationSeconds) && durationSeconds > 0) {
        setTimerMode('normal_timer');
        setCustomDurationSeconds(durationSeconds);
        setTimeRemaining(durationSeconds);
        
        // Convert to HH:MM:SS format
        const h = Math.floor(durationSeconds / 3600);
        const m = Math.floor((durationSeconds % 3600) / 60);
        const s = durationSeconds % 60;
        
        setInputHours(h.toString());
        setInputMinutes(m.toString());
        setInputSeconds(s.toString());
        
        if (pendingSubjectId) {
          setSelectedSubjectId(pendingSubjectId);
          setFocusStyle('deep_work');
        }
        
        // Auto start study sprint
        setIsActive(true);
      }
      
      // Clean up localStorage to prevent re-triggering
      localStorage.removeItem('studiq_pending_timer_duration');
      localStorage.removeItem('studiq_pending_timer_subject');
    }
  }, []);

  // Timer Countdown Logic
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeRemaining]);

  // Audio Playback synchronization
  useEffect(() => {
    if (isPlayingAudio && currentTrack) {
      const selectedTrack = AMBIENT_TRACKS.find(t => t.id === currentTrack);
      if (selectedTrack) {
        if (!audioRef.current) {
          audioRef.current = new Audio(selectedTrack.url);
          audioRef.current.loop = true;
        } else {
          audioRef.current.src = selectedTrack.url;
        }
        audioRef.current.play().catch(err => console.log('Audio autoplay blocked by browser', err));
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isPlayingAudio, currentTrack]);

  // Timer complete log trigger
  const handleTimerComplete = async () => {
    setIsActive(false);
    
    // Play alert beep
    try {
      const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav');
      beep.volume = 0.5;
      beep.play();
    } catch (e) {
      console.log(e);
    }

    if (isCustomTimer) {
      // Reward message / completion state
      alert(`🎉 Custom countdown timer completed!`);
      // Reset to custom duration
      setTimeRemaining(customDurationSeconds);
    } else {
      // Auto-Log Study Session
      await handleLogSessionSubmit();
      
      // Reward message
      alert(`🎉 Deep work session completed successfully! You unlocked +50 Study Points!`);
      
      // Reset to default
      setPreset('pomodoro', 25);
    }
  };

  // Skip timer
  const handleSkip = () => {
    setIsActive(false);
    setTimeRemaining(0);
  };

  // Reset timer
  const handleReset = () => {
    setIsActive(false);
    if (isCustomTimer) {
      setTimeRemaining(customDurationSeconds);
    } else {
      setTimeRemaining(durationMinutes * 60);
    }
  };

  // Toggle ambient soundtracks
  const handleToggleTrack = (trackId: string) => {
    if (currentTrack === trackId) {
      setIsPlayingAudio(!isPlayingAudio);
    } else {
      setCurrentTrack(trackId);
      setIsPlayingAudio(true);
    }
  };

  // Submit focus logs manual or auto
  const handleLogSessionSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Compute elapsed focus minutes
    const elapsedMinutes = Math.max(1, Math.round((initialDurationSeconds - timeRemaining) / 60));
    
    await addStudySession({
      subjectId: selectedSubjectId || null,
      durationMinutes: elapsedMinutes,
      mode: focusStyle,
      notes: sessionNotes || `Completed focus interval for ${timerMode.replace('_', ' ')}.`
    });

    // Reset notes
    setSessionNotes('');
    setSelectedSubjectId('');
  };

  // Slider adjustments
  const handleSliderChange = (minutes: number) => {
    setIsActive(false);
    setDurationMinutes(minutes);
    setTimeRemaining(minutes * 60);
    setCustomSliderVal(minutes);
  };

  // Time Formatter (HH:MM:SS or MM:SS)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0 || isCustomTimer) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto text-left">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-black text-2xl text-foreground glow-text tracking-tight">
            Focus Lounge
          </h2>
          <p className="text-sm text-muted-foreground">
            Activate immersive clocks, spin ambient sound layers, and catalog productive study timelines.
          </p>
        </div>

        {/* User stats widget */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-muted/60 border border-border px-3.5 py-1.5 rounded-lg">
            <Flame size={16} className="text-amber-500 animate-pulse" />
            <div className="text-left leading-none">
              <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-wider block">streak</span>
              <span className="text-xs font-black text-foreground">{user?.stats.studyStreak || 0} Days</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-muted/60 border border-border px-3.5 py-1.5 rounded-lg">
            <Award size={16} className="text-brand-400" />
            <div className="text-left leading-none">
              <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-wider block">points</span>
              <span className="text-xs font-black text-foreground">{user?.stats.points || 0} pts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Immersion Pomodoro Ring Container */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="flex flex-col items-center justify-center py-10 relative overflow-hidden bg-card">
            {/* Action Mode Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 bg-muted border border-border p-1 rounded-xl mb-8 z-10">
              <button
                type="button"
                onClick={() => setPreset('pomodoro', 25)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timerMode === 'pomodoro' ? 'bg-brand-500 text-white shadow-glow-brand' : 'text-muted-foreground hover:text-foreground'}`}
              >
                🔥 Focus Mode
              </button>
              <button
                type="button"
                onClick={() => setPreset('short_break', 5)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timerMode === 'short_break' ? 'bg-emerald-500 text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                🟢 Short Break
              </button>
              <button
                type="button"
                onClick={() => setPreset('long_break', 15)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timerMode === 'long_break' ? 'bg-cyan-500 text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                🔵 Long Break
              </button>
              <button
                type="button"
                onClick={setPresetNormalTimer}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timerMode === 'normal_timer' ? 'bg-indigo-500 text-white shadow-glow-indigo' : 'text-muted-foreground hover:text-foreground'}`}
              >
                ⏱️ Normal Timer
              </button>
            </div>

            {/* Circular countdown SVG ring */}
            <div className="relative h-56 w-56 flex items-center justify-center z-10 mb-8">
              <svg className="h-full w-full absolute -rotate-90">
                {/* Background track circle */}
                <circle
                  cx="112"
                  cy="112"
                  r={radius}
                  stroke="var(--bg-muted)"
                  strokeWidth="6"
                  className="fill-transparent"
                />
                {/* Active progress circle */}
                <circle
                  cx="112"
                  cy="112"
                  r={radius}
                  className={`fill-transparent stroke-[6] transition-all duration-1000 ${
                    timerMode === 'pomodoro' ? 'stroke-brand-500' : 
                    timerMode === 'short_break' ? 'stroke-emerald-500' : 
                    timerMode === 'long_break' ? 'stroke-cyan-500' : 'stroke-indigo-500'
                  }`}
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                />
              </svg>

              {/* Glowing visual indicators in the middle */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-4xl font-sans font-black tracking-tight text-foreground glow-text">
                  {formatTime(timeRemaining)}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1.5">
                  {timerMode === 'pomodoro' ? 'STAY DEEP' : 
                   timerMode === 'short_break' ? 'REST ACTIVE' :
                   timerMode === 'long_break' ? 'REST ACTIVE' : 'NORMAL TIMER'}
                </span>
              </div>
            </div>

            {/* Controls panel */}
            <div className="flex items-center gap-4 z-10 mb-6">
              <Button
                onClick={handleReset}
                variant="glass"
                size="icon"
                className="!rounded-full h-11 w-11 hover:text-foreground border-border"
                title="Reset session timer"
              >
                <RotateCcw size={16} />
              </Button>

              <button
                onClick={handleToggleActive}
                className={`h-16 w-16 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all text-white ${
                  isActive 
                    ? 'bg-muted border border-border hover:bg-muted/80 text-foreground' 
                    : 'bg-gradient-to-r from-brand-500 to-indigo-600 hover:shadow-glow-brand'
                }`}
              >
                {isActive ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </button>

              <Button
                onClick={handleSkip}
                variant="glass"
                size="icon"
                className="!rounded-full h-11 w-11 hover:text-foreground border-border"
                title="Skip current session"
              >
                <SkipForward size={16} />
              </Button>
            </div>

            {/* Slider / custom HH:MM:SS inputs */}
            {isCustomTimer ? (
              <div className="w-full max-w-xs space-y-3 z-10 px-4">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Configure custom duration:</span>
                  <span className="text-indigo-400 font-mono">
                    {inputHours.padStart(2, '0')}:{inputMinutes.padStart(2, '0')}:{inputSeconds.padStart(2, '0')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5 text-left">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Hours</span>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={inputHours}
                      onChange={(e) => handleTimeInputChange('hours', e.target.value)}
                      onBlur={() => handleTimeInputBlur('hours')}
                      disabled={isActive}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-center text-sm font-bold text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Minutes</span>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={inputMinutes}
                      onChange={(e) => handleTimeInputChange('minutes', e.target.value)}
                      onBlur={() => handleTimeInputBlur('minutes')}
                      disabled={isActive}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-center text-sm font-bold text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Seconds</span>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={inputSeconds}
                      onChange={(e) => handleTimeInputChange('seconds', e.target.value)}
                      onBlur={() => handleTimeInputBlur('seconds')}
                      disabled={isActive}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-center text-sm font-bold text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xs space-y-2 z-10 px-4">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Configure custom duration:</span>
                  <span className="text-brand-400">{customSliderVal} min</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="5"
                  value={customSliderVal}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
              </div>
            )}
          </Card>

          {/* Lofi Ambient soundtrack controls */}
          <div className="space-y-3 text-left">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Music size={14} className="text-brand-400" /> Focus Ambient Layers
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {AMBIENT_TRACKS.map((track) => {
                const isActiveTrack = currentTrack === track.id;
                const isPlaying = isActiveTrack && isPlayingAudio;

                return (
                  <Card
                    key={track.id}
                    onClick={() => handleToggleTrack(track.id)}
                    className={`
                      flex items-center justify-between p-4 cursor-pointer relative overflow-hidden transition-all duration-200
                      ${isPlaying 
                        ? 'bg-brand-500/10 border-brand-500/30 shadow-glow-brand' 
                        : 'bg-muted/30 border-border hover:bg-muted/50'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${isPlaying ? 'bg-brand-500/15 border-brand-500/30 text-brand-400' : 'bg-muted border-border text-muted-foreground'}`}>
                        {isPlaying ? (
                          <div className="flex items-end gap-0.5 h-3.5 w-3.5">
                            <span className="h-full w-0.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <span className="h-2/3 w-0.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                            <span className="h-4/5 w-0.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                          </div>
                        ) : (
                          <VolumeX size={14} />
                        )}
                      </div>
                      <div className="leading-none text-left">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Sound Layer</span>
                        <span className="text-xs font-bold text-foreground">{track.name}</span>
                      </div>
                    </div>
                    
                    <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground">
                      {isPlaying ? 'ACTIVE' : 'MUTED'}
                    </span>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Logging Dashboard & focus stats history */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={14} className="text-brand-400" /> Focus catalog logging
          </h3>

          <Card className="bg-card/50 border border-border shadow-xl space-y-4">
            <h4 className="font-sans font-bold text-foreground text-sm">Draft Focus Session log</h4>
            
            <form onSubmit={handleLogSessionSubmit} className="space-y-4 text-left">
              {/* Subject Select link */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Associate Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                >
                  <option value="">No Course Link</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode style check */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Focus Style</label>
                <div className="grid grid-cols-2 bg-muted border border-border p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFocusStyle('pomodoro')}
                    className={`py-1.5 rounded text-[10px] font-bold transition-all ${focusStyle === 'pomodoro' ? 'bg-brand-500 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    ⏱️ Pomodoro
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocusStyle('deep_work')}
                    className={`py-1.5 rounded text-[10px] font-bold transition-all ${focusStyle === 'deep_work' ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    🧘 Deep Work
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Session Quick notes</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="e.g. read chapter 2 direct mapped caches formulas..."
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder-muted-foreground/50 focus:outline-none resize-none h-16"
                />
              </div>

              <Button type="submit" variant="secondary" size="sm" className="w-full font-bold">
                Manual Log Focus Interval
              </Button>
            </form>
          </Card>

          {/* Session history ledger */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <History size={14} className="text-brand-400" /> Focus History Log
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-56 pr-1">
              {studySessions.map((session) => {
                const subject = subjects.find(s => s.id === session.subjectId);
                const isPomo = session.mode === 'pomodoro';

                return (
                  <Card key={session.id} className="p-3 bg-muted/20 border-border hover:bg-muted/40 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold text-foreground">{session.durationMinutes} Minutes</span>
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${isPomo ? 'bg-orange-500/10 text-orange-400 border border-orange-500/10' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'}`}>
                            {isPomo ? 'pomo' : 'deep'}
                          </span>
                          {subject && (
                            <span
                              className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border"
                              style={{
                                backgroundColor: `${subject.color}15`,
                                borderColor: `${subject.color}30`,
                                color: subject.color
                              }}
                            >
                              {subject.code}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{session.notes}</p>
                      </div>

                      <span className="text-[8px] text-muted-foreground font-bold uppercase">
                        {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </Card>
                );
              })}

              {studySessions.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground/80 font-bold border border-dashed border-border rounded-lg bg-muted/20">
                  No sessions cataloged. Activate deep work timer!
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
