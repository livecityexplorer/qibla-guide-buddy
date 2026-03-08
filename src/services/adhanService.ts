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
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed, prayers: { ...DEFAULT_SETTINGS.prayers, ...parsed.prayers } };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveAdhanSettings(settings: AdhanSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
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

  const playPromise = audio.play();
  if (playPromise) {
    playPromise.catch((err) => {
      console.warn("Audio playback blocked:", err);
    });
  }

  showAdhanNotification(settings);
}

export function stopAdhan(): void {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
}

/** Check if notifications are supported in the current context */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Check current notification permission state */
export function getNotificationPermission(): "granted" | "denied" | "default" | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Request notification permission.
 * Returns: { granted: boolean, reason?: string }
 */
export async function requestNotificationPermission(): Promise<{ granted: boolean; reason?: string }> {
  if (!isNotificationSupported()) {
    return { granted: false, reason: "Notifications are not supported in this browser or context. Try opening the app directly (not in an iframe)." };
  }
  
  if (Notification.permission === "granted") {
    return { granted: true };
  }
  
  if (Notification.permission === "denied") {
    return { granted: false, reason: "Notifications are blocked. Please go to your browser settings and allow notifications for this site, then try again." };
  }
  
  try {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      return { granted: true };
    }
    if (result === "denied") {
      return { granted: false, reason: "Notification permission was denied. Please enable notifications in your browser settings." };
    }
    return { granted: false, reason: "Notification permission was dismissed. Please try again and click 'Allow' when prompted." };
  } catch (err) {
    return { granted: false, reason: "Could not request notification permission. This may happen in embedded previews — try opening the app in a new tab." };
  }
}

function showAdhanNotification(settings: AdhanSettings): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;

  const now = new Date();
  const prayerName = getCurrentPrayerName(now);

  const title = "🕌 Adhan - " + (prayerName || "Prayer Time");
  const body = `It's time for ${prayerName || "prayer"}. May Allah accept your prayers.`;
  const options = {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: "adhan-notification",
    requireInteraction: true,
    silent: false,
  };

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, options);
    }).catch(() => {
      new Notification(title, options);
    });
  } else {
    try {
      new Notification(title, options);
    } catch {}
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
    diffMs -= now.getSeconds() * 1000;

    if (diffMs <= 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    const timerId = window.setTimeout(() => {
      playAdhan(settings);
      const nextTimer = window.setTimeout(() => {
        scheduleAdhan(settings);
      }, 1000);
      scheduledTimers.push(nextTimer);
    }, diffMs);

    scheduledTimers.push(timerId);
    console.log(`Adhan scheduled for ${prayerName} in ${Math.round(diffMs / 60000)} minutes`);
  }
}

export function initAdhanService(): void {
  const settings = getAdhanSettings();
  if (settings.enabled) {
    scheduleAdhan(settings);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      const s = getAdhanSettings();
      if (s.enabled) scheduleAdhan(s);
    }
  });

  setInterval(() => {
    const s = getAdhanSettings();
    if (!s.enabled) return;
    const now = new Date();
    const prayerName = getCurrentPrayerName(now);
    if (prayerName && s.prayers[prayerName as keyof AdhanSettings["prayers"]]) {
      playAdhan(s);
    }
  }, 30000);
}
