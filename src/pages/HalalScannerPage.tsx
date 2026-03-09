import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Camera, Search, ScanLine, CheckCircle, XCircle, AlertTriangle,
  HelpCircle, Loader2, ChevronRight, BookOpen, GraduationCap, Shield,
  Sparkles, Star, Zap, Globe, Clock, Heart, X, FlashlightOff, Flashlight,
  SwitchCamera, Keyboard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchByName, searchByBarcode, addToHistory, getSettings, getHistory, getFavorites, type ProductResult } from "@/services/halalScannerService";
import { getTodaysIngredient, getLearningProgress } from "@/data/halalEducation";

const statusConfig = {
  halal: { icon: CheckCircle, label: "Halal ✅", bgClass: "bg-emerald-mid/10", textClass: "text-emerald-mid", borderClass: "border-emerald-mid/30" },
  haram: { icon: XCircle, label: "Haram ❌", bgClass: "bg-destructive/10", textClass: "text-destructive", borderClass: "border-destructive/30" },
  mushbooh: { icon: AlertTriangle, label: "Doubtful ⚠️", bgClass: "bg-accent/20", textClass: "text-accent-foreground", borderClass: "border-accent/30" },
  unknown: { icon: HelpCircle, label: "Unknown ❓", bgClass: "bg-muted", textClass: "text-muted-foreground", borderClass: "border-border" },
};

type Mode = "home" | "scan" | "search";

