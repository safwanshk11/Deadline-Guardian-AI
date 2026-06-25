import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Task, MotivationData } from "../types";
import { AudioEngine, SoundType } from "../lib/audioEngine";
import { 
  Volume2, 
  VolumeX, 
  Wind, 
  Sparkles, 
  Waves, 
  Compass, 
  Music,
  Sliders,
  Volume1,
  Maximize,
  Minimize
} from "lucide-react";

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
  const [isMilitaryTime, setIsMilitaryTime] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundType, setSoundType] = useState<SoundType>("none");
  const [volume, setVolume] = useState<number>(50); // 0 to 100
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);

  const audioEngine = useRef<AudioEngine | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Error exiting fullscreen:", err);
      });
    }
  };

  const resetIdleTimer = () => {
    setShowControls(true);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2500); // 2.5 seconds of stillness hides the controls
  };

  // Setup/cleanup mousemove listeners inside the FocusRoom component
  useEffect(() => {
    const handleMouseMove = () => {
      resetIdleTimer();
    };

    window.addEventListener("mousemove", handleMouseMove);
    // Trigger initial brief display
    resetIdleTimer();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  // Initialize and cleanup AudioEngine
  useEffect(() => {
    audioEngine.current = new AudioEngine();
    // Sync initial state
    audioEngine.current.setVolume(volume / 100);
    
    return () => {
      if (audioEngine.current) {
        audioEngine.current.stop();
      }
    };
  }, []);

  // Sync volume level
  useEffect(() => {
    if (audioEngine.current) {
      if (isMuted) {
        audioEngine.current.setVolume(0);
      } else {
        audioEngine.current.setVolume(volume / 100);
      }
    }
  }, [volume, isMuted]);

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
    hour12: !isMilitaryTime,
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

  const handleSelectSound = (type: SoundType) => {
    setSoundType(type);
    if (audioEngine.current) {
      if (type === "none") {
        audioEngine.current.stop();
      } else {
        audioEngine.current.play(type);
      }
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Sound scenes descriptions
  const soundScenes = [
    { type: "none" as SoundType, label: "Mute", icon: VolumeX, color: "text-slate-400 hover:text-slate-200" },
    { type: "binaural" as SoundType, label: "Brainwave Theta", icon: Sparkles, color: "text-purple-400 hover:text-purple-300" },
    { type: "ocean" as SoundType, label: "Tidal Ocean Sweep", icon: Waves, color: "text-teal-400 hover:text-teal-350" },
    { type: "rain" as SoundType, label: "Steady Forest Rain", icon: Wind, color: "text-sky-400 hover:text-sky-350" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onExit}
      className={`group w-full h-screen flex flex-col justify-center items-center p-4 sm:p-12 cursor-pointer select-none transition-colors duration-700 relative overflow-hidden ${
        isDarkMode
          ? "bg-slate-950 text-slate-100"
          : "bg-slate-50 text-slate-900"
      }`}
      id="immersive-focus-room"
    >
      {/* REAL FULLSCREEN TOGGLE BUTTON */}
      <button
        id="focus-room-fullscreen-btn"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit Fullscreen Mode" : "Enter Immersive Fullscreen Mode"}
        className={`absolute top-6 right-6 p-2.5 rounded-xl border z-50 transition-all duration-300 cursor-pointer flex items-center justify-center ${
          showControls ? "opacity-100 translate-y-0 animate-pulse" : "opacity-0 -translate-y-4 pointer-events-none"
        } ${
          isDarkMode 
            ? "bg-slate-900/80 border-slate-800/80 text-slate-400 hover:text-indigo-400 hover:bg-slate-800" 
            : "bg-white/80 border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
        }`}
      >
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </button>

      <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-full px-4 mb-24">
        {/* Date */}
        <p className={`text-xs sm:text-sm font-mono uppercase tracking-[0.25em] font-semibold transition-colors duration-500 ${
          isDarkMode ? "text-indigo-400" : "text-indigo-600"
        }`}>
          {dateString}
        </p>

        {/* Time - styled with whitespace-nowrap and responsive scaling so it never wraps. Click toggles military time format. */}
        <h1 
          id="focus-room-time-display"
          onClick={(e) => {
            e.stopPropagation();
            setIsMilitaryTime(!isMilitaryTime);
          }}
          title="Click to toggle between 12-hour and 24-hour (military) format"
          className={`text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-mono tracking-tighter font-extrabold tabular-nums select-none drop-shadow-sm whitespace-nowrap transition-all duration-500 cursor-pointer hover:text-indigo-400 active:scale-95 ${
            isDarkMode ? "text-white hover:text-indigo-400" : "text-slate-950 hover:text-indigo-600"
          }`}
        >
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
          Click anywhere to return to Dashboard
        </span>
      </div>

      {/* FLOATING PROCEDURAL AMBIENT SOUND CONTROLLER CARD */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-8 max-w-xl w-11/12 border rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-5 shadow-2xl backdrop-blur-md transition-all duration-500 ease-out cursor-default ${
          showControls
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-8 pointer-events-none"
        } ${
          isDarkMode 
            ? "bg-slate-900/80 border-slate-800/80 shadow-black/60 text-slate-200" 
            : "bg-white/80 border-slate-200 shadow-slate-200/50 text-slate-800"
        }`}
      >
        {/* Playback status waveform indicator */}
        <div className="flex flex-col items-center md:items-start space-y-1 shrink-0">
          <div className="flex items-center gap-2">
            <Music className={`w-4 h-4 ${soundType !== "none" ? "animate-spin text-indigo-400" : "text-slate-400"}`} />
            <span className="text-[10px] font-mono font-black uppercase tracking-wider">
              Focus Atmosphere
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {soundType === "none" ? "Ambient sound disabled" : soundScenes.find(s => s.type === soundType)?.label}
          </span>
        </div>

        {/* Channels/Presets */}
        <div className="flex items-center gap-1.5">
          {soundScenes.map((scene) => {
            const IconComponent = scene.icon;
            const isActive = soundType === scene.type;
            return (
              <button
                key={scene.type}
                title={scene.label}
                onClick={() => handleSelectSound(scene.type)}
                className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-center relative ${
                  isActive 
                    ? "bg-indigo-600 border-indigo-500 text-white scale-115 shadow-md shadow-indigo-500/20" 
                    : isDarkMode
                      ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Volume & Mute slider panel */}
        <div className="flex items-center gap-3 w-full md:w-32 lg:w-40">
          <button
            onClick={handleToggleMute}
            className={`cursor-pointer p-1.5 rounded-lg transition-colors ${
              isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : volume < 40 ? (
              <Volume1 className="w-4 h-4 text-indigo-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-indigo-400" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${isMuted ? 0 : volume}%, ${isDarkMode ? "#334155" : "#e2e8f0"} ${isMuted ? 0 : volume}%, ${isDarkMode ? "#334155" : "#e2e8f0"} 100%)`
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

