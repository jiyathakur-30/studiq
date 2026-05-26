import axios from 'axios';
import { storage, safeParse, DEMO_USER_ID, DEMO_EMAIL, OFFLINE_USERS_KEY } from '../utils/storage';
import {
  initialUserProfile,
  initialSubjects,
  initialAttendance,
  initialAssignments,
  initialNotes,
  initialStudySessions,
  Subject,
  Attendance,
  Assignment,
  Note,
  StudySession,
  UserProfile,
  AttendanceRecord,
  Flashcard
} from './mockData';

export interface ScheduledSession {
  id: string;
  subjectId: string | null;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'missed';
  googleCalendarEventId: string | null;
  isAiGenerated: boolean;
  rescheduleCount: number;
}

export interface ExamPlan {
  id: string;
  subjectId: string;
  examDate: string;
  chapters: string[];
  confidenceLevel: number;
  studyHoursGoal: number;
  isAiOptimized: boolean;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  message: string;
}

export interface SchedulerStats {
  averageAttendance: number;
  backlogRisk: number;
  productivityScore: number;
  pomodoroConsistency: number;
  subjectAttendance: { subjectName: string; percentage: number }[];
  syncLogs: SyncLog[];
}


// Centralized Axios configuration
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Attach JWT access token to headers if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('studiq_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Offline Database Hooks (Initializing values in localStorage if empty)
export const initializeOfflineDb = () => {
  const userStr = localStorage.getItem('studiq_user');
  let activeUserId = '';
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      activeUserId = user?.id || user?._id || '';
    } catch (e) {}
  }

  // If the active user is the demo user, ensure default demo data is populated
  if (activeUserId === DEMO_USER_ID) {
    if (!storage.getItem('studiq_subjects')) {
      storage.setItem('studiq_subjects', JSON.stringify(initialSubjects));
    }
    if (!storage.getItem('studiq_attendance')) {
      storage.setItem('studiq_attendance', JSON.stringify(initialAttendance));
    }
    if (!storage.getItem('studiq_assignments')) {
      storage.setItem('studiq_assignments', JSON.stringify(initialAssignments));
    }
    if (!storage.getItem('studiq_notes')) {
      storage.setItem('studiq_notes', JSON.stringify(initialNotes));
    }
    if (!storage.getItem('studiq_study')) {
      storage.setItem('studiq_study', JSON.stringify(initialStudySessions));
    }
  } else if (activeUserId) {
    // For non-demo real users, ensure empty arrays exist if they don't already
    const keys = [
      'studiq_subjects',
      'studiq_attendance',
      'studiq_assignments',
      'studiq_notes',
      'studiq_study'
    ];
    keys.forEach((k) => {
      if (!storage.getItem(k)) {
        storage.setItem(k, JSON.stringify([]));
      }
    });
  }

  // Global scheduled sessions, exam plans & oauth
  if (!storage.getItem('studiq_scheduled_sessions')) {
    storage.setItem('studiq_scheduled_sessions', JSON.stringify([]));
  }
  if (!storage.getItem('studiq_exam_plans')) {
    storage.setItem('studiq_exam_plans', JSON.stringify([]));
  }
  if (!storage.getItem('studiq_google_oauth')) {
    storage.setItem('studiq_google_oauth', JSON.stringify({ isConnected: false, email: null }));
  }
};

initializeOfflineDb();

// Offline Engine CRUD controllers
const getLocalData = <T>(key: string): T => {
  const val = storage.getItem(key);
  if (!val) {
    const userStr = localStorage.getItem('studiq_user');
    let activeUserId = '';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        activeUserId = user?.id || user?._id || '';
      } catch (e) {}
    }

    if (activeUserId === DEMO_USER_ID) {
      if (key === 'studiq_user') return initialUserProfile as unknown as T;
      if (key === 'studiq_subjects') return initialSubjects as unknown as T;
      if (key === 'studiq_attendance') return initialAttendance as unknown as T;
      if (key === 'studiq_assignments') return initialAssignments as unknown as T;
      if (key === 'studiq_notes') return initialNotes as unknown as T;
      if (key === 'studiq_study') return initialStudySessions as unknown as T;
    } else {
      if (key === 'studiq_user') return null as unknown as T;
      return [] as unknown as T;
    }
    return [] as unknown as T;
  }
  return safeParse<T>(val, [] as unknown as T);
};

const setLocalData = <T>(key: string, data: T) => {
  storage.setItem(key, JSON.stringify(data));
};

