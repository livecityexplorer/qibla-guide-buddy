import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, BookOpen, Compass, ScanLine, MapPin, Moon } from "lucide-react";
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
  { label: "Prayer Times", icon: Clock, path: "/prayer", color: "gradient-emerald" },
  { label: "Qibla", icon: Compass, path: "/qibla", color: "gradient-emerald" },
  { label: "Quran", icon: BookOpen, path: "/quran", color: "gradient-emerald" },
  { label: "Halal Scanner", icon: ScanLine, path: "/scanner", color: "gradient-emerald" },
  { label: "Nearby", icon: MapPin, path: "/nearby", color: "gradient-emerald" },
  { label: "Hadith", icon: Moon, path: "/hadith", color: "gradient-emerald" },
];

const HomePage = () => {
  const navigate = useNavigate();

  const nextPrayer = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    for (const p of PRAYER_TIMES) {
      const [h, m] = p.time.split(":").map(Number);
      if (h * 60 + m > currentMinutes) return p;
    }
    return PRAYER_TIMES[0];
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden">
        <img src={heroImage} alt="Mosque at sunset" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="absolute inset-0 gradient-emerald opacity-40" />
        <div className="absolute bottom-4 left-4 right-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-medium text-primary-foreground/80">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
            <h1 className="mt-1 text-2xl font-bold text-primary-foreground font-arabic">
              Assalamu Alaikum
            </h1>
            <p className="text-sm text-primary-foreground/80">Your Islamic lifestyle companion</p>
          </motion.div>
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-5 pb-4">
        {/* Next Prayer Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl gradient-emerald p-5 shadow-emerald"
        >
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
        </motion.div>

        {/* Today's Prayers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Today's Prayers
          </h3>
          <div className="rounded-xl bg-card p-3 shadow-sm">
            {PRAYER_TIMES.map((p, i) => (
              <div
                key={p.name}
                className={`flex items-center justify-between py-2.5 px-2 ${
                  i < PRAYER_TIMES.length - 1 ? "border-b border-border" : ""
                } ${p.name === nextPrayer.name ? "rounded-lg bg-secondary" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{p.icon}</span>
                  <span className={`font-medium ${p.name === nextPrayer.name ? "text-primary" : "text-foreground"}`}>
                    {p.name}
                  </span>
                </div>
                <span className={`font-semibold ${p.name === nextPrayer.name ? "text-primary" : "text-muted-foreground"}`}>
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
          transition={{ delay: 0.4 }}
        >
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 rounded-xl bg-card p-4 shadow-sm transition-all hover:shadow-md active:scale-95"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-emerald">
                    <Icon size={20} className="text-primary-foreground" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
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
