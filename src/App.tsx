import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { 
  Plus, Calendar, ShieldCheck, ShieldAlert, Sparkles, AlertTriangle, 
  CheckCircle2, Clock, CheckSquare, Search, Filter, Loader2, ListTodo, 
  Trash2, Flame, RefreshCcw, BookOpen, Briefcase, Heart, Award, ArrowUpRight,
  Info, ExternalLink, Sun, Moon
} from "lucide-react";
import { motion } from "motion/react";
import { Task, DailyActionPlan, PriorityRecommendation, SubTask } from "./types";
import TaskForm from "./components/TaskForm";
import TaskSubtaskManager from "./components/TaskSubtaskManager";
import { AiMotivationPanel } from "./components/AiMotivationPanel";
import RiskAnalysisWidget from "./components/RiskAnalysisWidget";
import DailyPlanWidget from "./components/DailyPlanWidget";
import { FocusRoom } from "./components/FocusRoom";

// Seed realistic mock data to match the high-density placeholder design immediately
const PRE_POPULATED_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Q4 Financial Audit Prep",
    description: "Audit sample validation, consolidation of internal ledgers, balance statements, and coordinating with independent advisors for regulatory compliance checking.",
    deadline: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toISOString().substring(0, 10);
    })(),
    priority: "critical",
    category: "Work",
    estimatedHours: 12,
    status: "in_progress",
    riskScore: 88,
    riskExplanation: "Critical timelines compressed due to pending partner checks. High concurrent load increases probability of severe resource slippage.",
    suggestedMitigation: "Block out a solid 3-hour period exclusively for local financial ledger validation before midday, and delegate sub-ledger reports to the accounting lead.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    subtasks: [
      { id: "sub-1-1", title: "Consolidate Q4 ledger trials", isCompleted: false, estimatedMinutes: 120 },
      { id: "sub-1-2", title: "Review off-balance adjustments", isCompleted: true, estimatedMinutes: 90 },
      { id: "sub-1-3", title: "Independent advisor audit align", isCompleted: false, estimatedMinutes: 60 },
      { id: "sub-1-4", title: "Certify balance sheet items", isCompleted: false, estimatedMinutes: 45 },
    ]
  },
  {
    id: "task-2",
    title: "API Integration Bridge",
    description: "Resolving backend protocol discrepancies, testing JSON payload sizes, mapping relational entity keys, and locking webhook handshake parameters.",
    deadline: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().substring(0, 10);
    })(),
    priority: "guardian-priority",
    category: "Study",
    estimatedHours: 6,
    status: "in_progress",
    riskScore: 42,
    riskExplanation: "Elevated risk detected due to upstream API schema deprecations. Webhook test logs shows minor protocol mismatch at line 142.",
    suggestedMitigation: "Refactor core handler interface payload mapper and complete local dry-runs under fake network simulation buffers.",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    subtasks: [
      { id: "sub-2-1", title: "Resolve prototype schema mismatch", isCompleted: true, estimatedMinutes: 60 },
      { id: "sub-2-2", title: "Fix core mapper exception error", isCompleted: true, estimatedMinutes: 45 },
      { id: "sub-2-3", title: "Test round-trip latency speeds with mock files", isCompleted: false, estimatedMinutes: 90 },
      { id: "sub-2-4", title: "Deploy secure credential store parameters", isCompleted: false, estimatedMinutes: 30 },
    ]
  },
  {
    id: "task-3",
    title: "Client Branding Presentation Deck",
    description: "Designing high-fidelity user flow wireframes, writing case-study takeaways, and export custom vector assets.",
    deadline: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().substring(0, 10);
    })(),
    priority: "low",
    category: "Other",
    estimatedHours: 4,
    status: "completed",
    riskScore: 12,
    riskExplanation: "Risk is nominal. Creative assets have been fully engineered and exported. No active delays predicted.",
    suggestedMitigation: "Schedule standard 15-minute alignment check with the creative operations team to review typography layout adjustments.",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    subtasks: [
      { id: "sub-3-1", title: "Draft slide concepts", isCompleted: true, estimatedMinutes: 45 },
      { id: "sub-3-2", title: "Export vector branding elements", isCompleted: true, estimatedMinutes: 45 },
      { id: "sub-3-3", title: "Iterate feedback parameters", isCompleted: true, estimatedMinutes: 65 },
    ]
  }
];

