// Adhan Audio Service - handles scheduling, playback, and notifications

export interface AdhanSettings {
  enabled: boolean;
  selectedAdhan: string;
  volume: number;
  prayers: {
    Fajr: boolean;
    Sunrise: boolean;
    Dhuhr: boolean;
    Asr: boolean;
    Maghrib: boolean;
    Isha: boolean;
  };
}

export const ADHAN_OPTIONS = [
  { id: "adhan-mishary", label: "Mishary Rashid Alafasy", file: "/audio/adhan-mishary.mp3" },
  { id: "adhan-nafees", label: "Ahmad al-Nafees", file: "/audio/adhan-nafees.mp3" },
  { id: "adhan-dubai", label: "Dubai One TV - Mishary", file: "/audio/adhan-dubai.mp3" },
];

const STORAGE_KEY = "adhan-settings";

const DEFAULT_SETTINGS: AdhanSettings = {
  enabled: false,
  selectedAdhan: "adhan-mishary",
  volume: 0.8,
  prayers: {
    Fajr: true,
    Sunrise: false,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
};

export function getAdhanSettings(): AdhanSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveAdhanSettings(settings: AdhanSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  // Re-schedule after saving
  scheduleAdhan(settings);
}

let audioElement: HTMLAudioElement | null = null;
let scheduledTimers: number[] = [];

export function getAdhanAudio(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = "auto";
  }
  return audioElement;
}

export function playAdhan(settings: AdhanSettings): void {
  const option = ADHAN_OPTIONS.find((o) => o.id === settings.selectedAdhan) || ADHAN_OPTIONS[0];
  const audio = getAdhanAudio();
  audio.src = option.file;
  audio.volume = settings.volume;
  audio.loop = false;

  // Try to play - may fail if no user gesture
  const playPromise = audio.play();
  if (playPromise) {
    playPromise.catch((err) => {
      console.warn("Audio playback blocked:", err);
      // Fallback: show notification with sound
    });
  }

  // Also fire a notification for background/screen-off
  showAdhanNotification(settings);
}

export function stopAdhan(): void {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function showAdhanNotification(settings: AdhanSettings): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const now = new Date();
  const prayerName = getCurrentPrayerName(now);

  // Use service worker notification for background support
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification("🕌 Adhan - " + (prayerName || "Prayer Time"), {
        body: `It's time for ${prayerName || "prayer"}. May Allah accept your prayers.`,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "adhan-notification",
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        silent: false,
      });
    });
  } else {
    new Notification("🕌 Adhan - " + (prayerName || "Prayer Time"), {
      body: `It's time for ${prayerName || "prayer"}. May Allah accept your prayers.`,
      icon: "/favicon.ico",
      tag: "adhan-notification",
      requireInteraction: true,
      silent: false,
    });
  }
}

// Prayer times (static for now - can be made dynamic with API)
const PRAYER_SCHEDULE: Record<string, string> = {
  Fajr: "05:23",
  Sunrise: "06:45",
  Dhuhr: "12:30",
  Asr: "15:45",
  Maghrib: "18:12",
  Isha: "19:42",
};

function getCurrentPrayerName(now: Date): string | null {
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  for (const [name, time] of Object.entries(PRAYER_SCHEDULE)) {
    if (time === currentTime) return name;
  }
  return null;
}

export function scheduleAdhan(settings: AdhanSettings): void {
  // Clear existing timers
  scheduledTimers.forEach((id) => clearTimeout(id));
  scheduledTimers = [];

  if (!settings.enabled) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const [prayerName, timeStr] of Object.entries(PRAYER_SCHEDULE)) {
    if (!settings.prayers[prayerName as keyof AdhanSettings["prayers"]]) continue;

    const [h, m] = timeStr.split(":").map(Number);
    const prayerMinutes = h * 60 + m;
    let diffMs = (prayerMinutes - currentMinutes) * 60 * 1000;

    // Subtract seconds already passed in this minute
    diffMs -= now.getSeconds() * 1000;

    if (diffMs <= 0) {
      // Already passed today, schedule for tomorrow
      diffMs += 24 * 60 * 60 * 1000;
    }

    const timerId = window.setTimeout(() => {
      playAdhan(settings);
      // Reschedule for the next day
      const nextTimer = window.setTimeout(() => {
        scheduleAdhan(settings);
      }, 1000);
      scheduledTimers.push(nextTimer);
    }, diffMs);

    scheduledTimers.push(timerId);
    console.log(`Adhan scheduled for ${prayerName} in ${Math.round(diffMs / 60000)} minutes`);
  }
}

// Initialize: register service worker message handler
export function initAdhanService(): void {
  const settings = getAdhanSettings();
  if (settings.enabled) {
    scheduleAdhan(settings);
  }

  // Listen for visibility changes to reschedule
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      const s = getAdhanSettings();
      if (s.enabled) scheduleAdhan(s);
    }
  });

  // Keep alive with periodic check (for background reliability)
  setInterval(() => {
    const s = getAdhanSettings();
    if (!s.enabled) return;
    const now = new Date();
    const prayerName = getCurrentPrayerName(now);
    if (prayerName && s.prayers[prayerName as keyof AdhanSettings["prayers"]]) {
      playAdhan(s);
    }
  }, 30000); // Check every 30 seconds
}
