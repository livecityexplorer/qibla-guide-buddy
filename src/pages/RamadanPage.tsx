import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Moon, Sun, Utensils, Heart, BookOpen, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const RamadanPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"times" | "traditions" | "tips">("times");

  const RAMADAN_TIMES = [
    { nameKey: "ramadan.suhoorEnds", time: "05:10", icon: "🌙", descKey: "ramadan.preDawnDeadline" },
    { nameKey: "prayer.fajr", time: "05:23", icon: "🌅", descKey: "ramadan.dawnPrayer" },
    { nameKey: "prayer.dhuhr", time: "12:30", icon: "☀️", descKey: "ramadan.middayPrayer" },
    { nameKey: "prayer.asr", time: "15:45", icon: "🌤", descKey: "ramadan.afternoonPrayer" },
    { nameKey: "ramadan.maghribIftar", time: "18:12", icon: "🌅", descKey: "ramadan.sunsetPrayer" },
    { nameKey: "prayer.isha", time: "19:42", icon: "🌙", descKey: "ramadan.nightPrayer" },
    { nameKey: "ramadan.taraweeh", time: "20:15", icon: "⭐", descKey: "ramadan.taraweehDesc" },
  ];

  const TRADITIONS = [
    { icon: Utensils, titleKey: "ramadan.suhoorTitle", descKey: "ramadan.suhoorDesc" },
    { icon: Moon, titleKey: "ramadan.fastingTitle", descKey: "ramadan.fastingDesc" },
    { icon: Sun, titleKey: "ramadan.iftarTitle", descKey: "ramadan.iftarDesc" },
    { icon: BookOpen, titleKey: "ramadan.quranRecitation", descKey: "ramadan.quranRecitationDesc" },
    { icon: Star, titleKey: "ramadan.taraweehPrayers", descKey: "ramadan.taraweehPrayersDesc" },
    { icon: Heart, titleKey: "ramadan.zakatCharity", descKey: "ramadan.zakatCharityDesc" },
  ];

  const TIPS = Array.from({ length: 8 }, (_, i) => t(`ramadan.tip${i + 1}`));

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-8 pt-12 islamic-pattern">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} /><span className="text-sm">{t("common.back")}</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">{t("ramadan.title")}</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">{t("ramadan.subtitle")}</p>
      </div>
      <div className="px-4 -mt-4 pb-6">
        <div className="flex gap-2 rounded-xl bg-card p-1.5 shadow-sm mb-4">
          {([{ key: "times", label: t("ramadan.timing") }, { key: "traditions", label: t("ramadan.traditions") }, { key: "tips", label: t("ramadan.tips") }] as const).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${activeTab === tab.key ? "gradient-emerald text-primary-foreground shadow-sm" : "text-muted-foreground"}`}>{tab.label}</button>
          ))}
        </div>
        {activeTab === "times" && (
          <div className="space-y-3">
            {RAMADAN_TIMES.map((item, i) => (
              <motion.div key={item.nameKey} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div><p className="font-semibold text-foreground">{t(item.nameKey)}</p><p className="text-xs text-muted-foreground">{t(item.descKey)}</p></div>
                </div>
                <p className="text-lg font-bold text-primary">{item.time}</p>
              </motion.div>
            ))}
          </div>
        )}
        {activeTab === "traditions" && (
          <div className="space-y-3">
            {TRADITIONS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.titleKey} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-xl bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-emerald"><Icon size={18} className="text-primary-foreground" /></div>
                    <h3 className="font-semibold text-foreground">{t(item.titleKey)}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t(item.descKey)}</p>
                </motion.div>
              );
            })}
          </div>
        )}
        {activeTab === "tips" && (
          <div className="space-y-3">
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3">{t("ramadan.tipsTitle")}</h3>
              {TIPS.map((tip, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-emerald mt-0.5"><span className="text-[10px] font-bold text-primary-foreground">{i + 1}</span></div>
                  <p className="text-sm text-muted-foreground">{tip}</p>
                </motion.div>
              ))}
            </div>
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="text-sm font-medium text-foreground">🌙 {t("ramadan.laylatAlQadr")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("ramadan.laylatAlQadrDesc")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RamadanPage;
