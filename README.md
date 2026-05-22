# 🌌 STUDIQ — Student Productivity Operating System

STUDIQ is a futuristic, startup-grade academic productivity operating system designed for modern students. Combining sleek glassmorphic dashboard aesthetics (inspired by Notion, Linear, and Arc) with fully integrated academic tooling, it serves as a central control center for tracking attendance, managing assignments, drafting markdown lecture notes, and running deep work Pomodoro focus timers.

---

## Key Feature Modules

1. **Authentication Engine**: Dual JWT access/refresh token configurations with encrypted bcrypt security.
2. **SaaS Dashboard Hub**: Productivity curve analytics (Recharts), consecutive study streak gauges, GitHub-style focus heatmaps, and active timeline notification lists.
3. **Attendance ledger & prediction sandbox**: Live course standing counters and the flagship **Smart Survival Calculator** letting users slider-simulate upcoming classes and safe miss ratios.
4. **Kanban card board**: Drag-and-drop task workflow boards (*To Do*, *In Progress*, *Review*, *Done*) utilizing native HTML5 events with checklists and subject badges.
5. **Obsidian notepad workspace**: Dual-pane Markdown editor and previewer with simulated AI bullet concept synthesizers and 3D flipped MCQ study flashcards.
6. **Focus Timer Lounge**: SVG circular progress countdown timer with configurable interval sliders, custom course catalog logging, and HTML5 ambient audio controls (Lofi beats, Rain, Cafe atmosphere).
7. **Achievements System**: Dynamic student gamification rewards. Earn points and unlock consistency badges ("Deep Work Sage", "Consistency Legend") directly syncable to profiles.

---

## Hybrid Sync Engine (Visualized Architecture)

STUDIQ is built with a **Dual-Sync state engine**. The client app defaults to connecting with the Node.js MVC backend. If the MongoDB database is offline or unreachable, the frontend gracefully falls back to a fully responsive, rich local state manager (using `localStorage`). This allows the platform to be fully evaluated immediately, right out-of-the-box, without setting up database instances!

```text
                  [ STUDIQ Client: React + Vite + Tailwind ]
                                      |
                     (Checks Backend Reachability)
                                    / \
                                   /   \
                      [ Reachable ]     [ Unreachable / Offline ]
                           /                     \
            [ Express API Server ]          [ LocalStorage Sync Engine ]
                   |                                 |
            [ Mongoose ODM ]                 [ Offline Seed Models ]
                   |
            [ MongoDB Database ]
```

---

## Core Folder Architecture

```text
STUDIQ/
├── backend/                       # Express Node.js MVC Server
│   ├── src/
│   │   ├── config/db.js           # Database configurations
│   │   ├── controllers/           # MVC Logic handlers
│   │   ├── middleware/            # JWT validators & rate limiters
│   │   ├── models/                # Mongoose database schemas
│   │   ├── routes/                # API Endpoints mapping
│   │   ├── utils/seeder.js        # Seed mock dataset scripts
│   │   └── index.js               # Application bootstrap
│   ├── .env.example               # Template environment files
│   └── package.json               # Backend dependencies
│
├── frontend/                      # React Client Webapp
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/            # Atomic buttons, inputs, modals
│   │   │   └── layout/            # Sidebar, Header layouts
│   │   ├── context/store.ts       # Central Zustand state manager
│   │   ├── pages/                 # Dashboard, Notes, Timer pages
│   │   ├── services/              # API connections & Mock seeders
│   │   ├── index.css              # Glassmorphic utilities & animations
│   │   ├── App.tsx                # Client Routing pathways
│   │   └── main.tsx               # Client bootstrap
│   ├── tailwind.config.js         # Indigo brand palettes & frames
│   ├── package.json               # Client dependencies
│   └── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** (optional, fallback offline mode active by default)

---

### Step 1: Running the Backend MVC Server

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install server dependencies:
   ```bash
   npm install
   ```
3. Configure your local environment variables. Duplicate `.env.example` into a new `.env` file:
   ```bash
   copy .env.example .env
   ```
   *(Ensure you customize port number and specify your MongoDB connection string).*
4. Seed the database with high-end starter datasets:
   ```bash
   npm run seed
   ```
5. Start the Express server in development hot-reload mode:
   ```bash
   npm run dev
   ```

---

### Step 2: Running the Frontend Client Webapp

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies (bypassing legacy React 19 peer overrides):
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite hot-reloading development server:
   ```bash
   npm run dev
   ```
4. Open the displayed local host URL in your browser (usually `http://localhost:5173`).

---

## Design System Palette & Aesthetics

- **Dark Mode Background**: `#0b0f19` (Deep Slate)
- **Glass Panel Styling**: `bg-slate-900/60 backdrop-blur-md border border-slate-800/80`
- **Neon Highlights**: HSL Tailored Indigo (`bg-brand-500` / `#6366f1`), pink highlights, and cyan highlights.
- **Typography**: Geometric fonts `Outfit` and `Inter` loaded via Google Fonts.

---

## 🛡️ License
Constructed for premium educational and dashboard environments. Fully scalable and production-grade.
