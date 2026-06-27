# 🛡️ Deadline Guardian AI

> **High-Performance Workspace Defensive Copilot** — Defending your target milestones against compressed timelines using multi-layered Gemini analysis, procedural focus-shield soundscapes, and native Google Cloud & Calendar synchronization.

---

## 🎯 Problem Statement & Core Mission

### **The Last-Minute Life Saver**
Students, professionals, and entrepreneurs frequently derail on deadlines, assignments, and vital commitments. Traditional productivity tools rely on passive push notifications that are easily dismissed, offering no concrete action when workloads collide.

**Deadline Guardian AI** transforms passive checklist management into an active, intelligent, defensive framework. It treats commitments as an **interconnected portfolio**, dynamically predicting schedule bottlenecks, surfacing underlying risks, and orchestrating step-by-step mitigation plans using structural Gemini generative schemas.

---

## ✨ Features Breakdown

### 🤖 Generative AI Copilot (Powered by `@google/genai`)
- **AI Subtask Generation**: Dynamically breaks down abstract title objectives into 3–7 atomic steps with specific estimated time bounds.
- **Intelligent Priority Recommendation**: Reviews entire task portfolios to determine realistic threat matrices, highlighting a reserved **Guardian Priority** for critical items.
- **Dynamic Risk Score Diagnostics**: Factors task constraints, total active checklists, and bedtime limits to calculate a predictive schedule threat score.
- **Tactical Daily Action Plan**: Assembles a custom hourly timeline from waking hours to sleep time, loaded with structured buffer blocks.
- **Aesthetic Motivational Coach**: Provides adaptive feedback, rendering blunt, high-pressure directives in Dark Theme and encouraging growth coaching in Light Theme.

### 🌌 Immersive Focus Dome
- **Procedural Audio Engine**: Soundscapes generated on the fly using the browser's native **Web Audio API** (e.g., custom white/pink noise, cosmic drones).
- **Zero-Distraction Screen**: Toggleable fullscreen interfaces featuring a real-time UTC/Local dynamic countdown timer clock (12h/24h toggle support).

### ☁️ Secure Cloud Sync & Google Calendar Integration
- **Google Cloud Backups**: Secure user data (tasks, habits, subtasks, daily plan logs) into Google Firebase Firestore via Firebase Auth.
- **Google Calendar Sync**: Actively register commitments directly into the user's real Google Calendar timeline.

### 🛡️ Resilient Failover Protocol
- **Dual-Model Fallback Architecture**: Primary orchestration handled by `gemini-3.5-flash` with graceful degradation to `gemini-3.1-flash-lite` in the event of transient outages or rate limits.

---

## 🏗️ System Architecture

```
                    ┌────────────────────────┐
                    │      Client Browser    │
                    └───────────┬────────────┘
                                │ (HTTP / API Requests)
                                ▼
                    ┌────────────────────────┐
                    │      Vite Dev/Prod     │
                    │   Reverse Proxy / CDN  │
                    └───────────┬────────────┘
                                │
         ┌──────────────────────┴──────────────────────┐
         ▼                                             ▼
┌─────────────────┐                             ┌─────────────────┐
│  Express Server │                             │ Google Firebase │
│ (Port 3000 Node)│                             │ (Auth/Firestore)│
└────────┬────────┘                             └─────────────────┘
         │
         ├──────────────────────────────┐
         ▼                              ▼
┌─────────────────┐            ┌──────────────────┐
│   Gemini API    │            │ Google Calendar  │
│ (v3.5-flash /   │            │   REST Services  │
│  v3.1-lite)     │            │                  │
└─────────────────┘            └──────────────────┘
```

### 📂 Directory Structure Layout

