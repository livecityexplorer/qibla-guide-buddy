import { useState, useEffect, useCallback } from "react";
import {
  type AdhanSettings,
  getAdhanSettings,
  saveAdhanSettings,
  requestNotificationPermission,
  playAdhan,
  stopAdhan,
  getAdhanAudio,
} from "@/services/adhanService";

export function useAdhan() {
  const [settings, setSettings] = useState<AdhanSettings>(getAdhanSettings);
  const [notificationGranted, setNotificationGranted] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = getAdhanAudio();
    const onPlay = () => setIsPlaying(true);
    const onEnded = () => setIsPlaying(false);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  const updateSettings = useCallback((partial: Partial<AdhanSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveAdhanSettings(next);
      return next;
    });
  }, []);

  const togglePrayer = useCallback((prayer: keyof AdhanSettings["prayers"]) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        prayers: { ...prev.prayers, [prayer]: !prev.prayers[prayer] },
      };
      saveAdhanSettings(next);
      return next;
    });
  }, []);

  const enableAdhan = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotificationGranted(granted);
    updateSettings({ enabled: true });
  }, [updateSettings]);

  const disableAdhan = useCallback(() => {
    updateSettings({ enabled: false });
    stopAdhan();
  }, [updateSettings]);

  const testAdhan = useCallback(() => {
    playAdhan(settings);
  }, [settings]);

  const stopPlayback = useCallback(() => {
    stopAdhan();
  }, []);

  return {
    settings,
    notificationGranted,
    isPlaying,
    updateSettings,
    togglePrayer,
    enableAdhan,
    disableAdhan,
    testAdhan,
    stopPlayback,
  };
}
