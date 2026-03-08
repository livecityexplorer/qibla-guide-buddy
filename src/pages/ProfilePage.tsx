import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Globe, Volume2, Moon, MapPin, ChevronRight, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserSettings {
  name: string;
  language: string;
  adhanSound: string;
  prayerMethod: string;
  notifications: boolean;
  location: string;
}

const LANGUAGES = ["English", "Arabic", "French", "Turkish", "Urdu", "Malay", "Indonesian"];
const ADHAN_SOUNDS = ["Default (Mishary)", "Dubai", "Madinah", "Makkah", "Nafees"];
const PRAYER_METHODS = [
  "Muslim World League",
  "Egyptian General Authority",
  "Umm Al-Qura University",
  "Islamic Society of North America",
  "University of Islamic Sciences, Karachi",
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem("user-settings");
    return saved
      ? JSON.parse(saved)
      : {
          name: "Muslim User",
          language: "English",
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
  };

  return (
    <div className="min-h-screen gradient-dark">
      {/* Header */}
      <div className="relative px-5 pt-12 pb-8">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-gold glow-gold">
            <User size={28} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{settings.name}</h1>
            <p className="text-sm text-muted-foreground">Manage your preferences</p>
          </div>
        </motion.div>
      </div>

      <div className="px-4 space-y-4 pb-6">
        {/* Name */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SettingSection title="Profile">
            <SettingItem
              icon={<User size={18} className="text-primary" />}
              label="Name"
              value={settings.name}
              editing={editingField === "name"}
              onEdit={() => setEditingField("name")}
              onSave={(v) => updateSetting("name", v)}
              type="text"
            />
          </SettingSection>
        </motion.div>

        {/* Prayer Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SettingSection title="Prayer Settings">
            <SettingSelect
              icon={<MapPin size={18} className="text-accent" />}
              label="Calculation Method"
              value={settings.prayerMethod}
              options={PRAYER_METHODS}
              onChange={(v) => updateSetting("prayerMethod", v)}
            />
            <SettingSelect
              icon={<Volume2 size={18} className="text-accent" />}
              label="Adhan Sound"
              value={settings.adhanSound}
              options={ADHAN_SOUNDS}
              onChange={(v) => updateSetting("adhanSound", v)}
            />
            <SettingToggle
              icon={<Bell size={18} className="text-accent" />}
              label="Prayer Notifications"
              value={settings.notifications}
              onChange={(v) => updateSetting("notifications", v)}
            />
          </SettingSection>
        </motion.div>

        {/* App Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SettingSection title="App Settings">
            <SettingSelect
              icon={<Globe size={18} className="text-primary" />}
              label="Language"
              value={settings.language}
              options={LANGUAGES}
              onChange={(v) => updateSetting("language", v)}
            />
            <SettingItem
              icon={<MapPin size={18} className="text-primary" />}
              label="Location"
              value={settings.location}
              editing={editingField === "location"}
              onEdit={() => setEditingField("location")}
              onSave={(v) => updateSetting("location", v)}
              type="text"
            />
          </SettingSection>
        </motion.div>

        {/* About */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <SettingSection title="About">
            <div className="flex items-center justify-between py-3 px-1">
              <span className="text-sm text-muted-foreground">Version</span>
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

const SettingItem = ({
  icon,
  label,
  value,
  editing,
  onEdit,
  onSave,
  type,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  editing: boolean;
  onEdit: () => void;
  onSave: (v: string) => void;
  type: string;
}) => {
  const [tempVal, setTempVal] = useState(value);

  if (editing) {
    return (
      <div className="flex items-center gap-3 py-3">
        {icon}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <input
            type={type}
            value={tempVal}
            onChange={(e) => setTempVal(e.target.value)}
            onBlur={() => onSave(tempVal)}
            onKeyDown={(e) => e.key === "Enter" && onSave(tempVal)}
            autoFocus
            className="w-full bg-transparent text-sm text-foreground border-b border-primary/50 outline-none pb-1"
          />
        </div>
      </div>
    );
  }

  return (
    <button onClick={onEdit} className="flex items-center gap-3 py-3 w-full text-left hover:opacity-80 transition-opacity">
      {icon}
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
      <ChevronRight size={16} className="text-muted-foreground" />
    </button>
  );
};

const SettingSelect = ({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) => (
  <div className="flex items-center gap-3 py-3">
    {icon}
    <div className="flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm text-foreground outline-none cursor-pointer mt-0.5"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-card text-foreground">
            {opt}
          </option>
        ))}
      </select>
    </div>
  </div>
);

const SettingToggle = ({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center gap-3 py-3">
    {icon}
    <span className="flex-1 text-sm text-foreground">{label}</span>
    <button
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}
    >
      <div
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${
          value ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  </div>
);

export default ProfilePage;
