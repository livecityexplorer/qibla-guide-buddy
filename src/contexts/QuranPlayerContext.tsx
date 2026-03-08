import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { getSurahAudioUrl, getAyahAudioUrl, type Ayah } from "@/services/quranService";

interface PlayerState {
  isPlaying: boolean;
  currentAyah: Ayah | null;
  currentSurahName: string;
  currentSurahNumber: number | null;
  reciter: string;
  playlist: Ayah[];
  playlistIndex: number;
  duration: number;
  currentTime: number;
  mode: "surah" | "ayah"; // surah = full file, ayah = single ayah
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
  playAll: (ayahs: Ayah[], surahName: string, surahNumber: number) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function useQuranPlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("useQuranPlayer must be used within QuranPlayerProvider");
  return ctx;
}

export function QuranPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentAyah: null,
    currentSurahName: "",
    currentSurahNumber: null,
    reciter: localStorage.getItem("quran-reciter") || "ar.alafasy",
    playlist: [],
    playlistIndex: 0,
    duration: 0,
    currentTime: 0,
    mode: "surah",
  });

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

  const updateMediaSession = useCallback((surahName: string, ayahInfo?: string) => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: ayahInfo || surahName,
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
    if ("mediaSession" in navigator && audioRef.current) {
      const audio = audioRef.current;
      if (audio.duration && isFinite(audio.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime,
          });
        } catch {}
      }
    }
  }, []);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setState((s) => ({ ...s, currentTime: audio.currentTime }));
    });
    audio.addEventListener("loadedmetadata", () => {
      setState((s) => ({ ...s, duration: audio.duration }));
      updatePositionState();
    });
    audio.addEventListener("ended", () => {
      setState((prev) => {
        // In surah mode, audio naturally ends when the full surah finishes
        updatePlaybackState(false);
        releaseWakeLock();
        return { ...prev, isPlaying: false };
      });
    });
    audio.addEventListener("play", () => {
      setState((s) => ({ ...s, isPlaying: true }));
      updatePlaybackState(true);
      requestWakeLock();
    });
    audio.addEventListener("pause", () => {
      setState((s) => ({ ...s, isPlaying: false }));
      updatePlaybackState(false);
    });

    // MediaSession action handlers
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("stop", () => {
        audio.pause();
        audio.src = "";
        setState((s) => ({ ...s, isPlaying: false, currentAyah: null, currentSurahNumber: null, playlist: [], playlistIndex: 0 }));
        releaseWakeLock();
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime != null) audio.currentTime = details.seekTime;
        updatePositionState();
      });
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
        updatePositionState();
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + (details.seekOffset || 10));
        updatePositionState();
      });
    }

    return () => {
      audio.pause();
      audio.src = "";
      releaseWakeLock();
    };
  }, [requestWakeLock, releaseWakeLock, updatePlaybackState, updatePositionState]);

  // Update MediaSession when surah changes
  useEffect(() => {
    if (state.currentSurahName) {
      updateMediaSession(state.currentSurahName);
    }
  }, [state.currentSurahName, updateMediaSession]);

  // Play full surah audio (continuous, no interruption on screen off)
  const playAll = useCallback((ayahs: Ayah[], surahName: string, surahNumber: number) => {
    if (ayahs.length === 0) return;
    const audio = audioRef.current!;
    const url = getSurahAudioUrl(surahNumber, state.reciter);
    audio.src = url;
    audio.play().catch(() => {});
    updateMediaSession(surahName);
    setState((s) => ({
      ...s,
      currentAyah: ayahs[0],
      currentSurahName: surahName,
      currentSurahNumber: surahNumber,
      playlist: ayahs,
      playlistIndex: 0,
      isPlaying: true,
      mode: "surah",
    }));
  }, [state.reciter, updateMediaSession]);

  // Play a single ayah (for tapping on individual ayah)
  const play = useCallback((ayah: Ayah, surahName: string, playlist?: Ayah[], startIndex?: number) => {
    const audio = audioRef.current!;
    const url = getAyahAudioUrl(ayah.number, state.reciter);
    audio.src = url;
    audio.play().catch(() => {});
    updateMediaSession(surahName, `Ayah ${ayah.numberInSurah}`);
    setState((s) => ({
      ...s,
      currentAyah: ayah,
      currentSurahName: surahName,
      playlist: playlist || [ayah],
      playlistIndex: startIndex ?? 0,
      isPlaying: true,
      mode: "ayah",
    }));
  }, [state.reciter, updateMediaSession]);

  const pause = useCallback(() => { audioRef.current?.pause(); }, []);
  const resume = useCallback(() => { audioRef.current?.play().catch(() => {}); }, []);
  const stop = useCallback(() => {
    const audio = audioRef.current!;
    audio.pause();
    audio.src = "";
    setState((s) => ({ ...s, isPlaying: false, currentAyah: null, currentSurahNumber: null, playlist: [], playlistIndex: 0 }));
    releaseWakeLock();
    updatePlaybackState(false);
  }, [releaseWakeLock, updatePlaybackState]);

  const next = useCallback(() => { /* No-op in surah mode */ }, []);
  const prev = useCallback(() => { /* No-op in surah mode */ }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      updatePositionState();
    }
  }, [updatePositionState]);

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
