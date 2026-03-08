import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  type AdhanSettings,
  getAdhanSettings,
  saveAdhanSettings,
  requestNotificationPermission,
  getNotificationPermission,
  playAdhan,
  stopAdhan,
  getAdhanAudio,
  scheduleAdhan,
} from "@/services/adhanService";

export function useAdhan() {
  const [settings, setSettings] = useState<AdhanSettings>(getAdhanSettings);
  const [notificationGranted, setNotificationGranted] = useState(
    getNotificationPermission() === "granted"
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Keep permission state in sync
  useEffect(() => {
    const check = () => setNotificationGranted(getNotificationPermission() === "granted");
    check();
    // Re-check when page becomes visible (user may have changed browser settings)
    const onVisibility = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

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
    const { granted, reason } = await requestNotificationPermission();
    setNotificationGranted(granted);

    if (granted) {
      updateSettings({ enabled: true });
      toast.success("Adhan notifications enabled ✅", {
        description: "You'll be notified at prayer times insha'Allah",
      });
    } else {
      // Still enable adhan for audio playback even without notification permission
      updateSettings({ enabled: true });
      toast.warning("Adhan enabled (audio only)", {
        description: reason || "Notifications couldn't be enabled. Adhan audio will still play when the app is open.",
        duration: 6000,
      });
    }
  }, [updateSettings]);

  const disableAdhan = useCallback(() => {
    updateSettings({ enabled: false });
    stopAdhan();
    toast.info("Adhan notifications disabled");
  }, [updateSettings]);

  const testAdhan = useCallback(() => {
    playAdhan(settings);
    toast.success("Playing test Adhan 🔊");
  }, [settings]);

  const stopPlayback = useCallback(() => {
    stopAdhan();
    toast.info("Adhan stopped");
  }, []);

  // Re-schedule when settings change
  useEffect(() => {
    if (settings.enabled) {
      scheduleAdhan(settings);
    }
  }, [settings]);

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
