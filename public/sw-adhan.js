// Custom service worker for Adhan background scheduling & notifications
// NOTE: This file is plain JS (no TypeScript) because it's loaded directly by the browser.

const ADHAN_CACHE = "adhan-audio-v2";
const ADHAN_FILES = ["/audio/adhan-custom.mp3"];

// Track scheduled timers
let scheduledTimers = [];
let lastPlayedKey = "";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(ADHAN_CACHE).then((cache) => cache.addAll(ADHAN_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const { type, data } = event.data || {};

  if (type === "SCHEDULE_ADHAN") {
    saveSettingsAndSchedule(data);
  }

  if (type === "PLAY_ADHAN_NOTIFICATION") {
    showAdhanNotificationWithSound(data);
  }

  if (type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        if (clients.length > 0) {
          return clients[0].focus();
        }
        return self.clients.openWindow("/prayer");
      })
  );
});

// ─── Scheduling inside Service Worker ───

function clearScheduledTimers() {
  scheduledTimers.forEach((id) => clearTimeout(id));
  scheduledTimers = [];
}

async function saveSettingsAndSchedule(settings) {
  // Save settings to cache
  const cache = await caches.open("adhan-settings");
  await cache.put(
    "/adhan-settings.json",
    new Response(JSON.stringify(settings), {
      headers: { "Content-Type": "application/json" },
    })
  );

  // Schedule timers inside the SW
  scheduleFromSettings(settings);
}

function scheduleFromSettings(settings) {
  clearScheduledTimers();

  if (!settings || !settings.enabled) return;

  const prayerSchedule = settings.prayerSchedule || {};
  const now = new Date();
  const currentMs =
    now.getHours() * 3600000 +
    now.getMinutes() * 60000 +
    now.getSeconds() * 1000;

  for (const [prayerName, timeStr] of Object.entries(prayerSchedule)) {
    if (!settings.prayers || !settings.prayers[prayerName]) continue;

    const [h, m] = timeStr.split(":").map(Number);
    const prayerMs = h * 3600000 + m * 60000;

    // Schedule adhan at prayer time
    let diffMs = prayerMs - currentMs;
    if (diffMs <= 0) diffMs += 86400000;
    // Only schedule if within 24h
    if (diffMs > 0 && diffMs < 86400000) {
      const tid = setTimeout(() => {
        fireAdhan(prayerName, settings);
      }, diffMs);
      scheduledTimers.push(tid);
      console.log(
        `[sw-adhan] Scheduled ${prayerName} in ${Math.round(diffMs / 60000)} min`
      );
    }

    // Schedule 10-min pre-reminder
    if (settings.preReminder) {
      let preMs = prayerMs - 600000 - currentMs;
      if (preMs <= 0) preMs += 86400000;
      if (preMs > 0 && preMs < 86400000) {
        const preId = setTimeout(() => {
          firePreReminder(prayerName, settings);
        }, preMs);
        scheduledTimers.push(preId);
        console.log(
          `[sw-adhan] Pre-reminder for ${prayerName} in ${Math.round(preMs / 60000)} min`
        );
      }
    }
  }

  // Also set up a periodic self-check every 30s to catch missed timers
  // (browsers may kill SW timers; this re-checks on wake)
  startPeriodicCheck();
}

let periodicCheckId = null;

function startPeriodicCheck() {
  if (periodicCheckId) clearInterval(periodicCheckId);
  periodicCheckId = setInterval(() => {
    checkAndPlayAdhan();
  }, 30000);
}

async function fireAdhan(prayerName, settings) {
  const key = prayerName + "-" + new Date().toDateString();
  if (lastPlayedKey === key) return; // Already played this prayer today
  lastPlayedKey = key;

  const adhanFile =
    settings.adhanOptions?.[0]?.file || "/audio/adhan-custom.mp3";

  // Show notification (works in background!)
  await showAdhanNotificationWithSound({ prayerName, adhanFile });

  // Re-schedule for remaining prayers
  const cache = await caches.open("adhan-settings");
  const response = await cache.match("/adhan-settings.json");
  if (response) {
    const latestSettings = await response.json();
    scheduleFromSettings(latestSettings);
  }
}

