import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { getAyahAudioUrl, type Ayah } from "@/services/quranService";

interface PlayerState {
  isPlaying: boolean;
  currentAyah: Ayah | null;
  currentSurahName: string;
  reciter: string;
  playlist: Ayah[];
  playlistIndex: number;
  duration: number;
  currentTime: number;
}

interface PlayerContextType extends PlayerState {
  play: (ayah: Ayah, surahName: string, playlist?: Ayah[], startIndex?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setReciter: (id: string) => void;
  playAll: (ayahs: Ayah[], surahName: string) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function useQuranPlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("useQuranPlayer must be used within QuranPlayerProvider");
  return ctx;
}

export function QuranPlayerProvider({ children }: { children: React.ReactNode }) {
  // Dual audio elements for gapless playback that survives screen-off
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioRef = useRef<"A" | "B">("A");
  const wakeLockRef = useRef<any>(null);

  const getActiveAudio = useCallback(() => {
    return activeAudioRef.current === "A" ? audioARef.current! : audioBRef.current!;
  }, []);

  const getInactiveAudio = useCallback(() => {
    return activeAudioRef.current === "A" ? audioBRef.current! : audioARef.current!;
  }, []);

  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentAyah: null,
    currentSurahName: "",
    reciter: localStorage.getItem("quran-reciter") || "ar.alafasy",
    playlist: [],
    playlistIndex: 0,
    duration: 0,
    currentTime: 0,
  });

  // Wake Lock helpers
  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      }
    } catch {}
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && state.isPlaying) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [state.isPlaying, requestWakeLock]);

  const updateMediaSession = useCallback((ayah: Ayah, surahName: string) => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Ayah ${ayah.numberInSurah}`,
        artist: "Holy Quran",
        album: surahName,
        artwork: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      });
    }
  }, []);

  const updatePlaybackState = useCallback((playing: boolean) => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    }
  }, []);

  const updatePositionState = useCallback(() => {
    if ("mediaSession" in navigator) {
      const audio = getActiveAudio();
      if (audio && audio.duration && isFinite(audio.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime,
          });
        } catch {}
      }
    }
  }, [getActiveAudio]);

  // Preload the next ayah into the inactive audio element
  const preloadNext = useCallback((playlist: Ayah[], currentIndex: number, reciter: string) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < playlist.length) {
      const nextAyah = playlist[nextIndex];
      const inactive = getInactiveAudio();
      if (inactive) {
        inactive.src = getAyahAudioUrl(nextAyah.number, reciter);
        inactive.preload = "auto";
        inactive.load();
      }
    }
  }, [getInactiveAudio]);

  // Swap to the preloaded audio element and play immediately
  const swapAndPlay = useCallback((nextAyah: Ayah, surahName: string) => {
    const currentActive = getActiveAudio();
    currentActive.pause();

    // Swap active
    activeAudioRef.current = activeAudioRef.current === "A" ? "B" : "A";
    const newActive = getActiveAudio();

    // Play the preloaded audio immediately - no src change needed, it's already loaded
    newActive.play().catch(() => {});
    updateMediaSession(nextAyah, surahName);
  }, [getActiveAudio, updateMediaSession]);

  // Setup both audio elements
  useEffect(() => {
    const audioA = new Audio();
    const audioB = new Audio();
    audioA.preload = "auto";
    audioB.preload = "auto";
    audioARef.current = audioA;
    audioBRef.current = audioB;

    const setupAudioEvents = (audio: HTMLAudioElement) => {
      audio.addEventListener("timeupdate", () => {
        // Only update if this is the active audio
        const active = activeAudioRef.current === "A" ? audioARef.current : audioBRef.current;
        if (audio === active) {
          setState((s) => ({ ...s, currentTime: audio.currentTime }));
        }
      });

      audio.addEventListener("loadedmetadata", () => {
        const active = activeAudioRef.current === "A" ? audioARef.current : audioBRef.current;
        if (audio === active) {
          setState((s) => ({ ...s, duration: audio.duration }));
        }
      });

      audio.addEventListener("ended", () => {
        const active = activeAudioRef.current === "A" ? audioARef.current : audioBRef.current;
        if (audio !== active) return; // Ignore events from inactive element

        setState((prev) => {
          const nextIndex = prev.playlistIndex + 1;
          if (nextIndex < prev.playlist.length) {
            const nextAyah = prev.playlist[nextIndex];
            const inactive = activeAudioRef.current === "A" ? audioBRef.current! : audioARef.current!;

            // Check if the inactive element is already preloaded with the right URL
            const expectedUrl = getAyahAudioUrl(nextAyah.number, prev.reciter);
            if (inactive.src === expectedUrl || inactive.src.endsWith(`/${nextAyah.number}.mp3`)) {
              // Swap to preloaded element
              audio.pause();
              activeAudioRef.current = activeAudioRef.current === "A" ? "B" : "A";
              inactive.play().catch(() => {});
            } else {
              // Fallback: load into inactive and swap
              inactive.src = expectedUrl;
              audio.pause();
              activeAudioRef.current = activeAudioRef.current === "A" ? "B" : "A";
              inactive.play().catch(() => {});
            }

            updateMediaSession(nextAyah, prev.currentSurahName);

            // Preload the one after next
            const afterNextIndex = nextIndex + 1;
            if (afterNextIndex < prev.playlist.length) {
              const afterNextAyah = prev.playlist[afterNextIndex];
              // The now-inactive element (previously active) can be reused
              audio.src = getAyahAudioUrl(afterNextAyah.number, prev.reciter);
              audio.preload = "auto";
              audio.load();
            }

            return { ...prev, currentAyah: nextAyah, playlistIndex: nextIndex, isPlaying: true };
          }
          updatePlaybackState(false);
          releaseWakeLock();
          return { ...prev, isPlaying: false };
        });
      });

      audio.addEventListener("play", () => {
        const active = activeAudioRef.current === "A" ? audioARef.current : audioBRef.current;
        if (audio === active) {
          setState((s) => ({ ...s, isPlaying: true }));
          updatePlaybackState(true);
          requestWakeLock();
        }
      });

      audio.addEventListener("pause", () => {
        const active = activeAudioRef.current === "A" ? audioARef.current : audioBRef.current;
        if (audio === active) {
          setState((s) => ({ ...s, isPlaying: false }));
          updatePlaybackState(false);
        }
      });
    };

    setupAudioEvents(audioA);
    setupAudioEvents(audioB);

    // MediaSession action handlers
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => {
        const active = activeAudioRef.current === "A" ? audioARef.current! : audioBRef.current!;
        active.play();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        const active = activeAudioRef.current === "A" ? audioARef.current! : audioBRef.current!;
        active.pause();
      });
      navigator.mediaSession.setActionHandler("stop", () => {
        audioA.pause(); audioA.src = "";
        audioB.pause(); audioB.src = "";
        setState((s) => ({ ...s, isPlaying: false, currentAyah: null, playlist: [], playlistIndex: 0 }));
        releaseWakeLock();
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        const active = activeAudioRef.current === "A" ? audioARef.current! : audioBRef.current!;
        if (details.seekTime != null) active.currentTime = details.seekTime;
      });
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        const active = activeAudioRef.current === "A" ? audioARef.current! : audioBRef.current!;
        active.currentTime = Math.max(0, active.currentTime - (details.seekOffset || 10));
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        const active = activeAudioRef.current === "A" ? audioARef.current! : audioBRef.current!;
        active.currentTime = Math.min(active.duration, active.currentTime + (details.seekOffset || 10));
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        setState((prev) => {
          if (prev.playlistIndex > 0) {
            const i = prev.playlistIndex - 1;
            const ayah = prev.playlist[i];
            const active = activeAudioRef.current === "A" ? audioARef.current! : audioBRef.current!;
            active.src = getAyahAudioUrl(ayah.number, prev.reciter);
            active.play().catch(() => {});
            updateMediaSession(ayah, prev.currentSurahName);
            return { ...prev, currentAyah: ayah, playlistIndex: i };
          }
          return prev;
        });
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        setState((prev) => {
          if (prev.playlistIndex < prev.playlist.length - 1) {
            const i = prev.playlistIndex + 1;
            const ayah = prev.playlist[i];
            const inactive = activeAudioRef.current === "A" ? audioBRef.current! : audioARef.current!;
            const active = activeAudioRef.current === "A" ? audioARef.current! : audioBRef.current!;
            active.pause();
            inactive.src = getAyahAudioUrl(ayah.number, prev.reciter);
            activeAudioRef.current = activeAudioRef.current === "A" ? "B" : "A";
            inactive.play().catch(() => {});
            updateMediaSession(ayah, prev.currentSurahName);
            return { ...prev, currentAyah: ayah, playlistIndex: i };
          }
          return prev;
        });
      });
    }

    return () => {
      audioA.pause(); audioA.src = "";
      audioB.pause(); audioB.src = "";
      releaseWakeLock();
    };
  }, [requestWakeLock, releaseWakeLock, updateMediaSession, updatePlaybackState]);

  useEffect(() => {
    if (state.currentAyah) {
      updateMediaSession(state.currentAyah, state.currentSurahName);
    }
  }, [state.currentAyah, state.currentSurahName, updateMediaSession]);

  const play = useCallback((ayah: Ayah, surahName: string, playlist?: Ayah[], startIndex?: number) => {
    const active = getActiveAudio();
    const url = getAyahAudioUrl(ayah.number, state.reciter);
    active.src = url;
    active.play().catch(() => {});

    const pl = playlist || [ayah];
    const idx = startIndex ?? 0;

    setState((s) => ({
      ...s,
      currentAyah: ayah,
      currentSurahName: surahName,
      playlist: pl,
      playlistIndex: idx,
      isPlaying: true,
    }));

    // Preload next ayah into inactive element
    preloadNext(pl, idx, state.reciter);
  }, [state.reciter, getActiveAudio, preloadNext]);

  const playAll = useCallback((ayahs: Ayah[], surahName: string) => {
    if (ayahs.length === 0) return;
    play(ayahs[0], surahName, ayahs, 0);
  }, [play]);

  const pause = useCallback(() => { getActiveAudio().pause(); }, [getActiveAudio]);
  const resume = useCallback(() => { getActiveAudio().play().catch(() => {}); }, [getActiveAudio]);
  const stop = useCallback(() => {
    const audioA = audioARef.current!;
    const audioB = audioBRef.current!;
    audioA.pause(); audioA.src = "";
    audioB.pause(); audioB.src = "";
    activeAudioRef.current = "A";
    setState((s) => ({ ...s, isPlaying: false, currentAyah: null, playlist: [], playlistIndex: 0 }));
    releaseWakeLock();
    updatePlaybackState(false);
  }, [releaseWakeLock, updatePlaybackState]);

  const next = useCallback(() => {
    setState((prev) => {
      if (prev.playlistIndex < prev.playlist.length - 1) {
        const i = prev.playlistIndex + 1;
        const ayah = prev.playlist[i];
        const active = getActiveAudio();
        const inactive = getInactiveAudio();

        // Check if inactive already has the next ayah preloaded
        const expectedUrl = getAyahAudioUrl(ayah.number, prev.reciter);
        if (inactive.src === expectedUrl || inactive.src.endsWith(`/${ayah.number}.mp3`)) {
          active.pause();
          activeAudioRef.current = activeAudioRef.current === "A" ? "B" : "A";
          inactive.play().catch(() => {});
        } else {
          active.src = expectedUrl;
          active.play().catch(() => {});
        }

        // Preload the one after
        const afterNext = i + 1;
        if (afterNext < prev.playlist.length) {
          const nowInactive = activeAudioRef.current === "A" ? audioBRef.current! : audioARef.current!;
          nowInactive.src = getAyahAudioUrl(prev.playlist[afterNext].number, prev.reciter);
          nowInactive.preload = "auto";
          nowInactive.load();
        }

        return { ...prev, currentAyah: ayah, playlistIndex: i, isPlaying: true };
      }
      return prev;
    });
  }, [getActiveAudio, getInactiveAudio]);

  const prev = useCallback(() => {
    setState((prev) => {
      if (prev.playlistIndex > 0) {
        const i = prev.playlistIndex - 1;
        const ayah = prev.playlist[i];
        const active = getActiveAudio();
        active.src = getAyahAudioUrl(ayah.number, prev.reciter);
        active.play().catch(() => {});

        // Preload the current (now next) into inactive
        const inactive = getInactiveAudio();
        if (prev.currentAyah) {
          inactive.src = getAyahAudioUrl(prev.currentAyah.number, prev.reciter);
          inactive.preload = "auto";
          inactive.load();
        }

        return { ...prev, currentAyah: ayah, playlistIndex: i, isPlaying: true };
      }
      return prev;
    });
  }, [getActiveAudio, getInactiveAudio]);

  const seek = useCallback((time: number) => {
    const active = getActiveAudio();
    if (active) {
      active.currentTime = time;
      updatePositionState();
    }
  }, [getActiveAudio, updatePositionState]);

  const setReciter = useCallback((id: string) => {
    localStorage.setItem("quran-reciter", id);
    setState((s) => ({ ...s, reciter: id }));
  }, []);

  return (
    <PlayerContext.Provider value={{ ...state, play, playAll, pause, resume, stop, next, prev, seek, setReciter }}>
      {children}
    </PlayerContext.Provider>
  );
}
