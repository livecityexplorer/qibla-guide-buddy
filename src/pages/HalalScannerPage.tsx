import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Camera, Search, ScanLine, CheckCircle, XCircle, AlertTriangle,
  HelpCircle, Loader2, ChevronRight, BookOpen, GraduationCap, Shield,
  Sparkles, Star, Zap, Globe, Clock, Heart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchByName, searchByBarcode, addToHistory, getSettings, getHistory, getFavorites, type ProductResult } from "@/services/halalScannerService";
import { getTodaysIngredient, getLearningProgress } from "@/data/halalEducation";
import type { HalalStatus } from "@/data/ingredientDatabase";

const statusConfig = {
  halal: { icon: CheckCircle, label: "Halal ✅", bgClass: "bg-emerald-mid/10", textClass: "text-emerald-mid", borderClass: "border-emerald-mid/30" },
  haram: { icon: XCircle, label: "Haram ❌", bgClass: "bg-destructive/10", textClass: "text-destructive", borderClass: "border-destructive/30" },
  mushbooh: { icon: AlertTriangle, label: "Doubtful ⚠️", bgClass: "bg-accent/20", textClass: "text-accent-foreground", borderClass: "border-accent/30" },
  unknown: { icon: HelpCircle, label: "Unknown ❓", bgClass: "bg-muted", textClass: "text-muted-foreground", borderClass: "border-border" },
};

type Mode = "home" | "scan" | "search";

const HalalScannerPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("home");
  const [query, setQuery] = useState("");
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductResult[]>([]);
  const [singleResult, setSingleResult] = useState<ProductResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const todaysIngredient = getTodaysIngredient();
  const progress = getLearningProgress();
  const historyCount = getHistory().length;
  const favCount = getFavorites().length;

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    setError("");
    try {
      const data = await searchByName(query.trim());
      setResults(data.products);
      const settings = getSettings();
      if (settings.autoSave) {
        data.products.slice(0, 3).forEach(p => {
          addToHistory({ product: p, scannedAt: new Date().toISOString() });
        });
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScan = async () => {
    if (!barcode.trim()) return;
    setLoading(true);
    setError("");
    setSingleResult(null);
    try {
      const product = await searchByBarcode(barcode.trim());
      if (product) {
        setSingleResult(product);
        const settings = getSettings();
        if (settings.autoSave) addToHistory({ product, scannedAt: new Date().toISOString() });
        if (settings.vibration && navigator.vibrate) navigator.vibrate(100);
      } else {
        setError("Product not found in database. Try searching by name instead.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="gradient-emerald px-4 pb-10 pt-12 islamic-pattern relative z-10">
          <button onClick={() => mode === "home" ? navigate("/") : setMode("home")} className="mb-5 flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">{mode === "home" ? "Back" : "Scanner Home"}</span>
          </button>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur-sm">
                <Shield size={22} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground tracking-tight">Halal Scanner</h1>
                <p className="text-xs text-primary-foreground/60 font-medium">Powered by Open Food Facts</p>
              </div>
            </div>
            {mode === "home" && (
              <p className="mt-3 text-sm text-primary-foreground/70 italic font-arabic leading-relaxed">
                "وَكُلُوا مِمَّا رَزَقَكُمُ اللَّهُ حَلَالًا طَيِّبًا" — القرآن ٥:٨٨
              </p>
            )}
          </motion.div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary-foreground/5 z-0" />
        <div className="absolute -bottom-5 -left-8 h-24 w-24 rounded-full bg-primary-foreground/5 z-0" />
      </div>

      <div className="px-4 -mt-5 pb-6 space-y-4 relative z-10">
        <AnimatePresence mode="wait">
          {/* ── HOME MODE ── */}
          {mode === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Main Action Cards */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  onClick={() => setMode("scan")}
                  className="group rounded-2xl bg-card p-5 shadow-sm border border-border text-left active:scale-[0.97] transition-all hover:shadow-md hover:border-emerald-mid/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-emerald shadow-emerald group-hover:scale-110 transition-transform">
                    <Camera size={24} className="text-primary-foreground" />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-foreground">Scan Barcode</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Enter a product barcode to instantly check its Halal status
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-primary">
                    <Zap size={10} /> Instant results
                  </div>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  onClick={() => setMode("search")}
                  className="group rounded-2xl bg-card p-5 shadow-sm border border-border text-left active:scale-[0.97] transition-all hover:shadow-md hover:border-emerald-mid/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-gold shadow-gold group-hover:scale-110 transition-transform">
                    <Search size={24} className="text-primary-foreground" />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-foreground">Search Product</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Search by product name or brand from our global database
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-accent-foreground">
                    <Globe size={10} /> Worldwide products
                  </div>
                </motion.button>
              </div>

              {/* Quick Tools Row */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-2">
                {[
                  { label: "Ingredients", icon: BookOpen, path: "/halal-scanner/ingredients", desc: "50+ ingredients" },
                  { label: "Learn", icon: GraduationCap, path: "/halal-scanner/learn", desc: "Articles & quizzes" },
                  { label: "Full Scanner", icon: Sparkles, path: "/halal-scanner", desc: "All features" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.path} onClick={() => navigate(item.path)}
                      className="rounded-xl bg-card p-3 border border-border text-center active:scale-95 transition-all hover:shadow-sm">
                      <Icon size={20} className="mx-auto text-primary" />
                      <p className="mt-1 text-xs font-semibold text-foreground">{item.label}</p>
                      <p className="text-[9px] text-muted-foreground">{item.desc}</p>
                    </button>
                  );
                })}
              </motion.div>

              {/* Ingredient of the Day */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 shrink-0">
                    <Star size={18} className="text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ingredient of the Day</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{todaysIngredient.emoji} {todaysIngredient.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{todaysIngredient.fact}</p>
                  </div>
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="grid grid-cols-3 gap-2">
                {[
                  { value: historyCount, label: "Scanned", icon: "📱" },
                  { value: favCount, label: "Saved", icon: "❤️" },
                  { value: progress.articlesRead.length, label: "Learned", icon: "📖" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl bg-card p-3 text-center border border-border">
                    <p className="text-base">{stat.icon}</p>
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </motion.div>

              {/* Quick Links */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="space-y-2">
                {[
                  { label: "Scan History", icon: Clock, path: "/halal-scanner/history", count: historyCount },
                  { label: "My Favorites", icon: Heart, path: "/halal-scanner/favorites", count: favCount },
                  { label: "Scanner Settings", icon: ScanLine, path: "/halal-scanner/settings" },
                ].map((link) => {
                  const Icon = link.icon;
                  return (
                    <button key={link.path} onClick={() => navigate(link.path)}
                      className="w-full flex items-center gap-3 rounded-xl bg-card p-3.5 border border-border active:scale-[0.98] transition-transform hover:shadow-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Icon size={16} className="text-primary" />
                      </div>
                      <span className="flex-1 text-left text-sm font-medium text-foreground">{link.label}</span>
                      {"count" in link && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{link.count}</span>}
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </button>
                  );
                })}
              </motion.div>

              {/* How It Works */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="rounded-2xl bg-card p-5 border border-border shadow-sm">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" /> How It Works
                </h3>
                <div className="mt-4 space-y-4">
                  {[
                    { step: "1", title: "Scan or Search", text: "Enter a barcode number or search by product name to find it in our database", icon: Search },
                    { step: "2", title: "AI Analysis", text: "Our engine checks every ingredient against Islamic dietary guidelines and scholarly rulings", icon: Shield },
                    { step: "3", title: "Detailed Results", text: "Get Halal/Haram/Doubtful status with Quranic references, scholarly opinions, and alternatives", icon: CheckCircle },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-emerald shadow-sm">
                          <span className="text-xs font-bold text-primary-foreground">{item.step}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Disclaimer */}
              <div className="rounded-xl bg-muted/50 p-4 border border-border">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  ⚠️ <strong>Disclaimer:</strong> For educational purposes only. Always verify with trusted scholars and certification bodies. "Leave what makes you doubt for what does not make you doubt." (Tirmidhi)
                </p>
              </div>
            </motion.div>
          )}

          {/* ── SCAN MODE ── */}
          {mode === "scan" && (
            <motion.div key="scan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-emerald">
                    <Camera size={20} className="text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Scan by Barcode</h3>
                    <p className="text-xs text-muted-foreground">Enter the barcode number from the product package</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text" inputMode="numeric" placeholder="Enter barcode number..."
                    value={barcode} onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBarcodeScan()}
                    className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-ring focus:outline-none"
                    autoFocus
                  />
                  <button onClick={handleBarcodeScan} disabled={loading || !barcode.trim()}
                    className="rounded-xl gradient-emerald px-5 py-3 text-primary-foreground font-medium shadow-emerald transition-all active:scale-95 disabled:opacity-50">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Scan"}
                  </button>
                </div>
              </div>

              {/* Sample Barcodes */}
              <div className="rounded-2xl bg-card p-4 border border-border shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Try sample barcodes</p>
                <div className="space-y-2">
                  {[
                    { code: "7622210449283", label: "Oreo Cookies" },
                    { code: "5000159484695", label: "Cadbury Dairy Milk" },
                    { code: "3017620422003", label: "Nutella" },
                  ].map(s => (
                    <button key={s.code} onClick={() => { setBarcode(s.code); }}
                      className="w-full flex items-center justify-between rounded-xl bg-muted/50 p-3 active:scale-[0.98] transition-transform">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.code}</p>
                      </div>
                      <ScanLine size={14} className="text-primary" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-destructive/10 border border-destructive/30 p-4">
                  <p className="text-sm text-destructive">{error}</p>
                  <button onClick={() => { setMode("search"); setError(""); }} className="mt-2 text-xs font-medium text-primary">
                    Try searching by name instead →
                  </button>
                </motion.div>
              )}

              {/* Single Result */}
              {singleResult && <ResultCard product={singleResult} navigate={navigate} />}

              {/* Switch to search */}
              <button onClick={() => { setMode("search"); setError(""); setSingleResult(null); }}
                className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2">
                <Search size={14} /> Switch to Search by Name
              </button>
            </motion.div>
          )}

          {/* ── SEARCH MODE ── */}
          {mode === "search" && (
            <motion.div key="search" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-gold">
                    <Search size={20} className="text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Search by Name</h3>
                    <p className="text-xs text-muted-foreground">Type a product name, brand, or keyword</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="e.g. Oreo, Nutella, Doritos..."
                    value={query} onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                    autoFocus
                  />
                  <button onClick={handleSearch} disabled={loading || query.trim().length < 2}
                    className="rounded-xl gradient-emerald px-5 py-3 text-primary-foreground font-medium shadow-emerald transition-all active:scale-95 disabled:opacity-50">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Searches Open Food Facts — a free database of products worldwide
                </p>
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center py-10">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Searching products...</p>
                </div>
              )}

              {/* Results */}
              {!loading && results.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">{results.length} products found</p>
                  {results.map((product, i) => (
                    <motion.div key={product.barcode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <ResultCard product={product} navigate={navigate} compact />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {searched && !loading && results.length === 0 && (
                <div className="text-center py-10 rounded-2xl bg-card border border-border">
                  <Search size={40} className="mx-auto text-muted-foreground/20" />
                  <p className="mt-3 text-sm font-medium text-foreground">No products found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different name or spelling</p>
                  <button onClick={() => { setMode("scan"); setSearched(false); setResults([]); }}
                    className="mt-3 text-xs font-medium text-primary">
                    Try scanning by barcode →
                  </button>
                </div>
              )}

              {/* Switch to scan */}
              <button onClick={() => { setMode("scan"); setSearched(false); setResults([]); }}
                className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2">
                <Camera size={14} /> Switch to Barcode Scan
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ResultCard = ({ product, navigate, compact }: { product: ProductResult; navigate: any; compact?: boolean }) => {
  const config = statusConfig[product.status];
  const Icon = config.icon;
  return (
    <button
      onClick={() => navigate(`/halal-scanner/product/${product.barcode}`)}
      className={`w-full rounded-2xl border ${config.borderClass} ${config.bgClass} ${compact ? "p-3" : "p-4"} text-left active:scale-[0.98] transition-transform`}
    >
      <div className="flex items-center gap-3">
        {product.image ? (
          <img src={product.image} alt={product.name} className={`${compact ? "h-12 w-12" : "h-14 w-14"} rounded-xl object-contain bg-background`} />
        ) : (
          <div className={`${compact ? "h-12 w-12" : "h-14 w-14"} rounded-xl bg-muted flex items-center justify-center`}>
            <ScanLine size={18} className="text-muted-foreground/30" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Icon size={14} className={config.textClass} />
            <span className={`text-xs font-bold ${config.textClass}`}>{config.label}</span>
          </div>
          <p className="font-medium text-foreground truncate text-sm">{product.name}</p>
          <p className="text-xs text-muted-foreground truncate">{product.brand}</p>
        </div>
        <ChevronRight size={14} className="text-muted-foreground shrink-0" />
      </div>
      {!compact && <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">{product.summary}</p>}
    </button>
  );
};

export default HalalScannerPage;
