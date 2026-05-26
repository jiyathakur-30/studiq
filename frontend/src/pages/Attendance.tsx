import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  Plus,
  Trash2,
  AlertTriangle,
  Check,
  X,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Percent
} from 'lucide-react';
import { useAppStore } from '../context/store';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';

export const Attendance: React.FC = () => {
  const { subjects, attendance, logAttendance, removeAttendanceRecord, addSubject, deleteSubject, user } = useAppStore();
  
  // Modals & Forms State
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subColor, setSubColor] = useState('#6366f1');
  const [subProfessor, setSubProfessor] = useState('');
  const [subCredits, setSubCredits] = useState('3');

  // Calculator / Sandbox State
  const [selectedCalcSubject, setSelectedCalcSubject] = useState<string>('');
  const [sandboxAttended, setSandboxAttended] = useState<number>(0);
  const [sandboxTotal, setSandboxTotal] = useState<number>(0);
  const [simulatedClasses, setSimulatedClasses] = useState<number>(0);
  const [simulatedStatus, setSimulatedStatus] = useState<'attend' | 'miss'>('attend');

  const targetAttendance = user?.settings.targetAttendance || 75;

  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName) return;
    await addSubject({
      name: subName,
      code: subCode,
      color: subColor,
      professor: subProfessor,
      credits: Number(subCredits)
    });
    setSubName('');
    setSubCode('');
    setSubProfessor('');
    setIsAddSubjectOpen(false);
  };

  // Helper: compute specific subject attendance metrics
  const getSubjectMetrics = (subjectId: string) => {
    const subAtt = attendance.find(a => a.subjectId === subjectId);
    let total = 0;
    let attended = 0;
    let missed = 0;
    let recordsList: any[] = [];

    if (subAtt) {
      recordsList = subAtt.records;
      subAtt.records.forEach((rec) => {
        if (rec.status !== 'cancelled') {
          total += 1;
          if (rec.status === 'attended') attended += 1;
          if (rec.status === 'missed') missed += 1;
        }
      });
    }

    const percentage = total > 0 ? Math.round((attended / total) * 100) : 100;
    return { total, attended, missed, percentage, recordsList };
  };

  // Safe Misses & Required Attendance math
  const getSurvivalAdvice = (attended: number, total: number) => {
    if (total === 0) return { type: 'neutral', text: 'No lecture records logged yet.' };

    const currentPct = (attended / total) * 100;

    if (currentPct >= targetAttendance) {
      // Safe Misses: Find max m such that Attended / (Total + m) >= 0.75 (using target)
      const targetDec = targetAttendance / 100;
      const m = Math.floor((attended - targetDec * total) / targetDec);
      const safeMisses = Math.max(0, m);

      return {
        type: 'safe',
        safeCount: safeMisses,
        text: safeMisses > 0 
          ? `🛡️ Attendance Healthy! You can safely miss the next ${safeMisses} lecture(s) without dropping below ${targetAttendance}%.`
          : `⚠️ Borderline! You are at ${Math.round(currentPct)}%. Missing even 1 upcoming class will breach your target.`
      };
    } else {
      // Required consecutive: Find min a such that (Attended + a) / (Total + a) >= 0.75
      const targetDec = targetAttendance / 100;
      const factor = 1 - targetDec; // 0.25 for 75%
      const rawA = (targetDec * total - attended) / factor;
      const mustAttend = Math.max(0, Math.ceil(rawA));

      return {
        type: 'danger',
        mustAttendCount: mustAttend,
        text: `🚨 Warning! You are below target. You must attend the next ${mustAttend} consecutive class(es) to reclaim your ${targetAttendance}% standing.`
      };
    }
  };

  // Sync sandbox with chosen subject
  const handleSelectSubjectForCalc = (subjId: string) => {
    setSelectedCalcSubject(subjId);
    if (!subjId) {
      setSandboxAttended(0);
      setSandboxTotal(0);
      return;
    }
    const metrics = getSubjectMetrics(subjId);
    setSandboxAttended(metrics.attended);
    setSandboxTotal(metrics.total);
    setSimulatedClasses(0);
  };

  // Calculate sandbox projection
  const getSimulatedPercentage = () => {
    let nextAtt = sandboxAttended;
    let nextTot = sandboxTotal;

    if (simulatedClasses > 0) {
      if (simulatedStatus === 'attend') {
        nextAtt += simulatedClasses;
      }
      nextTot += simulatedClasses;
    }

    return nextTot > 0 ? Math.round((nextAtt / nextTot) * 100) : 100;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto text-left px-1 sm:px-0">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-black text-2xl text-foreground tracking-tight">
            Attendance Overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Track lectures, predict class margins, and maintain target thresholds.
          </p>
        </div>
        <Button onClick={() => setIsAddSubjectOpen(true)} variant="primary" size="sm" className="gap-1.5 font-bold h-9">
          <Plus size={14} /> Add New Subject
        </Button>
      </div>

      {/* Grid: Overview Cards & Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Subjects Attendance Cards List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Subject Standings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjects.map((sub) => {
              const metrics = getSubjectMetrics(sub.id);
              const advice = getSurvivalAdvice(metrics.attended, metrics.total);
              const isLow = metrics.percentage < targetAttendance;

              return (
                <Card key={sub.id} className="flex flex-col justify-between h-full relative overflow-hidden group">
                  {/* Subject Color ribbon */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: sub.color }} />
                  
                  <div className="space-y-4 pt-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{sub.code || 'NO-CODE'}</span>
                        <h4 className="font-sans font-extrabold text-foreground truncate max-w-[180px]">{sub.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-semibold">Prof: {sub.professor || 'Unknown'}</p>
                      </div>
                      
                      {/* Circular indicator percentage */}
                      <div className={`h-11 w-11 rounded-lg border text-sm font-black flex items-center justify-center transition-all ${isLow ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 shadow-glow-rose' : 'bg-muted border-border text-foreground'}`}>
                        {metrics.percentage}%
                      </div>
                    </div>

                    {/* Progress slider bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                        <span>Attended: {metrics.attended}/{metrics.total}</span>
                        <span>Goal: {targetAttendance}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${isLow ? 'bg-rose-500' : 'bg-brand-500'}`}
                          style={{ width: `${Math.min(metrics.percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Micro logs row */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        onClick={() => logAttendance(sub.id, { status: 'attended', date: new Date().toISOString() })}
                        variant="glass"
                        size="sm"
                        className="!px-2.5 !py-1 text-[11px] !rounded-md gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20"
                      >
                        <Check size={11} /> Attended
                      </Button>
                      <Button
                        onClick={() => logAttendance(sub.id, { status: 'missed', date: new Date().toISOString() })}
                        variant="glass"
                        size="sm"
                        className="!px-2.5 !py-1 text-[11px] !rounded-md gap-1 font-semibold text-rose-600 dark:text-rose-450 hover:bg-rose-500/10 border-rose-500/20"
                      >
                        <X size={11} /> Missed
                      </Button>
                    </div>

                    {/* Safe misses advice snippet */}
                    <div className={`p-2.5 rounded-lg border text-[10px] font-semibold transition-all ${advice.type === 'safe' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-rose-400'}`}>
                      {advice.text}
                    </div>

                  </div>

                  <div className="flex items-center justify-between border-t border-border mt-5 pt-3">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{sub.credits} Credits</span>
                    <button
                      onClick={() => deleteSubject(sub.id)}
                      className="p-1 rounded text-muted-foreground hover:text-red-650 dark:hover:text-red-450 hover:bg-rose-500/10 transition-colors"
                      title="Delete Subject"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                </Card>
              );
            })}

            {subjects.length === 0 && (
              <div className="col-span-2">
                <EmptyState
                  align="center"
                  size="md"
                  icon={<CalendarCheck size={18} />}
                  title="Your attendance workspace is ready"
                  description="Add course subjects to begin tracking attendance margins and shortage alerts."
                  actionText="Create First Subject"
                  onAction={() => setIsAddSubjectOpen(true)}
                >
                  <div className="space-y-3 mt-4 max-w-xs mx-auto opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none blur-[1px] transition-all duration-300">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-foreground">
                        <span>CS-301 Algorithms</span>
                        <span>82%</span>
                      </div>
                      <div className="w-full bg-foreground/20 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-brand-500 h-full w-[82%]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-foreground">
                        <span>CS-302 Web Dev</span>
                        <span>71%</span>
                      </div>
                      <div className="w-full bg-foreground/20 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-brand-500 h-full w-[71%]" />
                      </div>
                    </div>
                  </div>
                </EmptyState>
              </div>
            )}
          </div>
        </div>

        {/* 2. Flagship Survival Simulator Sandbox */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Smart Survival Sandbox</h3>
          
          <Card className="space-y-6 border border-border bg-card shadow-xl">
            <div className="space-y-1">
              <h4 className="font-sans font-bold text-foreground text-base flex items-center gap-1.5">
                <TrendingUp size={16} className="text-brand-500" /> Attendance Sandbox
              </h4>
              <p className="text-xs text-muted-foreground">Select a course to simulate planned schedules and preview outcomes.</p>
            </div>

            {/* Selector */}
            <Select
              label="Select Target Subject"
              value={selectedCalcSubject}
              onChange={(val) => handleSelectSubjectForCalc(val)}
              options={[
                { value: '', label: '-- Choose Subject --' },
                ...subjects.map(s => ({ value: s.id, label: `${s.name} (${s.code || ''})` }))
              ]}
            />

            {selectedCalcSubject ? (
              <div className="space-y-5 animate-fade-in text-left">
                
                {/* Manual input controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Attended Classes"
                    type="number"
                    min="0"
                    value={sandboxAttended.toString()}
                    onChange={(e) => setSandboxAttended(Math.max(0, Number(e.target.value)))}
                  />
                  <Input
                    label="Total Classes"
                    type="number"
                    min="0"
                    value={sandboxTotal.toString()}
                    onChange={(e) => setSandboxTotal(Math.max(sandboxAttended, Number(e.target.value)))}
                  />
                </div>

                {/* Simulated upcoming slider */}
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                    <span>Simulate upcoming classes:</span>
                    <span className="text-brand-600 dark:text-brand-400">+{simulatedClasses} Classes</span>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={simulatedClasses}
                    onChange={(e) => setSimulatedClasses(Number(e.target.value))}
                    className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />

                  {/* Toggle state */}
                  <div className="grid grid-cols-2 bg-muted border border-border p-0.5 rounded-lg">
                    <button
                      onClick={() => setSimulatedStatus('attend')}
                      className={`py-1 rounded text-[10px] font-bold transition-all ${simulatedStatus === 'attend' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      ✔️ Attending All
                    </button>
                    <button
                      onClick={() => setSimulatedStatus('miss')}
                      className={`py-1 rounded text-[10px] font-bold transition-all ${simulatedStatus === 'miss' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      ❌ Missing All
                    </button>
                  </div>
                </div>

                {/* Outcome Display */}
                <div className="p-4 bg-muted/30 rounded-xl border border-border text-center space-y-2 mt-4">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Projected Attendance</span>
                  <div className="text-3xl font-black text-brand-600 dark:text-brand-400">
                    {getSimulatedPercentage()}%
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    {getSimulatedPercentage() >= targetAttendance 
                      ? '🟢 Projection is within healthy bounds!' 
                      : `🔴 Warning! Drop below threshold (target: ${targetAttendance}%)`}
                  </p>
                </div>

              </div>
            ) : (
              <EmptyState
                align="center"
                size="sm"
                title="Sandbox Awaiting Selection"
                description="Please select a target subject to activate the survival sandbox calculator."
              >
                <div className="flex flex-col gap-1.5 items-center justify-center text-[10px] font-semibold text-muted-foreground select-none pointer-events-none mt-1 opacity-80">
                  <div className="flex items-center gap-1.5 text-brand-650 dark:text-brand-400">
                    <span className="text-emerald-500 font-black">✓</span> Forecast engine ready
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-brand-500/60 font-black">✓</span> Attendance workspace configured
                  </div>
                </div>
              </EmptyState>
            )}
          </Card>
        </div>

      </div>

      {/* Modal Add Subject */}
      <Modal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        title="Add New Course Subject"
        size="sm"
      >
        <form onSubmit={handleAddSubjectSubmit} className="space-y-4">
          <Input
            label="Subject Name"
            placeholder="e.g. Advanced Algorithms"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Course Code"
              placeholder="e.g. CS-310"
              value={subCode}
              onChange={(e) => setSubCode(e.target.value)}
            />
            <Select
              label="Credits"
              value={subCredits}
              onChange={(val) => setSubCredits(val)}
              options={[
                { value: '1', label: '1 Credit' },
                { value: '2', label: '2 Credits' },
                { value: '3', label: '3 Credits' },
                { value: '4', label: '4 Credits' },
                { value: '5', label: '5 Credits' }
              ]}
            />
          </div>
          <Input
            label="Professor Name"
            placeholder="e.g. Prof. Marcus Chen"
            value={subProfessor}
            onChange={(e) => setSubProfessor(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Card Highlight Color</label>
            <div className="flex gap-2">
              {['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSubColor(color)}
                  className={`h-7 w-7 rounded-lg border-2 transition-all ${subColor === color ? 'scale-110 border-foreground shadow-sm' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" onClick={() => setIsAddSubjectOpen(false)} variant="ghost" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Subject
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