export default function App() {
  const [showIntro, setShowIntro] = useState<boolean>(true);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem("deadline_tasks");
    if (stored) {
      try {
        const decoded = JSON.parse(stored);
        if (decoded && decoded.length > 0) return decoded;
      } catch (e) {
        console.error("Localstorage recovery failed", e);
      }
    }
    return [];
  });

  const [dailyPlan, setDailyPlan] = useState<DailyActionPlan | null>(() => {
    const stored = localStorage.getItem("deadline_daily_plan");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  // UI State Controls
  const [selectedTask, setSelectedTask] = useState<Task | null>(() => {
    return tasks[0] || null;
  });
  const [isNewTaskFormOpen, setIsNewTaskFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "tasks" | "prioritizer" | "daily" | "focus">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);

  // AI Priorities recommendation response state
  const [prioritizing, setPrioritizing] = useState(false);
  const [priorityRecommendations, setPriorityRecommendations] = useState<PriorityRecommendation[]>([]);
  const [priorityError, setPriorityError] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("deadline_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (dailyPlan) {
      localStorage.setItem("deadline_daily_plan", JSON.stringify(dailyPlan));
    } else {
      localStorage.removeItem("deadline_daily_plan");
    }
  }, [dailyPlan]);

  // Check API configuration on load
  useEffect(() => {
    fetch("/api/config-status")
      .then((res) => res.json())
      .then((data) => {
        setApiConfigured(data.isConfigured);
      })
      .catch((err) => {
        console.error("Failed to check server API config", err);
        setApiConfigured(false);
      });
  }, []);

  // Handlers for task mutation
  const handleAddTask = (newTaskInfo: Omit<Task, "id" | "createdAt" | "status" | "subtasks" | "riskScore" | "riskExplanation" | "suggestedMitigation">) => {
    const newTask: Task = {
      ...newTaskInfo,
      id: "task-" + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)),
      status: "pending",
      subtasks: [],
      riskScore: 0,
      riskExplanation: "",
      suggestedMitigation: "",
      createdAt: new Date().toISOString(),
    };

    setTasks(prev => [newTask, ...prev]);
    setSelectedTask(newTask);
    setIsNewTaskFormOpen(false);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    if (selectedTask?.id === id) {
      setSelectedTask(updated[0] || null);
    }
  };

  const triggerConfetti = (isBig: boolean = false) => {
    if (isBig) {
      const duration = 1.8 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.85 },
          colors: ["#6366f1", "#10b981", "#3b82f6", "#ec4899", "#f59e0b"],
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.85 },
          colors: ["#6366f1", "#10b981", "#3b82f6", "#ec4899", "#f59e0b"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } else {
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.8 },
        colors: ["#6366f1", "#10b981", "#3b82f6", "#f59e0b"],
      });
    }
  };

  const handleUpdateSubtasks = (taskId: string, subtasks: SubTask[]) => {
    let becameCompleted = false;
    let subtaskCompleted = false;

    const originalTask = tasks.find(t => t.id === taskId);

    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        // Automatically mark as completed if all subtasks are complete and and any subtask exists
        const total = subtasks.length;
        const comp = subtasks.filter(st => st.isCompleted).length;
        const status: Task["status"] = total > 0 && comp === total ? "completed" : "in_progress";
        
        if (status === "completed" && t.status !== "completed") {
          becameCompleted = true;
        } else {
          const oldCompletedCount = t.subtasks?.filter(st => st.isCompleted).length || 0;
          if (comp > oldCompletedCount) {
            subtaskCompleted = true;
          }
        }

        return {
          ...t,
          subtasks,
          status,
        };
      }
      return t;
    });
    setTasks(updated);

    if (becameCompleted) {
      triggerConfetti(true);
    } else if (subtaskCompleted) {
      triggerConfetti(false);
    }

    // Also update selected task active visual state
    const curSelected = updated.find(t => t.id === taskId);
    if (curSelected) {
      setSelectedTask(curSelected);
    }
  };

  const handleUpdateRisk = (
    taskId: string, 
    riskScore: number, 
    riskExplanation: string, 
    suggestedMitigation: string
  ) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, riskScore, riskExplanation, suggestedMitigation };
      }
      return t;
    });
    setTasks(updated);

    const curSelected = updated.find(t => t.id === taskId);
    if (curSelected) {
      setSelectedTask(curSelected);
    }
  };

  const handleToggleTaskStatus = (taskId: string) => {
    let becameCompleted = false;
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextStatus: Task["status"] = t.status === "completed" ? "in_progress" : "completed";
        if (nextStatus === "completed") {
          becameCompleted = true;
        }
        return { ...t, status: nextStatus };
      }
      return t;
    });
    setTasks(updated);

    if (becameCompleted) {
      triggerConfetti(true);
    }

    const curSelected = updated.find(t => t.id === taskId);
    if (curSelected) {
      setSelectedTask(curSelected);
    }
  };

  // Run collective priority recommendation
  const handleOptimisePriorities = async () => {
    setPrioritizing(true);
    setPriorityError(null);
    try {
      const activeTasks = tasks.filter(t => t.status !== "completed");
      const response = await fetch("/api/prioritize-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: activeTasks,
          currentLocalTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Priority analysis failed.");
      }

      const data = await response.json();
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setPriorityRecommendations(data.recommendations);
      } else {
        throw new Error("Invalid priorities data format from Gemini.");
      }
    } catch (e: any) {
      console.error(e);
      setPriorityError(e.message || "Failed to analyze optimal priorities.");
    } finally {
      setPrioritizing(false);
    }
  };

  // Apply a suggested priority
  const handleApplyPriorityRecommendation = (rec: PriorityRecommendation) => {
    const updated = tasks.map((t) => {
      if (t.id === rec.taskId) {
        return { ...t, priority: rec.recommendedPriority };
      }
      return t;
    });
    setTasks(updated);

    // Filter out from currently display recommendations list
    setPriorityRecommendations(prev => prev.filter(r => r.taskId !== rec.taskId));

    const curSelected = updated.find(t => t.id === selectedTask?.id);
    if (curSelected) {
      setSelectedTask(curSelected);
    }
  };

  const handleApplyAllRecommendations = () => {
    if (priorityRecommendations.length === 0) return;

    const updated = tasks.map((t) => {
      const recommendation = priorityRecommendations.find(r => r.taskId === t.id);
      if (recommendation) {
        return { ...t, priority: recommendation.recommendedPriority };
      }
      return t;
    });

    setTasks(updated);
    setPriorityRecommendations([]);

    const curSelected = updated.find(t => t.id === selectedTask?.id);
    if (curSelected) {
      setSelectedTask(curSelected);
    }
  };

  // Filter & Search Logic
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "All" || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate high-level workspace metrics
  const activeTasksCount = tasks.filter((t) => t.status !== "completed").length;
  const highRiskCount = tasks.filter((t) => t.status !== "completed" && t.riskScore >= 70).length;
  const elevatedRiskCount = tasks.filter((t) => t.status !== "completed" && t.riskScore >= 40 && t.riskScore < 70).length;
  const totalCompletedCount = tasks.filter((t) => t.status === "completed").length;
  
  // Dynamic Workspace Velocity / Productivity Score calculation
  const productivityScore = tasks.length > 0 
    ? Math.round((totalCompletedCount / tasks.length) * 100) 
    : 100;

  // Render priority custom layout elements
  const renderPriorityBadge = (prio: Task["priority"]) => {
    switch (prio) {
      case "guardian-priority":
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] bg-indigo-950 text-indigo-300 font-extrabold border border-indigo-700/60 uppercase tracking-widest animate-pulse">
            🛡️ Guardian Threat
          </span>
        );
      case "critical":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800/60 uppercase tracking-wider font-semibold">
            🔴 Critical
          </span>
        );
      case "high":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-950/80 text-amber-300 border border-amber-805/60 uppercase tracking-wider font-semibold">
            🟠 Alert
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-350 border border-slate-700/60 font-semibold">
            🔵 Normal
          </span>
        );
      case "low":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 font-semibold">
            🟡 Flexible
          </span>
        );
    }
  };

  // Convert category string into custom tags / colors
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Work":
        return <Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      case "Study":
        return <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case "Personal":
        return <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      default:
        return <Award className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
    }
  };

  if (showIntro) {
    return (
      <div id="guardian-intro-container" className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans flex flex-col justify-between p-6 sm:p-10 md:p-16 lg:p-20 relative select-none">
        
        {/* Top Floating Theme Controls */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <button
            onClick={() => setIsDarkMode(prev => !prev)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition cursor-pointer text-slate-400 hover:text-slate-200"
            title={isDarkMode ? "Toggle Light Theme" : "Toggle Dark Theme"}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>

        {/* Outer container */}
        <div className="max-w-4xl mx-auto w-full my-auto space-y-12 py-8">
          
          {/* Header section with brand info */}
          <header className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40 border border-indigo-400/30">
              <ShieldCheck className="w-9 h-9 text-white animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-300 to-slate-100 bg-clip-text text-transparent">
                Deadline Guardian AI
              </h1>
              <p className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
                Enterprise AI Scheduling & Delay Sentinel Portal
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Deadline Guardian AI is a high-performance workspace designed to defend your target milestones. Actively parsing task values, estimating completion times, and loading Google Gemini telemetry, it acts as a digital copilot ensuring you navigate compressed schedules safely.
            </p>
          </header>

          {/* Key Domains section */}
          <section className="space-y-4">
            <h2 className="text-xs font-mono tracking-widest text-indigo-400 uppercase text-center font-bold">
              -- Core System Domains --
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/40 transition">
                <div className="w-8 h-8 rounded bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400 mb-3">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Sentinel Diagnostics</h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Tracks individual work pressures, mapping dates left, subtask completion counts, and historical slippages into live threat factors.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-teal-500/40 transition">
                <div className="w-8 h-8 rounded bg-teal-950/60 border border-teal-800/40 flex items-center justify-center text-teal-400 mb-3">
                  <ListTodo className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Slicing Checklist</h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Connects to advanced Gemini reasoning paths to break down complex, multi-day milestones into concrete, micro-action checklists.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-amber-500/40 transition">
                <div className="w-8 h-8 rounded bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400 mb-3">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Daily Buffer Block</h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Synthesizes active targets into single chronological schedules matched specifically to bedtime boundaries and productive hour thresholds.
                </p>
              </div>
            </div>
          </section>

          {/* Step-by-Step App Walkthrough Guide */}
          <section className="space-y-4">
            <h2 className="text-xs font-mono tracking-widest text-indigo-400 uppercase text-center font-bold">
              -- Operation Walkthrough --
            </h2>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-inner shadow-slate-950/10">
              <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
                <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Enlist Your Commitments</h4>
                  <p className="text-[11px] text-slate-400">
                    Tap the <strong className="text-indigo-455">New Commitment</strong> button to declare a task's title, approximate hours needed, and critical date limits.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
                <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Settle AI Checklist Targets</h4>
                  <p className="text-[11px] text-slate-400">
                    Click any commitment in your active guide list, then inside the right-hand inspection terminal, run <strong className="text-indigo-455">AI Generate Subtasks</strong> to auto-schedule micro-blocks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
                <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Rebalance Priorities Collectively</h4>
                  <p className="text-[11px] text-slate-400">
                    Navigate to the <strong className="text-indigo-455">Optimal Prioritizer</strong> tab. Run collective Gemini checkmarks to dynamically correct overlapping deliverables.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  4
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Construct a Chronological Path</h4>
                  <p className="text-[11px] text-slate-400">
                    Flip over to the <strong className="text-indigo-455">Daily Schedule Block</strong> tab to translate targets into clean chronological hours, ensuring buffer rests protect physical bedtime safety margins.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* About Me Section */}
          <section className="bg-indigo-950/10 border border-indigo-800/20 rounded-xl p-5 text-center sm:text-left">
            <h3 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center sm:justify-start justify-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-450" />
              SYSTEM ARCHITECT DOSSIER
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Forged by <strong className="text-slate-200">Safwan</strong>, an aspiring code marshal and mechanical keyboard builder operating inside terminal windows. Developed between late-night debug sessions and double espressos to eliminate creeping timeline slippages once and for all. Certified 100% procrastination-shielded.
            </p>
          </section>

          {/* Action trigger button */}
          <div className="flex flex-col items-center pt-2">
            <button
              onClick={() => {
                setShowIntro(false);
              }}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] border border-indigo-500/20 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer shadow-lg shadow-indigo-950 flex items-center gap-2"
            >
              <span>ESTABLISH CONNECT & GET STARTED</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <span className="text-[9px] text-slate-500 uppercase tracking-normal mt-3 font-mono">
              By entering, you initiate active timeline tracking sentinel systems
            </span>
          </div>

        </div>

        {/* Footer info brand */}
        <footer className="text-center text-[10px] text-slate-600 uppercase font-mono tracking-widest mt-8">
          Deadline Guardian AI - Core Sentinel Build v1.02
        </footer>
      </div>
    );
  }

  if (activeTab === "focus") {
    return (
      <FocusRoom
        tasks={tasks}
        motivation={null}
        isDarkMode={isDarkMode}
        onExit={() => setActiveTab("dashboard")}
      />
    );
  }

  return (
    <div id="guardian-root" className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* SIDEBAR NAVIGATION - Styled to match High Density look perfectly */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0 hidden md:flex">
        
        {/* Brand Header */}
        <div 
          onClick={() => setShowIntro(true)}
          className="p-5 flex items-center gap-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800/40 transition-colors group/brand"
          title="Return to System Onboarding"
        >
          <div className="w-9 h-9 rounded bg-indigo-600 flex items-center justify-center text-white font-bold tracking-tight shadow shadow-indigo-950 border border-indigo-500/50 group-hover/brand:scale-105 transition-transform shrink-0">
            <ShieldCheck className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-md text-slate-100 block leading-tight group-hover/brand:text-indigo-455 transition-colors">
              Deadline Guardian
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              AI Sentinel System
            </span>
          </div>
        </div>

        {/* Tab Controls Navigation */}
        <nav className="flex-1 py-5 px-3.5 space-y-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <button
            onClick={() => { setActiveTab("dashboard"); setSelectedTask(tasks[0] || null); }}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-indigo-600 border border-indigo-500/40 text-white"
                : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <span>Overview & Focus</span>
            {highRiskCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {highRiskCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
              activeTab === "tasks"
                ? "bg-indigo-600 border border-indigo-500/40 text-white"
                : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <span>All Commitments</span>
            <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("prioritizer")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
              activeTab === "prioritizer"
                ? "bg-indigo-600 border border-indigo-500/40 text-white"
                : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <span>Optimal Prioritizer</span>
            <span className="text-[10px] text-amber-400">Gemini</span>
          </button>

          <button
            onClick={() => setActiveTab("daily")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
              activeTab === "daily"
                ? "bg-indigo-600 border border-indigo-500/40 text-white"
                : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <span>Daily Schedule Block</span>
            {dailyPlan && (
              <span className="text-emerald-400 font-mono text-[9px] uppercase font-bold tracking-widest">ACTIVE</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("focus")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
              activeTab === "focus"
                ? "bg-indigo-600 border border-indigo-500/40 text-white"
                : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <span>Focus Room</span>
            <span className="text-[10px] text-indigo-400 font-mono">⚡ LIVE</span>
          </button>
        </nav>

        {/* Footer Monitor Info */}
        <div className="p-4 mt-auto border-t border-slate-800 bg-slate-950/30">
          {apiConfigured === false && (
            <div className="mb-3 bg-red-950/30 border border-red-900/40 rounded-lg p-3 text-[11px] text-red-200">
              <span className="font-bold flex items-center gap-1 text-red-400 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                No API Key Detected
              </span>
              Verify <code className="bg-red-950/60 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code> setup in the Settings Secret box to enable real-time risk diagnostic calculations.
            </div>
          )}

          <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest">
                Gemini Core Shield
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Analyzing {activeTasksCount} commitments in real-time for delay, buffer slippage, and critical milestones.
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER AREA */}
      <main id="workspace-container" className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP STATUS HEADER BAR */}
        <header className="h-16 border-b border-slate-850 bg-slate-900/50 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-md sm:text-lg font-semibold tracking-tight text-slate-100 flex items-center gap-2">
              <span 
                onClick={() => setShowIntro(true)}
                className="md:hidden text-indigo-500 bg-indigo-950/60 p-1.5 rounded-lg border border-indigo-500/20 mr-1 cursor-pointer hover:bg-indigo-900/60 transition-colors"
                title="Return to System Onboarding"
              >
                🛡️
              </span>
              Deadline Guardian Dashboard
            </h1>
            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
            <span className="text-xs text-slate-400 font-mono hidden sm:block">
              {new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })}
            </span>
          </div>

          {/* Quick Metrics display */}
          <div className="flex items-center gap-6">
            
            {/* Quick light/dark theme switch */}
            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 hover:bg-slate-800 transition cursor-pointer text-slate-400 hover:text-slate-200 flex items-center justify-center shrink-0"
              title={isDarkMode ? "Switch to Solar Light Theme" : "Switch to Sentinel Dark Theme"}
              aria-label="Toggle Theme Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                Productive Velocity
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 flex items-center gap-1">
                {productivityScore}%
                <span className="text-[9px] text-slate-500 font-normal">({totalCompletedCount} secured)</span>
              </span>
            </div>

            <button
              onClick={() => setIsNewTaskFormOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer shadow shadow-indigo-900/40"
            >
              <Plus className="w-4 h-4" />
              <span>New Commitment</span>
            </button>
          </div>
        </header>

        {/* MOBILE NAVIGATION TABS (Visible only below screen size medium) */}
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-2 flex items-center justify-around gap-1 shrink-0">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1.5 rounded text-xs tracking-tight font-semibold ${
              activeTab === "dashboard" ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-3 py-1.5 rounded text-xs tracking-tight font-semibold relative ${
              activeTab === "tasks" ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab("prioritizer")}
            className={`px-3 py-1.5 rounded text-xs tracking-tight font-semibold ${
              activeTab === "prioritizer" ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            Prioritizer
          </button>
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-3 py-1.5 rounded text-xs tracking-tight font-semibold ${
              activeTab === "daily" ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            Action Schedule
          </button>
          <button
            onClick={() => setActiveTab("focus")}
            className={`px-3 py-1.5 rounded text-xs tracking-tight font-semibold ${
              activeTab === "focus" ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            Focus Room
          </button>
        </div>

        {/* INNER CONTENT SCROLL CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-6">

          {/* NEW COMMITMENT FORM MODAL OVERLAY */}
          {isNewTaskFormOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="w-full max-w-2xl bg-zinc-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <TaskForm 
                  onAddTask={handleAddTask} 
                  onClose={() => setIsNewTaskFormOpen(false)} 
                />
              </div>
            </div>
          )}

          {/* MAIN GRID VIEW AREA based on Active Tab */}
          
          {/* ==================================================================== */}
          {/* TAB 1: DASHBOARD VIEW */}
          {/* ==================================================================== */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-12 gap-5 auto-rows-min">
              
              {/* Stat Card 1: Workspace Health */}
              <section className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4.5">
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-3.5 flex items-center justify-between">
                  <span>Guard System Health</span>
                  <span className="text-indigo-400 font-mono">active</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-3xl font-bold text-slate-100 font-mono leading-none">
                        {tasks.length}
                      </div>
                      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                        Total Enlisted Commitments
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-rose-500 font-mono leading-none flex items-center gap-1 justify-end">
                        {highRiskCount}
                      </div>
                      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                        Critical Threat Levels
                      </div>
                    </div>
                  </div>

                  {/* Multi-tier custom metric progress bar */}
                  <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-850/80">
                    <div 
                      className="bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300" 
                      style={{ width: `${tasks.length ? (highRiskCount / tasks.length) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-gradient-to-r from-amber-600 to-amber-500 transition-all duration-300" 
                      style={{ width: `${tasks.length ? (elevatedRiskCount / tasks.length) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300" 
                      style={{ width: `${tasks.length ? (totalCompletedCount / tasks.length) * 100 : 0}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
                    <div className="flex items-center gap-1.5 text-stone-300 font-medium">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div> 
                      Critical Threat ({highRiskCount})
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-300 font-medium">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div> 
                      Elevated Risk ({elevatedRiskCount})
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-300 font-medium">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div> 
                      Secured ({totalCompletedCount})
                    </div>
                  </div>
                </div>
              </section>

              {/* Dynamic AI Motivation & Guidance Centerpiece */}
              <div className="col-span-12 lg:col-span-8 flex">
                <AiMotivationPanel 
                  tasks={tasks}
                  productivityScore={productivityScore}
                  highRiskCount={highRiskCount}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* SECTION: COMMITMENTS TABLE & TASK DETAIL SPLIT */}
              <div className="col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-5 mt-2">
                
                {/* TABLE STREAM (LHS) */}
                <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden min-h-[400px]">
                  
                  {/* Table Control Header */}
                  <div className="px-5 py-4 border-b border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-850/20">
                    <div>
                      <h3 className="text-xs uppercase font-extrabold text-slate-350 tracking-wider">
                        Active commitments & Deadline map
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        Showing {filteredTasks.length} out of {tasks.length} total recorded commitments.
                      </p>
                    </div>

                    {/* Table Filters control block */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {/* Search box */}
                      <div className="relative flex-1 sm:w-44 text-xs">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search commitments..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500/80 transition font-sans"
                        />
                      </div>

                      {/* Category Switch */}
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-400 focus:outline-none focus:border-indigo-500 font-sans"
                      >
                        <option value="All">All Categories</option>
                        <option value="Work">💼 Work</option>
                        <option value="Study">📚 Study</option>
                        <option value="Personal">🏡 Personal</option>
                        <option value="Other">⭐ Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Commitments Table Element */}
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 font-mono text-[9px] uppercase tracking-widest border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Priority / Item</th>
                          <th className="px-4 py-3 font-semibold">Deadline Target</th>
                          <th className="px-4 py-3 font-semibold text-center">Subtask Logs</th>
                          <th className="px-4 py-3 font-semibold">Threat Level Factor</th>
                          <th className="px-4 py-3 font-semibold text-center">Diagnostics</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {filteredTasks.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-12 text-center text-slate-500 italic bg-slate-950/20">
                              No active commitments found matching current parameters.
                            </td>
                          </tr>
                        ) : (
                          filteredTasks.map((t) => {
                            const isSelected = selectedTask?.id === t.id;
                            const totalSubs = t.subtasks?.length || 0;
                            const completedSubs = t.subtasks?.filter(s => s.isCompleted).length || 0;
                            
                            // Color risk slider based on threat category
                            let riskColorClass = "bg-emerald-500";
                            let textRiskClass = "text-emerald-400";
                            if (t.riskScore >= 75) {
                              riskColorClass = "bg-rose-500 animate-pulse";
                              textRiskClass = "text-rose-400 font-extrabold";
                            } else if (t.riskScore >= 40) {
                              riskColorClass = "bg-amber-500";
                              textRiskClass = "text-amber-400 font-bold";
                            }

                            return (
                              <tr 
                                key={t.id}
                                onClick={() => setSelectedTask(t)}
                                className={`group hover:bg-slate-800/40 transition-all cursor-pointer ${
                                  isSelected ? "bg-slate-850/50" : ""
                                }`}
                              >
                                {/* Title with priority badge and category icon */}
                                <td className={`px-4 py-3.5 transition-all relative border-l-4 ${isSelected ? "border-indigo-500 pl-3 bg-slate-850/20" : "border-transparent pl-3"}`}>
                                  <div className="flex flex-col gap-1 max-w-[240px]">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {renderPriorityBadge(t.priority)}
                                      <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-850 rounded px-1.5 py-0.5 flex items-center gap-1">
                                        {getCategoryIcon(t.category)}
                                        {t.category}
                                      </span>
                                    </div>
                                    <span className={`text-slate-100 font-medium text-xs mt-1 group-hover:text-indigo-300 transition-colors ${
                                      t.status === "completed" ? "line-through text-slate-500" : ""
                                    }`}>
                                      {t.title}
                                    </span>
                                  </div>
                                </td>

                                {/* Deadline Target calendar log */}
                                <td className="px-4 py-3.5 font-mono text-[11px] text-slate-300">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                    <span>{t.deadline}</span>
                                    {new Date(t.deadline) < new Date() && t.status !== "completed" && (
                                      <span className="text-[8px] bg-red-950 text-rose-400 border border-rose-900/60 font-bold px-1 py-0.5 rounded uppercase font-mono animate-bounce">OVERDUE</span>
                                    )}
                                  </div>
                                </td>

                                {/* Subtasks fraction logs */}
                                <td className="px-4 py-3.5 text-center">
                                  <span className="bg-slate-950 border border-slate-850 px-2.5 py-1 rounded text-[11px] font-mono text-slate-300">
                                    {completedSubs}/{totalSubs}
                                  </span>
                                </td>

                                {/* AI Threat Factor progress slider */}
                                <td className="px-4 py-3.5">
                                  {t.riskScore > 0 ? (
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex-1 w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                                        <div 
                                          className={`h-full ${riskColorClass} transition-all duration-300`} 
                                          style={{ width: `${t.riskScore}%` }}
                                        />
                                      </div>
                                      <span className={`text-[11px] font-mono shrink-0 ${textRiskClass}`}>
                                        {t.riskScore}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 italic font-mono uppercase tracking-tight">Pending telemetry</span>
                                  )}
                                </td>

                                {/* Details / Status quick tag */}
                                <td className="px-4 py-3.5 text-center">
                                  <div className="flex items-center justify-center">
                                    {t.status === "completed" ? (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-widest bg-emerald-950/80 text-emerald-400 border border-emerald-900/40 font-mono">
                                        SECURED
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-widest bg-amber-950/60 text-amber-300 border border-amber-900/40 font-mono">
                                        ACTIVE
                                      </span>
                                    )}
                                  </div>
                                </td>

                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* TASK DETAILS INSPECTION DRAWER (RHS) */}
                <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between overflow-hidden">
                  
                  {selectedTask ? (
                    <div className="space-y-4">
                      <div className="border-b border-slate-800 pb-3">
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">
                            Milestone Inspector
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(selectedTask.id)}
                            className={`text-[10px] font-bold px-2 py-1 rounded border transition cursor-pointer ${
                              selectedTask.status === "completed"
                                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                            }`}
                          >
                            {selectedTask.status === "completed" ? "✓ Secured" : "Mark Secured"}
                          </button>
                        </div>

                        <h3 className="text-sm font-semibold text-slate-100 flex items-start gap-1">
                          {selectedTask.title}
                        </h3>

                        {selectedTask.description && (
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-2.5 bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg">
                            {selectedTask.description}
                          </p>
                        )}
                      </div>

                      {/* SUBTASK CHECKS MANAGER */}
                      <TaskSubtaskManager 
                        task={selectedTask}
                        onUpdateSubtasks={handleUpdateSubtasks}
                      />

                      {/* AI RISK DIAGNOSTIC */}
                      <RiskAnalysisWidget
                        task={selectedTask}
                        allTasks={tasks}
                        onUpdateRisk={handleUpdateRisk}
                      />

                      {/* Delete action footer */}
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Confirm deletion of this commitment logging entry?")) {
                              handleDeleteTask(selectedTask.id);
                            }
                          }}
                          className="text-[10px] text-rose-450 hover:text-rose-455 font-semibold uppercase tracking-wider flex items-center gap-1.5 transition p-1.5 rounded hover:bg-rose-950/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Entry
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <ListTodo className="w-10 h-10 text-slate-700 mb-3.5" />
                      <p className="text-xs text-slate-450 font-medium">No commitment chosen</p>
                      <p className="text-[11px] text-slate-550 mt-1 max-w-[200px]">
                        Select or create a target commitment to view its subtasks and run risk diagnostics.
                      </p>
                    </div>
                  )}

                </div>

              </div>

              {/* TAB RE-ROUTING LINKS */}
              <section className="col-span-12 bg-indigo-950/10 border border-indigo-500/10 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide block">Schedule Daily Focus Blocks</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-xl">
                    Convert active tasks and subtasks into a sequential study blocks timeline to keep your deadline safety buffers healthy.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("daily")}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition shrink-0 shadow shadow-indigo-950/50 cursor-pointer"
                >
                  Configure Daily Schedule Block →
                </button>
              </section>

            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 2: ALL COMMITMENTS VIEW ONLY */}
          {/* ==================================================================== */}
          {activeTab === "tasks" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-md font-semibold text-slate-100 uppercase tracking-wider">All Target commitments list</h2>
                  <p className="text-xs text-slate-400">Complete catalogue of recorded commitments, deadlines, and metrics.</p>
                </div>

                <button 
                  onClick={() => setIsNewTaskFormOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-semibold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Enlist New Code
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-850/30 border-b border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <div className="relative w-full sm:max-w-md text-xs">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter by title, categories, variables description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    <option value="Work">Work</option>
                    <option value="Study">Study</option>
                    <option value="Personal">Personal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="divide-y divide-slate-850">
                  {filteredTasks.length === 0 ? (
                    <div className="p-12 text-center text-slate-550 italic">
                      No commitments recorded for this screen target.
                    </div>
                  ) : (
                    filteredTasks.map((t) => (
                      <div key={t.id} className="p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-850/30 transition">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {renderPriorityBadge(t.priority)}
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                              {t.category}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Estimate: {t.estimatedHours} Hrs
                            </span>
                          </div>

                          <h3 className={`text-xs font-semibold text-slate-100 ${t.status === 'completed' ? 'line-through text-slate-550' : ''}`}>
                            {t.title}
                          </h3>
                          <p className="text-[11px] text-slate-450 line-clamp-2 max-w-3xl">
                            {t.description || "No extensive summary notes provided."}
                          </p>
                        </div>

                        {/* Status checks list and controls */}
                        <div className="flex items-center gap-4 shrink-0 self-end md:self-auto uppercase font-mono text-[10px]">
                          <div className="text-right">
                            <span className="text-slate-550 block text-[9px] font-sans font-black uppercase">DEADLINE TARGET</span>
                            <span className="text-slate-200 font-bold">{t.deadline}</span>
                          </div>

                          <div className="h-8 w-px bg-slate-800"></div>

                          <button
                            onClick={() => handleToggleTaskStatus(t.id)}
                            className={`px-3 py-1.5 rounded-lg border transition font-sans text-xs font-semibold cursor-pointer ${
                              t.status === "completed"
                                ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                                : "bg-slate-950 text-slate-400 hover:text-white border-slate-800"
                            }`}
                          >
                            {t.status === "completed" ? "✓ Secured" : "Secure Event"}
                          </button>

                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-950 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 3: COLLECTIVE WORK PRIORITIZER ENGINE */}
          {/* ==================================================================== */}
          {activeTab === "prioritizer" && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-md font-semibold text-slate-100 uppercase tracking-wider">Collective Work Prioritizer Engine</h2>
                  <p className="text-xs text-slate-400">
                    Use Gemini reasoning to analyze active workloads collectively and distribute priority tags based on delay risk vectors.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={prioritizing || tasks.filter(t => t.status !== "completed").length === 0}
                  onClick={handleOptimisePriorities}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                >
                  {prioritizing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Optimising Workstreams...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      Recalculate Priorities Allocation
                    </>
                  )}
                </button>
              </div>

              {priorityError && (
                <div className="text-xs bg-rose-950/20 text-rose-400 border border-rose-900/40 p-3.5 rounded-lg">
                  {priorityError}
                </div>
              )}

              {/* Recommendation results view panel */}
              {priorityRecommendations.length > 0 && (
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4.5 space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-900/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                        AI Recommended Allocations Breakdown
                      </span>
                    </div>

                    <button
                      onClick={handleApplyAllRecommendations}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded transition"
                    >
                      Authorize All Adjustments
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {priorityRecommendations.map((rec) => {
                      const associatedTask = tasks.find(t => t.id === rec.taskId);
                      if (!associatedTask) return null;

                      return (
                        <div key={rec.taskId} className="bg-slate-950 border border-slate-850 p-4 rounded-lg flex flex-col justify-between gap-3 shadow shadow-slate-950/60">
                          <div>
                            <span className="text-[10px] text-slate-500 block mb-1">RECOGNIZED COMMITMENT</span>
                            <span className="text-xs font-bold text-slate-200 block truncate">{associatedTask.title}</span>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] text-slate-450 uppercase font-mono">Current:</span>
                              <span className="text-[10px] uppercase font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-450">
                                {associatedTask.priority}
                              </span>
                              <span className="text-[10px] text-indigo-400 font-bold font-mono">→ Target:</span>
                              <span className="text-[10px] uppercase font-bold font-mono bg-indigo-950/60 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/40">
                                {rec.recommendedPriority}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 leading-normal mt-3 bg-indigo-950/10 p-2 rounded italic">
                              "{rec.priorityReasoning}"
                            </p>
                          </div>

                          <button
                            onClick={() => handleApplyPriorityRecommendation(rec)}
                            className="w-full mt-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-800 hover:border-slate-700 transition"
                          >
                            Establish Suggested Priority
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Static visual flow details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs uppercase font-extrabold text-slate-300 tracking-wider">Prioritization Strategy Concept</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    By default, commitments can be added with arbitrary priorities. However, true threat vectors must evaluate cumulative hours, overlapping calendars, and subtasks completeness coefficients.
                  </p>
                  <p className="text-xs text-slate-450 leading-relaxed italic border-l border-slate-700 pl-3">
                    The single highest-threat task is promoted to **"Guardian Priority"** tags, aligning undivided attention parameters exclusively on the imminent target commitment block.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xs uppercase font-extrabold text-slate-350 tracking-wider">Active Stream Telemetry</h3>
                    <div className="space-y-2 pt-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Active Non-Completed Streams:</span>
                        <span className="text-slate-200">{activeTasksCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Unanalyzed Risk Items:</span>
                        <span className="text-slate-200">
                          {tasks.filter(t => t.status !== "completed" && t.riskScore === 0).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={tasks.filter(t => t.status !== "completed").length === 0}
                    onClick={handleOptimisePriorities}
                    className="w-full mt-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition"
                  >
                    {prioritizing ? "Compiling Workstreams..." : "Establish Collective Threat Check Now"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 4: DAILY PLAN BLOCK */}
          {/* ==================================================================== */}
          {activeTab === "daily" && (
            <DailyPlanWidget
              tasks={tasks}
              plan={dailyPlan}
              onSetPlan={(newPlan) => setDailyPlan(newPlan)}
            />
          )}

        </div>
      </main>
    </div>
  );
}
