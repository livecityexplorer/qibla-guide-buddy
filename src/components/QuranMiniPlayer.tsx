import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useQuranPlayer } from "@/contexts/QuranPlayerContext";
import { Slider } from "@/components/ui/slider";

function formatTime(s: number): string {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const QuranMiniPlayer = () => {
  const { isPlaying, currentSurahName, currentTime, duration, pause, resume, stop, seek, mode } = useQuranPlayer();
  const [expanded, setExpanded] = useState(false);

  if (!currentSurahName) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-16 left-0 right-0 z-50"
      >
        {/* Expanded view */}
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mx-2 mb-1 rounded-t-2xl bg-card border border-border border-b-0 p-4 shadow-lg"
          >
            <div className="text-center mb-3">
              <p className="text-lg font-arabic font-bold text-foreground leading-loose">
                {currentSurahName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {mode === "surah" ? "Full Surah" : "Single Ayah"}
              </p>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                max={duration || 1}
                step={0.5}
                onValueChange={([v]) => seek(v)}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
            </div>
          </motion.div>
        )}

        {/* Mini bar */}
        <div className="mx-2 rounded-2xl bg-card border border-border shadow-lg overflow-hidden">
          <div className="flex items-center gap-3 p-3">
            <button onClick={() => setExpanded(!expanded)} className="shrink-0">
              <ChevronUp size={16} className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{currentSurahName}</p>
              <p className="text-xs text-muted-foreground">
                {mode === "surah" ? formatTime(currentTime) + " / " + formatTime(duration) : "Single Ayah"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={isPlaying ? pause : resume}
                className="p-2 rounded-full gradient-emerald"
              >
                {isPlaying ? <Pause size={16} className="text-primary-foreground" /> : <Play size={16} className="text-primary-foreground" />}
              </button>
              <button onClick={stop} className="p-1.5 rounded-full hover:bg-secondary">
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-secondary">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuranMiniPlayer;
