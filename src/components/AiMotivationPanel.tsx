import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, RefreshCw, AlertTriangle, Brain, Quote, Loader2 
} from "lucide-react";
import { Task, MotivationData } from "../types";

interface AiMotivationPanelProps {
  tasks: Task[];
  productivityScore: number;
  highRiskCount: number;
  isDarkMode: boolean;
}

export const AiMotivationPanel: React.FC<AiMotivationPanelProps> = ({
  tasks,
  productivityScore,
  highRiskCount,
  isDarkMode,
}) => {
  const [motivation, setMotivation] = useState<MotivationData | null>(() => {
    const stored = localStorage.getItem("deadline_guardian_motivation");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to restore motivation cache:", e);
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMotivation = async (force: boolean = false) => {
    // If we already have cached data and tasks didn't change (or not forced), don't fetch
    if (loading) return;
    if (tasks.length === 0) {
      setMotivation({
        quote: "The best way to predict the future is to create it. Declare your commitments to begin.",
        primaryObjective: "Declare your first commitment using the 'New Commitment' button.",
        biggestRisk: "Ambiguity around deadline targets and task complexity.",
        recommendedAction: "Add 1-2 urgent projects or studies to organize your timeline."
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-motivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          productivityScore,
          highRiskCount,
          isDarkMode,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate dynamic motivation directives.");
      }

      const data: MotivationData = await response.json();
      setMotivation(data);
      localStorage.setItem("deadline_guardian_motivation", JSON.stringify(data));
    } catch (err: any) {
      console.error("Motivation API error:", err);
      setError(err.message || "Unable to sync with Gemini Coach. Check your connection or API key.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch if there is no motivation cache, or when tasks length or theme changes
  useEffect(() => {
    if (tasks.length > 0) {
      fetchMotivation();
    }
  }, [tasks.length, isDarkMode]);

  return (
    <section 
      id="ai-motivation-coaching-center" 
      className="col-span-12 bg-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-slate-950/40"
    >
      {/* Decorative subtle abstract glowing grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-black block">
              COGNITIVE COMMAND CENTER
            </span>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-100 flex items-center gap-1.5">
              <span>Active AI Mindset & Focus Coach</span>
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            </h2>
          </div>
        </div>

        {/* Action controllers */}
        <button
          onClick={() => fetchMotivation(true)}
          disabled={loading || tasks.length === 0}
          className="px-4 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/30 text-slate-300 hover:text-indigo-400 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group/btn"
          id="btn-recalculate-directive"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 group-hover/btn:rotate-180 transition-transform duration-500" />
          )}
          <span>Recalculate Focus Directive</span>
        </button>
      </div>

      {/* Main Content Area: High-impact full-width editorial-style quote */}
      <div className="relative z-10">
        <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-6 sm:p-8 relative min-h-[160px] flex flex-col justify-between">
          <div className="absolute top-6 right-8 text-indigo-500/10 pointer-events-none">
            <Quote className="w-20 h-20 transform rotate-180" />
          </div>

          <div className="space-y-4 max-w-4xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-md text-[9px] font-mono font-bold uppercase tracking-widest">
              State Insight Quote
            </span>
            
            {loading ? (
              <div className="space-y-2 animate-pulse py-2">
                <div className="h-5 bg-slate-800 rounded w-full"></div>
                <div className="h-5 bg-slate-800 rounded w-5/6"></div>
                <div className="h-5 bg-slate-800 rounded w-2/3"></div>
              </div>
            ) : error ? (
              <p className="text-sm text-red-400 italic">
                "Directives offline. Connection is waiting for a valid system credential."
              </p>
            ) : (
              <blockquote className="text-lg sm:text-xl font-serif italic text-slate-100 leading-relaxed font-semibold">
                "{motivation?.quote || "Align your focus, design your timeline, and outpace your commitments today."}"
              </blockquote>
            )}
          </div>

          {error && (
            <div className="bg-red-950/30 border border-red-900/40 text-red-200 text-[11px] p-3 rounded-lg flex items-start gap-2 mt-4 max-w-2xl">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Gemini Directives Offline</span>
                Configure your `GEMINI_API_KEY` in the **Settings → Secrets** panel or verify your internet connection.
              </div>
            </div>
          )}
        </div>
      </div>

    </section>
  );
};
