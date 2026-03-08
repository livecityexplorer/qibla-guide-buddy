import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Search, BookOpen, GraduationCap, Clock, Heart, ChevronRight, ScanLine, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getHistory, getFavorites, type ScanHistoryItem } from "@/services/halalScannerService";
import { getTodaysIngredient, getLearningProgress } from "@/data/halalEducation";

const statusColors: Record<string, string> = {
  halal: "bg-emerald-mid/20 text-emerald-mid border-emerald-mid/30",
  haram: "bg-destructive/20 text-destructive border-destructive/30",
  mushbooh: "bg-accent/20 text-accent-foreground border-accent/30",
  unknown: "bg-muted text-muted-foreground border-border",
};

const statusLabel: Record<string, string> = {
  halal: "✅ Halal",
  haram: "❌ Haram",
  mushbooh: "⚠️ Doubtful",
  unknown: "❓ Unknown",
};

const ScannerHomePage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const todaysIngredient = getTodaysIngredient();
  const progress = getLearningProgress();

  useEffect(() => {
    setHistory(getHistory().slice(0, 10));
  }, []);

  const favCount = getFavorites().length;
  const totalScans = getHistory().length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-emerald px-4 pb-8 pt-12 islamic-pattern">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-primary-foreground/60 font-medium uppercase tracking-wider">My Halal Hub</p>
            <h1 className="text-2xl font-bold text-primary-foreground flex items-center gap-2">
              <ScanLine size={24} /> Halal Scanner
            </h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-primary-foreground/70 italic font-arabic">
          "وَكُلُوا مِمَّا رَزَقَكُمُ اللَّهُ حَلَالًا طَيِّبًا"
        </p>
        <p className="text-xs text-primary-foreground/50">
          "And eat of what Allah has provided for you, lawful and good." (5:88)
        </p>
      </div>

      <div className="px-4 -mt-4 pb-6 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate("/halal-scanner/scan")}
            className="rounded-2xl gradient-emerald p-5 text-left shadow-emerald active:scale-95 transition-transform"
          >
            <Camera size={28} className="text-primary-foreground" />
            <p className="mt-2 text-base font-bold text-primary-foreground">📱 Scan Barcode</p>
            <p className="text-xs text-primary-foreground/60">Camera or manual entry</p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => navigate("/halal-scanner/search")}
            className="rounded-2xl bg-blue-600 p-5 text-left shadow-sm active:scale-95 transition-transform"
          >
            <Search size={28} className="text-primary-foreground" />
            <p className="mt-2 text-base font-bold text-primary-foreground">🔍 Search Products</p>
            <p className="text-xs text-primary-foreground/60">By name or brand</p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate("/halal-scanner/ingredients")}
            className="rounded-2xl bg-card p-4 text-left shadow-sm border border-accent/30 active:scale-95 transition-transform"
          >
            <BookOpen size={24} className="text-accent" />
            <p className="mt-1 text-sm font-semibold text-foreground">📖 Ingredient Guide</p>
            <p className="text-xs text-muted-foreground">50+ ingredients</p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => navigate("/halal-scanner/learn")}
            className="rounded-2xl bg-card p-4 text-left shadow-sm border border-purple-400/30 active:scale-95 transition-transform"
          >
            <GraduationCap size={24} className="text-purple-500" />
            <p className="mt-1 text-sm font-semibold text-foreground">📚 Learn About Halal</p>
            <p className="text-xs text-muted-foreground">Articles & quizzes</p>
          </motion.button>
        </div>

        {/* Today's Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card p-4 shadow-sm border border-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Ingredient of the Day</h3>
          </div>
          <p className="text-base font-bold text-foreground">{todaysIngredient.emoji} {todaysIngredient.name}</p>
          <p className="text-sm text-muted-foreground mt-1">{todaysIngredient.fact}</p>
          <button
            onClick={() => navigate("/halal-scanner/ingredients")}
            className="mt-2 text-xs font-medium text-primary flex items-center gap-1"
          >
            Learn more <ChevronRight size={12} />
          </button>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-4 gap-2"
        >
          {[
            { label: "Scanned", value: totalScans, icon: "📱" },
            { label: "Saved", value: favCount, icon: "❤️" },
            { label: "Learned", value: progress.articlesRead.length, icon: "📖" },
            { label: "Streak", value: `${progress.streak}d`, icon: "🔥" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-card p-3 text-center shadow-sm border border-border">
              <p className="text-lg">{stat.icon}</p>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Recent Scans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock size={14} /> Recent Scans
            </h3>
            {history.length > 0 && (
              <button
                onClick={() => navigate("/halal-scanner/history")}
                className="text-xs font-medium text-primary flex items-center gap-1"
              >
                View All <ChevronRight size={12} />
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="rounded-2xl bg-card p-8 text-center shadow-sm border border-border">
              <ScanLine size={40} className="mx-auto text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium text-foreground">No scans yet</p>
              <p className="text-xs text-muted-foreground">Scan your first product to get started!</p>
              <button
                onClick={() => navigate("/halal-scanner/scan")}
                className="mt-3 rounded-xl gradient-emerald px-6 py-2 text-sm font-medium text-primary-foreground"
              >
                Scan Now
              </button>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {history.map((item) => (
                <button
                  key={item.product.barcode + item.scannedAt}
                  onClick={() => navigate(`/halal-scanner/product/${item.product.barcode}`)}
                  className="shrink-0 w-36 rounded-xl bg-card p-3 shadow-sm border border-border text-left active:scale-95 transition-transform"
                >
                  {item.product.image ? (
                    <img src={item.product.image} alt={item.product.name} className="h-20 w-full object-contain rounded-lg bg-muted" />
                  ) : (
                    <div className="h-20 w-full rounded-lg bg-muted flex items-center justify-center">
                      <ScanLine size={24} className="text-muted-foreground/30" />
                    </div>
                  )}
                  <p className="mt-2 text-xs font-medium text-foreground truncate">{item.product.name}</p>
                  <span className={`mt-1 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColors[item.product.status]}`}>
                    {statusLabel[item.product.status]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Links */}
        <div className="space-y-2">
          {[
            { label: "Scan History", icon: Clock, path: "/halal-scanner/history", count: totalScans },
            { label: "My Favorites", icon: Heart, path: "/halal-scanner/favorites", count: favCount },
            { label: "Scanner Settings", icon: ScanLine, path: "/halal-scanner/settings" },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="w-full flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm border border-border active:scale-[0.98] transition-transform"
              >
                <Icon size={20} className="text-primary" />
                <span className="flex-1 text-left text-sm font-medium text-foreground">{link.label}</span>
                {"count" in link && (
                  <span className="text-xs text-muted-foreground">{link.count}</span>
                )}
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl bg-muted/50 p-4 border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            ⚠️ <strong>Disclaimer:</strong> This scanner is for educational purposes only. Always verify with trusted scholars and certification bodies. When in doubt, abstain — "Leave what makes you doubt for what does not make you doubt." (Tirmidhi)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScannerHomePage;
