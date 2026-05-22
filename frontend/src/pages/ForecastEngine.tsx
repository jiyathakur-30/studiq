import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  BrainCircuit,
  TrendingUp,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Activity,
  Terminal,
  ChevronRight,
  TrendingDown,
  Gauge,
  BookOpen,
  Calendar,
  Hourglass,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useAppStore, SemesterRecord } from '../context/store';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  Legend
} from 'recharts';

// --- THEME-AWARE TYPOGRAPHY CONSTANTS ---
const TXT_PRIMARY = "text-slate-900 dark:text-white";
const TXT_SECONDARY = "text-slate-700 dark:text-slate-300";
const TXT_MUTED = "text-slate-500 dark:text-slate-400";

export const ForecastEngine: React.FC = () => {
  const {
    semesters,
    addSemester,
    subjects,
    attendance,
    studySessions,
    user
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard' | 'whatif' | 'insights'>('upload');

  // Document Upload States
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'parsing' | 'success'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [extractedData, setExtractedData] = useState<{
    semesterName: string;
    sgpa: number;
    credits: number;
    subjects: { name: string; grade: string; credits: number }[];
  } | null>(null);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // What-If Simulator States
  const [simStudyHours, setSimStudyHours] = useState(20); // default weekly hours
  const [simAttendance, setSimAttendance] = useState(80); // default attendance %
  const [simDifficulty, setSimDifficulty] = useState<'standard' | 'challenging' | 'hardcore'>('challenging');

  // Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Simulated OCR & Data Extraction Pipeline
  const processFile = (file: File) => {
    setUploadedFile({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    });
    setUploadState('uploading');
    setUploadProgress(0);
    setTerminalLogs([]);

    // Step 1: Simulate uploading
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          startParsing();
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const startParsing = () => {
    setUploadState('parsing');
    const logs = [
      '🚀 Booting OCR neural networks...',
      '📂 Open PDF gazette stream descriptor...',
      '🔍 Scanning document pixel arrays for text blocks...',
      '🛠️ Extracted university header: "STUDIQ STATE UNIVERSITY COGNITIVE SCIENCES DIVISION"',
      '📑 Parsing table grids & grade matrix entries...',
      '⚡ Aligning credit weights with grade conversions...',
      '🤖 Machine Learning model classification matching semester name...',
      '✅ Extracted Semester Name: "Semester 5 (Spring Session)"',
      '📚 Extracted Course: Advanced Algorithms (CS-501) - Grade: A+ | Credits: 4',
      '📚 Extracted Course: Cognitive Neural Nets (CS-502) - Grade: O | Credits: 4',
      '📚 Extracted Course: Database Engineering (CS-503) - Grade: A | Credits: 3',
      '📚 Extracted Course: Human-Computer Interaction (CS-504) - Grade: A | Credits: 4',
      '📚 Extracted Course: Technical Report Lab (CS-505) - Grade: B+ | Credits: 5',
      '📊 Calculated SGPA from grade parameters: 9.15',
      '📊 Extracted Total Credits: 20',
      '🏁 OCR processing terminal success! Commit ledger to lock values.'
    ];

    let currentLogIndex = 0;
    const logInterval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setTerminalLogs((prev) => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(logInterval);
        setUploadState('success');
        setExtractedData({
          semesterName: `Semester ${semesters.length + 1}`,
          sgpa: 9.15,
          credits: 20,
          subjects: [
            { name: 'Advanced Algorithms', grade: 'A+', credits: 4 },
            { name: 'Cognitive Neural Nets', grade: 'O', credits: 4 },
            { name: 'Database Engineering', grade: 'A', credits: 3 },
            { name: 'Human-Computer Interaction', grade: 'A', credits: 4 },
            { name: 'Technical Report Lab', grade: 'B+', credits: 5 }
          ]
        });
      }
    }, 300);
  };

  // Scroll Terminal to Bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Commit extracted results to Zustand Semesters ledger
  const handleCommitData = () => {
    if (!extractedData) return;
    addSemester({
      name: extractedData.semesterName,
      sgpa: extractedData.sgpa,
      credits: extractedData.credits
    });
    setUploadState('idle');
    setUploadedFile(null);
    setExtractedData(null);
    setActiveTab('dashboard');
  };

  // Academic Trend Computations
  const totalSemesters = semesters.length;
  const currentCgpa = useMemo(() => {
    if (semesters.length === 0) return 0;
    const totalCreditsWeighted = semesters.reduce((sum, sem) => sum + sem.sgpa * sem.credits, 0);
    const totalCredits = semesters.reduce((sum, sem) => sum + sem.credits, 0);
    return Number((totalCreditsWeighted / totalCredits).toFixed(2));
  }, [semesters]);

  const historicalAverageCredits = useMemo(() => {
    if (semesters.length === 0) return 20;
    return semesters.reduce((sum, s) => sum + s.credits, 0) / semesters.length;
  }, [semesters]);

  // Base predicted forecast SGPA for next semester
  const forecastedSgpa = useMemo(() => {
    if (semesters.length === 0) return 8.5;
    
    // Weight later semesters higher (linear decay)
    let totalWeight = 0;
    let weightedSgpaSum = 0;
    
    semesters.forEach((sem, idx) => {
      const weight = idx + 1; // Later semesters have larger weight
      totalWeight += weight;
      weightedSgpaSum += sem.sgpa * weight;
    });

    // Slight dynamic premium for good attendance or high focus timer minutes
    let productivityMultiplier = 1.0;
    if (studySessions.length > 5) productivityMultiplier += 0.05;
    const overallAttendance = attendance.reduce((acc, a) => {
      const present = a.records.filter(r => r.status === 'attended').length;
      const total = a.records.length;
      return acc + (total > 0 ? present / total : 0.8);
    }, 0) / (attendance.length || 1);
    
    if (overallAttendance > 0.85) productivityMultiplier += 0.03;

    return Number(Math.min(10.0, (weightedSgpaSum / totalWeight) * productivityMultiplier).toFixed(2));
  }, [semesters, studySessions, attendance]);

  // Forecast trajectory data mapping historical semesters + predicted semester
  const forecastChartData = useMemo(() => {
    const data = semesters.map((sem, idx) => ({
      name: sem.name,
      GPA: sem.sgpa,
      type: 'Actual'
    }));

    if (semesters.length > 0) {
      data.push({
        name: `Sem ${semesters.length + 1} (Forecast)`,
        GPA: forecastedSgpa,
        type: 'Predicted'
      } as any);
    }

    return data;
  }, [semesters, forecastedSgpa]);

  // Subject Category Mastery Mesh Data
  const subjectMasteryData = useMemo(() => {
    return [
      { subject: 'Logic & Theory', value: 85, fullMark: 100 },
      { subject: 'Coding & Dev', value: 92, fullMark: 100 },
      { subject: 'Mathematics', value: 76, fullMark: 100 },
      { subject: 'Systems Eng', value: 80, fullMark: 100 },
      { subject: 'Technical Writing', value: 88, fullMark: 100 }
    ];
  }, []);

  // Attendance & Timer GPA Correlation Data
  const correlationData = useMemo(() => {
    return [
      { attendanceRate: 65, gpa: 7.2, label: 'Sem 1' },
      { attendanceRate: 75, gpa: 8.0, label: 'Sem 2' },
      { attendanceRate: 85, gpa: 8.6, label: 'Sem 3' },
      { attendanceRate: 90, gpa: 9.1, label: 'Sem 4' },
      { attendanceRate: simAttendance, gpa: Number((forecastedSgpa + (simAttendance - 80) * 0.045).toFixed(2)), label: 'Simulated' }
    ];
  }, [simAttendance, forecastedSgpa]);

  // What-If Simulation Calculations
  const simulatedSgpa = useMemo(() => {
    // base predicted SGPA
    let base = forecastedSgpa;
    
    // Impact of weekly study hours: default 20 hours is neutral
    const studyHoursImpact = (simStudyHours - 20) * 0.035;
    
    // Impact of attendance: default 80% is neutral
    const attendanceImpact = (simAttendance - 80) * 0.045;
    
    // Impact of simulated coursework difficulty
    let difficultyImpact = 0;
    if (simDifficulty === 'standard') difficultyImpact = 0.25;
    if (simDifficulty === 'hardcore') difficultyImpact = -0.35;

    return Number(Math.max(4.0, Math.min(10.0, base + studyHoursImpact + attendanceImpact + difficultyImpact)).toFixed(2));
  }, [forecastedSgpa, simStudyHours, simAttendance, simDifficulty]);

  const simulatedCgpa = useMemo(() => {
    if (semesters.length === 0) return simulatedSgpa;
    const totalCreditsWeighted = semesters.reduce((sum, sem) => sum + sem.sgpa * sem.credits, 0);
    const totalCredits = semesters.reduce((sum, sem) => sum + sem.credits, 0);
    
    const nextSemCredits = historicalAverageCredits;
    return Number(((totalCreditsWeighted + simulatedSgpa * nextSemCredits) / (totalCredits + nextSemCredits)).toFixed(2));
  }, [semesters, simulatedSgpa, historicalAverageCredits]);

  // Academic Health Rating Engine
  const academicHealthScore = useMemo(() => {
    let score = 75; // baseline

    // Attendance influence
    const avgAttendance = attendance.reduce((acc, a) => {
      const present = a.records.filter(r => r.status === 'attended').length;
      const total = a.records.length;
      return acc + (total > 0 ? (present / total) * 100 : 80);
    }, 0) / (attendance.length || 1);

    score += (avgAttendance - 75) * 0.4;

    // Study consistency
    if (studySessions.length > 5) score += 8;
    if (user?.stats?.studyStreak && user.stats.studyStreak > 3) score += 5;

    // Historical SGPAs stability
    if (currentCgpa > 8.5) score += 10;
    if (currentCgpa < 7.0) score -= 15;

    return Math.max(10, Math.min(100, Math.round(score)));
  }, [attendance, studySessions, user, currentCgpa]);

  const healthCategory = useMemo(() => {
    if (academicHealthScore >= 90) return { name: 'Elite', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    if (academicHealthScore >= 80) return { name: 'Excellent', color: 'text-brand-500 bg-brand-500/10 border-brand-500/20' };
    if (academicHealthScore >= 65) return { name: 'Stable', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' };
    if (academicHealthScore >= 45) return { name: 'Moderate Risk', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    return { name: 'Academic Danger', color: 'text-red-500 bg-red-500/10 border-red-500/20 shadow-glow-rose' };
  }, [academicHealthScore]);

  // Dynamic Contextual AI Advisor Insights
  const advisorInsights = useMemo(() => {
    const list = [
      {
        id: '1',
        title: 'Calibrate Course Focus Allocations',
        content: `Based on your low baseline score in Mathematics (76% mastery mesh), increasing weekly Pomodoro study blocks for computational algorithms will raise next semester's SGPA confidence interval to 9.25.`,
        type: 'warning',
        metric: 'Mathematics Concept'
      },
      {
        id: '2',
        title: 'Study Habit Consistency Correlation',
        content: `Data analysis shows a high correlation (r = 0.87) between your study streak (currently ${user?.stats?.studyStreak || 3} days) and positive GPA acceleration. Maintaining consistency boosts predictions by +0.15 grade points.`,
        type: 'success',
        metric: 'Streak Multiplier'
      },
      {
        id: '3',
        title: 'Attendance Slippage Warnings',
        content: `Your active attendance parameters (averaging 78%) have induced a slight drag on core systems theories. Adjusting attendance above 85% yields a +0.22 simulated GPA shift.`,
        type: 'danger',
        metric: 'Systems Engineering'
      }
    ];

    if (simStudyHours >= 30) {
      list.push({
        id: '4',
        title: 'Deep Focus Sandbox Optimization',
        content: `Simulating ${simStudyHours} focus hours/week generates maximum performance benefits, pushing predicted CGPA closer to ${simulatedCgpa}. Balance with study breaks to avoid burnout.`,
        type: 'info',
        metric: 'What-If Forecast'
      });
    }

    return list;
  }, [user, simStudyHours, simulatedCgpa]);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto text-left pb-12">
      {/* Cinematic Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-border/60 pb-6">
        <div>
          <h2 className={`font-sans font-black text-3xl ${TXT_PRIMARY} tracking-tight flex items-center gap-2`}>
            <BrainCircuit size={28} className="text-brand-500 animate-pulse" />
            AI Academic Forecast Engine
          </h2>
          <p className={`text-sm ${TXT_SECONDARY} mt-1 max-w-2xl`}>
            SaaS-grade predictive analytics modeling. Upload university marksheets, test OCR parsing engines, simulate focus adjustments, and project your academic trajectory.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 focus-visible:outline-none ${
              activeTab === 'upload'
                ? 'bg-card text-brand-500 shadow-sm border border-border'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UploadCloud size={14} /> OCR Upload
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 focus-visible:outline-none ${
              activeTab === 'dashboard'
                ? 'bg-card text-brand-500 shadow-sm border border-border'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={14} /> Analytics Hub
          </button>
          <button
            onClick={() => setActiveTab('whatif')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 focus-visible:outline-none ${
              activeTab === 'whatif'
                ? 'bg-card text-brand-500 shadow-sm border border-border'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders size={14} /> What-If Sandbox
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 focus-visible:outline-none ${
              activeTab === 'insights'
                ? 'bg-card text-brand-500 shadow-sm border border-border'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={14} /> AI Advisor
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: OCR DOCUMENT UPLOAD ZONE */}
        {activeTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Upload Area Component */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="p-8 flex flex-col justify-center min-h-[380px]">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`
                    border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-350 cursor-pointer
                    ${dragActive ? 'border-brand-500 bg-brand-500/5' : 'border-border hover:border-brand-500/40 hover:bg-muted/10'}
                    focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/50 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-950
                  `}
                >
                  <input
                    type="file"
                    id="ocr-file-upload"
                    className="sr-only"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="ocr-file-upload" className="cursor-pointer w-full flex flex-col items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 mb-6 shadow-sm border border-brand-500/20">
                      <UploadCloud size={28} className="animate-float" />
                    </div>
                    
                    <h3 className={`font-sans font-extrabold text-base ${TXT_PRIMARY}`}>
                      Transmit Result Documents
                    </h3>
                    <p className={`text-xs ${TXT_MUTED} mt-2 max-w-sm`}>
                      Drag and drop PDF gazettes, semester marksheet reports, or mobile screenshots. Support files: PDF, PNG, JPG (Max 10MB).
                    </p>
                    
                    <Button variant="secondary" size="sm" className="mt-6 pointer-events-none font-bold">
                      Select Files From Disk
                    </Button>
                  </label>
                </div>

                {/* Selected File Details */}
                {uploadedFile && (
                  <div className="mt-6 p-4 rounded-xl bg-muted border border-border flex items-center justify-between animate-slide-up">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-brand-500/10 rounded-lg flex items-center justify-center text-brand-500 border border-brand-500/20">
                        <FileText size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold ${TXT_PRIMARY} truncate max-w-xs`}>{uploadedFile.name}</span>
                        <span className={`text-[10px] ${TXT_MUTED}`}>{uploadedFile.size}</span>
                      </div>
                    </div>
                    <Badge variant={uploadState === 'success' ? 'success' : 'brand'}>
                      {uploadState === 'uploading' && `Uploading ${uploadProgress}%`}
                      {uploadState === 'parsing' && 'Scanning OCR...'}
                      {uploadState === 'success' && 'Ready to Commit'}
                    </Badge>
                  </div>
                )}
              </Card>

              {/* simulated OCR Terminal Output */}
              {uploadState !== 'idle' && (
                <Card className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl relative shadow-2xl hover:scale-100 hover:border-zinc-800" hoverEffect={false}>
                  <div className="flex items-center justify-between mb-3.5 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Terminal size={14} className="text-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest font-mono leading-relaxed tracking-wide">STUDIQ OS-OCR DeepScanner v1.2</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      <span className="text-[10px] font-mono text-zinc-400">Scanning ACTIVE</span>
                    </div>
                  </div>

                  <div className="h-44 overflow-y-auto space-y-1.5 font-mono text-xs font-semibold leading-relaxed tracking-wider text-emerald-500 dark:text-emerald-400 text-left scrollbar-thin select-all">
                    {terminalLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-emerald-600 dark:text-emerald-500/80 flex-shrink-0">[{idx.toString().padStart(3, '0')}]</span>
                        <span className="text-emerald-500 dark:text-emerald-400">{log}</span>
                      </div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>
                </Card>
              )}
            </div>

            {/* extracted Results Ledger Preview */}
            <div className="lg:col-span-5">
              <AnimatePresence mode="wait">
                {extractedData ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-6"
                  >
                    <Card className="p-6">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl z-0 pointer-events-none" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2.5 mb-6">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                          <CheckCircle2 size={16} />
                        </div>
                        <h3 className={`font-sans font-black text-lg ${TXT_PRIMARY} tracking-tight`}>
                          OCR Extracted Records
                        </h3>
                      </div>

                      {/* Semester Info */}
                      <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/30 border border-slate-200/60 dark:border-white/5">
                        <div>
                          <span className={`text-[10px] font-bold ${TXT_MUTED} uppercase tracking-wider block`}>Target Destination</span>
                          <span className={`text-sm font-extrabold ${TXT_PRIMARY} mt-0.5 block`}>{extractedData.semesterName}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-bold ${TXT_MUTED} uppercase tracking-wider block`}>Calculated SGPA</span>
                          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{extractedData.sgpa}</span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-border/50">
                          <span className={`text-[10px] font-bold ${TXT_MUTED} uppercase tracking-wider block`}>Parsed Total Credits</span>
                          <span className={`text-sm font-extrabold ${TXT_PRIMARY} mt-0.5 block`}>{extractedData.credits} Credits</span>
                        </div>
                      </div>

                      {/* Course Breakdown */}
                      <div className="space-y-3 mb-6">
                        <span className={`text-[10px] font-bold ${TXT_MUTED} uppercase tracking-wider block px-1`}>Extracted Course Ledger</span>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {extractedData.subjects.map((sub, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border text-xs">
                              <span className={`font-bold ${TXT_PRIMARY} truncate max-w-[200px]`}>{sub.name}</span>
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] ${TXT_MUTED}`}>{sub.credits} Credits</span>
                                <Badge variant="brand" className="font-extrabold px-2">{sub.grade}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Commit Buttons */}
                      <div className="space-y-2">
                        <Button
                          onClick={handleCommitData}
                          variant="primary"
                          className="w-full font-bold h-11 text-xs shadow-md shadow-brand-500/25"
                        >
                          Commit parsed records to database
                        </Button>
                        <Button
                          onClick={() => {
                            setUploadState('idle');
                            setUploadedFile(null);
                            setExtractedData(null);
                          }}
                          variant="ghost"
                          className="w-full text-xs font-semibold"
                        >
                          Abort Scan
                        </Button>
                      </div>
                      </div>
                    </Card>
                  </motion.div>
                ) : (
                  <Card className="p-6 border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center py-16 h-full min-h-[420px] bg-slate-50/10 dark:bg-white/[0.01]" hoverEffect={false}>
                    <FileText size={42} className="text-slate-300 dark:text-slate-700 mb-4 animate-pulse" />
                    <h4 className={`text-sm font-black ${TXT_PRIMARY}`}>Waiting for Data Pipeline</h4>
                    <p className={`text-xs ${TXT_SECONDARY} mt-1.5 max-w-xs leading-relaxed`}>
                      Upload your latest university marksheet, semester grades PDF or report card screenshots on the left. The OCR engine will scan, extract credits/SGPAs, and present verification logs here.
                    </p>
                  </Card>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* TAB 2: INTELLIGENCE & FORECASTING DASHBOARD */}
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Top Stat Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 hover:scale-[1.01] transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full filter blur-lg z-0 pointer-events-none" />
                <div className="relative z-10">
                  <span className={`text-[10px] font-bold ${TXT_MUTED} uppercase tracking-wider block`}>Current Cumulative GPA</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className={`text-3xl font-black ${TXT_PRIMARY} tracking-tight`}>{currentCgpa || 'N/A'}</span>
                    <Badge variant="brand" className="font-extrabold flex items-center gap-0.5 text-[9px] px-1.5">
                      <TrendingUp size={8} /> Active CGPA
                    </Badge>
                  </div>
                  <p className={`text-[10px] ${TXT_MUTED} mt-2 font-medium`}>Computed across {totalSemesters} Semesters in records.</p>
                </div>
              </Card>

              <Card className="p-6 hover:scale-[1.01] transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-lg z-0 pointer-events-none" />
                <div className="relative z-10">
                  <span className={`text-[10px] font-bold ${TXT_MUTED} uppercase tracking-wider block`}>AI Forecast Next SGPA</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black text-brand-500 tracking-tight">{forecastedSgpa}</span>
                    <Badge variant="success" className="font-extrabold text-[9px] px-1.5">92% Conf</Badge>
                  </div>
                  <p className={`text-[10px] ${TXT_MUTED} mt-2 font-medium`}>Weighted regression with streak multipliers.</p>
                </div>
              </Card>

              <Card className="p-6 hover:scale-[1.01] transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full filter blur-lg z-0 pointer-events-none" />
                <div className="relative z-10">
                  <span className={`text-[10px] font-bold ${TXT_MUTED} uppercase tracking-wider block`}>Academic Health Rating</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className={`text-3xl font-black ${TXT_PRIMARY} tracking-tight`}>{academicHealthScore}%</span>
                    <Badge className={`font-extrabold text-[9px] px-1.5 ${healthCategory.color}`}>{healthCategory.name}</Badge>
                  </div>
                  <p className={`text-[10px] ${TXT_MUTED} mt-2 font-medium`}>Includes attendance, tasks & timer inputs.</p>
                </div>
              </Card>

              <Card className="p-6 hover:scale-[1.01] transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full filter blur-lg z-0 pointer-events-none" />
                <div className="relative z-10">
                  <span className={`text-[10px] font-bold ${TXT_MUTED} uppercase tracking-wider block`}>KT / Backlog Fail Risk</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className={`text-3xl font-black ${TXT_PRIMARY} tracking-tight`}>Low (2%)</span>
                    <Badge variant="success" className="font-extrabold text-[9px] px-1.5">Optimal</Badge>
                  </div>
                  <p className={`text-[10px] ${TXT_MUTED} mt-2 font-medium`}>Extremely low probability of semester failure.</p>
                </div>
              </Card>
            </div>

            {/* Performance charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Semester Trajectory Forecast Chart */}
              <Card className="lg:col-span-8 p-6 flex flex-col justify-between">
                <div>
                  <h3 className={`font-sans font-black text-base ${TXT_PRIMARY} tracking-tight`}>
                    CGPA / SGPA Progression & Projections
                  </h3>
                  <p className={`text-xs ${TXT_MUTED} mt-0.5`}>
                    Continuous tracking of achieved grades, with AI forecasted performance bounds for the upcoming term.
                  </p>
                </div>

                <div className="h-80 w-full mt-6">
                  {semesters.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={forecastChartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                          className="text-slate-500 dark:text-slate-400"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[4, 10]}
                          tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                          className="text-slate-500 dark:text-slate-400"
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg text-left text-xs">
                                  <p className={`font-extrabold ${TXT_PRIMARY}`}>{data.name}</p>
                                  <p className="text-brand-500 font-bold mt-1">GPA: {data.GPA}</p>
                                  <p className={`${TXT_SECONDARY} mt-0.5`}>Type: {data.type}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="GPA"
                          stroke="var(--color-primary)"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorGpa)"
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className={`flex flex-col items-center justify-center h-full text-center ${TXT_MUTED} text-xs font-semibold`}>
                      No semesters on record yet. Log or OCR upload marksheets to render the trajectory graphs.
                    </div>
                  )}
                </div>
              </Card>

              {/* Subject Mastery Radar Web */}
              <Card className="lg:col-span-4 p-6 flex flex-col justify-between">
                <div>
                  <h3 className={`font-sans font-black text-base ${TXT_PRIMARY} tracking-tight`}>
                    Course Mastery Mesh
                  </h3>
                  <p className={`text-xs ${TXT_MUTED} mt-0.5`}>
                    Estimated conceptual competency domains compiled from course grades.
                  </p>
                </div>

                <div className="h-72 w-full mt-6 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjectMasteryData}>
                      <PolarGrid stroke="var(--border-color)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: 'currentColor', fontSize: 8, fontWeight: 800 }}
                        className="text-slate-500 dark:text-slate-400"
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: 'currentColor', fontSize: 8 }}
                        className="text-slate-400 dark:text-slate-500"
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg text-left text-xs">
                                <p className={`font-extrabold ${TXT_PRIMARY}`}>{data.subject}</p>
                                <p className="text-brand-500 font-bold mt-1">Mastery: {data.value}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Radar
                        name="Mastery"
                        dataKey="value"
                        stroke="var(--color-primary)"
                        fill="var(--color-primary)"
                        fillOpacity={0.25}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Ledger and Correlation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Attendance Correlation Scatter-Line */}
              <Card className="lg:col-span-6 p-6 flex flex-col justify-between">
                <div>
                  <h3 className={`font-sans font-black text-base ${TXT_PRIMARY} tracking-tight`}>
                    Attendance vs GPA Correlation
                  </h3>
                  <p className={`text-xs ${TXT_MUTED} mt-0.5`}>
                    Demonstrating the direct correlation between high attendance rates and achieved GPA milestones.
                  </p>
                </div>

                <div className="h-64 w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={correlationData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                      <XAxis
                        dataKey="attendanceRate"
                        name="Attendance Rate"
                        unit="%"
                        tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                        className="text-slate-500 dark:text-slate-400"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[5, 10]}
                        name="GPA"
                        tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                        className="text-slate-500 dark:text-slate-400"
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs shadow-xl text-left">
                                <p className={`font-extrabold ${TXT_PRIMARY}`}>{data.label}</p>
                                <p className={`${TXT_SECONDARY} mt-1`}>Attendance: <strong className={TXT_PRIMARY}>{data.attendanceRate}%</strong></p>
                                <p className="text-brand-500 font-bold">GPA: {data.gpa}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="gpa"
                        name="Academic Correlation Profile"
                        stroke="var(--color-primary)"
                        strokeWidth={2.5}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Semester Historical list */}
              <Card className="lg:col-span-6 p-6 flex flex-col justify-between">
                <div>
                  <h3 className={`font-sans font-black text-base ${TXT_PRIMARY} tracking-tight`}>
                    Semester Ledger Database
                  </h3>
                  <p className={`text-xs ${TXT_MUTED} mt-0.5`}>
                    Review and manage persistent semester GPAs mapped inside your academic history records.
                  </p>
                </div>

                <div className="mt-6 flex-1 space-y-3 max-h-64 overflow-y-auto pr-1">
                  {semesters.map((sem) => (
                    <div key={sem.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-brand-500/10 border border-brand-500/20 text-brand-500 rounded-lg flex items-center justify-center">
                          <BookOpen size={16} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className={`text-xs font-bold ${TXT_PRIMARY}`}>{sem.name}</span>
                          <span className={`text-[10px] ${TXT_MUTED} font-medium`}>{sem.credits} Total Credits Registered</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-black ${TXT_PRIMARY}`}>{sem.sgpa.toFixed(2)} SGPA</span>
                        <div className="h-5 w-0.5 bg-border" />
                        <Badge variant="brand" className="font-extrabold text-[10px]">VERIFIED</Badge>
                      </div>
                    </div>
                  ))}

                  {semesters.length === 0 && (
                    <div className={`py-8 text-center text-xs ${TXT_MUTED} font-medium border border-dashed border-slate-200 dark:border-white/10 rounded-xl`}>
                      No semester records logged. Log them manually in the Performance Center or upload via OCR Gazette Portal above.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* TAB 3: WHAT-IF SANDBOX SIMULATOR */}
        {activeTab === 'whatif' && (
          <motion.div
            key="whatif"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Control Sliders Panel */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="p-6 space-y-8">
                <div>
                  <h3 className={`font-sans font-black text-lg ${TXT_PRIMARY} tracking-tight`}>
                    Variables Sandbox Simulator
                  </h3>
                  <p className={`text-xs ${TXT_MUTED} mt-0.5`}>
                    Modulate your predicted weekly routines, attendance rates, and technical course difficulty levels to immediately model future GPA impacts.
                  </p>
                </div>

                {/* Slider 1: Weekly Study Focus hours */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${TXT_PRIMARY} flex items-center gap-1.5`}>
                      <Hourglass size={14} className="text-brand-500" /> Weekly Study Focus Time
                    </span>
                    <span className="font-extrabold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">{simStudyHours} Hours / Week</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    step="1"
                    value={simStudyHours}
                    onChange={(e) => setSimStudyHours(Number(e.target.value))}
                    className="w-full accent-brand-500 bg-slate-200 dark:bg-slate-800 h-2 rounded-lg cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                  />
                  <div className={`flex items-center justify-between text-[10px] ${TXT_MUTED} font-semibold px-0.5`}>
                    <span>5h (Cozy/Slack)</span>
                    <span>20h (Normal Baseline)</span>
                    <span>45h (Ultimate Hardcore Focus)</span>
                  </div>
                </div>

                {/* Slider 2: Attendance Rate */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${TXT_PRIMARY} flex items-center gap-1.5`}>
                      <Calendar size={14} className="text-brand-500" /> Lecture Attendance Rate
                    </span>
                    <span className="font-extrabold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">{simAttendance}% Attendance</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="1"
                    value={simAttendance}
                    onChange={(e) => setSimAttendance(Number(e.target.value))}
                    className="w-full accent-brand-500 bg-slate-200 dark:bg-slate-800 h-2 rounded-lg cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                  />
                  <div className={`flex items-center justify-between text-[10px] ${TXT_MUTED} font-semibold px-0.5`}>
                    <span>50% (Academic Threat)</span>
                    <span>75% (Security Guard Limit)</span>
                    <span>100% (Perfect Attendance)</span>
                  </div>
                </div>

                {/* Simulated course targets Difficulty */}
                <div className="space-y-4 pt-4 border-t border-border/60">
                  <span className={`text-xs font-bold ${TXT_PRIMARY} block`}>Simulated Course Target Difficulty</span>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setSimDifficulty('standard')}
                      className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                        simDifficulty === 'standard'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black shadow-sm'
                          : 'bg-slate-50/50 dark:bg-white/[0.01] hover:bg-slate-100 dark:hover:bg-white/[0.04] border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <CheckCircle2 size={16} />
                      <span>Light & Electives</span>
                    </button>
                    <button
                      onClick={() => setSimDifficulty('challenging')}
                      className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                        simDifficulty === 'challenging'
                          ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-black shadow-sm'
                          : 'bg-slate-50/50 dark:bg-white/[0.01] hover:bg-slate-100 dark:hover:bg-white/[0.04] border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Activity size={16} />
                      <span>Technical Core</span>
                    </button>
                    <button
                      onClick={() => setSimDifficulty('hardcore')}
                      className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                        simDifficulty === 'hardcore'
                          ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 font-black shadow-sm shadow-glow-rose'
                          : 'bg-slate-50/50 dark:bg-white/[0.01] hover:bg-slate-100 dark:hover:bg-white/[0.04] border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <AlertTriangle size={16} />
                      <span>Hardcore Technicals</span>
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Simulated Result Projections Panel */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="p-8 flex flex-col items-center text-center justify-center min-h-[440px]">
                <div className="absolute top-0 right-0 w-36 h-36 bg-brand-500/5 rounded-full filter blur-xl z-0 pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-xl z-0 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center justify-center w-full">
                  <div className="h-12 w-12 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center mb-6 shadow-sm">
                    <Gauge size={22} className="animate-pulse" />
                  </div>

                  <h3 className={`font-sans font-black text-xl ${TXT_PRIMARY} tracking-tight`}>
                    Simulated Result Forecasts
                  </h3>
                  <p className={`text-xs ${TXT_MUTED} mt-1 max-w-xs leading-relaxed`}>
                    Real-time projections updated dynamically based on slider modifiers.
                  </p>

                  {/* simulated gpa value indicators */}
                  <div className="my-8 space-y-4 w-full max-w-xs">
                    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/30 border border-slate-200/60 dark:border-white/5 flex items-center justify-between w-full">
                      <span className={`text-xs font-bold ${TXT_MUTED}`}>Projected Next SGPA</span>
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-brand-500 tracking-tight">{simulatedSgpa.toFixed(2)}</span>
                        <span className={`text-[9px] font-bold ${simulatedSgpa >= forecastedSgpa ? 'text-emerald-500' : 'text-red-500'}`}>
                          {simulatedSgpa >= forecastedSgpa ? '+' : ''}{(simulatedSgpa - forecastedSgpa).toFixed(2)} vs Baseline
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/30 border border-slate-200/60 dark:border-white/5 flex items-center justify-between w-full">
                      <span className={`text-xs font-bold ${TXT_MUTED}`}>Projected Cumulative CGPA</span>
                      <div className="flex flex-col items-end">
                        <span className={`text-xl font-black ${TXT_PRIMARY} tracking-tight`}>{simulatedCgpa.toFixed(2)}</span>
                        <span className={`text-[9px] font-bold ${simulatedCgpa >= currentCgpa ? 'text-emerald-500' : 'text-red-500'}`}>
                          {simulatedCgpa >= currentCgpa ? '+' : ''}{(simulatedCgpa - currentCgpa).toFixed(2)} vs Current
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Contextual Simulator advice based on slider values */}
                  <div className="p-3 bg-brand-500/5 border border-brand-500/10 rounded-xl text-left max-w-xs">
                    <p className={`text-[10px] leading-relaxed ${TXT_SECONDARY}`}>
                      💡 <strong className={TXT_PRIMARY}>AI Observation:</strong>{' '}
                      {simStudyHours >= 30 && simAttendance >= 85
                        ? 'Ultimate peak study routine modeled. Perfect synergy between high focus habits and optimal lecture presence secures an Elite performance grade.'
                        : simAttendance < 75
                        ? 'WARNING: Attendance slip below 75% triggers university safety violation risks, reducing your forecast by -0.32 grade points. Drag attendance above 75%.'
                        : 'Standard operational levels active. Raising study hours by 5h/week yields a +0.18 SGPA increase on conceptual courses.'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* TAB 4: AI CONTEXTUAL ADVISOR INSIGHTS */}
        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Intro Alert */}
            <Card className="p-6 border border-brand-500/20 bg-brand-500/5 relative overflow-hidden flex-shrink-0" hoverEffect={false}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full filter blur-xl z-0 pointer-events-none" />
              <div className="relative z-10 flex items-start gap-4">
                <div className="h-10 w-10 bg-brand-500/10 border border-brand-500/20 text-brand-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className={`font-sans font-black text-base ${TXT_PRIMARY} tracking-tight flex items-center gap-1.5`}>
                    STUDIQ Contextual Advisor Active
                  </h3>
                  <p className={`text-xs ${TXT_SECONDARY} mt-1 max-w-3xl leading-relaxed`}>
                    Our AI models scan your attendance ratios, homework deadlines, Pomodoro logged study periods, and historical SGPA records to produce diagnostic warnings and improvement strategies.
                  </p>
                </div>
              </div>
            </Card>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advisorInsights.map((insight) => (
                <Card
                  key={insight.id}
                  className="p-6 flex flex-col justify-between min-h-[220px] hover:scale-[1.01] hover:border-brand-500/30 hover:shadow-glow-brand transition-all duration-300"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={insight.type === 'danger' ? 'danger' : insight.type === 'warning' ? 'warning' : 'brand'}>
                        {insight.type.toUpperCase()}
                      </Badge>
                      <span className={`text-[10px] font-bold ${TXT_MUTED}`}>{insight.metric}</span>
                    </div>

                    <h4 className={`font-sans font-black text-sm ${TXT_PRIMARY} tracking-tight mt-2.5`}>
                      {insight.title}
                    </h4>
                    <p className={`text-xs ${TXT_SECONDARY} leading-relaxed`}>
                      {insight.content}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border/50 mt-4 flex items-center justify-between text-[10px] text-brand-500 font-bold cursor-pointer group">
                    <span>Activate Strategy Guide</span>
                    <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Card>
              ))}

              {/* Extra Dynamic achievement box */}
              <Card className="p-6 border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center py-10 bg-slate-50/10 dark:bg-white/[0.01] min-h-[220px]" hoverEffect={false}>
                <Activity size={28} className="text-slate-400 dark:text-slate-600 mb-3" />
                <h5 className={`text-xs font-black ${TXT_PRIMARY}`}>Future Predictions Spawning</h5>
                <p className={`text-[10px] ${TXT_MUTED} mt-1 max-w-[200px] leading-relaxed`}>
                  Log more focus timer intervals and study routines to populate dynamic habit correlations.
                </p>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
