import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Trash2, Download, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSettings, saveSettings, clearHistory, getHistory, getFavorites, type ScannerSettings, DEFAULT_SETTINGS } from "@/services/halalScannerService";
import { getLearningProgress } from "@/data/halalEducation";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ScannerSettings>(getSettings());
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const update = (partial: Partial<ScannerSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
  };

  const storageUsed = () => {
    let total = 0;
    for (const key of ["halal_scan_history", "halal_favorites", "halal_scanner_settings", "halal_learning_progress"]) {
      total += (localStorage.getItem(key) || "").length;
    }
    return (total / 1024).toFixed(1);
  };

  const handleClear = (action: string) => {
    if (action === "history") {
      clearHistory();
    } else if (action === "progress") {
      localStorage.removeItem("halal_learning_progress");
    } else if (action === "all") {
      ["halal_scan_history", "halal_favorites", "halal_scanner_settings", "halal_learning_progress"].forEach(k => localStorage.removeItem(k));
      setSettings(DEFAULT_SETTINGS);
    }
    setConfirmAction(null);
  };

  const handleExport = () => {
    const data = {
      history: getHistory(),
      favorites: getFavorites(),
      settings: getSettings(),
      progress: getLearningProgress(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "halal-scanner-data.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-6 pt-12 islamic-pattern">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/halal-scanner")} className="flex items-center gap-2 text-primary-foreground/80">
            <ArrowLeft size={20} /><span className="text-sm">Back</span>
          </button>
          <button onClick={() => { setSettings(DEFAULT_SETTINGS); saveSettings(DEFAULT_SETTINGS); }}
            className="flex items-center gap-1 text-xs text-primary-foreground/60">
            <RotateCcw size={12} /> Reset
          </button>
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground">Scanner Settings</h1>
      </div>

      <div className="px-4 -mt-3 pb-6 space-y-4">
        {/* Scanning Preferences */}
        <Section title="Scanning Preferences">
          <Toggle label="Auto-save to history" value={settings.autoSave} onChange={v => update({ autoSave: v })} />
          <Toggle label="Scan sound" value={settings.scanSound} onChange={v => update({ scanSound: v })} />
          <Toggle label="Vibration on scan" value={settings.vibration} onChange={v => update({ vibration: v })} />
        </Section>

        {/* Educational Preferences */}
        <Section title="Educational Preferences">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-foreground">Learning Level</span>
            <select
              value={settings.learningLevel}
              onChange={(e) => update({ learningLevel: e.target.value as any })}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <Toggle label="Show Arabic text" value={settings.showArabic} onChange={v => update({ showArabic: v })} />
          <Toggle label="Show scholarly references" value={settings.showScholarlyRefs} onChange={v => update({ showScholarlyRefs: v })} />
        </Section>

        {/* Display Preferences */}
        <Section title="Display Preferences">
          <Toggle label="Compact view in lists" value={settings.compactView} onChange={v => update({ compactView: v })} />
          <Toggle label="Show product images" value={settings.showImages} onChange={v => update({ showImages: v })} />
          <Toggle label="Ingredient highlighting" value={settings.ingredientHighlighting} onChange={v => update({ ingredientHighlighting: v })} />
        </Section>

        {/* Data Management */}
        <Section title="Data Management">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-foreground">Storage used</span>
            <span className="text-sm text-muted-foreground">{storageUsed()} KB</span>
          </div>
          <button onClick={handleExport} className="w-full flex items-center gap-3 py-3 text-left">
            <Download size={18} className="text-primary" />
            <span className="text-sm text-foreground">Export my data (JSON)</span>
          </button>
          {[
            { key: "history", label: "Clear scan history" },
            { key: "progress", label: "Clear learning progress" },
          ].map(item => (
            <div key={item.key}>
              <button onClick={() => setConfirmAction(item.key)} className="w-full flex items-center gap-3 py-3 text-left">
                <Trash2 size={18} className="text-destructive/70" />
                <span className="text-sm text-foreground">{item.label}</span>
              </button>
              {confirmAction === item.key && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-destructive/10 p-3 mb-2">
                  <p className="text-xs text-foreground">Are you sure? This cannot be undone.</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleClear(item.key)} className="flex-1 rounded-lg bg-destructive py-1.5 text-xs font-medium text-destructive-foreground">Confirm</button>
                    <button onClick={() => setConfirmAction(null)} className="flex-1 rounded-lg border border-border py-1.5 text-xs font-medium text-foreground">Cancel</button>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </Section>

        {/* Privacy */}
        <Section title="Privacy">
          <button onClick={() => setConfirmAction("all")} className="w-full flex items-center gap-3 py-3 text-left">
            <Trash2 size={18} className="text-destructive" />
            <span className="text-sm text-destructive font-medium">Delete all my data</span>
          </button>
          {confirmAction === "all" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-destructive/10 p-3 mb-2">
              <p className="text-xs text-foreground font-medium">⚠️ This will delete ALL scanner data including history, favorites, settings, and learning progress.</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleClear("all")} className="flex-1 rounded-lg bg-destructive py-1.5 text-xs font-medium text-destructive-foreground">Delete Everything</button>
                <button onClick={() => setConfirmAction(null)} className="flex-1 rounded-lg border border-border py-1.5 text-xs font-medium text-foreground">Cancel</button>
              </div>
            </motion.div>
          )}
        </Section>

        {/* About */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">About Halal Scanner</h3>
          </div>
          <p className="text-xs text-muted-foreground">Version 1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">Data sources: Open Food Facts, Community contributions, Scholarly input</p>
          <div className="mt-3 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              ⚠️ <strong>Disclaimer:</strong> This app is for educational purposes only. Always verify with trusted scholars and certification bodies. When in doubt, abstain — "Leave what makes you doubt for what does not make you doubt." (Tirmidhi)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl bg-card border border-border p-4">
    <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
    <div className="divide-y divide-border">{children}</div>
  </div>
);

const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between py-3">
    <span className="text-sm text-foreground">{label}</span>
    <button
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-primary" : "bg-input"}`}
    >
      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-lg transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  </div>
);

export default SettingsPage;
