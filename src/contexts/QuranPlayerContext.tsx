import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { getAyahAudioUrl, type Ayah } from "@/services/quranService";

interface PlayerState {
  isPlaying: boolean;
  currentAyah: Ayah | null;
  currentSurahName: string;
  reciter: string;
  playlist: Ayah[];       // list of ayahs to play through
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
    });
    audio.addEventListener("ended", () => {
      // Auto-advance to next ayah
      setState((prev) => {
        const nextIndex = prev.playlistIndex + 1;
        if (nextIndex < prev.playlist.length) {
          const nextAyah = prev.playlist[nextIndex];
          const url = getAyahAudioUrl(nextAyah.number, prev.reciter);
          audio.src = url;
          audio.play().catch(() => {});
          return { ...prev, currentAyah: nextAyah, playlistIndex: nextIndex, isPlaying: true };
        }
        return { ...prev, isPlaying: false };
      });
    });
    audio.addEventListener("play", () => setState((s) => ({ ...s, isPlaying: true })));
    audio.addEventListener("pause", () => setState((s) => ({ ...s, isPlaying: false })));

    // MediaSession API for lock screen / notification controls
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        setState((prev) => {
          if (prev.playlistIndex > 0) {
            const i = prev.playlistIndex - 1;
            const ayah = prev.playlist[i];
            audio.src = getAyahAudioUrl(ayah.number, prev.reciter);
            audio.play().catch(() => {});
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
            return { ...prev, currentAyah: ayah, playlistIndex: i };
          }
          return prev;
        });
      });
    }

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Update MediaSession metadata
  useEffect(() => {
    if ("mediaSession" in navigator && state.currentAyah) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Ayah ${state.currentAyah.numberInSurah}`,
        artist: "Holy Quran",
        album: state.currentSurahName,
      });
    }
  }, [state.currentAyah, state.currentSurahName]);

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
  }, []);

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
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

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
