import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { getSurahAudioWithTimings, getAyahAudioUrl, type Ayah, type VerseTiming } from "@/services/quranService";

interface PlayerState {
  isPlaying: boolean;
  currentAyah: Ayah | null;
  currentAyahIndex: number;
  currentSurahName: string;
  currentSurahNumber: number | null;
  reciter: string;
  playlist: Ayah[];
  playlistIndex: number;
  duration: number;
  currentTime: number;
  mode: "surah" | "ayah";
  verseTimings: VerseTiming[];
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
  const verseTimingsRef = useRef<VerseTiming[]>([]);
  const playlistRef = useRef<Ayah[]>([]);

  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentAyah: null,
    currentAyahIndex: 0,
    currentSurahName: "",
    currentSurahNumber: null,
    reciter: localStorage.getItem("quran-reciter") || "ar.alafasy",
    playlist: [],
    playlistIndex: 0,
    duration: 0,
    currentTime: 0,
    mode: "surah",
    verseTimings: [],
  });

  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => { wakeLockRef.current = null; });
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
      if (document.visibilityState === "visible" && state.isPlaying) requestWakeLock();
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

  // Determine current ayah from timestamp using verse timings
  const getCurrentAyahFromTime = useCallback((timeMs: number): number => {
    const timings = verseTimingsRef.current;
    if (!timings.length) return 0;
    for (let i = timings.length - 1; i >= 0; i--) {
      if (timeMs >= timings[i].timestampFrom) return i;
    }
    return 0;
  }, []);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      const timeMs = audio.currentTime * 1000;
      const ayahIdx = getCurrentAyahFromTime(timeMs);
      const pl = playlistRef.current;

      setState((s) => {
        const newAyah = pl[ayahIdx] || s.currentAyah;
        const changed = s.currentAyahIndex !== ayahIdx;
        return {
          ...s,
          currentTime: audio.currentTime,
          currentAyahIndex: ayahIdx,
          currentAyah: changed ? newAyah : s.currentAyah,
          playlistIndex: ayahIdx,
        };
      });
    });
    audio.addEventListener("loadedmetadata", () => {
      setState((s) => ({ ...s, duration: audio.duration }));
      updatePositionState();
    });
    audio.addEventListener("ended", () => {
      setState((prev) => {
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
        setState((s) => ({ ...s, isPlaying: false, currentAyah: null, currentSurahNumber: null, playlist: [], playlistIndex: 0, verseTimings: [] }));
        verseTimingsRef.current = [];
        playlistRef.current = [];
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
  }, [requestWakeLock, releaseWakeLock, updatePlaybackState, updatePositionState, getCurrentAyahFromTime]);

  useEffect(() => {
    if (state.currentSurahName) {
      const ayahInfo = state.currentAyah ? `Ayah ${state.currentAyah.numberInSurah}` : undefined;
      updateMediaSession(state.currentSurahName, ayahInfo);
    }
  }, [state.currentSurahName, state.currentAyah, updateMediaSession]);

  // Play full surah audio with verse timings
  const playAll = useCallback(async (ayahs: Ayah[], surahName: string, surahNumber: number) => {
    if (ayahs.length === 0) return;
    const audio = audioRef.current!;

    try {
      // Fetch audio URL with verse timings
      const audioInfo = await getSurahAudioWithTimings(surahNumber, state.reciter);
      verseTimingsRef.current = audioInfo.verseTimings;
      playlistRef.current = ayahs;

      audio.src = audioInfo.audioUrl;
      audio.play().catch(() => {});
      updateMediaSession(surahName);

      setState((s) => ({
        ...s,
        currentAyah: ayahs[0],
        currentAyahIndex: 0,
        currentSurahName: surahName,
        currentSurahNumber: surahNumber,
        playlist: ayahs,
        playlistIndex: 0,
        isPlaying: true,
        mode: "surah",
        verseTimings: audioInfo.verseTimings,
      }));
    } catch {
      // Fallback to CDN without timings
      const cdnUrl = `https://cdn.islamic.network/quran/audio-surah/128/${state.reciter}/${surahNumber}.mp3`;
      verseTimingsRef.current = [];
      playlistRef.current = ayahs;
      audio.src = cdnUrl;
      audio.play().catch(() => {});

      setState((s) => ({
        ...s,
        currentAyah: ayahs[0],
        currentAyahIndex: 0,
        currentSurahName: surahName,
        currentSurahNumber: surahNumber,
        playlist: ayahs,
        playlistIndex: 0,
        isPlaying: true,
        mode: "surah",
        verseTimings: [],
      }));
    }
  }, [state.reciter, updateMediaSession]);

  // Play a single ayah
  const play = useCallback((ayah: Ayah, surahName: string, playlist?: Ayah[], startIndex?: number) => {
    const audio = audioRef.current!;
    const url = getAyahAudioUrl(ayah.number, state.reciter);
    verseTimingsRef.current = [];
    playlistRef.current = playlist || [ayah];
    audio.src = url;
    audio.play().catch(() => {});
    updateMediaSession(surahName, `Ayah ${ayah.numberInSurah}`);
    setState((s) => ({
      ...s,
      currentAyah: ayah,
      currentAyahIndex: startIndex ?? 0,
      currentSurahName: surahName,
      playlist: playlist || [ayah],
      playlistIndex: startIndex ?? 0,
      isPlaying: true,
      mode: "ayah",
      verseTimings: [],
    }));
  }, [state.reciter, updateMediaSession]);

  const pause = useCallback(() => { audioRef.current?.pause(); }, []);
  const resume = useCallback(() => { audioRef.current?.play().catch(() => {}); }, []);
  const stop = useCallback(() => {
    const audio = audioRef.current!;
    audio.pause();
    audio.src = "";
    verseTimingsRef.current = [];
    playlistRef.current = [];
    setState((s) => ({ ...s, isPlaying: false, currentAyah: null, currentSurahName: "", currentSurahNumber: null, playlist: [], playlistIndex: 0, verseTimings: [] }));
    releaseWakeLock();
    updatePlaybackState(false);
  }, [releaseWakeLock, updatePlaybackState]);

  const next = useCallback(() => {}, []);
  const prev = useCallback(() => {}, []);

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
