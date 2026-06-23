import React, { useState } from "react";
import { Plus, X, Sparkles } from "lucide-react";
import { Task } from "../types";

interface TaskFormProps {
  onAddTask: (task: Omit<Task, "id" | "createdAt" | "status" | "subtasks" | "riskScore" | "riskExplanation" | "suggestedMitigation">) => void;
  onClose: () => void;
}

export default function TaskForm({ onAddTask, onClose }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().substring(0, 10);
  });
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [category, setCategory] = useState("Work");
  const [estimatedHours, setEstimatedHours] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;

    onAddTask({
      title: title.trim(),
      description: description.trim(),
      deadline,
      priority,
      category,
      estimatedHours: Number(estimatedHours) || 1,
    });
    
    // Reset form
    setTitle("");
    setDescription("");
    onClose();
  };

  const categories = ["Work", "Study", "Personal", "Health", "Finance", "Other"];

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 text-stone-200">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-100">
          <Plus className="w-5 h-5 text-emerald-500" />
          Enlist New Commitment
        </h3>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-stone-800 transition"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-stone-400 mb-1.5">
            Commitment Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete quarterly financial review"
            className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500/80 rounded-lg px-3 py-2.5 text-sm text-stone-100 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-stone-400 mb-1.5">
            Brief Notes / Objectives
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline objectives, critical sub-blocks, or external dependencies..."
            rows={3}
            className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500/80 rounded-lg px-3 py-2.5 text-sm text-stone-100 outline-none transition resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-stone-400 mb-1.5">
              Deadline Target <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500/80 rounded-lg px-3 py-2.5 text-sm text-stone-100 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-stone-400 mb-1.5">
              Estimated Hours Required
            </label>
            <input
              type="number"
              min="0.5"
              max="168"
              step="0.5"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 1)}
              className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500/80 rounded-lg px-3 py-2.5 text-sm text-stone-100 outline-none transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-stone-400 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500/80 rounded-lg px-3 py-2.5 text-sm text-stone-100 outline-none transition"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-stone-400 mb-1.5">
              Priority Threat Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task["priority"])}
              className="w-full bg-stone-950 border border-stone-800 focus:border-emerald-500/80 rounded-lg px-3 py-2.5 text-sm text-stone-100 outline-none transition"
            >
              <option value="low">🟡 Low (Flexible)</option>
              <option value="medium">🔵 Medium (Normal)</option>
              <option value="high">🟠 High (Critical Warning)</option>
              <option value="critical">🔴 Critical (High Risk Check)</option>
              <option value="guardian-priority">🛡️ Guardian-Priority (Total Focus)</option>
            </select>
          </div>
        </div>

        <div className="pt-3 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium rounded-lg text-sm transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-lg text-sm flex items-center gap-1.5 transition shadow-md shadow-emerald-950/25"
          >
            <Sparkles className="w-4 h-4" />
            Establish Target
          </button>
        </div>
      </form>
    </div>
  );
}
