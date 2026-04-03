// Adhan Audio Service - handles scheduling, playback, notifications, and SW communication

export interface AdhanSettings {
  enabled: boolean;
  selectedAdhan: string;
  volume: number;
  preReminder: boolean; // 10 min before reminder
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
  { id: "adhan-custom", label: "Beautiful Adhan", file: "/audio/adhan-custom.mp3" },
];

const STORAGE_KEY = "adhan-settings";

const DEFAULT_SETTINGS: AdhanSettings = {
  enabled: false,
  selectedAdhan: "adhan-custom",
  volume: 0.8,
  preReminder: true,
  prayers: {
    Fajr: true,
    Sunrise: false,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
};

// Dynamic prayer schedule - loaded from API cache or defaults
function getPrayerSchedule(): Record<string, string> {
  try {
    const cached = localStorage.getItem("prayer-times-cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      if (parsed.date === todayStr && parsed.times) {
        return parsed.times;
      }
    }
  } catch {}
  // Fallback defaults (will be replaced once API loads)
  return {
    Fajr: "05:00",
    Sunrise: "06:30",
    Dhuhr: "12:30",
    Asr: "15:30",
    Maghrib: "18:00",
    Isha: "19:30",
  };
}

// Beautiful pre-reminder messages for each prayer
const PRE_REMINDER_MESSAGES: Record<string, { title: string; body: string }> = {
  Fajr: {
    title: "🌅🕋 Fajr in 10 minutes",
    body: "يا أيها المؤمن — The blessed dawn is near! \"الصلاة خير من النوم\" — Prayer is better than sleep. Make wudu and prepare your heart. The angels are witnessing. 🤲✨",
  },
  Sunrise: {
    title: "☀️🌄 Sunrise in 10 minutes",
    body: "سبحان الله — The sun is about to rise! A beautiful new day from Allah awaits you. Start it with gratitude, dhikr, and Ishraq prayer for abundant reward. 🌅🕌",
  },
  Dhuhr: {
    title: "☀️🕌 Dhuhr in 10 minutes",
    body: "حان وقت الظهر — Midday prayer is approaching! Pause your worldly affairs and prepare to stand before your Lord. \"أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ\" — In Allah's remembrance hearts find rest. 🤲💎",
  },
  Asr: {
    title: "🌤🕋 Asr in 10 minutes",
    body: "⚠️ حافظوا على الصلوات — Guard your prayers! The Prophet ﷺ said: \"Whoever misses Asr, it is as if they lost family and wealth.\" Make wudu now, don't let this prayer slip away! 🤲🔥",
  },
  Maghrib: {
    title: "🌅✨ Maghrib in 10 minutes",
    body: "الله أكبر — The sun is setting beautifully! Prepare for Maghrib prayer. If fasting, your iftar is near! May Allah fill your evening with barakah, mercy, and noor. 🕌🌙",
  },
  Isha: {
    title: "🌙⭐ Isha in 10 minutes",
    body: "يا عباد الله — The night prayer is near! \"وَمِنَ اللَّيْلِ فَاسْجُدْ لَهُ وَسَبِّحْهُ لَيْلًا طَوِيلًا\" — Prostrate and glorify Him. End your day with peace and Allah's forgiveness. 🤲🌟",
  },
};

// At-time messages
const PRAYER_TIME_MESSAGES: Record<string, { title: string; body: string }> = {
  Fajr: {
    title: "🕌 Allahu Akbar — Fajr",
    body: "It's time for Fajr prayer. Rise and shine for the sake of Allah! May He accept your worship. 🤲",
  },
  Sunrise: {
    title: "🌅 Sunrise — Ishraq Time",
    body: "The sun has risen. Time for Ishraq prayer if you wish. Have a blessed day! ☀️",
  },
  Dhuhr: {
    title: "🕌 Allahu Akbar — Dhuhr",
    body: "It's time for Dhuhr prayer. Pause your day and stand before your Lord. May Allah accept your salah. 🤲",
  },
  Asr: {
    title: "🕌 Allahu Akbar — Asr",
    body: "It's time for Asr prayer. Guard your prayer, especially the middle prayer. May Allah bless your efforts. 🤲",
  },
  Maghrib: {
    title: "🕌 Allahu Akbar — Maghrib",
    body: "It's time for Maghrib prayer. The sun has set — break your fast if fasting and pray. Barakallahu feek. 🤲",
  },
  Isha: {
    title: "🕌 Allahu Akbar — Isha",
    body: "It's time for Isha prayer. Complete your daily prayers and rest with a peaceful heart. May Allah grant you a blessed night. 🌙",
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
  syncSettingsToSW(settings);
}

// ─── Audio ───

let audioElement: HTMLAudioElement | null = null;
let scheduledTimers: number[] = [];
let wakeLock: any = null;
let isUnlocking = false; // Flag to suppress overlay during silent unlock

export function getAdhanAudio(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = "auto";
  }
  return audioElement;
}