```
├── .env.example                 # Template for required development secrets
├── README.md                    # Professional documentation
├── package.json                 # Node package configuration, script targets, and build configs
├── server.ts                    # Full-stack backend Express configuration & Vite asset middleware
├── firestore.rules              # Secure database read/write schema declarations
├── assets/
│   └── hero_banner.jpg          # Styled high-fidelity hero showcase banner
└── src/
    ├── main.tsx                 # Front-end initialization entrypoint
    ├── App.tsx                  # Main React view controller and master application loop
    ├── types.ts                 # Shared global strictly-typed definitions
    ├── lib/
    │   ├── firebase.ts          # Google Firebase initialization and cloud sync/Calendar API layer
    │   └── audioEngine.ts       # Procedural audio synthesizers built on Web Audio API
    └── components/
        ├── AiMotivationPanel.tsx # Adaptable Gemini motivational coach view
        ├── DailyPlanWidget.tsx  # Dynamic hourly timeline generation panel
        ├── FocusRoom.tsx        # High-immersion deep work fullscreen visualizer
        ├── HabitTracker.tsx     # Custom proactive time-shield checklist widget
        ├── RiskAnalysisWidget.tsx # Full portfolio-level predictive collision widget
        ├── TaskForm.tsx         # User commitment creation & configuration interface
        └── TaskSubtaskManager.tsx # Structured task editor and subtask control dashboard
```

---

## 🛠️ Installation & Setup

### 📋 Prerequisites
- **Node.js** (v18 or higher recommended)
- **NPM** (v9 or higher recommended)
- **Google Cloud Project** with:
  - Google Gemini API key configured
  - Google Calendar OAuth and Firebase Auth enabled

### 🚀 Local Quickstart Instructions

1. **Clone the repository and navigate to the project root:**
   ```bash
   cd deadline-guardian-ai
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Duplicate the `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your active API Credentials:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Launch the development server:**
   ```bash
   npm run dev
   ```
   *Your full-stack application will boot immediately on [http://localhost:3000](http://localhost:3000) using Express with Vite Hot-Reload.*

5. **Generate Production Build Bundle:**
   To bundle static frontend assets and compile the TypeScript backend Express server into a standalone node-executable CommonJS package inside `dist/`:
   ```bash
   npm run build
   ```

6. **Start Compiled Production Server:**
   ```bash
   npm run start
   ```

---

## 🧰 Technologies Used

- **UI Framework**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Build System**: [Vite 6](https://vite.dev/) & [esbuild](https://esbuild.github.io/)
- **Server Framework**: [Express 4](https://expressjs.com/) with native TypeScript runner (`tsx`)
- **Styling Utility**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Orchestration / Motion**: [Motion (formerly Framer Motion)](https://motion.dev/)
- **Aesthetic Iconography**: [Lucide React Icons](https://lucide.dev/)
- **Database / Sync**: [Google Firebase (Authentication & Firestore)](https://firebase.google.com/)
- **Integration API**: [Google Calendar API](https://developers.google.com/calendar)
- **Acoustic Synthesis**: Procedural synthesis built purely with [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## 📽️ Interactive Walkthrough

Here is a typical workflow demonstrating how Deadline Guardian AI coordinates your day:

1. **Portfolio Entry**: Add a complex task (e.g., `"Complete CS Thesis Draft"`). Set estimated completion hours, categories, and bedtime target.
2. **AI-Slicing**: Trigger **AI Checklist Breakdown**. Gemini generates a series of micro-tasks (e.g., literature review, formatting outline) complete with individual duration bounds.
3. **Portfolio Risk Audit**: Access the Risk diagnostics tab. Gemini evaluates this milestone against all other active tasks and highlights potential collisions.
4. **Daily Plan Generation**: Input your wake hours and available free hours. Click **Generate Action Plan**. Gemini constructs an hour-by-hour dynamic schedule mapping buffer blocks automatically.
5. **Deep Work Dome**: Select a priority item, select `"Focus Dome"`, enable the custom cosmic procedurally synthesized white noise, toggle fullscreen, and launch your focus sprint.
6. **Cloud Sync & Calendar Sync**: Log in with Google, backup your tasks securely into the Firestore backend, and push the commitments directly to your real Google Calendar for offline tracking.

---

*Formulating highly structured, bulletproof safety margins. Designed to defend your target milestones.*
