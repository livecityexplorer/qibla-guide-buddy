import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, BellOff, Volume2, Play, Square, Settings, MapPin, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdhan } from "@/hooks/useAdhan";
import { ADHAN_OPTIONS, type AdhanSettings } from "@/services/adhanService";
import { getPrayerTimes, type PrayerTimesData } from "@/services/prayerTimesService";
import { toast } from "sonner";

const PRAYER_META = [
  { nameKey: "prayer.fajr", key: "Fajr" as const, arabic: "الفجر", icon: "🌅" },
  { nameKey: "prayer.sunrise", key: "Sunrise" as const, arabic: "الشروق", icon: "🌄" },
  { nameKey: "prayer.dhuhr", key: "Dhuhr" as const, arabic: "الظهر", icon: "☀️" },
  { nameKey: "prayer.asr", key: "Asr" as const, arabic: "العصر", icon: "🌤" },
  { nameKey: "prayer.maghrib", key: "Maghrib" as const, arabic: "المغرب", icon: "🌅" },
  { nameKey: "prayer.isha", key: "Isha" as const, arabic: "العشاء", icon: "🌙" },
];

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
  const { settings, notificationGranted, isPlaying, updateSettings, setPrayerEnabled, enableAdhan, disableAdhan, testAdhan, stopPlayback } = useAdhan();

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const loadTimes = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getPrayerTimes();
      setPrayerTimes(result.times);
      setLocationName(result.locationName);
    } catch (err: any) {
      console.error("Failed to load prayer times:", err);
      if (err?.code === 1) {
        setError("Location access denied. Please enable location permissions.");
      } else {
        setError("Could not load prayer times. Check your connection.");
      }
      toast.error("Could not load prayer times", {
        description: "Please enable location access and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimes();
  }, []);

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-[hsl(160,50%,32%)] via-[hsl(160,45%,38%)] to-[hsl(160,40%,45%)] px-4 pb-8 pt-12 islamic-pattern">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/90">
            <ArrowLeft size={20} />
            <span className="text-sm">{t("common.back")}</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 rounded-full bg-white/25 px-3 py-1.5 text-white font-medium shadow-sm"
          >
            <Settings size={16} />
            <span className="text-xs font-medium">{t("common.settings")}</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white">{t("prayer.title")}</h1>
        <p className="mt-1 text-sm text-white/80">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        {locationName && (
          <div className="mt-1 flex items-center gap-1 text-xs text-white/70">
            <MapPin size={12} />
            <span>{locationName}</span>
            <button onClick={loadTimes} className="ml-1 p-0.5 rounded hover:bg-white/15">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        )}
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
                  {PRAYER_META.map((p) => {
                    const checked = settings.prayers[p.key] ?? false;
                    return (
                      <div key={p.key} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => setPrayerEnabled(p.key, !checked)}
                          className="flex-1 rounded text-left text-xs font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {t(p.nameKey)}
                        </button>
                        <Switch checked={checked} onCheckedChange={(next) => setPrayerEnabled(p.key, next)} />
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

              {settings.enabled && (
                <div className="mt-3 rounded-lg bg-muted/50 border border-border p-3">
                  <p className="text-xs text-foreground font-medium">📱 {t("prayer.keepAppOpen", "Keep app open for audio")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("prayer.backgroundLimitation", "Adhan audio plays when the app is open. For locked-screen reminders, set your phone's alarm app as backup.")}
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      <div className={`px-4 ${showSettings ? "mt-3" : "-mt-4"} space-y-3 pb-6`}>
        {loading && !prayerTimes && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <RefreshCw size={24} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading prayer times for your location...</p>
          </div>
        )}

        {error && !prayerTimes && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={loadTimes} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground font-medium">
              Retry
            </button>
          </div>
        )}

        {prayerTimes && PRAYER_META.map((prayer, i) => {
          const time = prayerTimes[prayer.key];
          const key = prayerSettingsKey(prayer.nameKey);
          const checked = key ? (settings.prayers[key] ?? false) : false;

          const toggleFromRow = async () => {
            if (!key) return;
            if (!settings.enabled) {
              await enableAdhan();
            }
            setPrayerEnabled(key, !checked);
          };

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
                {key ? (
                  <button
                    type="button"
                    onClick={toggleFromRow}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary/40 text-foreground transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={
                      checked
                        ? `${t(prayer.nameKey)} ${t("common.stop")}`
                        : `${t(prayer.nameKey)} ${t("common.testAdhan")}`
                    }
                  >
                    {settings.enabled && checked ? (
                      <Bell size={14} className="text-primary" />
                    ) : (
                      <BellOff size={14} className="text-muted-foreground/60" />
                    )}
                  </button>
                ) : (
                  <BellOff size={14} className="text-muted-foreground/40" />
                )}
                <p className="text-xl font-bold text-primary">{time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PrayerTimesPage;
