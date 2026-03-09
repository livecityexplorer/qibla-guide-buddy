import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, ScanLine, Keyboard, Clipboard, Loader2, CheckCircle, XCircle, AlertTriangle, HelpCircle, FlashlightOff, Flashlight } from "lucide-react";
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

  const handleScan = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setScanning(true);
    setError("");
    setResult(null);
    try {
      const product = await searchByBarcode(code.trim());
      if (product) {
        setResult(product);
        const settings = getSettings();
        if (settings.autoSave) addToHistory({ product, scannedAt: new Date().toISOString() });
        if (settings.vibration && navigator.vibrate) navigator.vibrate(100);
      } else {
        setError("Product not found. Try searching by name instead.");
      }
    } catch {
      setError("Failed to look up product. Check your connection.");
    } finally {
      setScanning(false);
    }
  }, []);

  const handlePaste = async () => {
    try { const text = await navigator.clipboard.readText(); setBarcode(text.trim()); } catch {}
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
          <button onClick={() => setMode("camera")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === "camera" ? "gradient-emerald text-primary-foreground" : "text-muted-foreground"}`}>
            <Camera size={16} className="inline mr-1" /> Camera
          </button>
          <button onClick={() => { setMode("manual"); setTimeout(() => inputRef.current?.focus(), 100); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === "manual" ? "gradient-emerald text-primary-foreground" : "text-muted-foreground"}`}>
            <Keyboard size={16} className="inline mr-1" /> Manual
          </button>
        </div>

        {/* Camera / Manual */}
        {mode === "camera" && !result && !scanning ? (
          <CameraScanner
            onDetected={(code) => { setBarcode(code); handleScan(code); }}
            onManualEntry={() => { setMode("manual"); setTimeout(() => inputRef.current?.focus(), 100); }}
          />
        ) : mode === "manual" && !result ? (
          <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
            <div className="flex gap-2">
              <input ref={inputRef} type="text" inputMode="numeric" placeholder="Enter barcode number..."
                value={barcode} onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan(barcode)}
                className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
              <button onClick={handlePaste} className="rounded-xl border border-border p-3 text-muted-foreground hover:text-foreground" title="Paste">
                <Clipboard size={18} />
              </button>
            </div>
            <button onClick={() => handleScan(barcode)} disabled={scanning || !barcode.trim()}
              className="mt-3 w-full rounded-xl gradient-emerald py-3 font-medium text-primary-foreground shadow-emerald transition-all active:scale-95 disabled:opacity-50">
              {scanning ? <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Looking up...</span> : "Look Up Product"}
            </button>
          </div>
        ) : null}

        {scanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-4 border border-border">
            <p className="text-xs text-muted-foreground">💡 {HALAL_FACTS[factIndex]}</p>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-destructive/10 border border-destructive/30 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={() => navigate("/halal-scanner/search")} className="mt-2 text-xs font-medium text-primary">Search by name instead →</button>
          </motion.div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`rounded-2xl border ${statusConfig[result.status].border} ${statusConfig[result.status].bg} p-5`}>
              <div className="flex items-start gap-3">
                {result.image && <img src={result.image} alt={result.name} className="h-16 w-16 rounded-lg object-contain bg-background" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {StatusIcon && <StatusIcon size={24} className={statusConfig[result.status].text} />}
                    <span className={`text-lg font-bold ${statusConfig[result.status].text}`}>{statusConfig[result.status].label}</span>
                  </div>
                  <p className="font-medium text-foreground mt-1 truncate">{result.name}</p>
                  <p className="text-xs text-muted-foreground">{result.brand}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => navigate(`/halal-scanner/product/${result.barcode}`)}
                  className="flex-1 rounded-xl gradient-emerald py-2.5 text-sm font-medium text-primary-foreground">View Full Analysis</button>
                <button onClick={() => { setResult(null); setBarcode(""); setError(""); }}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground">Scan Another</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!result && mode === "manual" && (
          <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Try These Sample Barcodes</h3>
            <div className="space-y-2">
              {[
                { code: "7622210449283", label: "Oreo Cookies" },
                { code: "5000159484695", label: "Cadbury Dairy Milk" },
                { code: "3017620422003", label: "Nutella" },
              ].map((sample) => (
                <button key={sample.code} onClick={() => { setBarcode(sample.code); handleScan(sample.code); }}
                  className="w-full flex items-center justify-between rounded-lg bg-muted p-3 text-left active:scale-[0.98] transition-transform">
                  <div>
                    <p className="text-sm font-medium text-foreground">{sample.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{sample.code}</p>
                  </div>
                  <ScanLine size={16} className="text-primary" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Camera Scanner Component ── */
const CameraScanner = ({
  onDetected,
  onManualEntry,
}: {
  onDetected: (code: string) => void;
  onManualEntry: () => void;
}) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [cameraError, setCameraError] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [torch, setTorch] = useState(false);
  const detectedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    const scanner = html5QrCodeRef.current;
    if (!scanner) return;

    try {
      await scanner.stop();
    } catch {}

    try {
      scanner.clear?.();
    } catch {}

    html5QrCodeRef.current = null;
    setIsActive(false);
    setTorch(false);
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const startScanner = useCallback(async () => {
    if (isStarting) return;
    setCameraError("");
    setIsStarting(true);

    detectedRef.current = false;

    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available. Please use HTTPS or a supported browser.");
      }

      // Must be called from a user gesture on Safari/iOS
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      await stopScanner();

      const mod: any = await import("html5-qrcode");
      const Html5Qrcode = mod.Html5Qrcode;
      const SupportedFormats = mod.Html5QrcodeSupportedFormats;

      const scanner = new Html5Qrcode("barcode-reader", { verbose: false });
      html5QrCodeRef.current = scanner;

      // Stop the warm-up stream now that we're about to start html5-qrcode
      stream.getTracks().forEach((t) => t.stop());

      const config: any = {
        fps: 12,
        qrbox: { width: 280, height: 150 },
        disableFlip: false,
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
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
        (text: string) => {
          if (!detectedRef.current) {
            detectedRef.current = true;
            if (navigator.vibrate) navigator.vibrate(150);
            scanner
              .stop()
              .catch(() => {})
              .finally(() => {
                try {
                  scanner.clear?.();
                } catch {}
              });
            onDetected(text);
          }
        },
        () => {},
      );

      setHasStarted(true);
      setIsActive(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      let errorMessage = "Could not start camera. Please use manual entry instead.";
      
      if (err?.name === "NotAllowedError" || err?.message?.includes("NotAllowed") || err?.message?.includes("Permission denied")) {
        errorMessage = "Camera access denied. Please allow camera permission in your browser/app settings and reload.";
      } else if (err?.name === "NotFoundError" || err?.message?.includes("NotFound") || err?.message?.includes("Requested device not found")) {
        errorMessage = "No camera found on this device.";
      } else if (err?.name === "NotReadableError" || err?.message?.includes("NotReadable")) {
        errorMessage = "Camera is in use by another app. Please close other apps using the camera.";
      } else if (err?.message) {
        errorMessage = `Camera error: ${err.message}`;
      }
      
      setCameraError(errorMessage);
      setHasStarted(false);
      setIsActive(false);
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, onDetected, stopScanner]);

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
        <button
          onClick={onManualEntry}
          className="mt-4 w-full rounded-xl gradient-emerald py-3 text-sm font-medium text-primary-foreground shadow-emerald"
        >
          Enter Barcode Manually
        </button>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border text-center">
        <Camera size={48} className="mx-auto text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium text-foreground">Ready to Scan</p>
        <p className="text-xs text-muted-foreground mt-1">
          Tap “Start Scanner” to open your camera.
        </p>
        <button
          onClick={startScanner}
          disabled={isStarting}
          className="mt-4 w-full rounded-xl gradient-emerald py-3 text-sm font-medium text-primary-foreground shadow-emerald active:scale-95 transition-transform disabled:opacity-50"
        >
          {isStarting ? "Starting…" : "Start Scanner"}
        </button>
        <button
          onClick={onManualEntry}
          className="mt-3 text-xs font-medium text-primary flex items-center justify-center gap-1 mx-auto"
        >
          <Keyboard size={12} /> Enter barcode manually
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
      <div className="relative bg-foreground/95">
        <div id="barcode-reader" ref={scannerRef} className="w-full" style={{ minHeight: 300 }} />
        {isActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <motion.div
              animate={{ y: [-60, 60] }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5, ease: "easeInOut" }}
              className="w-64 h-0.5 rounded-full bg-emerald-mid shadow-[0_0_10px_2px_hsl(var(--emerald-mid)/0.5)]"
            />
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          <button onClick={toggleTorch} className="p-2 rounded-full bg-foreground/40 backdrop-blur-sm text-primary-foreground">
            {torch ? <Flashlight size={18} /> : <FlashlightOff size={18} />}
          </button>
        </div>
      </div>
      <div className="p-4 text-center">
        <p className="text-sm font-medium text-foreground">{isActive ? "Point camera at a barcode" : "Starting camera..."}</p>
        <p className="text-xs text-muted-foreground mt-1">{isActive ? "Hold steady — auto-detection is active" : "Please allow camera access"}</p>
        <button onClick={onManualEntry} className="mt-3 text-xs font-medium text-primary flex items-center justify-center gap-1 mx-auto">
          <Keyboard size={12} /> Enter barcode manually
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanPage;
