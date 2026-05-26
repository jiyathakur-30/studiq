import { create } from 'zustand';
import { storage, safeParse, DEMO_USER_ID } from '../utils/storage';
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

export interface StudyPlanningContext {
  goalType: 'Exam Prep' | 'Assignment Recovery' | 'Revision Week' | 'Catch-Up Recovery' | 'GPA Boost' | 'Regular Study';
  deadlineDays: number;
  dailyAvailableHours: number;
  weakSubjects: string[];
  targetIntensity: 'light' | 'moderate' | 'high';
  isPomodoroFormat?: boolean;
  optimizeForAttendance?: boolean;
}

interface AppState {
  // Centralized AI Coach States
  isAiCoachOpen: boolean;
  aiCoachPrefilledPrompt: string;
  aiPlanningContext: StudyPlanningContext | null;
  setAiCoachOpen: (open: boolean, prefilledPrompt?: string) => void;
  setAiPlanningContext: (ctx: StudyPlanningContext | null) => void;

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
  register: (username: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  deleteAccount: () => Promise<boolean>;
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
  hydrateAcademicData: () => void;

  // Offline Sync System Properties
  isOffline: boolean;
  syncStatus: 'synced' | 'pending' | 'saved_local';
  queueSyncAction: (type: string, payload: any) => void;
  syncOfflineQueue: () => Promise<void>;
}

// Centralized utility function to clear persisted state and clean only studiq_ keys
const clearPersistedState = (set: any, includeTheme: boolean = false) => {
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('studiq_')) {
        if (key === 'studiq_theme' && !includeTheme) {
          return;
        }
        if (key === 'studiq_offline_users') {
          return; // Protect the user registry database!
        }
        localStorage.removeItem(key);
      }
    });
  }

  set({
    user: null,
    token: null,
    isAuthenticated: false,
    subjects: [],
    attendance: [],
    assignments: [],
    notes: [],
    studySessions: [],
    scheduledSessions: [],
    examPlans: [],
    semesters: [],
    targetGpaSettings: {
      targetCgpa: 9.0,
      remainingSemesters: 4
    }
  });
};

