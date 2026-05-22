import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import Note from '../models/Note.js';
import StudySession from '../models/StudySession.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studiq');
    console.log('[Seeder] Connected to MongoDB...');

    // Clear old data
    await User.deleteMany();
    await Subject.deleteMany();
    await Attendance.deleteMany();
    await Assignment.deleteMany();
    await Note.deleteMany();
    await StudySession.deleteMany();
    console.log('[Seeder] Wiped all existing records.');

    // 1. Create Demo User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const demoUser = await User.create({
      username: 'SarahConnor',
      email: 'demo@studiq.com',
      password: hashedPassword,
      profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      settings: {
        theme: 'dark',
        targetAttendance: 75,
        dailyStudyGoalMinutes: 60
      },
      stats: {
        studyStreak: 5,
        lastActiveDate: new Date(),
        points: 420
      }
    });
    console.log('[Seeder] Demo User "demo@studiq.com" (password: "password123") created.');

    // 2. Create Subjects
    const subjects = await Subject.insertMany([
      {
        userId: demoUser._id,
        name: 'Computer Architecture & Systems',
        code: 'CS-302',
        color: '#6366f1', // Indigo
        professor: 'Dr. Evelyn Vance',
        credits: 4
      },
      {
        userId: demoUser._id,
        name: 'Advanced Algorithms & Analysis',
        code: 'CS-310',
        color: '#a855f7', // Purple
        professor: 'Prof. Marcus Chen',
        credits: 4
      },
      {
        userId: demoUser._id,
        name: 'Quantum Physics Principles',
        code: 'PHY-285',
        color: '#ec4899', // Pink
        professor: 'Dr. Robert Thorne',
        credits: 3
      },
      {
        userId: demoUser._id,
        name: 'Interaction Design & UX Frameworks',
        code: 'UX-104',
        color: '#06b6d4', // Cyan
        professor: 'Prof. Chloe Sterling',
        credits: 3
      }
    ]);
    console.log('[Seeder] 4 Color-coded Subjects created.');

    // 3. Create Attendance Logs
    // We will simulate various attendance records to show warning states
    const mockAttendance = [];

    // Subject 0 (Computer Architecture) -> 5 attended, 1 missed (83.3%)
    mockAttendance.push({
      userId: demoUser._id,
      subjectId: subjects[0]._id,
      records: [
        { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), status: 'attended', note: 'Regular lecture' },
        { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'attended', note: 'Regular lecture' },
        { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), status: 'attended', note: 'Lab quiz day' },
        { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), status: 'missed', note: 'Had dental appointment' },
        { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: 'attended', note: 'Regular lecture' },
        { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: 'attended', note: 'Seminar presentation' }
      ]
    });

    // Subject 1 (Advanced Algorithms) -> 3 attended, 3 missed (50%) -> WARNING STATE!
    mockAttendance.push({
      userId: demoUser._id,
      subjectId: subjects[1]._id,
      records: [
        { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), status: 'missed', note: 'Overslept' },
        { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'attended', note: 'Dynamic programming lecture' },
        { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), status: 'missed', note: 'Transit delays' },
        { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), status: 'attended', note: 'Graph theories segment' },
        { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: 'missed', note: 'Sick leave' },
        { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: 'attended', note: 'Lab workshop' }
      ]
    });

    // Subject 2 (Quantum Physics) -> 4 attended, 0 missed (100%)
    mockAttendance.push({
      userId: demoUser._id,
      subjectId: subjects[2]._id,
      records: [
        { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'attended' },
        { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), status: 'attended' },
        { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: 'attended' },
        { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: 'attended' }
      ]
    });

    // Subject 3 (Interaction Design) -> 4 attended, 1 missed (80.0%)
    mockAttendance.push({
      userId: demoUser._id,
      subjectId: subjects[3]._id,
      records: [
        { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'attended', note: 'Figma training' },
        { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), status: 'attended' },
        { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), status: 'missed', note: 'Interview conflict' },
        { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: 'attended' },
        { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: 'attended' }
      ]
    });

    await Attendance.insertMany(mockAttendance);
    console.log('[Seeder] Attendance logs seeded successfully.');

    // 4. Create Assignments (Linear / Jira-style Kanban Cards)
    await Assignment.insertMany([
      {
        userId: demoUser._id,
        subjectId: subjects[0]._id,
        title: 'Design 8-Bit CPU in Logisim',
        description: 'Complete the control unit wiring and execute simple subtraction loops.',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Due in 3 days
        priority: 'high',
        status: 'in_progress',
        subtasks: [
          { title: 'Wire instruction register', isCompleted: true },
          { title: 'Map control logic ROM', isCompleted: false },
          { title: 'Write CPU diagnostic report', isCompleted: false }
        ]
      },
      {
        userId: demoUser._id,
        subjectId: subjects[1]._id,
        title: 'Red-Black Trees Analysis',
        description: 'Solve problem set 3 on tree rotations and balanced node deletion costs.',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
        priority: 'high',
        status: 'todo',
        subtasks: [
          { title: 'Proof-of-work on single rotation cost bounds', isCompleted: false },
          { title: 'Write implementation functions in Python', isCompleted: false }
        ]
      },
      {
        userId: demoUser._id,
        subjectId: subjects[2]._id,
        title: 'Double-slit Interference Report',
        description: 'Review physical lab results, plot waveform intensity graphs, and submit findings.',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Overdue!
        priority: 'medium',
        status: 'todo'
      },
      {
        userId: demoUser._id,
        subjectId: subjects[3]._id,
        title: 'Heuristic Review for Canvas platform',
        description: 'Apply Nielsen’s 10 usability heuristics, list UI pain points, and provide screen re-draw proposals.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: 'low',
        status: 'review',
        subtasks: [
          { title: 'Perform user testing of canvas dashboard', isCompleted: true },
          { title: 'Assemble PDF review slides', isCompleted: true }
        ]
      },
      {
        userId: demoUser._id,
        subjectId: subjects[1]._id,
        title: 'Time Complexity Exercises',
        description: 'Submit solutions to Big-O recurrence relations in homework 1.',
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        status: 'done'
      }
    ]);
    console.log('[Seeder] Kanban Board Tasks seeded successfully.');

    // 5. Create Notes
    await Note.insertMany([
      {
        userId: demoUser._id,
        subjectId: subjects[0]._id,
        title: 'Cache Mapping Techniques',
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
        tags: ['Computer Architecture', 'Revision'],
        aiSummary: `### 🤖 STUDIQ AI Summary
- **Primary Topic**: Cache mapping configurations in computer hardware.
- **Key Concepts**: Direct, Fully Associative, and Set-Associative memory caching.
- **Rules**: Direct caching has simple lookups but high miss conflict risk, associative caching requires complex hardware tag checks, and set-associative offers the optimal trade-off.`,
        flashcards: [
          { question: "What formula is used to calculate set index in direct-mapped caches?", answer: "Index = (Block Address) mod (Number of lines)" },
          { question: "What is the primary drawback of direct mapping?", answer: "Extreme conflict misses when two memory blocks compete for the same line address." }
        ]
      },
      {
        userId: demoUser._id,
        subjectId: subjects[1]._id,
        title: 'Master Theorem for Recursion',
        content: `# Master Recurrence Relations

Solving recurrence relations of style:
T(n) = a * T(n/b) + f(n)

## Three Primary Cases:
1. **Case 1**: If f(n) grows strictly slower than n^log_b(a). Complexity: O(n^log_b(a)).
2. **Case 2**: If f(n) matches n^log_b(a) growth. Complexity: O(n^log_b(a) * log n).
3. **Case 3**: If f(n) grows strictly faster than n^log_b(a), and standard regularity checks pass. Complexity: O(f(n)).`,
        isPinned: false,
        tags: ['Algorithms', 'Math']
      }
    ]);
    console.log('[Seeder] Notion-style Notes seeded successfully.');

    // 6. Create Study Session logs
    await StudySession.insertMany([
      {
        userId: demoUser._id,
        subjectId: subjects[0]._id,
        durationMinutes: 50,
        mode: 'deep_work',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        notes: 'Constructed the Logisim base layout'
      },
      {
        userId: demoUser._id,
        subjectId: subjects[1]._id,
        durationMinutes: 25,
        mode: 'pomodoro',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        notes: 'Read DP examples'
      },
      {
        userId: demoUser._id,
        subjectId: subjects[2]._id,
        durationMinutes: 60,
        mode: 'deep_work',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        notes: 'Finished calculations for slits gap intensity bounds'
      },
      {
        userId: demoUser._id,
        subjectId: subjects[0]._id,
        durationMinutes: 45,
        mode: 'pomodoro',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        notes: 'Configured ALU control pathways'
      },
      {
        userId: demoUser._id,
        subjectId: subjects[1]._id,
        durationMinutes: 30,
        mode: 'pomodoro',
        date: new Date(), // Studied today
        notes: 'Wrote python scripts for RB-Tree balance rotations'
      }
    ]);
    console.log('[Seeder] Study Focus logs seeded successfully.');

    console.log('\n🌟 [Seeder Completed] Seeded successfully! Wiped database, created user "demo@studiq.com" with password "password123", loaded subjects, logs, kanban boards, and notes.');
    process.exit(0);
  } catch (error) {
    console.error(`🚨 [Seeder Error] Failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
