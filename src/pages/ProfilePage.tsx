import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Globe, Volume2, Moon, MapPin, ChevronRight, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface UserSettings {
  name: string;
  language: string;
  adhanSound: string;
  prayerMethod: string;
  notifications: boolean;
  location: string;
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
  { code: "tr", label: "Türkçe" },
  { code: "ur", label: "اردو" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ru", label: "Русский" },
  { code: "zh", label: "中文" },
];

const ADHAN_SOUNDS = ["Beautiful Adhan"];
const PRAYER_METHODS = [
  "Muslim World League",
  "Egyptian General Authority",
  "Umm Al-Qura University",
  "Islamic Society of North America",
  "University of Islamic Sciences, Karachi",
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem("user-settings");
    return saved ? JSON.parse(saved) : {
      name: "Muslim User",
      language: i18n.language?.substring(0, 2) || "en",
      adhanSound: "Default (Mishary)",
      prayerMethod: "Muslim World League",
      notifications: true,
      location: "Auto-detect",
    };
  });
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("user-settings", JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof UserSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setEditingField(null);
    if (key === "language" && typeof value === "string") {
      i18n.changeLanguage(value);
      localStorage.setItem("app-language", value);
    }
  };

  return (
    <div className="min-h-screen gradient-dark">
      <div className="relative px-5 pt-12 pb-8">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} /><span className="text-sm">{t("common.back")}</span>
        </button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-gold glow-gold"><User size={28} className="text-primary-foreground" /></div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{settings.name}</h1>
            <p className="text-sm text-muted-foreground">{t("profile.managePreferences")}</p>
          </div>
        </motion.div>
      </div>

      <div className="px-4 space-y-4 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SettingSection title={t("profile.profileSection")}>
            <SettingItem icon={<User size={18} className="text-primary" />} label={t("profile.name")} value={settings.name} editing={editingField === "name"} onEdit={() => setEditingField("name")} onSave={(v) => updateSetting("name", v)} type="text" />
          </SettingSection>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SettingSection title={t("profile.prayerSettings")}>
            <SettingSelect icon={<MapPin size={18} className="text-accent" />} label={t("profile.calculationMethod")} value={settings.prayerMethod} options={PRAYER_METHODS} onChange={(v) => updateSetting("prayerMethod", v)} />
            <SettingSelect icon={<Volume2 size={18} className="text-accent" />} label={t("profile.adhanSound")} value={settings.adhanSound} options={ADHAN_SOUNDS} onChange={(v) => updateSetting("adhanSound", v)} />
            <SettingToggle icon={<Bell size={18} className="text-accent" />} label={t("profile.prayerNotifications")} value={settings.notifications} onChange={(v) => updateSetting("notifications", v)} />
          </SettingSection>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SettingSection title={t("profile.appSettings")}>
            <div className="flex items-center gap-3 py-3">
              <Globe size={18} className="text-primary" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{t("profile.language")}</p>
                <select value={settings.language} onChange={(e) => updateSetting("language", e.target.value)} className="w-full bg-transparent text-sm text-foreground outline-none cursor-pointer mt-0.5">
                  {LANGUAGES.map((lang) => (<option key={lang.code} value={lang.code} className="bg-card text-foreground">{lang.label}</option>))}
                </select>
              </div>
            </div>
            <SettingItem icon={<MapPin size={18} className="text-primary" />} label={t("profile.location")} value={settings.location} editing={editingField === "location"} onEdit={() => setEditingField("location")} onSave={(v) => updateSetting("location", v)} type="text" />
          </SettingSection>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <SettingSection title={t("profile.about")}>
            <div className="flex items-center justify-between py-3 px-1">
              <span className="text-sm text-muted-foreground">{t("common.version")}</span>
              <span className="text-sm text-foreground">1.0.0</span>
            </div>
          </SettingSection>
        </motion.div>
      </div>
    </div>
  );
};

const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">{title}</h3>
    <div className="rounded-2xl glass-card-strong divide-y divide-border/50 px-4">{children}</div>
  </div>
);

const SettingItem = ({ icon, label, value, editing, onEdit, onSave, type }: { icon: React.ReactNode; label: string; value: string; editing: boolean; onEdit: () => void; onSave: (v: string) => void; type: string; }) => {
  const [tempVal, setTempVal] = useState(value);
  if (editing) {
    return (
      <div className="flex items-center gap-3 py-3">{icon}<div className="flex-1"><p className="text-xs text-muted-foreground mb-1">{label}</p><input type={type} value={tempVal} onChange={(e) => setTempVal(e.target.value)} onBlur={() => onSave(tempVal)} onKeyDown={(e) => e.key === "Enter" && onSave(tempVal)} autoFocus className="w-full bg-transparent text-sm text-foreground border-b border-primary/50 outline-none pb-1" /></div></div>
    );
  }
  return (
    <button onClick={onEdit} className="flex items-center gap-3 py-3 w-full text-left hover:opacity-80 transition-opacity">{icon}<div className="flex-1"><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm text-foreground">{value}</p></div><ChevronRight size={16} className="text-muted-foreground" /></button>
  );
};

const SettingSelect = ({ icon, label, value, options, onChange }: { icon: React.ReactNode; label: string; value: string; options: string[]; onChange: (v: string) => void; }) => (
  <div className="flex items-center gap-3 py-3">{icon}<div className="flex-1"><p className="text-xs text-muted-foreground">{label}</p><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm text-foreground outline-none cursor-pointer mt-0.5">{options.map((opt) => (<option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>))}</select></div></div>
);

const SettingToggle = ({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void; }) => (
  <div className="flex items-center gap-3 py-3">{icon}<span className="flex-1 text-sm text-foreground">{label}</span><button onClick={() => onChange(!value)} className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}><div className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} /></button></div>
);

export default ProfilePage;
