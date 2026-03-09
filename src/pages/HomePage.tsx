import { useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, BookOpen, Compass, ScanLine, MapPin, Moon, Star, ShieldAlert, CloudSun, MapPinned, Calendar, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-mosque.jpg";
import { getDailyHadith } from "@/services/hadithService";

const PRAYER_TIMES = [
  { nameKey: "prayer.fajr", time: "05:23", icon: "🌅" },
  { nameKey: "prayer.dhuhr", time: "12:30", icon: "☀️" },
  { nameKey: "prayer.asr", time: "15:45", icon: "🌤" },
  { nameKey: "prayer.maghrib", time: "18:12", icon: "🌅" },
  { nameKey: "prayer.isha", time: "19:42", icon: "🌙" },
];

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

  const QUICK_ACTIONS = [
    { label: t("home.prayerTimes"), icon: Clock, path: "/prayer" },
    { label: t("nav.qibla"), icon: Compass, path: "/qibla" },
    { label: t("nav.quran"), icon: BookOpen, path: "/quran" },
    { label: t("nav.halalScanner"), icon: ScanLine, path: "/scanner" },
    { label: t("nav.ramadan"), icon: Star, path: "/ramadan" },
    { label: t("nav.boycott"), icon: ShieldAlert, path: "/boycott" },
    { label: t("nav.nearby"), icon: MapPin, path: "/nearby" },
    { label: t("nav.hadith"), icon: Moon, path: "/hadith" },
  ];

  const nextPrayer = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    for (const p of PRAYER_TIMES) {
      const [h, m] = p.time.split(":").map(Number);
      if (h * 60 + m > currentMinutes) return p;
    }
    return PRAYER_TIMES[0];
  }, []);

  // Countdown timer
  useEffect(() => {
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
          const nameRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&count=1`
          );
          const nameData = await nameRes.json();
          setLocation(nameData.results?.[0] ? `${nameData.results[0].name}, ${nameData.results[0].country}` : t("common.yourLocation"));
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

        {/* Today's Prayers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("home.todaysPrayers")}</h3>
          <div className="rounded-2xl glass-card-strong p-1">
            {PRAYER_TIMES.map((p, i) => (
              <div key={p.nameKey} className={`flex items-center justify-between py-3 px-3 rounded-xl transition-colors ${
                p.nameKey === nextPrayer.nameKey ? "bg-primary/10 border-glow-gold" : ""
              } ${i < PRAYER_TIMES.length - 1 && p.nameKey !== nextPrayer.nameKey ? "border-b border-border/50" : ""}`}>
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
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("home.quickActions")}</h3>
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.label} onClick={() => navigate(action.path)} className="group flex flex-col items-center gap-2 rounded-2xl glass-card p-3 transition-all hover:glow-gold active:scale-95">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
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
  if (code <= 57) return "🌧️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

export default HomePage;