export function isAudioUnlocking(): boolean {
  return isUnlocking;
}

/**
 * Browsers (especially iOS/Safari) often block scheduled audio unless the user has
 * interacted with the page at least once; calling this during a user gesture
 * primes/unlocks playback so Adhan can play later at prayer times.
 */
export function unlockAdhanAudio(settings: AdhanSettings): void {
  const option = ADHAN_OPTIONS.find((o) => o.id === settings.selectedAdhan) || ADHAN_OPTIONS[0];
  const audio = getAdhanAudio();

  isUnlocking = true;
  audio.src = option.file;
  audio.volume = 0;
  audio.loop = false;

  try {
    const p = audio.play();
    if (p) {
      p.then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = settings.volume;
        isUnlocking = false;
      }).catch(() => {
        isUnlocking = false;
      });
    } else {
      isUnlocking = false;
    }
  } catch {
    isUnlocking = false;
  }
}

export function playAdhan(settings: AdhanSettings): void {
  const option = ADHAN_OPTIONS.find((o) => o.id === settings.selectedAdhan) || ADHAN_OPTIONS[0];
  const audio = getAdhanAudio();
  audio.src = option.file;
  audio.volume = settings.volume;
  audio.loop = false;

  requestWakeLock();
  setupMediaSession(settings);

  const playPromise = audio.play();
  if (playPromise) {
    playPromise.catch((err) => {
      console.warn("Audio playback blocked:", err);
      triggerSWNotification(settings);
    });
  }

  audio.addEventListener("ended", () => {
    releaseWakeLock();
    clearMediaSession();
  }, { once: true });
  showAdhanNotification(settings);
}

export function muteAdhan(): void {
  if (audioElement) {
    audioElement.volume = 0;
  }
}

export function unmuteAdhan(volume?: number): void {
  if (audioElement) {
    audioElement.volume = volume ?? getAdhanSettings().volume;
  }
}

export function isAdhanPlaying(): boolean {
  return !!audioElement && !audioElement.paused && audioElement.currentTime > 0;
}

export function stopAdhan(): void {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
  releaseWakeLock();
  clearMediaSession();
}

// ─── Media Session API (lock screen controls) ───

function setupMediaSession(settings: AdhanSettings): void {
  if (!("mediaSession" in navigator)) return;

  const prayerName = getCurrentPrayerName(new Date()) || "Prayer";

  navigator.mediaSession.metadata = new MediaMetadata({
    title: `${prayerName} Adhan`,
    artist: ADHAN_OPTIONS.find((o) => o.id === settings.selectedAdhan)?.label || "Adhan",
    album: "Prayer Times",
    artwork: [
      { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  });

  navigator.mediaSession.setActionHandler("stop", () => stopAdhan());
  navigator.mediaSession.setActionHandler("pause", () => stopAdhan());
  navigator.mediaSession.setActionHandler("play", null);
  navigator.mediaSession.setActionHandler("previoustrack", null);
  navigator.mediaSession.setActionHandler("nexttrack", null);
}

function clearMediaSession(): void {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.setActionHandler("stop", null);
  navigator.mediaSession.setActionHandler("pause", null);
}

// ─── Wake Lock ───

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
  for (const [name, time] of Object.entries(getPrayerSchedule())) {
    if (time === currentTime) return name;
  }
  return null;
}

function showAdhanNotification(settings: AdhanSettings): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;
  const now = new Date();
  const prayerName = getCurrentPrayerName(now) || "Prayer";
  const msg = PRAYER_TIME_MESSAGES[prayerName] || { title: `🕌 ${prayerName} — Time to Pray`, body: `It's time for ${prayerName}. May Allah accept your prayers. 🤲` };

  const options: any = {
    body: msg.body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: "adhan-" + prayerName,
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200, 100, 200, 100, 400],
  };

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(msg.title, options);
    }).catch(() => {
      try { new Notification(msg.title, options); } catch {}
    });
  } else {
    try { new Notification(msg.title, options); } catch {}
  }
}