const HalalScannerPage = () => {
  const navigate = useNavigate();
  // Restore search state from sessionStorage for back navigation
  const savedSearch = sessionStorage.getItem("halal_search_state");
  const savedParsed = savedSearch ? JSON.parse(savedSearch) : null;
  
  const [query, setQuery] = useState(savedParsed?.query || "");
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductResult[]>(savedParsed?.results || []);
  const [singleResult, setSingleResult] = useState<ProductResult | null>(null);
  const [searched, setSearched] = useState(!!savedParsed?.results?.length);
  const [error, setError] = useState("");
  const [manualEntry, setManualEntry] = useState(false);

  // If we have saved search state, restore to search mode
  const [mode, setMode] = useState<Mode>(savedParsed?.results?.length ? "search" : "home");

  const todaysIngredient = getTodaysIngredient();
  const progress = getLearningProgress();
  const historyCount = getHistory().length;
  const favCount = getFavorites().length;

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    setError("");
    setResults([]);
    try {
      const data = await searchByName(query.trim());
      setResults(data.products);
      // Save search state for back navigation
      sessionStorage.setItem("halal_search_state", JSON.stringify({ query: query.trim(), results: data.products }));
      const settings = getSettings();
      if (settings.autoSave) {
        data.products.slice(0, 3).forEach(p => {
          addToHistory({ product: p, scannedAt: new Date().toISOString() });
        });
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Search failed. Please check your connection and try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeLookup = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setSingleResult(null);
    try {
      const product = await searchByBarcode(code.trim());
      if (product) {
        setSingleResult(product);
        const settings = getSettings();
        if (settings.autoSave) addToHistory({ product, scannedAt: new Date().toISOString() });
        if (settings.vibration && navigator.vibrate) navigator.vibrate(200);
      } else {
        setError("Product not found in database. Try searching by name instead.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const switchToMode = (m: Mode) => {
    setMode(m);
    setError("");
    setSingleResult(null);
    setResults([]);
    setSearched(false);
    setManualEntry(false);
    // Clear saved search when leaving search mode
    if (m !== "search") {
      sessionStorage.removeItem("halal_search_state");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="gradient-emerald px-4 pb-10 pt-12 islamic-pattern relative z-10">
          <button onClick={() => mode === "home" ? navigate("/") : switchToMode("home")} className="mb-5 flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors">
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
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary-foreground/5 z-0" />
        <div className="absolute -bottom-5 -left-8 h-24 w-24 rounded-full bg-primary-foreground/5 z-0" />
      </div>

      <div className="px-4 -mt-5 pb-6 space-y-4 relative z-10">
        <AnimatePresence initial={false}>
          {/* ── HOME MODE ── */}
          {mode === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  onClick={() => switchToMode("scan")}
                  className="group rounded-2xl bg-card p-5 shadow-sm border border-border text-left active:scale-[0.97] transition-all hover:shadow-md hover:border-emerald-mid/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-emerald shadow-emerald group-hover:scale-110 transition-transform">
                    <Camera size={24} className="text-primary-foreground" />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-foreground">Scan Barcode</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Point your camera at a product barcode for instant results
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-primary">
                    <Zap size={10} /> Camera scan
                  </div>
                </motion.button>

                <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  onClick={() => switchToMode("search")}
                  className="group rounded-2xl bg-card p-5 shadow-sm border border-border text-left active:scale-[0.97] transition-all hover:shadow-md hover:border-emerald-mid/30">
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

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="rounded-2xl bg-card p-5 border border-border shadow-sm">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" /> How It Works
                </h3>
                <div className="mt-4 space-y-4">
                  {[
                    { step: "1", title: "Scan or Search", text: "Point your camera at a barcode, or search by product name", icon: Search },
                    { step: "2", title: "AI Analysis", text: "Every ingredient is checked against Islamic dietary guidelines", icon: Shield },
                    { step: "3", title: "Detailed Results", text: "Get status with Quranic references, scholarly opinions & alternatives", icon: CheckCircle },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-emerald shadow-sm">
                        <span className="text-xs font-bold text-primary-foreground">{item.step}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <div className="rounded-xl bg-muted/50 p-4 border border-border">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  ⚠️ <strong>Disclaimer:</strong> For educational purposes only. Always verify with trusted scholars and certification bodies.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── SCAN MODE ── */}
          {mode === "scan" && (
            <motion.div key="scan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {!singleResult && !manualEntry && (
                <BarcodeScanner
                  onDetected={(code) => { setBarcode(code); handleBarcodeLookup(code); }}
                  onManualEntry={() => setManualEntry(true)}
                />
              )}

              {manualEntry && !singleResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-card p-5 shadow-sm border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-emerald">
                        <Keyboard size={20} className="text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">Manual Entry</h3>
                        <p className="text-xs text-muted-foreground">Type the barcode number</p>
                      </div>
                    </div>
                    <button onClick={() => setManualEntry(false)} className="p-1 text-muted-foreground"><X size={18} /></button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text" inputMode="numeric" placeholder="Enter barcode number..."
                      value={barcode} onChange={(e) => setBarcode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleBarcodeLookup(barcode)}
                      className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-ring focus:outline-none"
                      autoFocus
                    />
                    <button onClick={() => handleBarcodeLookup(barcode)} disabled={loading || !barcode.trim()}
                      className="rounded-xl gradient-emerald px-5 py-3 text-primary-foreground font-medium shadow-emerald transition-all active:scale-95 disabled:opacity-50">
                      {loading ? <Loader2 size={18} className="animate-spin" /> : "Scan"}
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Try samples</p>
                    {[
                      { code: "7622210449283", label: "Oreo Cookies" },
                      { code: "3017620422003", label: "Nutella" },
                      { code: "5000159484695", label: "Cadbury Dairy Milk" },
                    ].map(s => (
                      <button key={s.code} onClick={() => { setBarcode(s.code); handleBarcodeLookup(s.code); }}
                        className="w-full flex items-center justify-between rounded-xl bg-muted/50 p-3 active:scale-[0.98] transition-transform">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.label}</p>
                          <p className="text-xs text-muted-foreground font-mono">{s.code}</p>
                        </div>
                        <ScanLine size={14} className="text-primary" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {loading && (
                <div className="flex flex-col items-center py-10">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Analyzing product...</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">💡 Did you know? Agar-agar is a Halal gelatin substitute from seaweed.</p>
                </div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-destructive/10 border border-destructive/30 p-4">
                  <p className="text-sm text-destructive">{error}</p>
                  <button onClick={() => { switchToMode("search"); }} className="mt-2 text-xs font-medium text-primary">
                    Try searching by name instead →
                  </button>
                </motion.div>
              )}

              {singleResult && <ResultCard product={singleResult} navigate={navigate} />}

              {singleResult && (
                <button onClick={() => { setSingleResult(null); setBarcode(""); setError(""); setManualEntry(false); }}
                  className="w-full rounded-xl gradient-emerald py-3 text-sm font-medium text-primary-foreground shadow-emerald active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <Camera size={14} /> Scan Another Product
                </button>
              )}

              <button onClick={() => switchToMode("search")}
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
                  <input type="text" placeholder="e.g. Oreo, Nutella, Doritos..."
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

              {loading && (
                <div className="flex flex-col items-center py-10">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Searching products...</p>
                </div>
              )}

              {!loading && error && (
                <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-4 text-center">
                  <XCircle size={24} className="mx-auto text-destructive" />
                  <p className="mt-2 text-sm text-destructive font-medium">{error}</p>
                  <button onClick={handleSearch} className="mt-2 text-xs font-medium text-primary">Try again</button>
                </div>
              )}

              {!loading && !error && results.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">{results.length} products found</p>
                  {results.map((product, i) => (
                    <motion.div key={product.barcode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <ResultCard product={product} navigate={navigate} compact />
                    </motion.div>
                  ))}
                </div>
              )}

              {searched && !loading && results.length === 0 && (
                <div className="text-center py-10 rounded-2xl bg-card border border-border">
                  <Search size={40} className="mx-auto text-muted-foreground/20" />
                  <p className="mt-3 text-sm font-medium text-foreground">No products found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different name or spelling</p>
                  <button onClick={() => switchToMode("scan")} className="mt-3 text-xs font-medium text-primary">
                    Try scanning by barcode →
                  </button>
                </div>
              )}

              <button onClick={() => switchToMode("scan")}
                className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2">
                <Camera size={14} /> Switch to Camera Scan
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ── Camera Barcode Scanner Component ── */
const BarcodeScanner = ({ onDetected, onManualEntry }: { onDetected: (code: string) => void; onManualEntry: () => void }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [cameraError, setCameraError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [torch, setTorch] = useState(false);
  const detectedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const startScanner = async () => {
      try {
        const mod: any = await import("html5-qrcode");
        if (!mounted || !scannerRef.current) return;

        const Html5Qrcode = mod.Html5Qrcode;
        const SupportedFormats = mod.Html5QrcodeSupportedFormats;

        const scanner = new Html5Qrcode("barcode-scanner-region", { verbose: false });
        html5QrCodeRef.current = scanner;

        const config: any = {
          fps: 12,
          // Barcodes generally work better with a wider (rectangular) scan box.
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.min(420, Math.max(260, Math.floor(viewfinderWidth * 0.9)));
            const height = Math.min(220, Math.max(120, Math.floor(viewfinderHeight * 0.35)));
            return { width, height };
          },
          disableFlip: false,
          rememberLastUsedCamera: true,
          experimentalFeatures: {
            // Uses native BarcodeDetector on supported browsers for much better barcode performance.
            useBarCodeDetectorIfSupported: true,
          },
        };

        if (SupportedFormats) {
          config.formatsToSupport = [
            SupportedFormats.EAN_13,
            SupportedFormats.EAN_8,
            SupportedFormats.UPC_A,
            SupportedFormats.UPC_E,
            SupportedFormats.CODE_128,
            SupportedFormats.ITF,
          ].filter(Boolean);
        }

        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            if (!detectedRef.current) {
              detectedRef.current = true;
              if (navigator.vibrate) navigator.vibrate(200);
              scanner.stop().catch(() => {});
              onDetected(decodedText);
            }
          },
          () => {
            // ignore per-frame decode errors
          },
        );

        if (mounted) setIsScanning(true);
      } catch (err: any) {
        if (mounted) {
          console.error("Camera error:", err);
          setCameraError(
            err?.message?.includes("NotAllowed") || err?.name === "NotAllowedError"
              ? "Camera permission denied. Please allow camera access and try again."
              : err?.message?.includes("NotFound") || err?.name === "NotFoundError"
                ? "No camera found on this device."
                : "Could not start camera. Please use manual entry instead.",
          );
        }
      }
    };

    startScanner();

    // Only stop() — never call clear() as it deletes DOM nodes React manages, causing black screen
    return () => {
      mounted = false;
      html5QrCodeRef.current?.stop().catch(() => {});
    };
  }, [onDetected]);

  const toggleTorch = async () => {
    try {
      const track = html5QrCodeRef.current?.getRunningTrackCameraCapabilities?.();
      if (track?.torchFeature?.isSupported()) {
        await track.torchFeature.apply(!torch);
        setTorch(!torch);
      }
    } catch {}
  };

  if (cameraError) {
    return (
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border text-center">
        <Camera size={48} className="mx-auto text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium text-foreground">Camera Unavailable</p>
        <p className="text-xs text-muted-foreground mt-1">{cameraError}</p>
        <button onClick={onManualEntry}
          className="mt-4 w-full rounded-xl gradient-emerald py-3 text-sm font-medium text-primary-foreground shadow-emerald active:scale-95 transition-transform">
          Enter Barcode Manually
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
      {/* Camera View */}
      <div className="relative bg-foreground/95">
        <div id="barcode-scanner-region" ref={scannerRef} className="w-full" style={{ minHeight: 300 }} />
        
        {/* Overlay UI */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Scanning line animation */}
            <motion.div
              animate={{ y: [-60, 60] }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5, ease: "easeInOut" }}
              className="w-64 h-0.5 rounded-full bg-emerald-mid shadow-[0_0_10px_2px_hsl(var(--emerald-mid)/0.5)]"
            />
          </div>
        )}

        {/* Camera Controls */}
        <div className="absolute top-3 right-3 flex gap-2 pointer-events-auto">
          <button onClick={toggleTorch}
            className="p-2 rounded-full bg-foreground/40 backdrop-blur-sm text-primary-foreground active:scale-90 transition-transform">
            {torch ? <Flashlight size={18} /> : <FlashlightOff size={18} />}
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="p-4 text-center">
        <p className="text-sm font-medium text-foreground">
          {isScanning ? "Point camera at a barcode" : "Starting camera..."}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {isScanning ? "Hold steady, barcode will be detected automatically" : "Please allow camera access when prompted"}
        </p>
        <button onClick={onManualEntry}
          className="mt-3 text-xs font-medium text-primary flex items-center justify-center gap-1 mx-auto">
          <Keyboard size={12} /> Enter barcode manually
        </button>
      </div>
    </div>
  );
};

/* ── Result Card ── */
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
            {product.productType === "cosmetic" && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-semibold">💄 Cosmetic</span>
            )}
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