// Apply theme class to HTML element synchronously on module load to prevent hydration style flash
if (typeof window !== 'undefined') {
  const initialTheme = localStorage.getItem('studiq_theme') || 'dark';
  const root = window.document.documentElement;
  if (!root.classList.contains(initialTheme)) {
    root.classList.remove('light', 'dark', 'cyberpunk');
    root.classList.add(initialTheme);
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  // Centralized AI Coach State Init
  isAiCoachOpen: false,
  aiCoachPrefilledPrompt: '',
  aiPlanningContext: null,

  setAiCoachOpen: (open, prefilledPrompt = '') => {
    set({ 
      isAiCoachOpen: open, 
      aiCoachPrefilledPrompt: prefilledPrompt 
    });
  },

  setAiPlanningContext: (ctx) => {
    set({ aiPlanningContext: ctx });
  },

  // Initial Auth & Settings State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  theme: (typeof window !== 'undefined' ? (localStorage.getItem('studiq_theme') || 'dark') : 'dark') as 'light' | 'dark' | 'cyberpunk',
  
  isOffline: typeof window !== 'undefined' ? !navigator.onLine : false,
  syncStatus: 'synced',

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
    storage.setItem('studiq_semesters', JSON.stringify(nextSems));
  },

  deleteSemester: (id) => {
    const nextSems = get().semesters.filter(s => s.id !== id);
    set({ semesters: nextSems });
    storage.setItem('studiq_semesters', JSON.stringify(nextSems));
  },

  updateTargetGpaSettings: (updates) => {
    const nextSettings = { ...get().targetGpaSettings, ...updates };
    set({ targetGpaSettings: nextSettings });
    storage.setItem('studiq_target_gpa', JSON.stringify(nextSettings));
  },

  hydrateAcademicData: () => {
    const storedSemesters = storage.getItem('studiq_semesters');
    const storedTarget = storage.getItem('studiq_target_gpa');
    
    const user = get().user;
    const isDemoUser = user?.id === DEMO_USER_ID;

    const seededSemesters: SemesterRecord[] = storedSemesters 
      ? safeParse<SemesterRecord[]>(storedSemesters, [])
      : (isDemoUser ? [
          { id: 'sem-1', name: 'Semester 1', sgpa: 8.4, credits: 20 },
          { id: 'sem-2', name: 'Semester 2', sgpa: 8.6, credits: 22 },
          { id: 'sem-3', name: 'Semester 3', sgpa: 8.8, credits: 18 },
          { id: 'sem-4', name: 'Semester 4', sgpa: 9.0, credits: 20 }
        ] : []);

    const seededTarget: TargetGpaSettings = storedTarget
      ? safeParse<TargetGpaSettings>(storedTarget, { targetCgpa: 9.0, remainingSemesters: 4 })
      : { targetCgpa: 9.0, remainingSemesters: 4 };

    if (!storedSemesters && isDemoUser) {
      storage.setItem('studiq_semesters', JSON.stringify(seededSemesters));
    }
    if (!storedTarget) {
      storage.setItem('studiq_target_gpa', JSON.stringify(seededTarget));
    }

    set({ semesters: seededSemesters, targetGpaSettings: seededTarget });
  },

  // Auth Operations
  initAuth: async () => {
    set({ isLoading: true, error: null });
    const storedToken = localStorage.getItem('studiq_access_token');
    const storedTheme = (localStorage.getItem('studiq_theme') || 'dark') as 'light' | 'dark' | 'cyberpunk';
    
    // Set theme immediately on init
    get().setTheme(storedTheme);

    // Setup offline event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        set({ isOffline: false });
        get().syncOfflineQueue();
      });
      window.addEventListener('offline', () => {
        set({ isOffline: true });
      });
      set({ isOffline: !navigator.onLine });
      if (navigator.onLine) {
        get().syncOfflineQueue();
      }
    }

    // Initial temporary user hydration from localStorage to ensure correct namespacing before calling API
    const userStr = localStorage.getItem('studiq_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        set({ user: u });
      } catch (e) {}
    }

    // Centralized Academic Hydration
    get().hydrateAcademicData();

    // Run the migration cleanup dynamically!
    storage.runMigrationCleanup();

    if (storedToken) {
      try {
        const user = await apiService.getProfile();
        set({ user, token: storedToken, isAuthenticated: true, theme: user.settings.theme || storedTheme });
        
        // Re-hydrate academic data dynamically now that we have the verified user profile!
        get().hydrateAcademicData();

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

      // Hydrate newly authenticated user's academic semesters & target GPA from storage!
      get().hydrateAcademicData();

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

  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiService.register(username, email, password);
      set({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true,
        isLoading: false
      });

      // Hydrate newly registered user's academic semesters & target GPA from storage!
      get().hydrateAcademicData();

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
    clearPersistedState(set, false);
  },

  deleteAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      const success = await apiService.deleteAccount();
      if (success) {
        clearPersistedState(set, true); // Wipe everything including theme on permanent delete
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
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
    const previousAttendance = get().attendance;
    const tempRecordId = `temp-${Date.now()}`;
    const tempRecord = { ...record, id: tempRecordId, _id: tempRecordId } as any;

    set((state) => {
      const docExists = state.attendance.some(a => a.subjectId === subjectId);
      if (docExists) {
        return {
          attendance: state.attendance.map(a =>
            a.subjectId === subjectId ? { ...a, records: [...a.records, tempRecord] } : a
          )
        };
      } else {
        return {
          attendance: [...state.attendance, { subjectId, records: [tempRecord] }]
        };
      }
    });

    try {
      const updatedRecords = await apiService.logAttendance(subjectId, record);
      set((state) => ({
        attendance: state.attendance.map(a =>
          a.subjectId === subjectId ? { ...a, records: updatedRecords } : a
        )
      }));
    } catch (error: any) {
      set({ attendance: previousAttendance, error: error.message });
    }
  },

  removeAttendanceRecord: async (subjectId, recordId) => {
    const previousAttendance = get().attendance;

    set((state) => ({
      attendance: state.attendance.map(a =>
        a.subjectId === subjectId ? { ...a, records: a.records.filter(r => r.id !== recordId && (r as any)._id !== recordId) } : a
      )
    }));

    try {
      const updatedRecords = await apiService.deleteAttendanceRecord(subjectId, recordId);
      set((state) => ({
        attendance: state.attendance.map(a =>
          a.subjectId === subjectId ? { ...a, records: updatedRecords } : a
        )
      }));
    } catch (error: any) {
      set({ attendance: previousAttendance, error: error.message });
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
    const tempId = `temp-${Date.now()}`;
    const tempAssignment = { 
      ...assignment, 
      id: tempId,
      _id: tempId // support both formats
    } as any;
    
    const previousAssignments = get().assignments;
    set((state) => ({ assignments: [...state.assignments, tempAssignment] }));
    
    if (!navigator.onLine) {
      get().queueSyncAction('ADD_ASSIGNMENT', { tempId, assignment });
      return;
    }
    
    try {
      const newAssignment = await apiService.createAssignment(assignment);
      set((state) => ({
        assignments: state.assignments.map(a => a.id === tempId ? newAssignment : a)
      }));
    } catch (error: any) {
      get().queueSyncAction('ADD_ASSIGNMENT', { tempId, assignment });
    }
  },

  updateAssignment: async (id, updates) => {
    const previousAssignments = get().assignments;
    set((state) => ({
      assignments: state.assignments.map(a => (a.id === id || (a as any)._id === id) ? { ...a, ...updates } : a)
    }));
    
    if (!navigator.onLine) {
      get().queueSyncAction('UPDATE_ASSIGNMENT', { id, updates });
      return;
    }
    
    try {
      const updatedAssignment = await apiService.updateAssignment(id, updates);
      set((state) => ({
        assignments: state.assignments.map(a => (a.id === id || (a as any)._id === id) ? updatedAssignment : a)
      }));
    } catch (error: any) {
      get().queueSyncAction('UPDATE_ASSIGNMENT', { id, updates });
    }
  },

  deleteAssignment: async (id) => {
    const previousAssignments = get().assignments;
    set((state) => ({
      assignments: state.assignments.filter(a => a.id !== id && (a as any)._id !== id)
    }));
    
    if (!navigator.onLine) {
      get().queueSyncAction('DELETE_ASSIGNMENT', { id });
      return;
    }
    
    try {
      await apiService.deleteAssignment(id);
    } catch (error: any) {
      get().queueSyncAction('DELETE_ASSIGNMENT', { id });
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
    const previousSessions = get().scheduledSessions;

    // Optimistic local update
    set((state) => ({
      scheduledSessions: state.scheduledSessions.map(s => (s.id === id || (s as any)._id === id) ? { ...s, status } : s)
    }));

    try {
      const updatedSession = await apiService.updateSessionStatus(id, status);
      set((state) => ({
        scheduledSessions: state.scheduledSessions.map(s => (s.id === id || (s as any)._id === id) ? updatedSession : s)
      }));
      get().fetchSchedulerDashboardStats();
    } catch (error: any) {
      set({ scheduledSessions: previousSessions, error: error.message });
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
        
        if (!navigator.onLine) {
          get().queueSyncAction('RESCHEDULE_MISSED', {});
        }
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
  },

  queueSyncAction: (type, payload) => {
    const queue = JSON.parse(localStorage.getItem('studiq_sync_queue') || '[]');
    queue.push({
      id: 'action-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      type,
      payload,
      timestamp: Date.now()
    });
    localStorage.setItem('studiq_sync_queue', JSON.stringify(queue));
    set({ syncStatus: 'saved_local' });
  },

  syncOfflineQueue: async () => {
    if (!navigator.onLine) return;
    const queue = JSON.parse(localStorage.getItem('studiq_sync_queue') || '[]');
    if (queue.length === 0) {
      set({ syncStatus: 'synced' });
      return;
    }

    set({ syncStatus: 'pending' });
    console.log('[Offline Sync] Syncing queued actions:', queue.length);

    for (const action of queue) {
      try {
        switch (action.type) {
          case 'ADD_ASSIGNMENT':
            await apiService.createAssignment(action.payload.assignment);
            break;
          case 'UPDATE_ASSIGNMENT':
            await apiService.updateAssignment(action.payload.id, action.payload.updates);
            break;
          case 'DELETE_ASSIGNMENT':
            await apiService.deleteAssignment(action.payload.id);
            break;
          case 'LOG_ATTENDANCE':
            await apiService.logAttendance(action.payload.subjectId, action.payload.record);
            break;
          case 'REMOVE_ATTENDANCE':
            await apiService.deleteAttendanceRecord(action.payload.subjectId, action.payload.recordId);
            break;
          case 'UPDATE_SESSION_STATUS':
            await apiService.updateSessionStatus(action.payload.id, action.payload.status);
            break;
          case 'ADD_SUBJECT':
            await apiService.createSubject(action.payload.subject);
            break;
          case 'UPDATE_SUBJECT':
            await apiService.updateSubject(action.payload.id, action.payload.updates);
            break;
          case 'DELETE_SUBJECT':
            await apiService.deleteSubject(action.payload.id);
            break;
          case 'RESCHEDULE_MISSED':
            await apiService.rescheduleMissedSessions();
            break;
        }
      } catch (err) {
        console.error('[Offline Sync] Failed to sync action:', action, err);
        if (!navigator.onLine) {
          // If connection dropped, stop and keep remaining queue
          set({ syncStatus: 'saved_local' });
          return;
        }
      }
    }

    // Clear queue upon completion and reload store data dynamically to sync with actual DB
    localStorage.setItem('studiq_sync_queue', '[]');
    try {
      await Promise.all([
        get().fetchSubjects(),
        get().fetchAttendance(),
        get().fetchAssignments(),
        get().fetchNotes(),
        get().fetchStudySessions(),
        get().fetchScheduledSessions(),
        get().fetchSchedulerDashboardStats()
      ]);
      set({ syncStatus: 'synced' });
      console.log('[Offline Sync] All offline actions synced successfully.');
    } catch (e) {
      console.warn('[Offline Sync] Local re-hydration failed, keeping synced state.');
      set({ syncStatus: 'synced' });
    }
  }
}));
