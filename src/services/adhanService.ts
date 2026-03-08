// Adhan Audio Service - handles scheduling, playback, notifications, and SW communication

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

// Prayer times (static for now - can be made dynamic with API)
const PRAYER_SCHEDULE: Record<string, string> = {
  Fajr: "05:23",
  Sunrise: "06:45",
  Dhuhr: "12:30",
  Asr: "15:45",
  Maghrib: "18:12",
  Isha: "19:42",
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
  // Sync to service worker for background scheduling
  syncSettingsToSW(settings);
}

// ─── Audio ───

let audioElement: HTMLAudioElement | null = null;
let scheduledTimers: number[] = [];
let wakeLock: any = null;

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

  // Request wake lock to keep screen/audio alive during playback
  requestWakeLock();

  const playPromise = audio.play();
  if (playPromise) {
    playPromise.catch((err) => {
      console.warn("Audio playback blocked:", err);
      // Fallback: trigger notification with vibration from SW
      triggerSWNotification(settings);
    });
  }

  // Release wake lock when audio ends
  audio.addEventListener("ended", () => releaseWakeLock(), { once: true });

  // Also fire notification
  showAdhanNotification(settings);
}

export function stopAdhan(): void {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
  releaseWakeLock();
}

// ─── Wake Lock (keeps audio playing with screen off) ───

async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await (navigator as any).wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    }
  } catch (err) {
    console.log("Wake Lock not available:", err);
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

// ─── Notifications ───

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): "granted" | "denied" | "default" | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<{ granted: boolean; reason?: string }> {
  if (!isNotificationSupported()) {
    return { granted: false, reason: "Notifications are not supported in this browser or context. Try opening the app directly (not in an iframe)." };
  }
  if (Notification.permission === "granted") return { granted: true };
  if (Notification.permission === "denied") {
    return { granted: false, reason: "Notifications are blocked. Please go to your browser settings and allow notifications for this site." };
  }
  try {
    const result = await Notification.requestPermission();
    if (result === "granted") return { granted: true };
    if (result === "denied") return { granted: false, reason: "Notification permission was denied. Please enable in browser settings." };
    return { granted: false, reason: "Notification permission was dismissed. Please try again and click 'Allow'." };
  } catch {
    return { granted: false, reason: "Could not request permission. Try opening the app in a new tab." };
  }
}

function getCurrentPrayerName(now: Date): string | null {
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  for (const [name, time] of Object.entries(PRAYER_SCHEDULE)) {
    if (time === currentTime) return name;
  }
  return null;
}

function showAdhanNotification(settings: AdhanSettings): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;
  const now = new Date();
  const prayerName = getCurrentPrayerName(now);

  const title = "🕌 Adhan - " + (prayerName || "Prayer Time");
  const body = `It's time for ${prayerName || "prayer"}. May Allah accept your prayers. 🤲`;
  const options: any = {
    body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: "adhan-" + (prayerName || "prayer"),
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200, 100, 200, 100, 400],
  };

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, options);
    }).catch(() => {
      try { new Notification(title, options); } catch {}
    });
  } else {
    try { new Notification(title, options); } catch {}
  }
}

// ─── Service Worker Communication ───

function syncSettingsToSW(settings: AdhanSettings) {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SCHEDULE_ADHAN",
      data: {
        ...settings,
        adhanOptions: ADHAN_OPTIONS,
        prayerSchedule: PRAYER_SCHEDULE,
      },
    });
  }
}

function triggerSWNotification(settings: AdhanSettings) {
  const now = new Date();
  const prayerName = getCurrentPrayerName(now) || "Prayer";
  const option = ADHAN_OPTIONS.find((o) => o.id === settings.selectedAdhan) || ADHAN_OPTIONS[0];

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "PLAY_ADHAN_NOTIFICATION",
      data: { prayerName, adhanFile: option.file },
    });
  }
}

// Listen for SW messages to play audio in foreground
function listenForSWMessages() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      const { type, data } = event.data || {};
      if (type === "PLAY_ADHAN_AUDIO") {
        const settings = getAdhanSettings();
        const audio = getAdhanAudio();
        audio.src = data.adhanFile;
        audio.volume = settings.volume;
        audio.play().catch(() => {});
      }
    });
  }
}

// ─── Scheduling ───

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
      // Reschedule
      const nextTimer = window.setTimeout(() => scheduleAdhan(settings), 2000);
      scheduledTimers.push(nextTimer);
    }, diffMs);

    scheduledTimers.push(timerId);
    console.log(`Adhan scheduled for ${prayerName} in ${Math.round(diffMs / 60000)} minutes`);
  }
}

// Register periodic sync for background adhan (when supported)
async function registerPeriodicSync() {
  if ("serviceWorker" in navigator && "periodicSync" in (await navigator.serviceWorker.ready)) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).periodicSync.register("adhan-check", {
        minInterval: 60 * 1000, // Check every minute
      });
      console.log("Periodic sync registered for adhan");
    } catch (err) {
      console.log("Periodic sync not available:", err);
    }
  }
}

// ─── Init ───

export function initAdhanService(): void {
  const settings = getAdhanSettings();
  
  if (settings.enabled) {
    scheduleAdhan(settings);
    syncSettingsToSW(settings);
    registerPeriodicSync();
  }

  // Listen for messages from SW
  listenForSWMessages();

  // Reschedule on visibility change
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      const s = getAdhanSettings();
      if (s.enabled) scheduleAdhan(s);
    }
  });

  // Keep-alive check every 30s
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
