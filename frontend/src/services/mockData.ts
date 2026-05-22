export interface UserSettings {
  theme: 'light' | 'dark' | 'cyberpunk';
  targetAttendance: number;
  dailyStudyGoalMinutes: number;
}

export interface UserStats {
  studyStreak: number;
  lastActiveDate: string;
  points: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  profilePicture: string;
  settings: UserSettings;
  stats: UserStats;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  professor: string;
  credits: number;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: 'attended' | 'missed' | 'cancelled';
  note?: string;
}

export interface Attendance {
  subjectId: string;
  records: AttendanceRecord[];
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Assignment {
  id: string;
  subjectId: string | null;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  subtasks: Subtask[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface Note {
  id: string;
  subjectId: string | null;
  title: string;
  content: string;
  isPinned: boolean;
  tags: string[];
  aiSummary?: string;
  flashcards?: Flashcard[];
  updatedAt: string;
}

export interface StudySession {
  id: string;
  subjectId: string | null;
  durationMinutes: number;
  mode: 'pomodoro' | 'deep_work';
  date: string;
  notes?: string;
}

export const initialUserProfile: UserProfile = {
  id: "mock-user-1",
  username: "SarahConnor",
  email: "demo@studiq.com",
  profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  settings: {
    theme: "dark",
    targetAttendance: 75,
    dailyStudyGoalMinutes: 60
  },
  stats: {
    studyStreak: 5,
    lastActiveDate: new Date().toISOString(),
    points: 420
  }
};

export const initialSubjects: Subject[] = [
  {
    id: "sub-1",
    name: "Computer Architecture & Systems",
    code: "CS-302",
    color: "#6366f1", // Indigo
    professor: "Dr. Evelyn Vance",
    credits: 4
  },
  {
    id: "sub-2",
    name: "Advanced Algorithms & Analysis",
    code: "CS-310",
    color: "#a855f7", // Purple
    professor: "Prof. Marcus Chen",
    credits: 4
  },
  {
    id: "sub-3",
    name: "Quantum Physics Principles",
    code: "PHY-285",
    color: "#ec4899", // Pink
    professor: "Dr. Robert Thorne",
    credits: 3
  },
  {
    id: "sub-4",
    name: "Interaction Design & UX Frameworks",
    code: "UX-104",
    color: "#06b6d4", // Cyan
    professor: "Prof. Chloe Sterling",
    credits: 3
  }
];

export const initialAttendance: Attendance[] = [
  {
    subjectId: "sub-1",
    records: [
      { id: "att-1-1", date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), status: "attended", note: "Regular lecture" },
      { id: "att-1-2", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: "attended", note: "Regular lecture" },
      { id: "att-1-3", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), status: "attended", note: "Lab quiz day" },
      { id: "att-1-4", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: "missed", note: "Had dental appointment" },
      { id: "att-1-5", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: "attended", note: "Regular lecture" },
      { id: "att-1-6", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: "attended", note: "Seminar presentation" }
    ]
  },
  {
    subjectId: "sub-2",
    records: [
      { id: "att-2-1", date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), status: "missed", note: "Overslept" },
      { id: "att-2-2", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: "attended", note: "Dynamic programming lecture" },
      { id: "att-2-3", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), status: "missed", note: "Transit delays" },
      { id: "att-2-4", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: "attended", note: "Graph theories segment" },
      { id: "att-2-5", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: "missed", note: "Sick leave" },
      { id: "att-2-6", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: "attended", note: "Lab workshop" }
    ]
  },
  {
    subjectId: "sub-3",
    records: [
      { id: "att-3-1", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: "attended" },
      { id: "att-3-2", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), status: "attended" },
      { id: "att-3-3", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: "attended" },
      { id: "att-3-4", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: "attended" }
    ]
  },
  {
    subjectId: "sub-4",
    records: [
      { id: "att-4-1", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: "attended", note: "Figma training" },
      { id: "att-4-2", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), status: "attended" },
      { id: "att-4-3", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: "missed", note: "Interview conflict" },
      { id: "att-4-4", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: "attended" },
      { id: "att-4-5", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: "attended" }
    ]
  }
];

