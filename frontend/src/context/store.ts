import { create } from 'zustand';
import { apiService, ScheduledSession, ExamPlan, SyncLog, SchedulerStats } from '../services/api';
import { UserProfile, Subject, Attendance, Assignment, Note, StudySession, AttendanceRecord, Flashcard } from '../services/mockData';

export interface SemesterRecord {
  id: string;
  name: string;
  sgpa: number;
  credits: number;
}

export interface TargetGpaSettings {
  targetCgpa: number;
  remainingSemesters: number;
}

interface AppState {
  // Authentication & Settings
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark' | 'cyberpunk';
  
  // App Collections
  subjects: Subject[];
  attendance: Attendance[];
  assignments: Assignment[];
  notes: Note[];
  studySessions: StudySession[];
  
  // Academic Performance Collection
  semesters: SemesterRecord[];
  targetGpaSettings: TargetGpaSettings;

  addSemester: (sem: Omit<SemesterRecord, 'id'>) => void;
  deleteSemester: (id: string) => void;
  updateTargetGpaSettings: (updates: Partial<TargetGpaSettings>) => void;

  // Auth Operations
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string) => Promise<boolean>;
  logout: () => void;
  initAuth: () => Promise<void>;
  updateSettings: (settings: Partial<UserProfile['settings']>) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'cyberpunk') => void;

  // Subjects Operations
  fetchSubjects: () => Promise<void>;
  addSubject: (subject: Omit<Subject, 'id'>) => Promise<void>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  // Attendance Operations
  fetchAttendance: () => Promise<void>;
  logAttendance: (subjectId: string, record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
  removeAttendanceRecord: (subjectId: string, recordId: string) => Promise<void>;

  // Assignments Operations
  fetchAssignments: () => Promise<void>;
  addAssignment: (assignment: Omit<Assignment, 'id'>) => Promise<void>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;

  // Notes Operations
  fetchNotes: () => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  summarizeNote: (id: string) => Promise<void>;
  generateQuizFromNote: (id: string) => Promise<void>;

  // Study timer Operations
  fetchStudySessions: () => Promise<void>;
  addStudySession: (session: Omit<StudySession, 'id' | 'date'>) => Promise<void>;

  // AI Scheduler Operations
  scheduledSessions: ScheduledSession[];
  examPlans: ExamPlan[];
  googleConnected: boolean;
  googleEmail: string | null;
  syncLogs: SyncLog[];
  schedulerStats: SchedulerStats | null;

  fetchScheduledSessions: () => Promise<void>;
  fetchExamPlans: () => Promise<void>;
  createOrUpdateExamPlan: (plan: Omit<ExamPlan, 'id' | 'isAiOptimized'>) => Promise<void>;
  updateSessionStatus: (id: string, status: ScheduledSession['status']) => Promise<void>;
  fetchSchedulerDashboardStats: () => Promise<void>;
  generateAcademicPlan: (planParams: { subjectId: string; examDate: string; chapters: string[]; confidenceLevel: number; studyHoursGoal: number }) => Promise<{ success: boolean; adjustments: any[]; syncStats: any }>;
  rescheduleMissedSessions: () => Promise<{ success: boolean; message: string; rescheduledCount: number; details: any[] }>;
  connectGoogleCalendar: () => Promise<string>;
  disconnectGoogleCalendar: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial Auth & Settings State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  theme: 'dark',

  // Initial Collections State
  subjects: [],
  attendance: [],
  assignments: [],
  notes: [],
  studySessions: [],

  // Initial AI Scheduler State
  scheduledSessions: [],
  examPlans: [],
  googleConnected: false,
  googleEmail: null,
  syncLogs: [],
  schedulerStats: null,

  // Initial GPA State
  semesters: [],
  targetGpaSettings: {
    targetCgpa: 9.0,
    remainingSemesters: 4
  },

  // Theme Trigger Methods (Modifies HTML body class lists for styling)
  setTheme: (theme) => {
    localStorage.setItem('studiq_theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'cyberpunk');
    root.classList.add(theme);
    set({ theme });

    // Sync theme update to settings if user is logged in
    const user = get().user;
    if (user && user.settings.theme !== theme) {
      get().updateSettings({ theme });
    }
  },

  addSemester: (sem) => {
    const nextSem = { ...sem, id: 'sem-' + Date.now() };
    const nextSems = [...get().semesters, nextSem];
    set({ semesters: nextSems });
    localStorage.setItem('studiq_semesters', JSON.stringify(nextSems));
  },

  deleteSemester: (id) => {
    const nextSems = get().semesters.filter(s => s.id !== id);
    set({ semesters: nextSems });
    localStorage.setItem('studiq_semesters', JSON.stringify(nextSems));
  },

  updateTargetGpaSettings: (updates) => {
    const nextSettings = { ...get().targetGpaSettings, ...updates };
    set({ targetGpaSettings: nextSettings });
    localStorage.setItem('studiq_target_gpa', JSON.stringify(nextSettings));
  },

  // Auth Operations
  initAuth: async () => {
    set({ isLoading: true, error: null });
    const storedToken = localStorage.getItem('studiq_access_token');
    const storedTheme = (localStorage.getItem('studiq_theme') || 'dark') as 'light' | 'dark' | 'cyberpunk';
    
    // Set theme immediately on init
    get().setTheme(storedTheme);

    // Hydrate GPA details
    const storedSemesters = localStorage.getItem('studiq_semesters');
    const storedTarget = localStorage.getItem('studiq_target_gpa');
    
    const seededSemesters: SemesterRecord[] = storedSemesters 
      ? JSON.parse(storedSemesters)
      : [
          { id: 'sem-1', name: 'Semester 1', sgpa: 8.4, credits: 20 },
          { id: 'sem-2', name: 'Semester 2', sgpa: 8.6, credits: 22 },
          { id: 'sem-3', name: 'Semester 3', sgpa: 8.8, credits: 18 },
          { id: 'sem-4', name: 'Semester 4', sgpa: 9.0, credits: 20 }
        ];

    const seededTarget: TargetGpaSettings = storedTarget
      ? JSON.parse(storedTarget)
      : { targetCgpa: 9.0, remainingSemesters: 4 };

    if (!storedSemesters) {
      localStorage.setItem('studiq_semesters', JSON.stringify(seededSemesters));
    }
    if (!storedTarget) {
      localStorage.setItem('studiq_target_gpa', JSON.stringify(seededTarget));
    }

    set({ semesters: seededSemesters, targetGpaSettings: seededTarget });

    if (storedToken) {
      try {
        const user = await apiService.getProfile();
        set({ user, token: storedToken, isAuthenticated: true, theme: user.settings.theme || storedTheme });
        
        // Load collections concurrently in parallel to maximize response time
        await Promise.all([
          get().fetchSubjects(),
          get().fetchAttendance(),
          get().fetchAssignments(),
          get().fetchNotes(),
          get().fetchStudySessions()
        ]);
      } catch (error: any) {
        console.error('[Zustand] Auth initialization failed, logging out.', error.message);
        get().logout();
      }
    }
    set({ isLoading: false });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiService.login(email, password);
      set({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true,
        isLoading: false
      });
      get().setTheme(data.user.settings.theme);

      // Fetch collections concurrently in parallel
      await Promise.all([
        get().fetchSubjects(),
        get().fetchAttendance(),
        get().fetchAssignments(),
        get().fetchNotes(),
        get().fetchStudySessions()
      ]);

      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  register: async (username, email) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiService.register(username, email);
      set({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true,
        isLoading: false
      });

      // Fetch collections concurrently in parallel
      await Promise.all([
        get().fetchSubjects(),
        get().fetchAttendance(),
        get().fetchAssignments(),
        get().fetchNotes(),
        get().fetchStudySessions()
      ]);

      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('studiq_access_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      subjects: [],
      attendance: [],
      assignments: [],
      notes: [],
      studySessions: []
    });
  },

  updateSettings: async (settingsUpdates) => {
    try {
      const updatedUser = await apiService.updateSettings(settingsUpdates);
      set({ user: updatedUser });
      if (settingsUpdates.theme) {
        get().setTheme(settingsUpdates.theme);
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Subjects Operations
  fetchSubjects: async () => {
    try {
      const subjects = await apiService.getSubjects();
      set({ subjects });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addSubject: async (subject) => {
    try {
      const newSubject = await apiService.createSubject(subject);
      set((state) => ({ subjects: [...state.subjects, newSubject] }));
      await get().fetchAttendance(); // Reload attendance schemas
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateSubject: async (id, updates) => {
    try {
      const updatedSubject = await apiService.updateSubject(id, updates);
      set((state) => ({
        subjects: state.subjects.map(s => s.id === id ? updatedSubject : s)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteSubject: async (id) => {
    try {
      await apiService.deleteSubject(id);
      set((state) => ({
        subjects: state.subjects.filter(s => s.id !== id),
        attendance: state.attendance.filter(a => a.subjectId !== id),
        assignments: state.assignments.filter(a => a.subjectId !== id)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Attendance Operations
  fetchAttendance: async () => {
    try {
      const attendance = await apiService.getAttendance();
      set({ attendance });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  logAttendance: async (subjectId, record) => {
    try {
      const updatedRecords = await apiService.logAttendance(subjectId, record);
      set((state) => {
        const docExists = state.attendance.some(a => a.subjectId === subjectId);
        if (docExists) {
          return {
            attendance: state.attendance.map(a =>
              a.subjectId === subjectId ? { ...a, records: updatedRecords } : a
            )
          };
        } else {
          return {
            attendance: [...state.attendance, { subjectId, records: updatedRecords }]
          };
        }
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  removeAttendanceRecord: async (subjectId, recordId) => {
    try {
      const updatedRecords = await apiService.deleteAttendanceRecord(subjectId, recordId);
      set((state) => ({
        attendance: state.attendance.map(a =>
          a.subjectId === subjectId ? { ...a, records: updatedRecords } : a
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Assignments Operations
  fetchAssignments: async () => {
    try {
      const assignments = await apiService.getAssignments();
      set({ assignments });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addAssignment: async (assignment) => {
    try {
      const newAssignment = await apiService.createAssignment(assignment);
      set((state) => ({ assignments: [...state.assignments, newAssignment] }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateAssignment: async (id, updates) => {
    try {
      const updatedAssignment = await apiService.updateAssignment(id, updates);
      set((state) => ({
        assignments: state.assignments.map(a => a.id === id ? updatedAssignment : a)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteAssignment: async (id) => {
    try {
      await apiService.deleteAssignment(id);
      set((state) => ({
        assignments: state.assignments.filter(a => a.id !== id)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Notes Operations
  fetchNotes: async () => {
    try {
      const notes = await apiService.getNotes();
      set({ notes });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addNote: async (note) => {
    try {
      const newNote = await apiService.createNote(note);
      set((state) => ({ notes: [newNote, ...state.notes] }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateNote: async (id, updates) => {
    try {
      const updatedNote = await apiService.updateNote(id, updates);
      set((state) => ({
        notes: state.notes.map(n => n.id === id ? updatedNote : n)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteNote: async (id) => {
    try {
      await apiService.deleteNote(id);
      set((state) => ({
        notes: state.notes.filter(n => n.id !== id)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  summarizeNote: async (id) => {
    try {
      const summaryText = await apiService.summarizeNote(id);
      set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, aiSummary: summaryText } : n)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  generateQuizFromNote: async (id) => {
    try {
      const quizFlashcards = await apiService.generateQuiz(id);
      set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, flashcards: quizFlashcards } : n)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Study focus timer Operations
  fetchStudySessions: async () => {
    try {
      const studySessions = await apiService.getStudySessions();
      set({ studySessions });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addStudySession: async (session) => {
    try {
      const data = await apiService.logStudySession(session);
      set((state) => {
        const nextUser = state.user ? {
          ...state.user,
          stats: {
            ...state.user.stats,
            studyStreak: data.streak,
            points: data.points
          }
        } : null;
        
        return {
          studySessions: [data.session, ...state.studySessions],
          user: nextUser
        };
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // AI Scheduler Operations
  fetchScheduledSessions: async () => {
    try {
      const data = await apiService.getScheduledSessions();
      set({ scheduledSessions: data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchExamPlans: async () => {
    try {
      const data = await apiService.getExamPlans();
      set({ examPlans: data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  createOrUpdateExamPlan: async (plan) => {
    try {
      const newPlan = await apiService.createOrUpdateExamPlan(plan);
      set((state) => {
        const remainingPlans = state.examPlans.filter(p => p.subjectId !== plan.subjectId);
        return { examPlans: [...remainingPlans, newPlan] };
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateSessionStatus: async (id, status) => {
    try {
      const updatedSession = await apiService.updateSessionStatus(id, status);
      set((state) => ({
        scheduledSessions: state.scheduledSessions.map(s => s.id === id ? updatedSession : s)
      }));
      get().fetchSchedulerDashboardStats();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchSchedulerDashboardStats: async () => {
    try {
      const data = await apiService.getSchedulerDashboardStats();
      set({
        schedulerStats: data,
        googleConnected: data.syncLogs.length > 0 && localStorage.getItem('studiq_google_oauth') !== '{"isConnected":false,"email":null}',
        syncLogs: data.syncLogs
      });
      
      const localOauth = JSON.parse(localStorage.getItem('studiq_google_oauth') || '{"isConnected":false}');
      if (localOauth.isConnected) {
        set({
          googleConnected: true,
          googleEmail: localOauth.email || 'student.studiq@gmail.com'
        });
      } else {
        set({
          googleConnected: false,
          googleEmail: null
        });
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  generateAcademicPlan: async (planParams) => {
    try {
      const enrichedParams = {
        ...planParams,
        semesters: get().semesters
      };
      const response = await apiService.generateAcademicPlan(enrichedParams);
      if (response.success) {
        const sessions = await apiService.getScheduledSessions();
        set({
          scheduledSessions: sessions,
          googleConnected: response.syncStats.isConnected,
          googleEmail: response.syncStats.isConnected ? 'student.studiq@gmail.com' : null
        });
        get().fetchSchedulerDashboardStats();
      }
      return {
        success: response.success,
        adjustments: response.adjustments || [],
        syncStats: response.syncStats
      };
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  rescheduleMissedSessions: async () => {
    try {
      const response = await apiService.rescheduleMissedSessions();
      if (response.success && response.rescheduledCount > 0) {
        const sessions = await apiService.getScheduledSessions();
        set({ scheduledSessions: sessions });
        get().fetchSchedulerDashboardStats();
      }
      return response;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  connectGoogleCalendar: async () => {
    try {
      const data = await apiService.getGoogleAuthUrl();
      if (data.success) {
        if (data.isSimulated) {
          localStorage.setItem('studiq_google_oauth', JSON.stringify({ isConnected: true, email: 'student.studiq@gmail.com' }));
          set({ googleConnected: true, googleEmail: 'student.studiq@gmail.com' });
          get().fetchSchedulerDashboardStats();
        }
        return data.url;
      }
      return '';
    } catch (error: any) {
      set({ error: error.message });
      return '';
    }
  },

  disconnectGoogleCalendar: async () => {
    try {
      await apiService.disconnectGoogleCalendar();
      set({ googleConnected: false, googleEmail: null });
      get().fetchSchedulerDashboardStats();
    } catch (error: any) {
      set({ error: error.message });
    }
  }
}));