export const apiService = {
  // --- AUTH SERVICES ---
  async login(email: string, password: string): Promise<{ success: boolean; user: UserProfile; accessToken: string; refreshToken: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const response = await API.post('/auth/login', { email: normalizedEmail, password });
      localStorage.setItem('studiq_access_token', response.data.accessToken);
      localStorage.setItem('studiq_user', JSON.stringify(response.data.user));
      initializeOfflineDb();
      return response.data;
    } catch (error) {
      console.warn('[Hybrid Sync] Login server unreachable, executing fallback validations.');
      console.log('[Auth Debug] Offline login attempt for email:', normalizedEmail);

      let registeredUsers: any[] = [];
      try {
        const storedRegistry = localStorage.getItem(OFFLINE_USERS_KEY);
        if (storedRegistry) {
          registeredUsers = JSON.parse(storedRegistry);
        }
      } catch (e) {}

      // Add default demo user with its password conforming to the standard schema
      const demoUser = {
        id: DEMO_USER_ID,
        username: 'SarahConnor',
        email: DEMO_EMAIL,
        password: 'password123',
        createdAt: new Date().toISOString()
      };
      
      const allUsers = [demoUser, ...registeredUsers];
      console.log('[LOGIN USERS]', allUsers);
      console.log('[LOGIN INPUT]', normalizedEmail, password);

      const matchedUserRecord = allUsers.find(u => u.email.trim().toLowerCase() === normalizedEmail);

      if (matchedUserRecord) {
        const expectedPassword = matchedUserRecord.password;
        console.log('[Auth Debug] User found in registry. Matching passwords.');
        
        if (expectedPassword && password === expectedPassword) {
          const mockToken = 'mock-jwt-token-response';
          localStorage.setItem('studiq_access_token', mockToken);
          
          // Assemble the UserProfile for app store/UI consumption
          const matchedProfile: UserProfile = {
            id: matchedUserRecord.id,
            username: matchedUserRecord.username,
            email: matchedUserRecord.email,
            profilePicture: matchedUserRecord.id === DEMO_USER_ID 
              ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
              : 'avatar-default',
            settings: { theme: 'dark', targetAttendance: 75, dailyStudyGoalMinutes: 60 },
            stats: { studyStreak: matchedUserRecord.id === DEMO_USER_ID ? 5 : 0, lastActiveDate: new Date().toISOString(), points: matchedUserRecord.id === DEMO_USER_ID ? 420 : 0 }
          };

          localStorage.setItem('studiq_user', JSON.stringify(matchedProfile));
          
          console.log('[Auth Debug] Login success. User ID resolved:', matchedProfile.id);
          initializeOfflineDb();
          return {
            success: true,
            user: matchedProfile,
            accessToken: mockToken,
            refreshToken: 'mock-refresh-token'
          };
        }
      }
      console.log('[Auth Debug] Login credentials mismatch.');
      throw new Error('Invalid email or password.');
    }
  },

  async register(username: string, email: string, password?: string): Promise<{ success: boolean; user: UserProfile; accessToken: string }> {
    if (!password || password.trim().length === 0) {
      throw new Error('Password is required.');
    }
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const response = await API.post('/auth/register', { username, email: normalizedEmail, password });
      
      localStorage.setItem('studiq_access_token', response.data.accessToken);
      localStorage.setItem('studiq_user', JSON.stringify(response.data.user));
      initializeOfflineDb();
      return response.data;
    } catch (error) {
      console.warn('[Hybrid Sync] Register server unreachable, fallback registering demo profile.');
      
      // Duplicate registration protection
      let registeredUsers: any[] = [];
      try {
        const storedRegistry = localStorage.getItem(OFFLINE_USERS_KEY);
        if (storedRegistry) {
          registeredUsers = JSON.parse(storedRegistry);
        }
      } catch (e) {}

      console.log('[Auth Debug] Offline registration check. Registered users:', registeredUsers.map(u => u.email));

      if (registeredUsers.some(u => u.email.trim().toLowerCase() === normalizedEmail) || normalizedEmail === DEMO_EMAIL) {
        throw new Error('Registration failed: Email address is already registered.');
      }

      // Standardized structure record — store exact password as entered
      const newUser = {
        id: 'user-' + Date.now(),
        username: username.trim(),
        email: normalizedEmail,
        password: password,   // always the user's actual input
        createdAt: new Date().toISOString()
      };

      console.log('[REGISTER] New user created:', newUser.id, newUser.email);

      // Persist registry — same key as login reads
      registeredUsers.push(newUser);
      localStorage.setItem(OFFLINE_USERS_KEY, JSON.stringify(registeredUsers));

      // Verify persistence
      const verifyRegistry = localStorage.getItem(OFFLINE_USERS_KEY);
      console.log('[Auth Debug] Registry after registration:', verifyRegistry ? JSON.parse(verifyRegistry).length : 0, 'users');

      // Assemble UserProfile for app store consumption
      const userProfile: UserProfile = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        profilePicture: 'avatar-default',
        settings: { theme: 'dark', targetAttendance: 75, dailyStudyGoalMinutes: 60 },
        stats: { studyStreak: 0, lastActiveDate: newUser.createdAt, points: 0 }
      };

      localStorage.setItem('studiq_user', JSON.stringify(userProfile));
      localStorage.setItem('studiq_access_token', 'mock-jwt-token-response');
      initializeOfflineDb();
      
      console.log('[Auth Debug] Offline registration success. Created user ID:', newUser.id);
      return {
        success: true,
        user: userProfile,
        accessToken: 'mock-jwt-token-response'
      };
    }
  },

  async getProfile(): Promise<UserProfile> {
    try {
      const response = await API.get('/auth/profile');
      localStorage.setItem('studiq_user', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      return getLocalData<UserProfile>('studiq_user');
    }
  },

  async updateSettings(settings: Partial<UserProfile['settings']>): Promise<UserProfile> {
    try {
      const response = await API.put('/auth/settings', settings);
      localStorage.setItem('studiq_user', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      const user = getLocalData<UserProfile>('studiq_user');
      user.settings = { ...user.settings, ...settings };
      setLocalData('studiq_user', user);
      return user;
    }
  },

  async deleteAccount(): Promise<boolean> {
    try {
      await API.delete('/auth/delete-account');
      return true;
    } catch (error) {
      console.warn('Backend offline or failed to delete account database record, falling back to local data wipe.', error);
      return true;
    }
  },

  // --- SUBJECT SERVICES ---
  async getSubjects(): Promise<Subject[]> {
    try {
      const response = await API.get('/subjects');
      return response.data.subjects;
    } catch (error) {
      return getLocalData<Subject[]>('studiq_subjects');
    }
  },

  async createSubject(subject: Omit<Subject, 'id'>): Promise<Subject> {
    try {
      const response = await API.post('/subjects', subject);
      return response.data.subject;
    } catch (error) {
      const subjects = getLocalData<Subject[]>('studiq_subjects');
      const newSubject: Subject = { ...subject, id: 'sub-' + Date.now() };
      subjects.push(newSubject);
      setLocalData('studiq_subjects', subjects);

      // Initialize empty local attendance as well
      const attendance = getLocalData<Attendance[]>('studiq_attendance');
      attendance.push({ subjectId: newSubject.id, records: [] });
      setLocalData('studiq_attendance', attendance);

      return newSubject;
    }
  },

  async updateSubject(id: string, updates: Partial<Subject>): Promise<Subject> {
    try {
      const response = await API.put(`/subjects/${id}`, updates);
      return response.data.subject;
    } catch (error) {
      const subjects = getLocalData<Subject[]>('studiq_subjects');
      const index = subjects.findIndex(s => s.id === id);
      if (index !== -1) {
        subjects[index] = { ...subjects[index], ...updates };
        setLocalData('studiq_subjects', subjects);
        return subjects[index];
      }
      throw new Error('Subject not found');
    }
  },

  async deleteSubject(id: string): Promise<boolean> {
    try {
      await API.delete(`/subjects/${id}`);
      return true;
    } catch (error) {
      const subjects = getLocalData<Subject[]>('studiq_subjects');
      setLocalData('studiq_subjects', subjects.filter(s => s.id !== id));
      
      // Cascade delete local attendance & assignments
      const attendance = getLocalData<Attendance[]>('studiq_attendance');
      setLocalData('studiq_attendance', attendance.filter(a => a.subjectId !== id));

      const assignments = getLocalData<Assignment[]>('studiq_assignments');
      setLocalData('studiq_assignments', assignments.filter(t => t.subjectId !== id));

      return true;
    }
  },

  // --- ATTENDANCE SERVICES ---
  async getAttendance(): Promise<Attendance[]> {
    try {
      const response = await API.get('/attendance');
      return response.data.attendance;
    } catch (error) {
      return getLocalData<Attendance[]>('studiq_attendance');
    }
  },

  async logAttendance(subjectId: string, record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord[]> {
    try {
      const response = await API.post(`/attendance/${subjectId}`, record);
      return response.data.records;
    } catch (error) {
      const attendance = getLocalData<Attendance[]>('studiq_attendance');
      let doc = attendance.find(a => a.subjectId === subjectId);
      if (!doc) {
        doc = { subjectId, records: [] };
        attendance.push(doc);
      }
      const newRec: AttendanceRecord = {
        ...record,
        id: 'att-rec-' + Date.now(),
        date: record.date || new Date().toISOString()
      };
      doc.records.push(newRec);
      setLocalData('studiq_attendance', attendance);
      return doc.records;
    }
  },

  async deleteAttendanceRecord(subjectId: string, recordId: string): Promise<AttendanceRecord[]> {
    try {
      const response = await API.delete(`/attendance/${subjectId}/record/${recordId}`);
      return response.data.records;
    } catch (error) {
      const attendance = getLocalData<Attendance[]>('studiq_attendance');
      const doc = attendance.find(a => a.subjectId === subjectId);
      if (doc) {
        doc.records = doc.records.filter(r => r.id !== recordId);
        setLocalData('studiq_attendance', attendance);
        return doc.records;
      }
      return [];
    }
  },

  // --- ASSIGNMENT SERVICES ---
  async getAssignments(): Promise<Assignment[]> {
    try {
      const response = await API.get('/assignments');
      return response.data.assignments;
    } catch (error) {
      return getLocalData<Assignment[]>('studiq_assignments');
    }
  },

  async createAssignment(assignment: Omit<Assignment, 'id'>): Promise<Assignment> {
    try {
      const response = await API.post('/assignments', assignment);
      return response.data.assignment;
    } catch (error) {
      const assignments = getLocalData<Assignment[]>('studiq_assignments');
      const newAssignment: Assignment = {
        ...assignment,
        id: 'task-' + Date.now(),
        subtasks: assignment.subtasks.map((st, i) => ({ ...st, id: `subt-${Date.now()}-${i}` }))
      };
      assignments.push(newAssignment);
      setLocalData('studiq_assignments', assignments);
      return newAssignment;
    }
  },

  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    try {
      const response = await API.put(`/assignments/${id}`, updates);
      return response.data.assignment;
    } catch (error) {
      const assignments = getLocalData<Assignment[]>('studiq_assignments');
      const index = assignments.findIndex(a => a.id === id);
      if (index !== -1) {
        assignments[index] = { ...assignments[index], ...updates };
        setLocalData('studiq_assignments', assignments);
        return assignments[index];
      }
      throw new Error('Assignment not found');
    }
  },

  async deleteAssignment(id: string): Promise<boolean> {
    try {
      await API.delete(`/assignments/${id}`);
      return true;
    } catch (error) {
      const assignments = getLocalData<Assignment[]>('studiq_assignments');
      setLocalData('studiq_assignments', assignments.filter(a => a.id !== id));
      return true;
    }
  },

  // --- NOTES SERVICES ---
  async getNotes(): Promise<Note[]> {
    try {
      const response = await API.get('/notes');
      return response.data.notes;
    } catch (error) {
      return getLocalData<Note[]>('studiq_notes');
    }
  },

  async createNote(note: Omit<Note, 'id' | 'updatedAt'>): Promise<Note> {
    try {
      const response = await API.post('/notes', note);
      return response.data.note;
    } catch (error) {
      const notes = getLocalData<Note[]>('studiq_notes');
      const newNote: Note = {
        ...note,
        id: 'note-' + Date.now(),
        updatedAt: new Date().toISOString()
      };
      notes.push(newNote);
      setLocalData('studiq_notes', notes);
      return newNote;
    }
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    try {
      const response = await API.put(`/notes/${id}`, updates);
      return response.data.note;
    } catch (error) {
      const notes = getLocalData<Note[]>('studiq_notes');
      const index = notes.findIndex(n => n.id === id);
      if (index !== -1) {
        notes[index] = {
          ...notes[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        setLocalData('studiq_notes', notes);
        return notes[index];
      }
      throw new Error('Note not found');
    }
  },

  async deleteNote(id: string): Promise<boolean> {
    try {
      await API.delete(`/notes/${id}`);
      return true;
    } catch (error) {
      const notes = getLocalData<Note[]>('studiq_notes');
      setLocalData('studiq_notes', notes.filter(n => n.id !== id));
      return true;
    }
  },

  async summarizeNote(id: string): Promise<string> {
    try {
      const response = await API.post(`/notes/${id}/summarize`);
      return response.data.aiSummary;
    } catch (error) {
      const notes = getLocalData<Note[]>('studiq_notes');
      const index = notes.findIndex(n => n.id === id);
      if (index !== -1) {
        const note = notes[index];
        const contentText = note.content || '';
        let summary = '';
        if (contentText.trim().length < 10) {
          summary = "📝 This note is currently too short to be summarized. Please type some concepts to see the AI summarize it!";
        } else {
          summary = `### 🤖 STUDIQ AI Summary for "${note.title}"\n\n- **Objective**: Detailed review of the academic concept logged.\n- **Takeaways**: Master concepts by linking references, reviewing daily, and applying interactive markdown.\n- **Action Plan**: Review again before exams.\n\n*Generated by STUDIQ Offline Brain Engine*`;
        }
        note.aiSummary = summary;
        setLocalData('studiq_notes', notes);
        return summary;
      }
      return '';
    }
  },

  async generateQuiz(id: string): Promise<Flashcard[]> {
    try {
      const response = await API.post(`/notes/${id}/quiz`);
      return response.data.flashcards;
    } catch (error) {
      const notes = getLocalData<Note[]>('studiq_notes');
      const index = notes.findIndex(n => n.id === id);
      if (index !== -1) {
        const mockFlashcards: Flashcard[] = [
          {
            id: 'f-' + Date.now() + '-1',
            question: `Based on your note "${notes[index].title}", what is the primary core objective of studying this material?`,
            answer: "To master the foundational theory and apply it practically in solving problems."
          },
          {
            id: 'f-' + Date.now() + '-2',
            question: "How does periodic spacing (Active Recall) optimize learning retention?",
            answer: "It triggers neuroplasticity by forcing the brain to actively reconstruct concepts at regular intervals."
          }
        ];
        notes[index].flashcards = mockFlashcards;
        setLocalData('studiq_notes', notes);
        return mockFlashcards;
      }
      return [];
    }
  },

  // --- STUDY TIMER SERVICES ---
  async getStudySessions(): Promise<StudySession[]> {
    try {
      const response = await API.get('/study');
      return response.data.sessions;
    } catch (error) {
      return getLocalData<StudySession[]>('studiq_study');
    }
  },

  async logStudySession(session: Omit<StudySession, 'id' | 'date'>): Promise<{ session: StudySession; streak: number; points: number }> {
    try {
      const response = await API.post('/study', session);
      return response.data;
    } catch (error) {
      const sessions = getLocalData<StudySession[]>('studiq_study');
      const newSession: StudySession = {
        ...session,
        id: 'sess-' + Date.now(),
        date: new Date().toISOString()
      };
      sessions.push(newSession);
      setLocalData('studiq_study', sessions);

      // Increment streak
      const user = getLocalData<UserProfile>('studiq_user');
      user.stats.studyStreak += 1;
      user.stats.points += Math.floor(session.durationMinutes * 0.4);
      setLocalData('studiq_user', user);

      return {
        session: newSession,
        streak: user.stats.studyStreak,
        points: user.stats.points
      };
    }
  },

  // --- AI SCHEDULER & GOOGLE SYNC SERVICES ---
  async getGoogleAuthUrl(): Promise<{ success: boolean; url: string; isSimulated: boolean }> {
    try {
      const response = await API.get('/scheduler/google/url');
      return response.data;
    } catch (error) {
      console.warn('[Hybrid Sync] Scheduler server offline. Triggering premium sandboxed OAuth login screen.');
      return {
        success: true,
        url: `http://localhost:5173/scheduler?mock_oauth=true`,
        isSimulated: true
      };
    }
  },

  async disconnectGoogleCalendar(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await API.post('/scheduler/google/disconnect');
      return response.data;
    } catch (error) {
      localStorage.setItem('studiq_google_oauth', JSON.stringify({ isConnected: false, email: null }));
      return { success: true, message: 'Google Calendar successfully disconnected (Offline)' };
    }
  },

  async getScheduledSessions(): Promise<ScheduledSession[]> {
    try {
      const response = await API.get('/scheduler/sessions');
      return response.data.data;
    } catch (error) {
      return getLocalData<ScheduledSession[]>('studiq_scheduled_sessions');
    }
  },

  async getExamPlans(): Promise<ExamPlan[]> {
    try {
      const response = await API.get('/scheduler/exams');
      return response.data.data;
    } catch (error) {
      return getLocalData<ExamPlan[]>('studiq_exam_plans');
    }
  },

  async createOrUpdateExamPlan(plan: Omit<ExamPlan, 'id' | 'isAiOptimized'>): Promise<ExamPlan> {
    try {
      const response = await API.post('/scheduler/exams', plan);
      return response.data.data;
    } catch (error) {
      const plans = getLocalData<ExamPlan[]>('studiq_exam_plans');
      const index = plans.findIndex(p => p.subjectId === plan.subjectId);
      const newPlan: ExamPlan = {
        ...plan,
        id: 'exam-' + Date.now(),
        isAiOptimized: true
      };

      if (index !== -1) {
        plans[index] = newPlan;
      } else {
        plans.push(newPlan);
      }
      setLocalData('studiq_exam_plans', plans);
      return newPlan;
    }
  },

  async updateSessionStatus(id: string, status: ScheduledSession['status']): Promise<ScheduledSession> {
    try {
      const response = await API.put(`/scheduler/sessions/${id}`, { status });
      return response.data.data;
    } catch (error) {
      const sessions = getLocalData<ScheduledSession[]>('studiq_scheduled_sessions');
      const index = sessions.findIndex(s => s.id === id);
      if (index !== -1) {
        sessions[index].status = status;
        setLocalData('studiq_scheduled_sessions', sessions);
        return sessions[index];
      }
      throw new Error('Session not found offline');
    }
  },

  async getSchedulerDashboardStats(): Promise<SchedulerStats> {
    try {
      const response = await API.get('/scheduler/dashboard-stats');
      return response.data.data;
    } catch (error) {
      const subjects = getLocalData<Subject[]>('studiq_subjects');
      const attendance = getLocalData<Attendance[]>('studiq_attendance');
      const assignments = getLocalData<Assignment[]>('studiq_assignments');
      const studySessions = getLocalData<StudySession[]>('studiq_study');

      let totalAttended = 0;
      let totalClasses = 0;
      const subjectAttendance: { subjectName: string; percentage: number }[] = [];

      attendance.forEach(att => {
        const attended = att.records.filter(r => r.status === 'attended').length;
        const missed = att.records.filter(r => r.status === 'missed').length;
        const total = attended + missed;

        totalAttended += attended;
        totalClasses += total;

        const sub = subjects.find(s => s.id === att.subjectId);
        if (sub && total > 0) {
          subjectAttendance.push({
            subjectName: sub.name,
            percentage: Math.round((attended / total) * 100)
          });
        }
      });

      const averageAttendance = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 82;
      const overdueAssignments = assignments.filter(a => a.status !== 'done' && new Date(a.dueDate) < new Date());
      const backlogRisk = overdueAssignments.length > 2 ? 88 : overdueAssignments.length > 0 ? 48 : 12;

      const pastWeekSessions = studySessions.filter(s => {
        const diffTime = Math.abs(Date.now() - new Date(s.date).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      });

      const pomodoros = pastWeekSessions.filter(s => s.mode === 'pomodoro');
      const pomodoroConsistency = pastWeekSessions.length > 0 ? Math.round((pomodoros.length / pastWeekSessions.length) * 100) : 85;

      const weeklyMinutes = pastWeekSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
      const productivityScore = Math.min(100, Math.round((weeklyMinutes / 420) * 100));

      const syncLogs: SyncLog[] = [
        { id: '1', timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(), message: 'Google Calendar multi-way sync executed successfully (Simulated).' },
        { id: '2', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), message: 'AI Dynamic Rescheduler audited future session alignments.' },
        { id: '3', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), message: 'Self-adjusting scheduler compiled new revision timeline.' }
      ];

      return {
        averageAttendance,
        backlogRisk,
        productivityScore,
        pomodoroConsistency,
        subjectAttendance,
        syncLogs
      };
    }
  },

  async generateAcademicPlan(planParams: { subjectId: string; examDate: string; chapters: string[]; confidenceLevel: number; studyHoursGoal: number; semesters?: any[] }): Promise<{ success: boolean; data: ScheduledSession[]; adjustments: any[]; syncStats: any }> {
    try {
      const response = await API.post('/scheduler/generate-plan', planParams);
      return response.data;
    } catch (error) {
      const subjects = getLocalData<Subject[]>('studiq_subjects');
      const subject = subjects.find(s => s.id === planParams.subjectId);
      if (!subject) throw new Error('Subject not found offline');

      const adjustments: any[] = [];
      let adjustedHoursGoal = planParams.studyHoursGoal;
      let focusSprintDuration = 45;
      let blockDensity = 1;
      let isPomodoroSprint = false;
      let preferMorningSlots = false;
      let useProgressiveRampUp = false;
      let hasProactiveAssignmentBlock = false;
      let nearAssignmentObj: any = null;

      // 1. Attendance-Driven Priority Override
      const attendance = getLocalData<Attendance[]>('studiq_attendance');
      const attDoc = attendance.find(a => a.subjectId === planParams.subjectId);
      if (attDoc) {
        const attended = attDoc.records.filter(r => r.status === 'attended').length;
        const missed = attDoc.records.filter(r => r.status === 'missed').length;
        const total = attended + missed;
        if (total > 0) {
          const attendancePct = (attended / total) * 100;
          if (attendancePct < 75) {
            adjustedHoursGoal = Math.round(adjustedHoursGoal * 1.25);
            blockDensity += 0.25;
            preferMorningSlots = true;
            adjustments.push({
              type: 'attendance',
              label: 'Attendance Priority Adjustment',
              desc: `Subject attendance is critically low at ${Math.round(attendancePct)}% (< 75%). Expanded prep hours by 25% and scheduled early morning slots for optimal cognitive retention.`
            });
          }
        }
      }

      // 2. Weak Subject & Performance Trends (Confidence Rating)
      if (planParams.confidenceLevel <= 2) {
        adjustedHoursGoal = Math.round(adjustedHoursGoal * 1.2);
        blockDensity += 0.2;
        adjustments.push({
          type: 'confidence',
          label: 'Adaptive Workload Balance',
          desc: `Subject confidence rated ${planParams.confidenceLevel}/5. Increased study roadmap density by 20% for deeper, spaced revision.`
        });
      }

      // Quantitative/systems category analysis
      const isChallengingSubject = /math|calc|alg|syst|quant|phys|chem|code/i.test(subject.name || '');
      if (isChallengingSubject && planParams.confidenceLevel <= 3) {
        adjustedHoursGoal = Math.round(adjustedHoursGoal * 1.1);
        blockDensity += 0.1;
        adjustments.push({
          type: 'confidence',
          label: 'Adaptive Workload Balance',
          desc: `Target course "${subject.name}" identified in heavy quantitative/technical cluster. Increased study coverage density by 10%.`
        });
      }

      // Gazette / Semester trends
      const semesters = planParams.semesters || [];
      if (semesters && semesters.length >= 2) {
        const sortedSemesters = [...semesters].sort((a, b) => a.name.localeCompare(b.name));
        const latestSem = sortedSemesters[sortedSemesters.length - 1];
        const prevSem = sortedSemesters[sortedSemesters.length - 2];
        if (latestSem.sgpa < prevSem.sgpa) {
          adjustedHoursGoal = Math.round(adjustedHoursGoal * 1.15);
          blockDensity += 0.15;
          adjustments.push({
            type: 'trend',
            label: 'Adaptive Workload Balance',
            desc: `Academic Gazette records indicate a GPA deceleration from ${prevSem.sgpa} to ${latestSem.sgpa}. Injected high-density revision checkpoints (+15% study hours) to reverse the performance drift.`
          });
        }
      }

      // 3. Burnout & Productivity Score Adaptability (Recent Productivity Score)
      const studySessions = getLocalData<StudySession[]>('studiq_study');
      const pastWeekSessions = studySessions.filter(s => {
        const diffTime = Math.abs(Date.now() - new Date(s.date).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      });
      const weeklyMinutes = pastWeekSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
      const productivityScore = Math.min(100, Math.round((weeklyMinutes / 420) * 100));

      if (productivityScore < 40 && pastWeekSessions.length > 0) {
        focusSprintDuration = 30;
        adjustedHoursGoal = Math.max(4, Math.round(adjustedHoursGoal * 0.8));
        adjustments.push({
          type: 'productivity',
          label: 'Focus Recovery Window',
          desc: `Recent productivity index is critically low (${productivityScore}%). Activated fatigue safety guard: capped total workload (-20%) and set study blocks to 30m maximum to avoid cognitive exhaustion.`
        });
      }

      // 4. Study Streak Consistency (Progressive Habit Ramp-up)
      const user = getLocalData<UserProfile>('studiq_user');
      const studyStreak = user.stats ? user.stats.studyStreak : 0;
      if (studyStreak <= 1) {
        useProgressiveRampUp = true;
        adjustments.push({
          type: 'streak',
          label: 'Recovery Buffer',
          desc: `Active study streak is erratic (${studyStreak} days). Applied cognitive staging: first 3 days are scheduled as short 25m habit-builder blocks, scaling up to full focus blocks as momentum builds.`
        });
      }

      // 5. Pomodoro History (Focus Cycle Matching)
      const pomodoroSessions = pastWeekSessions.filter(s => s.mode === 'pomodoro');
      const pomodoroRatio = pastWeekSessions.length > 0 ? (pomodoroSessions.length / pastWeekSessions.length) : 0;
      if (pomodoroRatio < 0.4 && pastWeekSessions.length > 2) {
        isPomodoroSprint = true;
        focusSprintDuration = 25;
        adjustments.push({
          type: 'pomodoro',
          label: 'Recovery Buffer',
          desc: 'Inconsistent deep-work focus logged. Switched blocks to structured 25m Pomodoro sprints with built-in breaks to improve execution rates.'
        });
      }

      // 6. Assignment Deadline Integration
      const assignments = getLocalData<Assignment[]>('studiq_assignments');
      const subjectAssignments = assignments.filter(a => a.subjectId && a.subjectId === planParams.subjectId && a.status !== 'done');
      const nearAssignments = subjectAssignments.filter(a => {
        const due = new Date(a.dueDate);
        const diff = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      });

      if (nearAssignments.length > 0) {
        hasProactiveAssignmentBlock = true;
        nearAssignmentObj = nearAssignments[0];
        adjustments.push({
          type: 'assignment',
          label: 'Adaptive Workload Balance',
          desc: `Detected upcoming assignment "${nearAssignmentObj.title}" due soon. Automatically pre-allocated dedicated 1-hour prep blocks in advance of deadlines.`
        });
      }

      // 7. Backlog Risk Probability
      const overdueAssignments = assignments.filter(a => a.status !== 'done' && new Date(a.dueDate).getTime() < Date.now());
      if (overdueAssignments.length > 0) {
        blockDensity += 0.15;
        adjustments.push({
          type: 'backlog',
          label: 'Recovery Buffer',
          desc: `${overdueAssignments.length} overdue task(s) detected. Injected dedicated backlog resolution sprints and compressed scheduler gaps.`
        });
      }

      // --- ALGORITHM: TIME SLOT DISTRIBUTION ---
      const sessionsToCreate: ScheduledSession[] = [];
      const examDateObj = new Date(planParams.examDate);
      const startRange = new Date();
      startRange.setDate(startRange.getDate() + 1);
      startRange.setHours(9, 0, 0, 0);

      const daysAvailable = Math.max(1, Math.ceil((examDateObj.getTime() - startRange.getTime()) / (1000 * 60 * 60 * 24)));
      const sessionsCount = Math.ceil((adjustedHoursGoal * 60) / focusSprintDuration);
      
      const baseSessionsPerDay = Math.ceil(sessionsCount / daysAvailable);
      const sessionsPerDay = Math.ceil(baseSessionsPerDay * blockDensity);

      let currentDay = new Date(startRange);
      let createdCount = 0;
      const startHour = preferMorningSlots ? 8 : 10;
      const maxHour = 21;

      for (let d = 0; d < daysAvailable && createdCount < sessionsCount; d++) {
        let currentHour = startHour;
        const isInitialPeriod = d < 3;

        for (let s = 0; s < sessionsPerDay && createdCount < sessionsCount; s++) {
          const currentSprintDuration = (useProgressiveRampUp && isInitialPeriod) ? 25 : focusSprintDuration;

          const blockStart = new Date(currentDay);
          blockStart.setHours(currentHour, 0, 0, 0);

          const blockEnd = new Date(blockStart);
          blockEnd.setMinutes(blockEnd.getMinutes() + currentSprintDuration);

          const chapterIndex = createdCount % (planParams.chapters.length || 1);
          const chapterName = planParams.chapters[chapterIndex] || 'General Review';

          let title = '';
          let desc = '';
          if (isPomodoroSprint) {
            title = `🍅 Pomodoro Sprint: ${subject.name}`;
            desc = `Focus Sprint on "${chapterName}" (${currentSprintDuration}m focus + 5m break). [Simulated AI Override]`;
          } else {
            title = `⚡ AI Revision: ${subject.name}`;
            desc = `Deep Work session: revision on "${chapterName}" (${currentSprintDuration}m). Optimized based on behavior & analytics.`;
          }

          sessionsToCreate.push({
            id: 'sess-' + Date.now() + '-' + createdCount,
            subjectId: subject.id,
            title,
            description: desc,
            startTime: blockStart.toISOString(),
            endTime: blockEnd.toISOString(),
            status: 'scheduled',
            googleCalendarEventId: 'mock-evt-' + Math.random().toString(36).substr(2, 9),
            isAiGenerated: true,
            rescheduleCount: 0
          });

          createdCount++;
          const gapHours = blockDensity > 1.2 ? 1 : 2;
          currentHour += Math.ceil(currentSprintDuration / 60) + gapHours;
          if (currentHour >= maxHour) break;
        }
        currentDay.setDate(currentDay.getDate() + 1);
      }

      // Injected Proactive Assignment Prep Block
      if (hasProactiveAssignmentBlock && nearAssignmentObj) {
        const assignmentDueDate = new Date(nearAssignmentObj.dueDate);
        const prepDate = new Date(assignmentDueDate);
        prepDate.setDate(prepDate.getDate() - 1);
        prepDate.setHours(16, 0, 0, 0);

        if (prepDate.getTime() > Date.now() && prepDate.getTime() < examDateObj.getTime()) {
          sessionsToCreate.push({
            id: 'sess-prep-' + Date.now(),
            subjectId: subject.id,
            title: `📝 Assignment Prep: ${subject.name}`,
            description: `Dedicated proactive revision sprint to complete assignment "${nearAssignmentObj.title}" ahead of deadline.`,
            startTime: prepDate.toISOString(),
            endTime: new Date(prepDate.getTime() + 60 * 60 * 1000).toISOString(),
            status: 'scheduled',
            googleCalendarEventId: 'mock-evt-prep',
            isAiGenerated: true,
            rescheduleCount: 0
          });
        }
      }

      // Injected Backlog resolution block if backlog is high
      if (overdueAssignments.length > 0) {
        const backlogStart = new Date(startRange);
        backlogStart.setHours(17, 0, 0, 0);
        const backlogEnd = new Date(backlogStart);
        backlogEnd.setHours(18, 0, 0, 0);

        sessionsToCreate.push({
          id: 'sess-backlog-' + Date.now(),
          subjectId: null,
          title: '🧹 AI Backlog Mitigation',
          description: `Dedicated clearing sprint for overdue tasks: "${overdueAssignments[0].title}".`,
          startTime: backlogStart.toISOString(),
          endTime: backlogEnd.toISOString(),
          status: 'scheduled',
          googleCalendarEventId: 'mock-evt-backlog',
          isAiGenerated: true,
          rescheduleCount: 0
        });
      }

      const allSessions = getLocalData<ScheduledSession[]>('studiq_scheduled_sessions');
      const remainingSessions = allSessions.filter(s => s.subjectId !== planParams.subjectId);
      const mergedSessions = [...remainingSessions, ...sessionsToCreate];
      setLocalData('studiq_scheduled_sessions', mergedSessions);

      const examPlans = getLocalData<ExamPlan[]>('studiq_exam_plans');
      const existingIndex = examPlans.findIndex(p => p.subjectId === planParams.subjectId);
      const mockExamPlan: ExamPlan = {
        id: 'exam-' + Date.now(),
        subjectId: planParams.subjectId,
        examDate: planParams.examDate,
        chapters: planParams.chapters,
        confidenceLevel: planParams.confidenceLevel,
        studyHoursGoal: planParams.studyHoursGoal,
        isAiOptimized: true
      };
      if (existingIndex !== -1) {
        examPlans[existingIndex] = mockExamPlan;
      } else {
        examPlans.push(mockExamPlan);
      }
      setLocalData('studiq_exam_plans', examPlans);

      const googleOauth = getLocalData<any>('studiq_google_oauth');
      googleOauth.isConnected = true;
      googleOauth.email = 'student.studiq@gmail.com';
      setLocalData('studiq_google_oauth', googleOauth);

      return {
        success: true,
        data: sessionsToCreate,
        adjustments,
        syncStats: {
          isConnected: true,
          isSimulated: true,
          syncSuccess: true,
          syncedCount: sessionsToCreate.length
        }
      };
    }
  },

  async rescheduleMissedSessions(): Promise<{ success: boolean; message: string; rescheduledCount: number; details: any[] }> {
    try {
      const response = await API.post('/scheduler/reschedule-missed');
      return response.data;
    } catch (error) {
      const sessions = getLocalData<ScheduledSession[]>('studiq_scheduled_sessions');
      const missed = sessions.filter(s => s.status === 'missed');
      if (missed.length === 0) {
        return { success: true, message: 'No missed sessions detected.', rescheduledCount: 0, details: [] };
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const details: any[] = [];
      let resolvedCount = 0;

      const futureSessions = sessions.filter(s => new Date(s.startTime) >= tomorrow);

      missed.forEach(session => {
        let duration = Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60));
        let foundSlot = false;

        for (let dayOffset = 0; dayOffset < 14 && !foundSlot; dayOffset++) {
          const testDay = new Date(tomorrow);
          testDay.setDate(testDay.getDate() + dayOffset);

          const possibleHours = [15, 17, 19];
          for (const hr of possibleHours) {
            const testStart = new Date(testDay);
            testStart.setHours(hr, 0, 0, 0);
            const testEnd = new Date(testStart);
            testEnd.setMinutes(testEnd.getMinutes() + duration);

            const isOverlapping = futureSessions.some(fs => {
              const fsStart = new Date(fs.startTime);
              const fsEnd = new Date(fs.endTime);
              return (testStart >= fsStart && testStart < fsEnd) ||
                     (testEnd > fsStart && testEnd <= fsEnd);
            });

            if (!isOverlapping) {
              session.startTime = testStart.toISOString();
              session.endTime = testEnd.toISOString();
              session.status = 'scheduled';
              session.rescheduleCount += 1;

              futureSessions.push(session);
              details.push({
                sessionId: session.id,
                title: session.title,
                newDate: testStart.toLocaleDateString(),
                newTime: testStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              });

              foundSlot = true;
              resolvedCount++;
              break;
            }
          }
        }
      });

      setLocalData('studiq_scheduled_sessions', sessions);

      return {
        success: true,
        message: `Successfully rescheduled ${resolvedCount} missed session(s) offline.`,
        rescheduledCount: resolvedCount,
        details
      };
    }
  }
};
