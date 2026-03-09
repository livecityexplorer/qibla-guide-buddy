// Prayer Times Service - fetches accurate times from Aladhan API based on user location

export interface PrayerTimesData {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface AladhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

const CACHE_KEY = "prayer-times-cache";
const LOCATION_KEY = "prayer-location-cache";

interface CachedTimes {
  date: string;
  times: PrayerTimesData;
  locationName: string;
}

interface CachedLocation {
  lat: number;
  lng: number;
  name: string;
  timestamp: number;
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function stripTimeZoneSuffix(time: string): string {
  // Aladhan returns "05:23 (EET)" — strip the parenthetical
  return time.replace(/\s*\(.*\)/, "").trim();
}

export function getCachedPrayerTimes(): { times: PrayerTimesData; locationName: string } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedTimes = JSON.parse(raw);
    if (cached.date === getTodayStr()) {
      return { times: cached.times, locationName: cached.locationName };
    }
  } catch {}
  return null;
}

function getCachedLocation(): CachedLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    const loc: CachedLocation = JSON.parse(raw);
    // Cache location for 1 hour
    if (Date.now() - loc.timestamp < 3600000) return loc;
  } catch {}
  return null;
}

function saveCachedLocation(lat: number, lng: number, name: string) {
  localStorage.setItem(LOCATION_KEY, JSON.stringify({ lat, lng, name, timestamp: Date.now() }));
}

function saveCachedTimes(times: PrayerTimesData, locationName: string) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ date: getTodayStr(), times, locationName }));
}

export function getUserLocation(): Promise<{ lat: number; lng: number }> {
  const cached = getCachedLocation();
  if (cached) return Promise.resolve({ lat: cached.lat, lng: cached.lng });

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  });
}

export async function fetchPrayerTimes(lat: number, lng: number): Promise<{ times: PrayerTimesData; locationName: string }> {
  // Check cache first
  const cached = getCachedPrayerTimes();
  if (cached) return cached;

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  // Method 2 = ISNA, you can change: 1=MWL, 2=ISNA, 3=Egypt, 4=Makkah, 5=Karachi, etc.
  const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=2`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch prayer times");

  const json = await res.json();
  const timings: AladhanTimings = json.data.timings;
  const meta = json.data.meta;

  const times: PrayerTimesData = {
    Fajr: stripTimeZoneSuffix(timings.Fajr),
    Sunrise: stripTimeZoneSuffix(timings.Sunrise),
    Dhuhr: stripTimeZoneSuffix(timings.Dhuhr),
    Asr: stripTimeZoneSuffix(timings.Asr),
    Maghrib: stripTimeZoneSuffix(timings.Maghrib),
    Isha: stripTimeZoneSuffix(timings.Isha),
  };

  const locationName = meta?.timezone || "Your Location";

  saveCachedLocation(lat, lng, locationName);
  saveCachedTimes(times, locationName);

  return { times, locationName };
}

export async function getPrayerTimes(): Promise<{ times: PrayerTimesData; locationName: string }> {
  // Try cache first
  const cached = getCachedPrayerTimes();
  if (cached) return cached;

  const { lat, lng } = await getUserLocation();
  return fetchPrayerTimes(lat, lng);
}