export const initialAssignments: Assignment[] = [
  {
    id: "task-1",
    subjectId: "sub-1",
    title: "Design 8-Bit CPU in Logisim",
    description: "Complete the control unit wiring and execute simple subtraction loops.",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "high",
    status: "in_progress",
    subtasks: [
      { id: "subt-1-1", title: "Wire instruction register", isCompleted: true },
      { id: "subt-1-2", title: "Map control logic ROM", isCompleted: false },
      { id: "subt-1-3", title: "Write CPU diagnostic report", isCompleted: false }
    ]
  },
  {
    id: "task-2",
    subjectId: "sub-2",
    title: "Red-Black Trees Analysis",
    description: "Solve problem set 3 on tree rotations and balanced node deletion costs.",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "high",
    status: "todo",
    subtasks: [
      { id: "subt-2-1", title: "Proof-of-work on single rotation cost bounds", isCompleted: false },
      { id: "subt-2-2", title: "Write implementation functions in Python", isCompleted: false }
    ]
  },
  {
    id: "task-3",
    subjectId: "sub-3",
    title: "Double-slit Interference Report",
    description: "Review physical lab results, plot waveform intensity graphs, and submit findings.",
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "medium",
    status: "todo",
    subtasks: []
  },
  {
    id: "task-4",
    subjectId: "sub-4",
    title: "Heuristic Review for Canvas platform",
    description: "Apply Nielsen’s 10 usability heuristics, list UI pain points, and provide screen re-draw proposals.",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "low",
    status: "review",
    subtasks: [
      { id: "subt-4-1", title: "Perform user testing of canvas dashboard", isCompleted: true },
      { id: "subt-4-2", title: "Assemble PDF review slides", isCompleted: true }
    ]
  },
  {
    id: "task-5",
    subjectId: "sub-2",
    title: "Time Complexity Exercises",
    description: "Submit solutions to Big-O recurrence relations in homework 1.",
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "medium",
    status: "done",
    subtasks: []
  }
];

export const initialNotes: Note[] = [
  {
    id: "note-1",
    subjectId: "sub-1",
    title: "Cache Mapping Techniques",
    content: `# Cache Architecture Notes

## Direct Mapped Cache
- Each memory block maps to exactly one cache line.
- Index = (Block Address) mod (Number of Cache Lines)
- High conflict miss rate when alternate addresses compete for the same slot.

## Fully Associative Cache
- Blocks can reside in any slot.
- Requires parallel tag match checks.
- Zero index conflicts, but complex/expensive hardware.

## Set-Associative Cache
- N-Way set associative combines both styles.
- Index matches set, then tag searches are fully associative within that set.
- Standard sweet spot: 4-Way or 8-Way associative layouts.`,
    isPinned: true,
    tags: ["Hardware", "Hardware Caches"],
    aiSummary: `### 🤖 STUDIQ AI Summary
- **Primary Topic**: Cache mapping configurations in computer hardware.
- **Key Concepts**: Direct, Fully Associative, and Set-Associative memory caching.
- **Rules**: Direct caching has simple lookups but high miss conflict risk, associative caching requires complex hardware tag checks, and set-associative offers the optimal trade-off.`,
    flashcards: [
      { id: "f-1-1", question: "What formula is used to calculate set index in direct-mapped caches?", answer: "Index = (Block Address) mod (Number of lines)" },
      { id: "f-1-2", question: "What is the primary drawback of direct mapping?", answer: "Extreme conflict misses when two memory blocks compete for the same line address." }
    ],
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "note-2",
    subjectId: "sub-2",
    title: "Master Theorem for Recursion",
    content: `# Master Recurrence Relations

Solving recurrence relations of style:
T(n) = a * T(n/b) + f(n)

## Three Primary Cases:
1. **Case 1**: If f(n) grows strictly slower than n^log_b(a). Complexity: O(n^log_b(a)).
2. **Case 2**: If f(n) matches n^log_b(a) growth. Complexity: O(n^log_b(a) * log n).
3. **Case 3**: If f(n) grows strictly faster than n^log_b(a), and regularity checks pass. Complexity: O(f(n)).`,
    isPinned: false,
    tags: ["Algorithms", "Complexity Math"],
    updatedAt: new Date().toISOString()
  }
];

export const initialStudySessions: StudySession[] = [
  {
    id: "sess-1",
    subjectId: "sub-1",
    durationMinutes: 50,
    mode: "deep_work",
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Constructed the Logisim base layout"
  },
  {
    id: "sess-2",
    subjectId: "sub-2",
    durationMinutes: 25,
    mode: "pomodoro",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Read DP examples"
  },
  {
    id: "sess-3",
    subjectId: "sub-3",
    durationMinutes: 60,
    mode: "deep_work",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Finished calculations for slits gap intensity bounds"
  },
  {
    id: "sess-4",
    subjectId: "sub-1",
    durationMinutes: 45,
    mode: "pomodoro",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Configured ALU control pathways"
  },
  {
    id: "sess-5",
    subjectId: "sub-2",
    durationMinutes: 30,
    mode: "pomodoro",
    date: new Date().toISOString(),
    notes: "Wrote python scripts for RB-Tree balance rotations"
  }
];
