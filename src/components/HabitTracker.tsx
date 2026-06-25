import React, { useState } from "react";
import { 
  Flame, Plus, Trash2, CheckCircle2, Circle, Sparkles, Calendar, 
  TrendingUp, Activity, Award, Briefcase, BookOpen, Heart, ShieldAlert, CheckSquare, PlusCircle
} from "lucide-react";
import { motion } from "motion/react";
import { Habit } from "../types";
import confetti from "canvas-confetti";

interface HabitTrackerProps {
  habits: Habit[];
  onAddHabit: (title: string, category: "Work" | "Study" | "Personal" | "Health" | "Other") => void;
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  isDarkMode: boolean;
}

export default function HabitTracker({
  habits,
  onAddHabit,
  onToggleHabit,
  onDeleteHabit,
  isDarkMode
}: HabitTrackerProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"Work" | "Study" | "Personal" | "Health" | "Other">("Work");
  const [filter, setFilter] = useState<"All" | "Work" | "Study" | "Personal" | "Health" | "Other">("All");

  // Get current date string in local format (YYYY-MM-DD)
  const getTodayString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };

  const todayStr = getTodayString();

  // Quick preset habits for deadline avoidance & productivity shield
  const PRESET_HABITS = [
    { title: "Review deadline safety margins", category: "Work" as const },
    { title: "Complete a 45-minute focused work block", category: "Study" as const },
    { title: "Avoid phone first hour of waking up", category: "Personal" as const },
    { title: "Update active milestone checklists", category: "Work" as const },
    { title: "Sleep buffer check (no screen in bed)", category: "Health" as const }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddHabit(newTitle.trim(), newCategory);
    setNewTitle("");
  };

  // 7 days overview helper
  const getLast7Days = () => {
    const list = [];
    const daysName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      list.push({
        dateStr,
        dayName: daysName[d.getDay()],
        dayNum: d.getDate()
      });
    }
    return list;
  };

  const last7Days = getLast7Days();

  const filteredHabits = habits.filter(h => filter === "All" || h.category === filter);

  // Stats calculation
  const totalCompletedToday = habits.filter(h => h.lastCompletedDate === todayStr).length;
  const completionRate = habits.length > 0 ? Math.round((totalCompletedToday / habits.length) * 100) : 0;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak), 0) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Completion Progress Card */}
        <div className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[140px] ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs sm:text-sm font-mono uppercase tracking-wider font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Today's Shield Defenses
              </span>
              <Activity className="w-6 h-6 text-emerald-400 shrink-0" />
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                {totalCompletedToday} <span className="text-sm sm:text-base font-normal text-slate-500">/ {habits.length}</span>
              </span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-400 ml-2">
                {completionRate}% Shield strength
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 w-full bg-slate-800/40 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Max Active Streaks Card */}
        <div className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[140px] ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs sm:text-sm font-mono uppercase tracking-wider font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Top Persistence streak
              </span>
              <Flame className="w-6 h-6 text-amber-500 animate-pulse shrink-0" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                {bestStreak} <span className="text-sm sm:text-base font-normal text-slate-500">days</span>
              </span>
              <span className="text-xs sm:text-sm text-slate-400 leading-normal ml-2">
                Continuous safety shield
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 italic font-sans">
            Consistency is the ultimate defense against last-minute panic.
          </p>
        </div>

      </div>

      {/* Main Habit Area Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Habit list */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-5 h-5 text-indigo-400 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-100">Daily Defensive Shield Habits</h3>
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Work", "Study", "Personal", "Health", "Other"] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    filter === c
                      ? "bg-indigo-600 text-white border border-indigo-500/40"
                      : "bg-slate-950/60 text-slate-300 hover:text-slate-100 border border-slate-800/80"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Habits Cards List */}
          {filteredHabits.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-pulse" />
              <p className="text-base text-slate-200 font-bold">No habits registered in this category</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm mx-auto font-sans">
                Enlist a custom defensive habit to start tracking your daily resilience metrics.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredHabits.map(habit => {
                const isCompletedToday = habit.lastCompletedDate === todayStr;
                
                // Color mapping
                let badgeColor = "bg-indigo-950/60 text-indigo-400 border-indigo-800/40";
                let badgeLabel = habit.category;
                if (habit.category === "Study") {
                  badgeColor = "bg-amber-950/60 text-amber-400 border-amber-800/40";
                } else if (habit.category === "Personal") {
                  badgeColor = "bg-rose-950/60 text-rose-400 border-rose-800/40";
                } else if (habit.category === "Health") {
                  badgeColor = "bg-emerald-950/60 text-emerald-400 border-emerald-800/40";
                } else if (habit.category === "Other") {
                  badgeColor = "bg-teal-950/60 text-teal-400 border-teal-800/40";
                }

                return (
                  <motion.div
                    key={habit.id}
                    layoutId={habit.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${
                      isCompletedToday
                        ? "bg-slate-950/50 border-emerald-500/20 shadow-inner"
                        : "bg-slate-900 border-slate-800/80 hover:border-slate-700/80"
                    }`}
                  >
                    {/* Left details */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => onToggleHabit(habit.id)}
                        className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                          isCompletedToday
                            ? "bg-emerald-500 border-emerald-400 text-slate-950"
                            : "border-slate-700 hover:border-indigo-500 bg-slate-950/60 text-transparent hover:text-slate-700"
                        }`}
                        title={isCompletedToday ? "Mark Incomplete" : "Complete Habit"}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      </button>
                      
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className={`text-sm sm:text-base font-bold truncate leading-snug ${
                          isCompletedToday ? "text-slate-550 line-through font-medium" : "text-slate-100"
                        }`}>
                          {habit.title}
                        </p>
                        
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border font-mono font-semibold ${badgeColor}`}>
                            {badgeLabel}
                          </span>
                          
                          <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                            <Flame className={`w-3.5 h-3.5 ${habit.streak > 0 ? "text-amber-500 fill-amber-500" : "text-slate-600"}`} />
                            Streak: <strong className={habit.streak > 0 ? "text-amber-500" : "text-slate-450"}>{habit.streak}d</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right overview: 7 Days Grid */}
                    <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-850 pt-3 sm:pt-0 justify-between sm:justify-end">
                      
                      {/* Weekly mini grid */}
                      <div className="flex items-center gap-2">
                        {last7Days.map(day => {
                          const wasCompletedOnDay = habit.history.includes(day.dateStr);
                          const isDayToday = day.dateStr === todayStr;
                          
                          let bgClass = "bg-slate-950 border-slate-850";
                          if (wasCompletedOnDay) {
                            bgClass = "bg-emerald-500 border-emerald-400";
                          } else if (isDayToday) {
                            bgClass = "border-dashed border-indigo-500 bg-indigo-950/20";
                          }

                          return (
                            <div 
                              key={day.dateStr} 
                              className="flex flex-col items-center"
                              title={`${day.dateStr} (${wasCompletedOnDay ? "Completed" : "Incomplete"})`}
                            >
                              <span className="text-[10px] text-slate-500 font-mono uppercase mb-0.5 block">{day.dayName[0]}</span>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${bgClass}`}>
                                {wasCompletedOnDay && <div className="w-2 h-2 rounded-sm bg-slate-950" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteHabit(habit.id)}
                        className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-850 hover:bg-red-950/30 hover:border-red-900/40 text-slate-450 hover:text-red-400 transition cursor-pointer shrink-0"
                        title="Dismantle Habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </motion.div>
                );
              })}
            </div>
          )}

        </div>

        {/* Right Side: Add Habit form */}
        <div className="lg:col-span-4">
          <div className={`p-5 sm:p-6 rounded-2xl border ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <h4 className="text-sm font-mono tracking-wider text-indigo-400 uppercase font-bold flex items-center gap-2 pb-3 border-b border-slate-800">
              <PlusCircle className="w-5 h-5 text-indigo-400" />
              Enlist Custom Habit
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-bold tracking-widest text-slate-400 font-mono block">
                  Habit Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Review deadline safety margins"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/85 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition font-sans"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase font-bold tracking-widest text-slate-400 font-mono block">
                  Defensive Domain
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/85 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none transition cursor-pointer"
                >
                  <option value="Work">💼 Work</option>
                  <option value="Study">📚 Study</option>
                  <option value="Personal">🏡 Personal</option>
                  <option value="Health">🌱 Health</option>
                  <option value="Other">🛡️ Other</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-white font-bold text-sm py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Enlist Active Habit</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
