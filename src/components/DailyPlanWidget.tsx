import React, { useState } from "react";
import { 
  CalendarRange, Sparkles, Loader2, Clock, Moon, Sun, Hourglass, 
  MapPin, CheckSquare, RefreshCw, ChevronRight, AlertCircle, Info 
} from "lucide-react";
import { Task, DailyActionPlan } from "../types";

interface DailyPlanWidgetProps {
  tasks: Task[];
  plan: DailyActionPlan | null;
  onSetPlan: (plan: DailyActionPlan) => void;
}

export default function DailyPlanWidget({ tasks, plan, onSetPlan }: DailyPlanWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Scheduling Configuration
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [availableHours, setAvailableHours] = useState(6);

  const handleGeneratePlan = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      // Send active tasks (or pending commitments)
      const activeTasks = tasks.filter((t) => t.status !== "completed");

      const response = await fetch("/api/generate-action-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: activeTasks,
          currentLocalTime: new Date().toISOString(),
          wakeTime,
          sleepTime,
          availableHours,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed key telemetry connection.");
      }

      const data = await response.json();
      onSetPlan(data);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Failed to establish a schedule blueprint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-indigo-950 flex items-center justify-center text-indigo-400 border border-indigo-800/40">
            <CalendarRange className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
              Gemini Daily action target
            </h3>
            <p className="text-[11px] text-slate-400">
              Synchronize concurrent commitments with customized schedule blocks.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading || tasks.filter(t => t.status !== 'completed').length === 0}
          onClick={handleGeneratePlan}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 border border-indigo-500/40 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap self-stretch md:self-auto justify-center cursor-pointer shadow shadow-indigo-950"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Compiling Schedule...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              {plan ? "Recalculate Schedule" : "Generate Schedule"}
            </>
          )}
        </button>
      </div>

      {tasks.filter(t => t.status !== 'completed').length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
          <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-xs max-w-sm">
            Enlist active target commitments above before requesting a strategic action plan.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Workload Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-850">
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                <Sun className="w-3 h-3 text-amber-400" />
                Wake Schedule
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                <Moon className="w-3 h-3 text-indigo-400" />
                Target Bedtime
              </label>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                <Hourglass className="w-3 h-3 text-teal-400" />
                Target Study Focus (Hrs)
              </label>
              <input
                type="number"
                min="1"
                max="16"
                value={availableHours}
                onChange={(e) => setAvailableHours(Number(e.target.value) || 4)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {errorStatus && (
            <div className="text-xs bg-rose-950/20 text-rose-400 border border-rose-900/40 p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorStatus}</span>
            </div>
          )}

          {/* Plan Visualization */}
          {!plan ? (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-950/40 border border-dashed border-slate-800 rounded-lg text-center">
              <Info className="w-6 h-6 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 mb-2">
                Create a high-impact roadmap for today using AI reasoning.
              </p>
              <button
                type="button"
                onClick={handleGeneratePlan}
                className="px-4 py-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold rounded-lg transition"
              >
                Compile My Road Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Chronological blocks stream */}
              <div className="lg:col-span-7 space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-2.5">
                  Chronological Stream blocks
                </span>
                {plan.scheduledItems?.map((item, index) => {
                  const isBreak = item.taskId === "break" || item.taskId === "buffer";
                  return (
                    <div 
                      key={index} 
                      className={`flex gap-3.5 items-start p-3 rounded-lg border transition ${
                        isBreak 
                          ? "bg-slate-950/40 border-slate-800/60" 
                          : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850/50"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center bg-slate-950 border border-slate-800/80 rounded px-2.5 py-1.5 font-mono text-[10px] text-indigo-300 font-bold tracking-tight text-center min-w-[90px] shrink-0 shadow-sm">
                        <Clock className="w-3 h-3 text-indigo-400 mb-1 inline-block" />
                        {item.timeSlot}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`text-xs font-semibold truncate ${isBreak ? "text-slate-400" : "text-slate-100"}`}>
                            {item.taskTitle}
                          </h4>
                          {isBreak && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 uppercase tracking-widest font-semibold border border-slate-750">
                              REPOSE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal mt-1 flex items-start gap-1">
                          <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                          <span className="truncate">{item.activity}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Strategic Advice and Tips panel */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4.5">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-indigo-900/60 pb-2">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse shrink-0" />
                    <span className="text-xs font-black tracking-wider text-indigo-300 uppercase">
                      Strategic Insight
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed italic">
                    "{plan.focusMessage}"
                  </p>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {plan.summary}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-indigo-900/60">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    Defenders Safeguards
                  </span>
                  <ul className="space-y-1.5">
                    {plan.mitigationTips?.slice(0, 3).map((tip, idx) => (
                      <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-2">
                        <CheckSquare className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
