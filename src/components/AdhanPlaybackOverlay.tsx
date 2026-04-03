import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Square, VolumeX, Volume2 } from "lucide-react";
import { getAdhanAudio, stopAdhan, muteAdhan, unmuteAdhan, getAdhanSettings, isAudioUnlocking } from "@/services/adhanService";

const AdhanPlaybackOverlay = () => {
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = getAdhanAudio();
    const show = () => {
      // Don't show overlay during silent unlock
      if (isAudioUnlocking()) return;
      if (audio.volume === 0) return;
      setVisible(true);
      setMuted(false);
    };
    const hide = () => { setVisible(false); setMuted(false); };

    audio.addEventListener("play", show);
    audio.addEventListener("ended", hide);
    audio.addEventListener("pause", hide);

    // Check if already playing
    if (!audio.paused && audio.currentTime > 0) setVisible(true);

    return () => {
      audio.removeEventListener("play", show);
      audio.removeEventListener("ended", hide);
      audio.removeEventListener("pause", hide);
    };
  }, []);

  const handleStop = () => {
    stopAdhan();
    setVisible(false);
  };

  const handleToggleMute = () => {
    if (muted) {
      unmuteAdhan(getAdhanSettings().volume);
      setMuted(false);
    } else {
      muteAdhan();
      setMuted(true);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-[100] flex items-center justify-between gap-3 rounded-2xl bg-primary p-4 shadow-2xl"
        >
          {/* Pulsing indicator */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <span className="text-lg">🕌</span>
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary-foreground truncate">Adhan Playing</p>
              <p className="text-xs text-primary-foreground/70">Allahu Akbar</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleToggleMute}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground active:scale-95 transition-transform"
              aria-label={muted ? "Unmute Adhan" : "Mute Adhan"}
            >
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button
              onClick={handleStop}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-destructive-foreground active:scale-95 transition-transform"
              aria-label="Stop Adhan"
            >
              <Square size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdhanPlaybackOverlay;