function showPreReminderNotification(prayerName: string): void {
  const msg = PRE_REMINDER_MESSAGES[prayerName] || { title: `⏰ ${prayerName} in 10 minutes`, body: `Prepare for ${prayerName} prayer. 🤲` };

  // Always show in-app toast so the user sees it even without notification permission
  import("sonner").then(({ toast }) => {
    toast(msg.title, {
      description: msg.body,
      duration: 15000,
    });
  }).catch(() => {});

  // Also show native device notification with device alarm sound
  if (!isNotificationSupported() || Notification.permission !== "granted") return;

  const options: any = {
    body: msg.body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: "pre-reminder-" + prayerName,
    requireInteraction: true,
    silent: false, // Uses device default notification/alarm sound
    vibrate: [200, 100, 200, 100, 200],
  };

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(msg.title, options);
    }).catch(() => {
      try { new Notification(msg.title, options); } catch {}
    });
  } else {
    try { new Notification(msg.title, options); } catch {}
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
        prayerSchedule: getPrayerSchedule(),
        preReminderMessages: PRE_REMINDER_MESSAGES,
        prayerTimeMessages: PRAYER_TIME_MESSAGES,
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
  const currentMs = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;

  for (const [prayerName, timeStr] of Object.entries(getPrayerSchedule())) {
    if (!settings.prayers[prayerName as keyof AdhanSettings["prayers"]]) continue;

    const [h, m] = (timeStr as string).split(":").map(Number);
    const prayerMs = h * 3600000 + m * 60000;

    // Schedule at prayer time
    let diffMs = prayerMs - currentMs;
    if (diffMs <= 0) diffMs += 86400000;

    const timerId = window.setTimeout(() => {
      const latest = getAdhanSettings();
      if (!latest.enabled) return;
      if (!latest.prayers[prayerName as keyof AdhanSettings["prayers"]]) return;

      playAdhan(latest);
      const nextTimer = window.setTimeout(() => scheduleAdhan(getAdhanSettings()), 2000);
      scheduledTimers.push(nextTimer);
    }, diffMs);
    scheduledTimers.push(timerId);

    // Schedule 10-minute-before reminder
    if (settings.preReminder) {
      let preMs = prayerMs - 600000 - currentMs; // 10 min before
      if (preMs <= 0) preMs += 86400000;

      const preTimerId = window.setTimeout(() => {
        // Re-check latest settings before showing reminder
        const latest = getAdhanSettings();
        if (!latest.enabled) return;
        if (!latest.preReminder) return;
        if (!latest.prayers[prayerName as keyof AdhanSettings["prayers"]]) return;
        showPreReminderNotification(prayerName);
      }, preMs);
      scheduledTimers.push(preTimerId);
      console.log(`Pre-reminder for ${prayerName} in ${Math.round(preMs / 60000)} min`);
    }

    console.log(`Adhan scheduled for ${prayerName} in ${Math.round(diffMs / 60000)} minutes`);
  }
}

// Register periodic sync for background adhan (when supported)
async function registerPeriodicSync() {
  if ("serviceWorker" in navigator && "periodicSync" in (await navigator.serviceWorker.ready)) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).periodicSync.register("adhan-check", {
        minInterval: 60 * 1000,
      });
    } catch (err) {
      console.log("Periodic sync not available:", err);
    }
  }
}

// ─── Init ───

function initGestureAudioUnlock() {
  // Ensure at least one trusted user gesture happens before we ever need scheduled audio.
  const handler = () => {
    try {
      unlockAdhanAudio(getAdhanSettings());
      console.log("[adhan] audio unlocked via user gesture");
    } catch (e) {
      console.log("[adhan] audio unlock failed", e);
    }
  };

  const opts: AddEventListenerOptions = { once: true, passive: true };
  document.addEventListener("touchstart", handler, opts);
  document.addEventListener("mousedown", handler, opts);
  document.addEventListener("keydown", handler, opts);
}

export function initAdhanService(): void {
  initGestureAudioUnlock();

  const settings = getAdhanSettings();

  if (settings.enabled) {
    scheduleAdhan(settings);
    syncSettingsToSW(settings);
    registerPeriodicSync();
  }

  listenForSWMessages();

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
