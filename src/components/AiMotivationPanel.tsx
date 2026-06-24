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

  const fallbackQuote = isDarkMode
    ? "No excuses. No delays. Put down the phone and build your legacy."
    : "Align your focus, design your timeline, and outpace your commitments today.";

  const fetchMotivation = async (force: boolean = false) => {
    // If we already have cached data and tasks didn't change (or not forced), don't fetch
    if (loading) return;
    if (!force && motivation) return;
    if (tasks.length === 0) {
      setMotivation({
        quote: fallbackQuote,
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
      className={`col-span-12 rounded-2xl p-6 relative overflow-hidden transition-all duration-500 border ${
        isDarkMode 
          ? "bg-slate-900 border-indigo-500/20 shadow-xl shadow-slate-950/40" 
          : "bg-white border-indigo-500/10 shadow-lg shadow-indigo-100/30"
      }`}
    >
      {/* Decorative subtle abstract glowing grid background */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
        isDarkMode 
          ? "bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.06),transparent_60%)] opacity-100" 
          : "bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.03),transparent_60%)] opacity-60"
      }`} />
      <div className={`absolute top-0 right-0 w-96 h-96 blur-[120px] rounded-full pointer-events-none transition-colors duration-500 ${
        isDarkMode ? "bg-indigo-500/5" : "bg-indigo-300/10"
      }`} />
      
      {/* Header bar */}
      <div className={`relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b ${
        isDarkMode ? "border-slate-800/60" : "border-slate-100"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isDarkMode 
              ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-400" 
              : "bg-indigo-50 border border-indigo-100 text-indigo-600"
          }`}>
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className={`text-[10px] font-mono tracking-widest uppercase font-black block ${
              isDarkMode ? "text-indigo-400" : "text-indigo-600"
            }`}>
              COGNITIVE COMMAND CENTER
            </span>
            <h2 className={`text-lg font-extrabold tracking-tight flex items-center gap-1.5 transition-colors ${
              isDarkMode ? "text-slate-100" : "text-slate-800"
            }`}>
              <span>Active AI Mindset & Focus Coach</span>
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            </h2>
          </div>
        </div>

        {/* Action controllers */}
        <button
          onClick={() => fetchMotivation(true)}
          disabled={loading || tasks.length === 0}
          className={`px-4 py-2 border rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group/btn ${
            isDarkMode 
              ? "bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 hover:border-indigo-500/30 text-slate-300 hover:text-indigo-400" 
              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200"
          }`}
          id="btn-recalculate-directive"
        >
          {loading ? (
            <Loader2 className={`w-3.5 h-3.5 animate-spin ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 group-hover/btn:rotate-180 transition-transform duration-500" />
          )}
          <span>Recalculate Focus Directive</span>
        </button>
      </div>

      {/* Main Content Area: High-impact full-width editorial-style quote */}
      <div className="relative z-10">
        <div className={`border rounded-xl p-6 sm:p-8 relative min-h-[160px] flex flex-col justify-between transition-colors duration-500 ${
          isDarkMode 
            ? "bg-slate-950/40 border-slate-800/40" 
            : "bg-slate-50/80 border-slate-200/60"
        }`}>
          <div className="absolute top-6 right-8 text-indigo-500/10 pointer-events-none">
            <Quote className="w-20 h-20 transform rotate-180" />
          </div>

          <div className="space-y-4 max-w-4xl">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-[9px] font-mono font-bold uppercase tracking-widest ${
              isDarkMode 
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/25" 
                : "bg-indigo-50 text-indigo-600 border-indigo-100"
            }`}>
              State Insight Quote
            </span>
            
            {loading ? (
              <div className="space-y-2 animate-pulse py-2">
                <div className="h-5 bg-slate-800 rounded w-full animate-pulse"></div>
                <div className="h-5 bg-slate-800 rounded w-5/6 animate-pulse"></div>
                <div className="h-5 bg-slate-800 rounded w-2/3 animate-pulse"></div>
              </div>
            ) : error ? (
              <p className="text-sm text-red-400 italic">
                "Directives offline. Connection is waiting for a valid system credential."
              </p>
            ) : (
              <blockquote className={`text-base sm:text-lg md:text-xl font-serif italic leading-relaxed font-semibold ${
                isDarkMode ? "text-slate-100" : "text-slate-800"
              }`}>
                "{motivation?.quote || fallbackQuote}"
              </blockquote>
            )}
          </div>

          {error && (
            <div className={`border text-[11px] p-3 rounded-lg flex items-start gap-2 mt-4 max-w-2xl ${
              isDarkMode 
                ? "bg-red-950/30 border-red-900/40 text-red-200" 
                : "bg-red-50 border-red-100 text-red-800"
            }`}>
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Gemini Directives Offline</span>
                Configure your `GEMINI_API_KEY` in the Settings → Secrets panel or verify your internet connection.
              </div>
            </div>
          )}
        </div>
      </div>

    </section>
  );
};
