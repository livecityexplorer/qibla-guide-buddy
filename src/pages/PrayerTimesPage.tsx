import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, BellOff, Volume2, Play, Square, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdhan } from "@/hooks/useAdhan";
import { ADHAN_OPTIONS, type AdhanSettings } from "@/services/adhanService";

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
  const [showSettings, setShowSettings] = useState(false);
  const {
    settings,
    notificationGranted,
    isPlaying,
    updateSettings,
    togglePrayer,
    enableAdhan,
    disableAdhan,
    testAdhan,
    stopPlayback,
  } = useAdhan();

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-8 pt-12 islamic-pattern">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-primary-foreground/80">
            <ArrowLeft size={20} />
            <span className="text-sm">Back</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 rounded-full bg-primary-foreground/20 px-3 py-1.5 text-primary-foreground"
          >
            <Settings size={16} />
            <span className="text-xs font-medium">Adhan</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground">Prayer Times</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Adhan Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mx-4 -mt-4 mb-3 rounded-xl bg-card p-4 shadow-lg border border-border z-10 relative"
        >
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            Adhan Notification Settings
          </h3>

          {/* Master Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Enable Adhan</p>
              <p className="text-xs text-muted-foreground">
                {settings.enabled
                  ? notificationGranted
                    ? "✅ Active with notifications"
                    : "🔊 Audio only (notifications unavailable)"
                  : "Tap to enable Adhan alerts"}
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => (checked ? enableAdhan() : disableAdhan())}
            />
          </div>

          {settings.enabled && (
            <>
              {/* Adhan Voice Selection */}
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Adhan Voice</label>
                <Select
                  value={settings.selectedAdhan}
                  onValueChange={(v) => updateSettings({ selectedAdhan: v })}
                >
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

              {/* Volume */}
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                  <Volume2 size={14} />
                  Volume: {Math.round(settings.volume * 100)}%
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

              {/* Per-prayer toggles */}
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Enable for each prayer
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRAYER_TIMES.map((p) => (
                    <div key={p.name} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                      <span className="text-xs font-medium text-foreground">{p.name}</span>
                      <Switch
                        checked={settings.prayers[p.name as keyof AdhanSettings["prayers"]] ?? false}
                        onCheckedChange={() => togglePrayer(p.name as keyof AdhanSettings["prayers"])}
                        className="scale-75"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Test button */}
              <div className="flex gap-2">
                <button
                  onClick={isPlaying ? stopPlayback : testAdhan}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg gradient-emerald px-4 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  {isPlaying ? (
                    <>
                      <Square size={14} /> Stop
                    </>
                  ) : (
                    <>
                      <Play size={14} /> Test Adhan
                    </>
                  )}
                </button>
              </div>

              {!notificationGranted && settings.enabled && (
                <div className="mt-3 rounded-lg bg-accent/10 border border-accent/20 p-3">
                  <p className="text-xs text-foreground font-medium">💡 Notifications not available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adhan audio will play when the app is open. For background notifications, open the app in a new browser tab (not in a preview) and allow notifications.
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      <div className={`px-4 ${showSettings ? "mt-3" : "-mt-4"} space-y-3 pb-6`}>
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
            <div className="flex items-center gap-3">
              {settings.enabled && settings.prayers[prayer.name as keyof AdhanSettings["prayers"]] ? (
                <Bell size={14} className="text-primary" />
              ) : (
                <BellOff size={14} className="text-muted-foreground/40" />
              )}
              <p className="text-xl font-bold text-primary">{prayer.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PrayerTimesPage;
