/// <reference lib="webworker" />

// Custom service worker for Adhan background audio + pre-reminders

declare const self: ServiceWorkerGlobalScope;

const ADHAN_CACHE = "adhan-audio-v2";
const ADHAN_FILES = [
  "/audio/adhan-custom.mp3",
];

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
    scheduleBackgroundAdhan(data);
  }

  if (type === "PLAY_ADHAN_NOTIFICATION") {
    showAdhanNotificationWithSound(data);
  }

  if (type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("periodicsync" as any, (event: any) => {
  if (event.tag === "adhan-check") {
    event.waitUntil(checkAndPlayAdhan());
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow("/prayer");
    })
  );
});

async function showAdhanNotificationWithSound(data: {
  prayerName: string;
  adhanFile: string;
}) {
  const { prayerName, adhanFile } = data;

  // Try to get custom message from cached settings
  let title = `🕌 ${prayerName} — Time to Pray`;
  let body = `It's time for ${prayerName}. May Allah accept your prayers. 🤲`;

  try {
    const cache = await caches.open("adhan-settings");
    const response = await cache.match("/adhan-settings.json");
    if (response) {
      const settings = await response.json();
      if (settings.prayerTimeMessages?.[prayerName]) {
        title = settings.prayerTimeMessages[prayerName].title;
        body = settings.prayerTimeMessages[prayerName].body;
      }
    }
  } catch {}

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

  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({
      type: "PLAY_ADHAN_AUDIO",
      data: { prayerName, adhanFile },
    });
  }
}

async function showPreReminderNotification(prayerName: string) {
  let title = `⏰ ${prayerName} in 10 minutes`;
  let body = `Prepare for ${prayerName} prayer. 🤲`;

  try {
    const cache = await caches.open("adhan-settings");
    const response = await cache.match("/adhan-settings.json");
    if (response) {
      const settings = await response.json();
      if (settings.preReminderMessages?.[prayerName]) {
        title = settings.preReminderMessages[prayerName].title;
        body = settings.preReminderMessages[prayerName].body;
      }
    }
  } catch {}

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

    const prayerSchedule: Record<string, string> = settings.prayerSchedule || {
      Fajr: "05:23", Sunrise: "06:45", Dhuhr: "12:30",
      Asr: "15:45", Maghrib: "18:12", Isha: "19:42",
    };

    for (const [name, time] of Object.entries(prayerSchedule)) {
      if (!settings.prayers[name]) continue;

      // Check for exact prayer time
      if (time === currentTime) {
        const option = settings.adhanOptions?.find((o: any) => o.id === settings.selectedAdhan);
        await showAdhanNotificationWithSound({
          prayerName: name,
          adhanFile: option?.file || "/audio/adhan-mishary.mp3",
        });
        break;
      }

      // Check for 10-minute pre-reminder
      if (settings.preReminder) {
        const [h, m] = (time as string).split(":").map(Number);
        let preH = h;
        let preM = m - 10;
        if (preM < 0) { preM += 60; preH -= 1; }
        if (preH < 0) preH += 24;
        const preTime = `${String(preH).padStart(2, "0")}:${String(preM).padStart(2, "0")}`;
        if (preTime === currentTime) {
          await showPreReminderNotification(name);
          break;
        }
      }
    }
  } catch (err) {
    console.error("Background adhan check failed:", err);
  }
}

function scheduleBackgroundAdhan(settings: any) {
  caches.open("adhan-settings").then((cache) => {
    cache.put(
      "/adhan-settings.json",
      new Response(JSON.stringify(settings), {
        headers: { "Content-Type": "application/json" },
      })
    );
  });
}
