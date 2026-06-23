import React, { useState } from "react";
import { ShieldAlert, RefreshCw, Sparkles, Loader2, CheckCircle2, HelpCircle } from "lucide-react";
import { Task } from "../types";

interface RiskAnalysisWidgetProps {
  task: Task;
  allTasks: Task[];
  onUpdateRisk: (taskId: string, riskScore: number, riskExplanation: string, suggestedMitigation: string) => void;
}

export default function RiskAnalysisWidget({ task, allTasks, onUpdateRisk }: RiskAnalysisWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const calculateRisk = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      // Find other active tasks
      const otherTasks = allTasks.filter((t) => t.id !== task.id && t.status !== "completed");

      const response = await fetch("/api/estimate-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task,
          currentLocalTime: new Date().toISOString(),
          otherTasks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to contact Gemini");
      }

      const data = await response.json();
      if (typeof data.riskScore === "number") {
        onUpdateRisk(task.id, data.riskScore, data.riskExplanation, data.suggestedMitigation);
      } else {
        throw new Error("Invalid risk estimate structure received from AI.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Failed to estimate delay risk.");
    } finally {
      setLoading(false);
    }
  };

  const hasAnalysedRisk = task.riskScore > 0 || task.riskExplanation;

  // Determine risk level styling
  let riskColor = "text-emerald-400";
  let bgGradient = "from-emerald-500/10 to-teal-500/5";
  let borderColor = "border-emerald-500/20";
  let progressColor = "bg-emerald-500";
  let badgeText = "On Track (Low)";

  if (task.riskScore >= 75) {
    riskColor = "text-rose-400";
    bgGradient = "from-rose-500/10 to-stone-900/5";
    borderColor = "border-rose-500/30";
    progressColor = "bg-rose-500";
    badgeText = "CRITICAL LIMIT";
  } else if (task.riskScore >= 40) {
    riskColor = "text-amber-400";
    bgGradient = "from-amber-500/10 to-stone-900/5";
    borderColor = "border-amber-500/30";
    progressColor = "bg-amber-500";
    badgeText = "ELEVATED RISK";
  }

  return (
    <div className={`rounded-xl border ${borderColor} bg-gradient-to-br ${bgGradient} p-5 text-stone-200 mt-4 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`w-5 h-5 ${riskColor}`} />
          <h4 className="text-sm font-semibold tracking-tight text-stone-200">
            Guardian Risk Diagnostics
          </h4>
        </div>

        <button
          type="button"
          disabled={loading || task.status === "completed"}
          onClick={calculateRisk}
          className="text-xs bg-slate-900/80 hover:bg-slate-800 disabled:opacity-40 border border-slate-700/60 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition font-mono text-stone-300 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
          )}
          {hasAnalysedRisk ? "Recount Risk" : "Assess Risk"}
        </button>
      </div>

      {task.status === "completed" ? (
        <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-800/40 p-3.5 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs text-stone-300">
            This commitment is locked and secured! No deadline threats detected.
          </p>
        </div>
      ) : !hasAnalysedRisk ? (
        <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-950/45 border border-dashed border-slate-800 rounded-lg">
          <HelpCircle className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-xs text-slate-400 max-w-[280px]">
            Execute Gemini telemetry to estimate delay threat variables, buffers, and dependencies.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={calculateRisk}
            className="mt-3.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition duration-200"
          >
            {loading ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
            )}
            Run AI Diagnostic
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Big Risk Indicator */}
            <div className="sm:col-span-4 flex flex-col items-center justify-center bg-slate-950/60 border border-slate-800 p-3 rounded-lg text-center">
              <span className={`text-3xl font-mono font-black ${riskColor}`}>
                {task.riskScore}%
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1">
                {badgeText}
              </span>
            </div>

            {/* Risk Explanation Text */}
            <div className="sm:col-span-8 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Threat Breakdown
              </span>
              <p className="text-xs text-stone-300 leading-relaxed font-sans">
                {task.riskExplanation}
              </p>
            </div>
          </div>

          {/* Visual Progress/Urgency Indicator bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase">
              <span>Low Risk Target</span>
              <span>Deadline Limit Threat</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`${progressColor} h-full transition-all duration-500`}
                style={{ width: `${task.riskScore}%` }}
              />
            </div>
          </div>

          {/* Mitigation Tip */}
          {task.suggestedMitigation && (
            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Mitigation Priority Directive
                </span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed italic">
                "{task.suggestedMitigation}"
              </p>
            </div>
          )}
        </div>
      )}

      {errorStatus && (
        <div className="text-xs bg-red-950/30 text-red-400 border border-red-900/40 p-2.5 rounded-lg mt-3">
          {errorStatus}
        </div>
      )}
    </div>
  );
}
