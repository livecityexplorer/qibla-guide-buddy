import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, BookOpen, Compass, ScanLine, MapPin, Moon, Star, ShieldAlert, CloudSun, MapPinned, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-mosque.jpg";

const PRAYER_TIMES = [
  { name: "Fajr", time: "05:23", icon: "🌅" },
  { name: "Dhuhr", time: "12:30", icon: "☀️" },
  { name: "Asr", time: "15:45", icon: "🌤" },
  { name: "Maghrib", time: "18:12", icon: "🌅" },
  { name: "Isha", time: "19:42", icon: "🌙" },
];

const QUICK_ACTIONS = [
  { label: "Prayer Times", icon: Clock, path: "/prayer" },
  { label: "Qibla", icon: Compass, path: "/qibla" },
  { label: "Quran", icon: BookOpen, path: "/quran" },
  { label: "Halal Scanner", icon: ScanLine, path: "/scanner" },
  { label: "Ramadan", icon: Star, path: "/ramadan" },
  { label: "Boycott", icon: ShieldAlert, path: "/boycott" },
  { label: "Nearby", icon: MapPin, path: "/nearby" },
  { label: "Hadith", icon: Moon, path: "/hadith" },
];

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
}

const getIslamicDate = () => {
  try {
    const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return formatter.format(new Date());
  } catch {
    return "";
  }
};

const HomePage = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState<string>("Loading...");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const islamicDate = useMemo(() => getIslamicDate(), []);

  const nextPrayer = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    for (const p of PRAYER_TIMES) {
      const [h, m] = p.time.split(":").map(Number);
      if (h * 60 + m > currentMinutes) return p;
    }
    return PRAYER_TIMES[0];
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          // Reverse geocode
          try {
            const geoRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
            );
            const geoData = await geoRes.json();
            const temp = Math.round(geoData.current?.temperature_2m || 0);
            const code = geoData.current?.weather_code || 0;
            const desc = getWeatherDescription(code);
            const icon = getWeatherIcon(code);
            setWeather({ temp, description: desc, icon });
          } catch {
            setWeather(null);
          }
          // Get city name
          try {
            const nameRes = await fetch(
              `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&count=1`
            );
            const nameData = await nameRes.json();
            if (nameData.results?.[0]) {
              setLocation(`${nameData.results[0].name}, ${nameData.results[0].country}`);
            } else {
              setLocation("Your Location");
            }
          } catch {
            setLocation("Your Location");
          }
        },
        () => setLocation("Location unavailable")
      );
    }
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "Good Night";
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <div className="min-h-screen gradient-dark">
      {/* Hero */}
      <div className="relative h-60 overflow-hidden">
        <img src={heroImage} alt="Mosque at sunset" className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

        <div className="absolute bottom-5 left-5 right-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-medium text-gold font-arabic">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              {greeting} 👋
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPinned size={13} className="text-primary" />
                {location}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-5 pb-6">
        {/* Weather + Islamic Date Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-3"
        >
          {/* Weather */}
          <div className="flex-1 glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
              <CloudSun size={14} className="text-primary" />
              Weather
            </div>
            {weather ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{weather.icon}</span>
                <div>
                  <p className="text-xl font-bold text-foreground">{weather.temp}°C</p>
                  <p className="text-xs text-muted-foreground">{weather.description}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </div>

          {/* Islamic Date */}
          <div className="flex-1 glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
              <Calendar size={14} className="text-primary" />
              Islamic Date
            </div>
            <p className="text-sm font-semibold text-foreground leading-snug">{islamicDate}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date().toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}
            </p>
          </div>
        </motion.div>

        {/* Next Prayer Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative overflow-hidden rounded-2xl gradient-emerald p-5 glow-emerald"
        >
          <div className="absolute inset-0 islamic-pattern opacity-30" />
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-wider text-primary-foreground/70">
              Next Prayer
            </p>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-primary-foreground">{nextPrayer.name}</h2>
                <p className="text-lg text-primary-foreground/80">{nextPrayer.time}</p>
              </div>
              <span className="text-4xl">{nextPrayer.icon}</span>
            </div>
          </div>
        </motion.div>

        {/* Today's Prayers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Today's Prayers
          </h3>
          <div className="rounded-2xl glass-card-strong p-1">
            {PRAYER_TIMES.map((p, i) => (
              <div
                key={p.name}
                className={`flex items-center justify-between py-3 px-3 rounded-xl transition-colors ${
                  p.name === nextPrayer.name ? "bg-primary/10 border-glow-gold" : ""
                } ${i < PRAYER_TIMES.length - 1 && p.name !== nextPrayer.name ? "border-b border-border/50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{p.icon}</span>
                  <span className={`font-medium ${p.name === nextPrayer.name ? "text-primary" : "text-foreground"}`}>
                    {p.name}
                  </span>
                </div>
                <span className={`font-semibold tabular-nums ${p.name === nextPrayer.name ? "text-primary" : "text-muted-foreground"}`}>
                  {p.time}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="group flex flex-col items-center gap-2 rounded-2xl glass-card p-3 transition-all hover:glow-gold active:scale-95"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Daily Verse */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="rounded-2xl glass-card p-5 border-glow-gold"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-primary mb-3">Daily Reminder</p>
          <p className="text-sm leading-relaxed text-foreground/90 font-arabic text-lg">
            "وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥ"
          </p>
          <p className="mt-2 text-sm text-muted-foreground italic">
            "And whoever relies upon Allah – then He is sufficient for him."
          </p>
          <p className="mt-1 text-xs text-primary/70">— Surah At-Talaq 65:3</p>
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
