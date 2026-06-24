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
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Chronological Daily Timeline
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {plan.scheduledItems?.length || 0} Schedule Blocks
                </span>
              </div>

              <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {plan.scheduledItems?.map((item, index) => {
                  const isBreak = item.taskId === "break" || item.taskId === "buffer";
                  const matchingTask = tasks.find((t) => t.id === item.taskId);

                  return (
                    <div key={index} className="relative group pb-1">
                      {/* Timeline Bullet Node */}
                      <div className={`absolute -left-[32px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow ${
                        isBreak 
                          ? "border-slate-700 bg-slate-900" 
                          : "border-indigo-500 bg-slate-950"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isBreak ? "bg-slate-500" : "bg-indigo-400 animate-pulse"}`} />
                      </div>

                      {/* Schedule Item Card */}
                      <div className={`p-4 rounded-xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isBreak
                          ? "bg-slate-950/30 border-slate-800/80 hover:border-slate-700"
                          : "bg-gradient-to-r from-slate-900 to-slate-950 border-slate-800 hover:border-indigo-500/20 hover:shadow-md hover:shadow-indigo-950/20"
                      }`}>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Time Slot Badge */}
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10.5px] font-mono font-bold uppercase tracking-wider ${
                              isBreak 
                                ? "bg-slate-800/80 text-slate-400 border border-slate-700/50" 
                                : "bg-indigo-950/80 text-indigo-300 border border-indigo-900/40"
                            }`}>
                              <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                              {item.timeSlot}
                            </span>

                            {/* Task Title */}
                            <h4 className={`text-xs font-bold uppercase tracking-wide ${isBreak ? "text-slate-400 animate-pulse" : "text-slate-100"}`}>
                              {item.taskTitle}
                            </h4>

                            {isBreak && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 uppercase tracking-widest font-black border border-slate-750">
                                Repose Break
                              </span>
                            )}

                            {!isBreak && matchingTask && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest border ${
                                matchingTask.priority === "critical" || matchingTask.priority === "guardian-priority"
                                  ? "bg-rose-950/40 text-rose-400 border-rose-900/55"
                                  : matchingTask.priority === "high"
                                  ? "bg-amber-950/40 text-amber-400 border-amber-900/55"
                                  : "bg-slate-800 text-slate-400 border-slate-700"
                              }`}>
                                {matchingTask.priority}
                              </span>
                            )}
                          </div>

                          {/* Activity Details */}
                          <p className="text-xs text-slate-300 leading-relaxed pl-1">
                            {item.activity}
                          </p>
                        </div>

                        {/* Database context details */}
                        {!isBreak && matchingTask && (
                          <div className="flex flex-row md:flex-col items-start md:items-end gap-2 shrink-0 border-t md:border-t-0 border-slate-850 pt-2.5 md:pt-0 text-[10.5px]">
                            {matchingTask.category && (
                              <span className="text-slate-500 font-mono">
                                Category: <strong className="text-slate-400 font-sans">{matchingTask.category}</strong>
                              </span>
                            )}
                            {matchingTask.estimatedHours && (
                              <span className="text-slate-500 font-mono">
                                Hours: <strong className="text-slate-400 font-sans">{matchingTask.estimatedHours}h</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
