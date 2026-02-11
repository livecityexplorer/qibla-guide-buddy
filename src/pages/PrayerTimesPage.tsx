import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PRAYER_TIMES = [
  { name: "Fajr", time: "05:23", arabic: "الفجر", icon: "🌅" },
  { name: "Sunrise", time: "06:45", arabic: "الشروق", icon: "🌄" },
  { name: "Dhuhr", time: "12:30", arabic: "الظهر", icon: "☀️" },
  { name: "Asr", time: "15:45", arabic: "العصر", icon: "🌤" },
  { name: "Maghrib", time: "18:12", arabic: "المغرب", icon: "🌅" },
  { name: "Isha", time: "19:42", arabic: "العشاء", icon: "🌙" },
];

const PrayerTimesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-8 pt-12 islamic-pattern">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">Prayer Times</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="px-4 -mt-4 space-y-3 pb-6">
        {PRAYER_TIMES.map((prayer, i) => (
          <motion.div
            key={prayer.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{prayer.icon}</span>
              <div>
                <p className="font-semibold text-foreground">{prayer.name}</p>
                <p className="text-sm font-arabic text-muted-foreground">{prayer.arabic}</p>
              </div>
            </div>
            <p className="text-xl font-bold text-primary">{prayer.time}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PrayerTimesPage;
