import { useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, BookOpen, Compass, ScanLine, MapPin, Moon, Star, ShieldAlert, CloudSun, MapPinned, Calendar, RotateCcw, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-mosque.jpg";
import { getDailyHadith } from "@/services/hadithService";
import { getCachedPrayerTimes, getPrayerTimes, type PrayerTimesData } from "@/services/prayerTimesService";

const DHIKR_OPTIONS = [
  { key: "subhanAllah", arabic: "سبحان الله", target: 33 },
  { key: "alhamdulillah", arabic: "الحمد لله", target: 33 },
  { key: "allahuAkbar", arabic: "الله أكبر", target: 34 },
  { key: "laIlahaIllallah", arabic: "لا إله إلا الله", target: 100 },
  { key: "astaghfirullah", arabic: "أستغفر الله", target: 100 },
];

const DAILY_VERSES = [
  { arabic: "وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥ", en: "And whoever relies upon Allah – then He is sufficient for him.", ref: "Surah At-Talaq 65:3" },
  { arabic: "إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا", en: "Indeed, with hardship comes ease.", ref: "Surah Ash-Sharh 94:6" },
  { arabic: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ", en: "And your Lord is going to give you, and you will be satisfied.", ref: "Surah Ad-Duha 93:5" },
  { arabic: "فَٱذْكُرُونِىٓ أَذْكُرْكُمْ", en: "So remember Me; I will remember you.", ref: "Surah Al-Baqarah 2:152" },
  { arabic: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ", en: "And He is with you wherever you are.", ref: "Surah Al-Hadid 57:4" },
  { arabic: "رَبِّ ٱشْرَحْ لِى صَدْرِى", en: "My Lord, expand for me my breast [with assurance].", ref: "Surah Ta-Ha 20:25" },
  { arabic: "وَلَا تَيْـَٔسُوا۟ مِن رَّوْحِ ٱللَّهِ", en: "And do not despair of the mercy of Allah.", ref: "Surah Yusuf 12:87" },
];

interface WeatherData { temp: number; description: string; icon: string; }

const getIslamicDate = () => {
  try {
    const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" });
    return formatter.format(new Date());
  } catch { return ""; }
};

function getCountdown(targetTime: string): string {
  const now = new Date();
  const [h, m] = targetTime.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

const PRAYER_ICONS: Record<string, string> = {
  Fajr: "🌅",
  Sunrise: "🌄",
  Dhuhr: "☀️",
  Asr: "🌤",
  Maghrib: "🌅",
  Isha: "🌙",
};

const PRAYER_NAME_KEYS: Record<string, string> = {
  Fajr: "prayer.fajr",
  Dhuhr: "prayer.dhuhr",
  Asr: "prayer.asr",
  Maghrib: "prayer.maghrib",
  Isha: "prayer.isha",
};

const DISPLAY_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 65) return "Rain";
  if (code <= 67) return "Freezing rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

function getWeatherIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 86) return "❄️";
  return "⛈️";
}

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [location, setLocation] = useState<string>(t("common.loading"));
  const [locationError, setLocationError] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const islamicDate = useMemo(() => getIslamicDate(), []);
  const dailyHadith = useMemo(() => getDailyHadith(), []);
  const dayOfYear = useMemo(() => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000), []);
  const dailyVerse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
  const [selectedDhikr, setSelectedDhikr] = useState(0);
  const [dhikrCount, setDhikrCount] = useState(0);
  const [countdown, setCountdown] = useState("");
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);

  const QUICK_ACTIONS = [
    { label: t("home.prayerTimes"), icon: Clock, path: "/prayer", desc: t("more.prayerDesc", "View accurate prayer times for your location"), gradient: "from-emerald-800/80 to-emerald-600/60" },
    { label: t("nav.qibla"), icon: Compass, path: "/qibla", desc: t("more.qiblaDesc", "Find the exact direction of the Kaaba in Makkah from wherever you are"), gradient: "from-emerald-900/80 to-emerald-700/60" },
    { label: t("nav.quran"), icon: BookOpen, path: "/quran", desc: t("more.quranDesc", "Read and listen to the Holy Quran with translations"), gradient: "from-teal-800/80 to-teal-600/60" },
    { label: t("nav.halalScanner"), icon: ScanLine, path: "/scanner", desc: t("more.halalDesc", "Scan barcodes to check Halal status of food products"), gradient: "from-emerald-800/80 to-green-600/60" },
    { label: t("nav.ramadan"), icon: Star, path: "/ramadan", desc: t("more.ramadanDesc", "Ramadan schedule, Suhoor & Iftar times"), gradient: "from-amber-800/80 to-yellow-600/60" },
    { label: t("nav.boycott"), icon: ShieldAlert, path: "/boycott", desc: t("more.boycottDesc", "Check and search boycott product directory"), gradient: "from-rose-800/80 to-pink-600/60" },
    { label: t("nav.nearby"), icon: MapPin, path: "/nearby", desc: t("more.nearbyDesc", "Find nearby mosques and halal restaurants"), gradient: "from-slate-700/80 to-slate-500/60" },
    { label: t("nav.hadith"), icon: Moon, path: "/hadith", desc: t("more.hadithDesc", "Sayings of the Prophet ﷺ from Bukhari, Muslim & more"), gradient: "from-purple-800/80 to-violet-500/60" },
  ];

  // Load prayer times from cache first, then fetch if needed (once per day)
  useEffect(() => {
    const cached = getCachedPrayerTimes();
    if (cached) {
      setPrayerTimes(cached.times);
      return;
    }
    // Only fetch if no cache for today
    getPrayerTimes().then((result) => {
      setPrayerTimes(result.times);
    }).catch(() => {});
  }, []);

  const prayerList = useMemo(() => {
    if (!prayerTimes) return DISPLAY_PRAYERS.map((key) => ({
      nameKey: PRAYER_NAME_KEYS[key],
      time: "--:--",
      icon: PRAYER_ICONS[key],
    }));
    return DISPLAY_PRAYERS.map((key) => ({
      nameKey: PRAYER_NAME_KEYS[key],
      time: prayerTimes[key],
      icon: PRAYER_ICONS[key],
    }));
  }, [prayerTimes]);

  const nextPrayer = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    for (const p of prayerList) {
      if (p.time === "--:--") continue;
      const [h, m] = p.time.split(":").map(Number);
      if (h * 60 + m > currentMinutes) return p;
    }
    return prayerList[0];
  }, [prayerList]);

  // Countdown timer
  useEffect(() => {
    if (nextPrayer.time === "--:--") return;
    setCountdown(getCountdown(nextPrayer.time));
    const interval = setInterval(() => {
      setCountdown(getCountdown(nextPrayer.time));
    }, 1000);
    return () => clearInterval(interval);
  }, [nextPrayer.time]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(t("common.locationUnavailable"));
      setWeather(null);
      setLocationError(true);
      return;
    }

    setLocation(t("common.loading"));
    setLocationError(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geoRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
          );
          const geoData = await geoRes.json();
          const temp = Math.round(geoData.current?.temperature_2m || 0);
          const code = geoData.current?.weather_code || 0;
          setWeather({ temp, description: getWeatherDescription(code), icon: getWeatherIcon(code) });
        } catch {
          setWeather(null);
        }

        try {
          let resolvedLocation = "";

          try {
            const nameRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
            );
            if (nameRes.ok) {
              const nameData = await nameRes.json();
              const addr = nameData.address || {};
              const city = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || "";
              const district = addr.city_district || addr.suburb || addr.county || "";
              const admin = addr.state || addr.region || addr.country || "";
              const secondary = district && district !== city ? district : admin;
              resolvedLocation = secondary ? `${city}, ${secondary}` : city;
            }
          } catch {}

          if (!resolvedLocation) {
            const fallbackRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              const city = fallbackData.city || fallbackData.locality || "";
              const admin = fallbackData.principalSubdivision || fallbackData.countryName || "";
              const secondary = admin && admin !== city ? admin : "";
              resolvedLocation = secondary ? `${city}, ${secondary}` : city;
            }
          }

          setLocation(resolvedLocation || t("common.yourLocation"));
          setLocationError(false);
        } catch {
          setLocation(t("common.yourLocation"));
          setLocationError(false);
        }
      },
      () => {
        setLocation(t("common.locationUnavailable"));
        setWeather(null);
        setLocationError(true);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  }, [t]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return t("home.greetingNight");
    if (h < 12) return t("home.greetingMorning");
    if (h < 17) return t("home.greetingAfternoon");
    return t("home.greetingEvening");
  }, [t]);

  const currentDhikr = DHIKR_OPTIONS[selectedDhikr];

  return (
    <div className="min-h-screen gradient-dark">
      {/* Hero */}
      <div className="relative h-60 overflow-hidden">
        <img src={heroImage} alt="Mosque at sunset" className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-sm font-medium text-gold font-arabic">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">{greeting} 👋</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPinned size={13} className="text-primary" />{location}</span>
              {locationError && (
                <button
                  onClick={requestLocation}
                  className="text-xs font-medium text-primary-foreground/80 underline underline-offset-4"
                >
                  Enable location
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-5 pb-6">
        {/* Weather + Islamic Date Row */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-3">
          <div className="flex-1 glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
              <CloudSun size={14} className="text-primary" />{t("home.weather")}
            </div>
            {weather ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{weather.icon}</span>
                <div>
                  <p className="text-xl font-bold text-foreground">{weather.temp}°C</p>
                  <p className="text-xs text-muted-foreground">{weather.description}</p>
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
          </div>
          <div className="flex-1 glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
              <Calendar size={14} className="text-primary" />{t("home.islamicDate")}
            </div>
            <p className="text-sm font-semibold text-foreground leading-snug">{islamicDate}</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date().toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}</p>
          </div>
        </motion.div>

        {/* Next Prayer Card with Countdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="relative overflow-hidden rounded-2xl gradient-emerald p-5 glow-emerald">
          <div className="absolute inset-0 islamic-pattern opacity-30" />
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-wider text-primary-foreground/70">{t("home.nextPrayer")}</p>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-primary-foreground">{t(nextPrayer.nameKey)}</h2>
                <p className="text-lg text-primary-foreground/80">{nextPrayer.time}</p>
              </div>
              <div className="text-right">
                <span className="text-4xl">{nextPrayer.icon}</span>
                <p className="text-lg font-bold text-primary-foreground tabular-nums mt-1">{countdown}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Verse of the Day */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-2xl glass-card p-5 border-glow-gold">
          <p className="text-xs font-medium uppercase tracking-wider text-primary mb-3">{t("home.verseOfDay")}</p>
          <p className="text-lg leading-relaxed text-foreground/90 font-arabic text-right">"{dailyVerse.arabic}"</p>
          <p className="mt-2 text-sm text-muted-foreground italic">"{dailyVerse.en}"</p>
          <p className="mt-1 text-xs text-primary/70">— {dailyVerse.ref}</p>
        </motion.div>

        {/* Hadith of the Day */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl glass-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">{t("home.hadithOfDay")}</p>
          <p className="text-sm leading-relaxed text-foreground/90">"{dailyHadith.text}"</p>
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-xs font-medium text-primary">{dailyHadith.narrator}</p>
            <p className="text-xs text-muted-foreground">{dailyHadith.source}</p>
          </div>
        </motion.div>

        {/* Dhikr Counter */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="rounded-2xl glass-card-strong p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">{t("home.dhikrCounter")}</p>
          <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
            {DHIKR_OPTIONS.map((d, i) => (
              <button
                key={d.key}
                onClick={() => { setSelectedDhikr(i); setDhikrCount(0); }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  i === selectedDhikr ? "gradient-gold text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
                }`}
              >
                {t(`dhikr.${d.key}`)}
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm text-muted-foreground mb-1">{t(`dhikr.${currentDhikr.key}Meaning`)}</p>
            <button
              onClick={() => setDhikrCount((c) => c + 1)}
              className="relative flex h-28 w-28 items-center justify-center rounded-full gradient-emerald glow-emerald active:scale-95 transition-transform"
            >
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-foreground">{dhikrCount}</p>
                <p className="text-[10px] text-primary-foreground/70 font-arabic">{currentDhikr.arabic}</p>
              </div>
            </button>
            <div className="flex items-center gap-4 mt-3">
              <p className="text-xs text-muted-foreground">{t("home.target")}: {currentDhikr.target}</p>
              <button onClick={() => setDhikrCount(0)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80">
                <RotateCcw size={12} />{t("home.reset")}
              </button>
            </div>
            {dhikrCount >= currentDhikr.target && (
              <p className="mt-2 text-xs text-accent font-medium">✨ {t("home.target")} reached! MashaAllah!</p>
            )}
          </div>
        </motion.div>

        {/* Today's Prayers - now using real API times */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("home.todaysPrayers")}</h3>
          <div className="rounded-2xl glass-card-strong p-1">
            {prayerList.map((p, i) => (
              <div key={p.nameKey} className={`flex items-center justify-between py-3 px-3 rounded-xl transition-colors ${
                p.nameKey === nextPrayer.nameKey ? "bg-primary/10 border-glow-gold" : ""
              } ${i < prayerList.length - 1 && p.nameKey !== nextPrayer.nameKey ? "border-b border-border/50" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{p.icon}</span>
                  <span className={`font-medium ${p.nameKey === nextPrayer.nameKey ? "text-primary" : "text-foreground"}`}>{t(p.nameKey)}</span>
                </div>
                <span className={`font-semibold tabular-nums ${p.nameKey === nextPrayer.nameKey ? "text-primary" : "text-muted-foreground"}`}>{p.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("home.quickActions")}</h3>
          <div className="flex flex-col gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.label} onClick={() => navigate(action.path)} className={`group relative flex items-center gap-4 rounded-2xl bg-gradient-to-r ${action.gradient} border border-white/10 p-4 transition-all hover:scale-[1.01] active:scale-[0.98] overflow-hidden`}>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                    <Icon size={28} className="text-white/90" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-base font-bold text-white">{action.label}</h4>
                    <p className="text-xs text-white/60 leading-snug mt-0.5">{action.desc}</p>
                  </div>
                  <ChevronRight size={20} className="text-white/40 shrink-0" />
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
