import React, { useState } from "react";
import { Check, Plus, Trash2, Sparkles, Loader2, ListTodo, Globe, Search, ExternalLink } from "lucide-react";
import { Task, SubTask } from "../types";

interface TaskSubtaskManagerProps {
  task: Task;
  onUpdateSubtasks: (taskId: string, subtasks: SubTask[]) => void;
  onUpdateCitations?: (taskId: string, citations: string[], searchQueries: string[]) => void;
}

export default function TaskSubtaskManager({ task, onUpdateSubtasks, onUpdateCitations }: TaskSubtaskManagerProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [useSearch, setUseSearch] = useState(false);

  const toggleSubtask = (subtaskId: string) => {
    const updated = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );
    onUpdateSubtasks(task.id, updated);
  };

  const deleteSubtask = (subtaskId: string) => {
    const updated = task.subtasks.filter((st) => st.id !== subtaskId);
    onUpdateSubtasks(task.id, updated);
  };

  const addManualSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub: SubTask = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      title: newSubtaskTitle.trim(),
      isCompleted: false,
      estimatedMinutes: 30, // Default to 30 mins
    };

    onUpdateSubtasks(task.id, [...task.subtasks, newSub]);
    setNewSubtaskTitle("");
  };

  const handleAiBreakdown = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const response = await fetch("/api/generate-subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          category: task.category,
          estimatedHours: task.estimatedHours,
          useSearch: useSearch,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to contact Gemini");
      }

      const data = await response.json();
      if (data.subtasks && Array.isArray(data.subtasks)) {
        const parsed: SubTask[] = data.subtasks.map((st: any) => ({
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
          title: st.title || "Actionable chunk",
          isCompleted: false,
          estimatedMinutes: Number(st.estimatedMinutes) || 30,
        }));

        onUpdateSubtasks(task.id, [...task.subtasks, ...parsed]);

        if (onUpdateCitations && (data.citations || data.searchQueries)) {
          onUpdateCitations(task.id, data.citations || [], data.searchQueries || []);
        }
      } else {
        throw new Error("Invalid subtask list format returned from Gemini.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Could not analyze subtasks.");
    } finally {
      setLoading(false);
    }
  };

  const totalMinutes = task.subtasks.reduce((acc, current) => acc + current.estimatedMinutes, 0);
  const completedMinutes = task.subtasks
    .filter((s) => s.isCompleted)
    .reduce((acc, current) => acc + current.estimatedMinutes, 0);

  const progressPercent = task.subtasks.length
    ? Math.round((task.subtasks.filter((s) => s.isCompleted).length / task.subtasks.length) * 100)
    : 0;

  return (
    <div className="bg-stone-950 border border-stone-850 rounded-lg p-5 mt-3 text-stone-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-teal-400" />
          <h4 className="text-sm font-semibold text-stone-200">
            AI Subtask Checklist
          </h4>
          <span className="text-xs text-stone-500 font-mono bg-stone-900 border border-stone-800 px-2 py-0.5 rounded">
            {task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle for Search Grounding */}
          <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-400 font-mono bg-stone-900/60 px-2 py-1 rounded-md border border-stone-850 hover:bg-stone-900 transition">
            <input
              type="checkbox"
              checked={useSearch}
              onChange={(e) => setUseSearch(e.target.checked)}
              className="accent-teal-500 scale-90"
            />
            <span>Google Grounding</span>
          </label>

          <button
            type="button"
            disabled={loading}
            onClick={handleAiBreakdown}
            className="text-xs bg-teal-950/45 text-teal-300 hover:bg-teal-900/60 disabled:bg-stone-900 disabled:text-stone-600 border border-teal-800/60 hover:border-teal-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium self-end sm:self-auto cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Slicing Task...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                AI Generate Subtasks
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress slider bar */}
      {task.subtasks.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-stone-400 font-mono mb-1">
            <span>Progress: {progressPercent}%</span>
            <span>
              {completedMinutes}m / {totalMinutes}m budgeted
            </span>
          </div>
          <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden border border-stone-800">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {errorStatus && (
        <div className="text-xs bg-red-950/30 text-red-400 border border-red-900/40 p-2.5 rounded-lg mb-3">
          {errorStatus}
        </div>
      )}

      {/* Subtasks checklist */}
      {task.subtasks.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-stone-900 rounded-lg bg-stone-950/60 mb-4">
          <p className="text-sm text-stone-400 italic">No subtasks defined yet.</p>
          <p className="text-xs text-stone-500 mt-1.5">
            Use the "AI Generate Subtasks" button above to dynamically auto-schedule blocks.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-4 max-h-[220px] overflow-y-auto pr-1">
          {task.subtasks.map((st) => (
            <div
              key={st.id}
              className="group flex items-start justify-between p-2.5 rounded-lg bg-stone-900/40 hover:bg-stone-900/70 border border-stone-900 transition gap-2"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleSubtask(st.id)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition cursor-pointer shrink-0 mt-0.5 ${
                    st.isCompleted
                      ? "bg-teal-600/80 border-teal-500 text-stone-150"
                      : "border-stone-700 hover:border-stone-500"
                  }`}
                >
                  {st.isCompleted && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-xs text-stone-200 transition select-none break-words whitespace-normal ${
                      st.isCompleted ? "line-through text-stone-500" : ""
                    }`}
                  >
                    {st.title}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono mt-0.5">
                    {st.estimatedMinutes} mins
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteSubtask(st.id)}
                className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-rose-400 p-1 rounded transition shrink-0 mt-0.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Display Google Search citations/queries if they exist */}
      {task.citations && task.citations.length > 0 && (
        <div className="mt-3.5 mb-4 p-3 bg-stone-900/40 border border-stone-850 rounded-lg space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Google Search Grounding Verifications</span>
          </div>
          
          {task.searchQueries && task.searchQueries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.searchQueries.map((query, index) => (
                <span key={index} className="text-[9px] bg-indigo-950/50 border border-indigo-900/40 text-indigo-300 font-mono px-2 py-0.5 rounded flex items-center gap-1">
                  <Search className="w-2.5 h-2.5 shrink-0" />
                  {query}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-1.5 pt-1 border-t border-stone-850/60">
            <span className="text-[9px] text-stone-500 font-mono block uppercase">Verified Web Citations</span>
            {task.citations.map((url, index) => (
              <a
                key={index}
                href={url.startsWith("http") ? url : `https://google.com/search?q=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 leading-normal truncate hover:underline"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span>{url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Manual Input form */}
      <form onSubmit={addManualSubtask} className="flex gap-2">
        <input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          placeholder="Append custom subtask element..."
          className="flex-1 bg-stone-900 border border-stone-850 focus:border-teal-500/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 outline-none transition"
        />
        <button
          type="submit"
          className="bg-stone-900 border border-stone-800 hover:border-stone-700 hover:text-white text-stone-400 p-1.5 px-3 rounded-lg flex items-center gap-1 transition text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </form>
    </div>
  );
}
