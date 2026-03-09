import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, BellOff, Volume2, Play, Square, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdhan } from "@/hooks/useAdhan";
import { ADHAN_OPTIONS, type AdhanSettings } from "@/services/adhanService";

const PRAYER_TIMES = [
  { nameKey: "prayer.fajr", time: "05:23", arabic: "الفجر", icon: "🌅" },
  { nameKey: "prayer.sunrise", time: "06:45", arabic: "الشروق", icon: "🌄" },
  { nameKey: "prayer.dhuhr", time: "12:30", arabic: "الظهر", icon: "☀️" },
  { nameKey: "prayer.asr", time: "15:45", arabic: "العصر", icon: "🌤" },
  { nameKey: "prayer.maghrib", time: "18:12", arabic: "المغرب", icon: "🌅" },
  { nameKey: "prayer.isha", time: "19:42", arabic: "العشاء", icon: "🌙" },
];

// Map nameKey to AdhanSettings prayer key
const PRAYER_KEY_MAP: Record<string, keyof AdhanSettings["prayers"]> = {
  "prayer.fajr": "Fajr",
  "prayer.sunrise": "Sunrise",
  "prayer.dhuhr": "Dhuhr",
  "prayer.asr": "Asr",
  "prayer.maghrib": "Maghrib",
  "prayer.isha": "Isha",
};

const prayerSettingsKey = (nameKey: string): keyof AdhanSettings["prayers"] | null => {
  return PRAYER_KEY_MAP[nameKey] || null;
};

const PrayerTimesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const { settings, notificationGranted, isPlaying, updateSettings, setPrayerEnabled, togglePrayer, enableAdhan, disableAdhan, testAdhan, stopPlayback } = useAdhan();

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-8 pt-12 islamic-pattern">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-primary-foreground/80">
            <ArrowLeft size={20} />
            <span className="text-sm">{t("common.back")}</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 rounded-full bg-primary-foreground/20 px-3 py-1.5 text-primary-foreground"
          >
            <Settings size={16} />
            <span className="text-xs font-medium">{t("common.settings")}</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground">{t("prayer.title")}</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mx-4 -mt-4 mb-3 rounded-xl bg-card p-4 shadow-lg border border-border z-10 relative"
        >
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            {t("prayer.adhanSettings")}
          </h3>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">{t("prayer.enableAdhan")}</p>
              <p className="text-xs text-muted-foreground">
                {settings.enabled
                  ? notificationGranted
                    ? `✅ ${t("prayer.activeWithNotifications")}`
                    : `🔊 ${t("prayer.audioOnly")}`
                  : t("prayer.tapToEnable")}
              </p>
            </div>
            <Switch checked={settings.enabled} onCheckedChange={(checked) => (checked ? enableAdhan() : disableAdhan())} />
          </div>

          {settings.enabled && (
            <>
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("prayer.adhanVoice")}</label>
                <Select value={settings.selectedAdhan} onValueChange={(v) => updateSettings({ selectedAdhan: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADHAN_OPTIONS.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                  <Volume2 size={14} />
                  {t("prayer.volume")}: {Math.round(settings.volume * 100)}%
                </label>
                <Slider
                  value={[settings.volume * 100]}
                  onValueChange={([v]) => updateSettings({ volume: v / 100 })}
                  max={100}
                  min={10}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-foreground">10-min Pre-Reminder</p>
                  <p className="text-xs text-muted-foreground">Get a beautiful notification 10 min before each prayer</p>
                </div>
                <Switch checked={settings.preReminder ?? true} onCheckedChange={(checked) => updateSettings({ preReminder: checked })} />
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{t("prayer.enableForEach")}</label>

                <div className="grid grid-cols-2 gap-2">
                  {PRAYER_TIMES.map((p) => {
                    const key = prayerSettingsKey(p.nameKey);
                    if (!key) return null;

                    const onToggle = () => togglePrayer(key);

                    return (
                      <div
                        key={p.nameKey}
                        role="button"
                        tabIndex={0}
                        onClick={onToggle}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onToggle();
                          }
                        }}
                        className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2.5 cursor-pointer active:bg-secondary/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="text-xs font-medium text-foreground">{t(p.nameKey)}</span>
                        <Switch
                          checked={settings.prayers[key] ?? false}
                          onCheckedChange={onToggle}
                          // prevent row click + switch click from toggling twice
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={isPlaying ? stopPlayback : testAdhan}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg gradient-emerald px-4 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  {isPlaying ? (
                    <>
                      <Square size={14} /> {t("common.stop")}
                    </>
                  ) : (
                    <>
                      <Play size={14} /> {t("common.testAdhan")}
                    </>
                  )}
                </button>
              </div>

              {!notificationGranted && settings.enabled && (
                <div className="mt-3 rounded-lg bg-accent/10 border border-accent/20 p-3">
                  <p className="text-xs text-foreground font-medium">💡 {t("prayer.notificationsUnavailable")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("prayer.notificationsNote")}</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      <div className={`px-4 ${showSettings ? "mt-3" : "-mt-4"} space-y-3 pb-6`}>
        {PRAYER_TIMES.map((prayer, i) => {
          const key = prayerSettingsKey(prayer.nameKey);
          return (
            <motion.div
              key={prayer.nameKey}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{prayer.icon}</span>
                <div>
                  <p className="font-semibold text-foreground">{t(prayer.nameKey)}</p>
                  <p className="text-sm font-arabic text-muted-foreground">{prayer.arabic}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {key && settings.enabled && settings.prayers[key] ? (
                  <Bell size={14} className="text-primary" />
                ) : (
                  <BellOff size={14} className="text-muted-foreground/40" />
                )}
                <p className="text-xl font-bold text-primary">{prayer.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PrayerTimesPage;