async function firePreReminder(prayerName, settings) {
  const preKey = "pre-" + prayerName + "-" + new Date().toDateString();
  if (lastPlayedKey === preKey) return;

  await showPreReminderNotification(prayerName, settings);
}

async function showAdhanNotificationWithSound(data) {
  const { prayerName, adhanFile } = data;

  let title = `🕌 ${prayerName} — Time to Pray`;
  let body = `It's time for ${prayerName}. May Allah accept your prayers. 🤲`;

  try {
    const cache = await caches.open("adhan-settings");
    const response = await cache.match("/adhan-settings.json");
    if (response) {
      const settings = await response.json();
      if (settings.prayerTimeMessages && settings.prayerTimeMessages[prayerName]) {
        title = settings.prayerTimeMessages[prayerName].title;
        body = settings.prayerTimeMessages[prayerName].body;
      }
    }
  } catch (e) {}

  await self.registration.showNotification(title, {
    body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: "adhan-" + prayerName,
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200, 100, 200, 100, 400],
    data: { prayerName, adhanFile },
    actions: [
      { action: "open", title: "Open App" },
      { action: "dismiss", title: "Dismiss" },
    ],
  });

  // Tell any open client windows to play the actual adhan audio
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of clients) {
    client.postMessage({
      type: "PLAY_ADHAN_AUDIO",
      data: { prayerName, adhanFile },
    });
  }
}

async function showPreReminderNotification(prayerName, settings) {
  let title = `⏰ ${prayerName} in 10 minutes`;
  let body = `Prepare for ${prayerName} prayer. 🤲`;

  try {
    if (settings && settings.preReminderMessages && settings.preReminderMessages[prayerName]) {
      title = settings.preReminderMessages[prayerName].title;
      body = settings.preReminderMessages[prayerName].body;
    } else {
      const cache = await caches.open("adhan-settings");
      const response = await cache.match("/adhan-settings.json");
      if (response) {
        const s = await response.json();
        if (s.preReminderMessages && s.preReminderMessages[prayerName]) {
          title = s.preReminderMessages[prayerName].title;
          body = s.preReminderMessages[prayerName].body;
        }
      }
    }
  } catch (e) {}

  await self.registration.showNotification(title, {
    body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: "pre-reminder-" + prayerName,
    requireInteraction: false,
    silent: false,
    vibrate: [100, 50, 100],
  });
}

async function checkAndPlayAdhan() {
  try {
    const cache = await caches.open("adhan-settings");
    const response = await cache.match("/adhan-settings.json");
    if (!response) return;

    const settings = await response.json();
    if (!settings.enabled) return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const prayerSchedule = settings.prayerSchedule || {};

    for (const [name, time] of Object.entries(prayerSchedule)) {
      if (!settings.prayers || !settings.prayers[name]) continue;

      // Check exact prayer time
      if (time === currentTime) {
        const key = name + "-" + now.toDateString();
        if (lastPlayedKey === key) continue;
        lastPlayedKey = key;

        const adhanFile =
          settings.adhanOptions?.[0]?.file || "/audio/adhan-custom.mp3";
        await showAdhanNotificationWithSound({
          prayerName: name,
          adhanFile,
        });
        break;
      }

      // Check 10-min pre-reminder
      if (settings.preReminder) {
        const [h, m] = time.split(":").map(Number);
        let preH = h;
        let preM = m - 10;
        if (preM < 0) {
          preM += 60;
          preH -= 1;
        }
        if (preH < 0) preH += 24;
        const preTime = `${String(preH).padStart(2, "0")}:${String(preM).padStart(2, "0")}`;
        if (preTime === currentTime) {
          await showPreReminderNotification(name, settings);
          break;
        }
      }
    }
  } catch (err) {
    console.error("[sw-adhan] Background check failed:", err);
  }
}
