import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Task, MotivationData } from "../types";

interface FocusRoomProps {
  tasks: Task[];
  motivation: MotivationData | null;
  isDarkMode: boolean;
  onExit: () => void;
}

export const FocusRoom: React.FC<FocusRoomProps> = ({
  isDarkMode,
  onExit,
}) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time nicely
  const timeString = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const dateString = time.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Short, punchy, beautiful one-liners distinct from the overview page
  const darkFocusQuotes = [
    "Focus is the ultimate leverage.",
    "Do it now. Later becomes never.",
    "Where your attention goes, energy flows.",
    "Be silent. Work hard. Stay humble.",
    "Overthinking ruins progress.",
    "One single task. No distractions.",
  ];

  const lightFocusQuotes = [
    "Inhale presence, exhale the noise.",
    "One pixel, one line, one step at a time.",
    "Deep work is a quiet superpower.",
    "Progress is quiet and steady.",
    "Simplify your screen, simplify your mind.",
    "Trust your craft and stay present.",
  ];

  // Select quote based on state (recalculated on 10-minute intervals)
  const getMotivationalQuote = () => {
    const list = isDarkMode ? darkFocusQuotes : lightFocusQuotes;
    // Calculate the absolute 10-minute block interval
    const tenMinuteBlock = Math.floor(time.getTime() / (10 * 60 * 1000));
    const index = tenMinuteBlock % list.length;
    return list[index];
  };

  const displayQuote = getMotivationalQuote();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onExit}
      className={`w-full h-screen flex flex-col justify-center items-center p-4 sm:p-12 cursor-pointer select-none transition-colors duration-700 relative overflow-hidden ${
        isDarkMode
          ? "bg-slate-950 text-slate-100"
          : "bg-slate-50 text-slate-900"
      }`}
      id="immersive-focus-room"
    >
      <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-full px-4">
        {/* Date */}
        <p className={`text-xs sm:text-sm font-mono uppercase tracking-[0.25em] font-semibold transition-colors duration-500 ${
          isDarkMode ? "text-indigo-400" : "text-indigo-600"
        }`}>
          {dateString}
        </p>

        {/* Time - styled with whitespace-nowrap and responsive scaling so it never wraps */}
        <h1 className={`text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-mono tracking-tighter font-extrabold tabular-nums select-all drop-shadow-sm whitespace-nowrap transition-colors duration-500 ${
          isDarkMode ? "text-white" : "text-slate-950"
        }`}>
          {timeString}
        </h1>

        {/* Dynamic Focus Quote - short, elegant one-liner */}
        <p className={`text-base sm:text-lg md:text-xl font-serif italic max-w-2xl pt-4 leading-relaxed transition-colors duration-500 ${
          isDarkMode ? "text-slate-400" : "text-slate-600"
        }`}>
          "{displayQuote}"
        </p>

        {/* Minimal return text */}
        <span className={`text-[10px] font-mono tracking-widest uppercase opacity-40 pt-8 transition-colors duration-500 ${
          isDarkMode ? "text-slate-500" : "text-slate-400"
        }`}>
          Click anywhere to return
        </span>
      </div>
    </motion.div>
  );
};
