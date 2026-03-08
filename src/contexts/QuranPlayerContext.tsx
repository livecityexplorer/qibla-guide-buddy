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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);
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

  // Wake Lock helpers - keeps audio playing with screen off
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

  // Re-acquire wake lock when page becomes visible again (it's auto-released on visibility change)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && state.isPlaying) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [state.isPlaying, requestWakeLock]);

  // Update MediaSession metadata with artwork
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

  // Update MediaSession playback state
  const updatePlaybackState = useCallback((playing: boolean) => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    }
  }, []);

  // Update MediaSession position state
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
        const nextIndex = prev.playlistIndex + 1;
        if (nextIndex < prev.playlist.length) {
          const nextAyah = prev.playlist[nextIndex];
          const url = getAyahAudioUrl(nextAyah.number, prev.reciter);
          audio.src = url;
          audio.play().catch(() => {});
          updateMediaSession(nextAyah, prev.currentSurahName);
          return { ...prev, currentAyah: nextAyah, playlistIndex: nextIndex, isPlaying: true };
        }
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

    // MediaSession action handlers for lock screen controls
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("stop", () => {
        audio.pause();
        audio.src = "";
        setState((s) => ({ ...s, isPlaying: false, currentAyah: null, playlist: [], playlistIndex: 0 }));
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
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        setState((prev) => {
          if (prev.playlistIndex > 0) {
            const i = prev.playlistIndex - 1;
            const ayah = prev.playlist[i];
            audio.src = getAyahAudioUrl(ayah.number, prev.reciter);
            audio.play().catch(() => {});
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
            audio.src = getAyahAudioUrl(ayah.number, prev.reciter);
            audio.play().catch(() => {});
            updateMediaSession(ayah, prev.currentSurahName);
            return { ...prev, currentAyah: ayah, playlistIndex: i };
          }
          return prev;
        });
      });
    }

    return () => {
      audio.pause();
      audio.src = "";
      releaseWakeLock();
    };
  }, [requestWakeLock, releaseWakeLock, updateMediaSession, updatePlaybackState, updatePositionState]);

  // Update MediaSession metadata when ayah changes
  useEffect(() => {
    if (state.currentAyah) {
      updateMediaSession(state.currentAyah, state.currentSurahName);
    }
  }, [state.currentAyah, state.currentSurahName, updateMediaSession]);

  const play = useCallback((ayah: Ayah, surahName: string, playlist?: Ayah[], startIndex?: number) => {
    const audio = audioRef.current!;
    const url = getAyahAudioUrl(ayah.number, state.reciter);
    audio.src = url;
    audio.play().catch(() => {});
    setState((s) => ({
      ...s,
      currentAyah: ayah,
      currentSurahName: surahName,
      playlist: playlist || [ayah],
      playlistIndex: startIndex ?? 0,
      isPlaying: true,
    }));
  }, [state.reciter]);

  const playAll = useCallback((ayahs: Ayah[], surahName: string) => {
    if (ayahs.length === 0) return;
    play(ayahs[0], surahName, ayahs, 0);
  }, [play]);

  const pause = useCallback(() => { audioRef.current?.pause(); }, []);
  const resume = useCallback(() => { audioRef.current?.play().catch(() => {}); }, []);
  const stop = useCallback(() => {
    const audio = audioRef.current!;
    audio.pause();
    audio.src = "";
    setState((s) => ({ ...s, isPlaying: false, currentAyah: null, playlist: [], playlistIndex: 0 }));
    releaseWakeLock();
    updatePlaybackState(false);
  }, [releaseWakeLock, updatePlaybackState]);

  const next = useCallback(() => {
    setState((prev) => {
      if (prev.playlistIndex < prev.playlist.length - 1) {
        const i = prev.playlistIndex + 1;
        const ayah = prev.playlist[i];
        const audio = audioRef.current!;
        audio.src = getAyahAudioUrl(ayah.number, prev.reciter);
        audio.play().catch(() => {});
        return { ...prev, currentAyah: ayah, playlistIndex: i, isPlaying: true };
      }
      return prev;
    });
  }, []);

  const prev = useCallback(() => {
    setState((prev) => {
      if (prev.playlistIndex > 0) {
        const i = prev.playlistIndex - 1;
        const ayah = prev.playlist[i];
        const audio = audioRef.current!;
        audio.src = getAyahAudioUrl(ayah.number, prev.reciter);
        audio.play().catch(() => {});
        return { ...prev, currentAyah: ayah, playlistIndex: i, isPlaying: true };
      }
      return prev;
    });
  }, []);

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
