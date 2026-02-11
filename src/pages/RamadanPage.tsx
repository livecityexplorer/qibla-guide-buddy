import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Moon, Sun, Utensils, Heart, BookOpen, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RAMADAN_TIMES = [
  { name: "Suhoor Ends", time: "05:10", icon: "🌙", description: "Pre-dawn meal deadline" },
  { name: "Fajr", time: "05:23", icon: "🌅", description: "Dawn prayer & fast begins" },
  { name: "Dhuhr", time: "12:30", icon: "☀️", description: "Midday prayer" },
  { name: "Asr", time: "15:45", icon: "🌤", description: "Afternoon prayer" },
  { name: "Maghrib / Iftar", time: "18:12", icon: "🌅", description: "Sunset prayer & fast breaks" },
  { name: "Isha", time: "19:42", icon: "🌙", description: "Night prayer" },
  { name: "Taraweeh", time: "20:15", icon: "⭐", description: "Special Ramadan night prayer" },
];

const TRADITIONS = [
  {
    icon: Utensils,
    title: "Suhoor (Pre-Dawn Meal)",
    description: "Eat a nutritious meal before dawn to sustain energy throughout the day. The Prophet ﷺ said: 'Take suhoor, for in suhoor there is blessing.'",
  },
  {
    icon: Moon,
    title: "Fasting (Sawm)",
    description: "Abstain from food, drink, and other physical needs from dawn to sunset. One of the Five Pillars of Islam.",
  },
  {
    icon: Sun,
    title: "Iftar (Breaking Fast)",
    description: "Break your fast at sunset, traditionally with dates and water following the Sunnah of Prophet Muhammad ﷺ.",
  },
  {
    icon: BookOpen,
    title: "Quran Recitation",
    description: "Ramadan is the month the Quran was revealed. Muslims aim to complete the entire Quran during this blessed month.",
  },
  {
    icon: Star,
    title: "Taraweeh Prayers",
    description: "Special nightly prayers performed in congregation during Ramadan, usually 8 or 20 rakats.",
  },
  {
    icon: Heart,
    title: "Zakat & Charity",
    description: "Increase charitable giving during Ramadan. Zakat al-Fitr is obligatory before Eid prayer.",
  },
];

const TIPS = [
  "Stay hydrated during suhoor — drink plenty of water",
  "Eat dates and fruits at iftar before the main meal",
  "Read at least 1 juz (chapter) of Quran daily",
  "Make extra dua before breaking fast — it's accepted",
  "Seek Laylat al-Qadr in the last 10 nights",
  "Increase charity and help those in need",
  "Avoid excessive eating at iftar",
  "Maintain good character and patience",
];

const RamadanPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"times" | "traditions" | "tips">("times");

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-8 pt-12 islamic-pattern">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">Ramadan</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">Fasting schedule, traditions & guidance</p>
      </div>

      <div className="px-4 -mt-4 pb-6">
        {/* Tab Switcher */}
        <div className="flex gap-2 rounded-xl bg-card p-1.5 shadow-sm mb-4">
          {([
            { key: "times", label: "Timing" },
            { key: "traditions", label: "Traditions" },
            { key: "tips", label: "Tips" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "gradient-emerald text-primary-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Times */}
        {activeTab === "times" && (
          <div className="space-y-3">
            {RAMADAN_TIMES.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-primary">{item.time}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Traditions */}
        {activeTab === "traditions" && (
          <div className="space-y-3">
            {TRADITIONS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl bg-card p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-emerald">
                      <Icon size={18} className="text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Tips */}
        {activeTab === "tips" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3">Ramadan Tips & Guidance</h3>
              {TIPS.map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 py-2.5 border-b border-border last:border-0"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-emerald mt-0.5">
                    <span className="text-[10px] font-bold text-primary-foreground">{i + 1}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{tip}</p>
                </motion.div>
              ))}
            </div>

            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="text-sm font-medium text-foreground">🌙 Laylat al-Qadr</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                The Night of Decree is better than a thousand months. Seek it in the odd nights of the last ten days of Ramadan (21st, 23rd, 25th, 27th, 29th).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RamadanPage;
