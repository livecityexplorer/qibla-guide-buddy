import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, ScanLine, Keyboard, Clipboard, Loader2, CheckCircle, XCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchByBarcode, addToHistory, getSettings } from "@/services/halalScannerService";
import type { ProductResult } from "@/services/halalScannerService";

const statusConfig = {
  halal: { icon: CheckCircle, label: "HALAL ✅", bg: "bg-emerald-mid/10", text: "text-emerald-mid", border: "border-emerald-mid/30" },
  haram: { icon: XCircle, label: "HARAM ❌", bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30" },
  mushbooh: { icon: AlertTriangle, label: "DOUBTFUL ⚠️", bg: "bg-accent/20", text: "text-accent-foreground", border: "border-accent/30" },
  unknown: { icon: HelpCircle, label: "UNKNOWN ❓", bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
};

const HALAL_FACTS = [
  "Did you know? Gelatin from fish is Halal!",
  "Agar-agar is a plant-based Halal alternative to gelatin.",
  "E120 (Carmine) is made from crushed insects.",
  "Pure vanilla extract contains 35%+ alcohol.",
  "'Natural Flavors' can hide animal-derived ingredients.",
  "Most commercial gelatin is from pork.",
];

const BarcodeScanPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState<ProductResult | null>(null);
  const [error, setError] = useState("");
  const [factIndex] = useState(Math.floor(Math.random() * HALAL_FACTS.length));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = async (code: string) => {
    if (!code.trim()) return;
    setScanning(true);
    setError("");
    setResult(null);

    try {
      const product = await searchByBarcode(code.trim());
      if (product) {
        setResult(product);
        const settings = getSettings();
        if (settings.autoSave) {
          addToHistory({ product, scannedAt: new Date().toISOString() });
        }
        if (settings.vibration && navigator.vibrate) {
          navigator.vibrate(100);
        }
      } else {
        setError("Product not found. Try searching by name instead.");
      }
    } catch {
      setError("Failed to look up product. Check your connection.");
    } finally {
      setScanning(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setBarcode(text.trim());
    } catch {
      // clipboard access denied
    }
  };

  const StatusIcon = result ? statusConfig[result.status].icon : null;

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-8 pt-12 islamic-pattern">
        <button onClick={() => navigate("/halal-scanner")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} /><span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">Scan Product</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">Scan barcode or enter manually</p>
      </div>

      <div className="px-4 -mt-4 pb-6 space-y-4">
        {/* Mode Toggle */}
        <div className="flex rounded-xl bg-card border border-border overflow-hidden">
          <button
            onClick={() => setMode("camera")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === "camera" ? "gradient-emerald text-primary-foreground" : "text-muted-foreground"}`}
          >
            <Camera size={16} className="inline mr-1" /> Camera
          </button>
          <button
            onClick={() => { setMode("manual"); setTimeout(() => inputRef.current?.focus(), 100); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === "manual" ? "gradient-emerald text-primary-foreground" : "text-muted-foreground"}`}
          >
            <Keyboard size={16} className="inline mr-1" /> Manual
          </button>
        </div>

        {/* Scanner Area */}
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border text-center">
          {mode === "camera" ? (
            <>
              <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted relative overflow-hidden">
                {scanning ? (
                  <motion.div
                    animate={{ y: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute inset-x-0 h-0.5 gradient-emerald"
                  />
                ) : null}
                <div className="text-center">
                  <Camera size={48} className="mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Camera scanning requires<br />html5-qrcode library
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Use manual entry below, or search by product name
              </p>
              <button
                onClick={() => { setMode("manual"); setTimeout(() => inputRef.current?.focus(), 100); }}
                className="mt-3 text-sm font-medium text-primary"
              >
                Switch to Manual Entry →
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter barcode number..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScan(barcode)}
                  className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <button
                  onClick={handlePaste}
                  className="rounded-xl border border-border p-3 text-muted-foreground hover:text-foreground"
                  title="Paste from clipboard"
                >
                  <Clipboard size={18} />
                </button>
              </div>
              <button
                onClick={() => handleScan(barcode)}
                disabled={scanning || !barcode.trim()}
                className="mt-3 w-full rounded-xl gradient-emerald py-3 font-medium text-primary-foreground shadow-emerald transition-all active:scale-95 disabled:opacity-50"
              >
                {scanning ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Looking up...
                  </span>
                ) : (
                  "Look Up Product"
                )}
              </button>
            </>
          )}
        </div>

        {/* Scanning Fact */}
        {scanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl bg-card p-4 border border-border"
          >
            <p className="text-xs text-muted-foreground">💡 {HALAL_FACTS[factIndex]}</p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-destructive/10 border border-destructive/30 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={() => navigate("/halal-scanner/search")} className="mt-2 text-xs font-medium text-primary">
              Search by name instead →
            </button>
          </motion.div>
        )}

        {/* Quick Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-2xl border ${statusConfig[result.status].border} ${statusConfig[result.status].bg} p-5`}
            >
              <div className="flex items-start gap-3">
                {result.image && (
                  <img src={result.image} alt={result.name} className="h-16 w-16 rounded-lg object-contain bg-background" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {StatusIcon && <StatusIcon size={24} className={statusConfig[result.status].text} />}
                    <span className={`text-lg font-bold ${statusConfig[result.status].text}`}>
                      {statusConfig[result.status].label}
                    </span>
                  </div>
                  <p className="font-medium text-foreground mt-1 truncate">{result.name}</p>
                  <p className="text-xs text-muted-foreground">{result.brand}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => navigate(`/halal-scanner/product/${result.barcode}`)}
                  className="flex-1 rounded-xl gradient-emerald py-2.5 text-sm font-medium text-primary-foreground"
                >
                  View Full Analysis
                </button>
                <button
                  onClick={() => { setResult(null); setBarcode(""); setError(""); }}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground"
                >
                  Scan Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sample Barcodes */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">Try These Sample Barcodes</h3>
          <div className="space-y-2">
            {[
              { code: "7622210449283", label: "Oreo Cookies" },
              { code: "5000159484695", label: "Cadbury Dairy Milk" },
              { code: "8801234567890", label: "Nongshim Noodles" },
            ].map((sample) => (
              <button
                key={sample.code}
                onClick={() => { setBarcode(sample.code); setMode("manual"); handleScan(sample.code); }}
                className="w-full flex items-center justify-between rounded-lg bg-muted p-3 text-left active:scale-[0.98] transition-transform"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{sample.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{sample.code}</p>
                </div>
                <ScanLine size={16} className="text-primary" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanPage;
