import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Camera, Keyboard, Clipboard, Loader2, ScanLine,
  ShieldAlert, ShieldCheck, FlashlightOff, Flashlight, Package,
  Factory, MapPin, Tag, Leaf, ExternalLink, ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { lookupBarcode, matchWithBoycott, type BoycottScanResult } from "@/services/boycottScanService";
import { getLevelConfig } from "@/data/boycottDirectory";

const BoycottScanPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState<BoycottScanResult | null>(null);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setScanning(true);
    setError("");
    setResult(null);
    try {
      const product = await lookupBarcode(code.trim());
      if (product) {
        const scanResult = matchWithBoycott(product);
        setResult(scanResult);
      } else {
        setError("Product not found in any database. Try a different barcode or search manually.");
      }
    } catch {
      setError("Failed to look up product. Check your connection.");
    } finally {
      setScanning(false);
    }
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setBarcode(text.trim());
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 px-4 pb-8 pt-12">
        <button onClick={() => navigate("/boycott")} className="mb-4 flex items-center gap-2 text-white/80">
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Scan Product</h1>
        <p className="mt-1 text-sm text-white/70">Scan a barcode to check if the product is on the boycott list</p>
      </div>

      <div className="px-4 -mt-4 pb-24 space-y-4">
        {/* Mode Toggle */}
        <div className="flex rounded-xl bg-card border border-border overflow-hidden shadow-sm">
          <button
            onClick={() => setMode("camera")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === "camera" ? "bg-gradient-to-r from-red-700 to-red-900 text-white" : "text-muted-foreground"
            }`}
          >
            <Camera size={16} className="inline mr-1" /> Camera
          </button>
          <button
            onClick={() => { setMode("manual"); setTimeout(() => inputRef.current?.focus(), 100); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === "manual" ? "bg-gradient-to-r from-red-700 to-red-900 text-white" : "text-muted-foreground"
            }`}
          >
            <Keyboard size={16} className="inline mr-1" /> Manual
          </button>
        </div>

        {/* Camera */}
        {mode === "camera" && !result && !scanning && (
          <CameraScanner
            onDetected={(code) => { setBarcode(code); handleScan(code); }}
            onManualEntry={() => { setMode("manual"); setTimeout(() => inputRef.current?.focus(), 100); }}
          />
        )}

        {/* Manual Entry */}
        {mode === "manual" && !result && !scanning && (
          <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
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
              <button onClick={handlePaste} className="rounded-xl border border-border p-3 text-muted-foreground hover:text-foreground" title="Paste">
                <Clipboard size={18} />
              </button>
            </div>
            <button
              onClick={() => handleScan(barcode)}
              disabled={scanning || !barcode.trim()}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-red-700 to-red-900 py-3 font-medium text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              Check Product
            </button>
          </div>
        )}

        {/* Scanning Indicator */}
        {scanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl bg-card p-8 border border-border text-center"
          >
            <Loader2 size={40} className="mx-auto animate-spin text-red-600" />
            <p className="mt-4 font-medium text-foreground">Looking up product...</p>
            <p className="mt-1 text-xs text-muted-foreground">Checking Open Food Facts, Cosmetics & more</p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-destructive/10 border border-destructive/30 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={() => { setError(""); setResult(null); setBarcode(""); }} className="mt-2 text-xs font-medium text-primary">Try again →</button>
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Boycott Status Banner */}
              {result.boycottMatch ? (
                <div className={`rounded-2xl border ${getLevelConfig(result.boycottMatch.level).border} ${getLevelConfig(result.boycottMatch.level).bg} p-5`}>
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={32} className={getLevelConfig(result.boycottMatch.level).color} />
                    <div>
                      <p className={`text-lg font-bold ${getLevelConfig(result.boycottMatch.level).color}`}>
                        ⛔ ON BOYCOTT LIST
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {result.matchType === "direct" && `Direct match: ${result.matchedOn}`}
                        {result.matchType === "sub-brand" && `Sub-brand of: ${result.boycottMatch.name} (via ${result.matchedOn})`}
                        {result.matchType === "related" && `Related to: ${result.boycottMatch.name} (via ${result.matchedOn})`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${getLevelConfig(result.boycottMatch.level).color}`}>
                        {getLevelConfig(result.boycottMatch.level).label}
                      </span>
                      <span className="text-xs text-muted-foreground">· {result.boycottMatch.country}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {result.boycottMatch.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.boycottMatch.reason}</p>

                    {result.boycottMatch.alternatives && result.boycottMatch.alternatives.length > 0 && (
                      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 mt-3">
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">💡 Alternatives</p>
                        <p className="mt-1 text-xs text-muted-foreground">{result.boycottMatch.alternatives.join(", ")}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
                  <ShieldCheck size={40} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Not on Boycott List ✅</p>
                  <p className="mt-1 text-xs text-muted-foreground">This product was not found on the boycott directory. Always verify with official BDS sources.</p>
                </div>
              )}

              {/* Product Info Card */}
              <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                <div className="flex gap-4">
                  {result.product.imageUrl ? (
                    <img
                      src={result.product.imageUrl}
                      alt={result.product.name}
                      className="h-24 w-24 rounded-xl object-contain bg-white p-1 shadow-sm"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-muted">
                      <Package size={32} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-foreground text-lg leading-tight">{result.product.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{result.product.brand}</p>
                    {result.product.quantity && (
                      <p className="text-xs text-muted-foreground mt-0.5">{result.product.quantity}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {result.product.nutriscoreGrade && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          result.product.nutriscoreGrade === "a" ? "bg-emerald-500/20 text-emerald-600" :
                          result.product.nutriscoreGrade === "b" ? "bg-green-500/20 text-green-600" :
                          result.product.nutriscoreGrade === "c" ? "bg-yellow-500/20 text-yellow-600" :
                          result.product.nutriscoreGrade === "d" ? "bg-orange-500/20 text-orange-600" :
                          "bg-red-500/20 text-red-600"
                        }`}>
                          Nutri-Score {result.product.nutriscoreGrade.toUpperCase()}
                        </span>
                      )}
                      {result.product.novaGroup && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                          NOVA {result.product.novaGroup}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Toggle Details */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="mt-4 flex w-full items-center justify-center gap-1 text-xs font-medium text-primary"
                >
                  {showDetails ? "Hide" : "Show"} full details
                  <ChevronDown size={14} className={`transition-transform ${showDetails ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3 border-t border-border pt-4">
                        {result.product.manufacturer && (
                          <DetailRow icon={Factory} label="Manufacturer" value={result.product.manufacturer} />
                        )}
                        {result.product.categories && (
                          <DetailRow icon={Tag} label="Categories" value={result.product.categories} />
                        )}
                        {result.product.origins && (
                          <DetailRow icon={MapPin} label="Origins" value={result.product.origins} />
                        )}
                        {result.product.countries && (
                          <DetailRow icon={MapPin} label="Sold in" value={result.product.countries} />
                        )}
                        {result.product.stores && (
                          <DetailRow icon={Package} label="Stores" value={result.product.stores} />
                        )}
                        {result.product.labels && (
                          <DetailRow icon={Leaf} label="Labels" value={result.product.labels} />
                        )}
                        {result.product.packaging && (
                          <DetailRow icon={Package} label="Packaging" value={result.product.packaging} />
                        )}
                        {result.product.ingredients && (
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-1">Ingredients</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{result.product.ingredients}</p>
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Source: {result.product.source === "openfoodfacts" ? "Open Food Facts" :
                                   result.product.source === "openbeautyfacts" ? "Open Beauty Facts" : "Open Pet Food Facts"}
                          {" · Barcode: "}{result.product.barcode}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setResult(null); setBarcode(""); setError(""); setShowDetails(false); }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-700 to-red-900 py-3 font-medium text-white shadow-md transition-all active:scale-95"
                >
                  Scan Another
                </button>
                <button
                  onClick={() => navigate("/boycott")}
                  className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-all active:scale-95"
                >
                  Browse List
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sample Barcodes */}
        {!result && !scanning && mode === "manual" && (
          <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Try These Sample Barcodes</h3>
            <div className="space-y-2">
              {[
                { code: "5449000000996", label: "Coca-Cola" },
                { code: "7622210449283", label: "Oreo Cookies (Mondelez)" },
                { code: "5000159484695", label: "Cadbury Dairy Milk" },
                { code: "3017620422003", label: "Nutella (Ferrero)" },
                { code: "5000112637922", label: "Nescafé (Nestlé)" },
              ].map((sample) => (
                <button
                  key={sample.code}
                  onClick={() => { setBarcode(sample.code); handleScan(sample.code); }}
                  className="w-full flex items-center justify-between rounded-lg bg-muted p-3 text-left active:scale-[0.98] transition-transform"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{sample.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{sample.code}</p>
                  </div>
                  <ScanLine size={16} className="text-red-600" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Detail Row ── */
const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <Icon size={14} className="mt-0.5 text-muted-foreground shrink-0" />
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xs text-foreground">{value}</p>
    </div>
  </div>
);

/* ── Camera Scanner ── */
const CameraScanner = ({ onDetected, onManualEntry }: { onDetected: (code: string) => void; onManualEntry: () => void }) => {
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
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available. Please use HTTPS or a supported browser.");
      }

      console.log("[BoycottScan] Requesting camera permission...");
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch (e) {
        console.log("[BoycottScan] facingMode failed, trying video:true", e);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      console.log("[BoycottScan] Permission granted, tracks:", stream.getTracks().length);
      await stopScanner();

      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("boycott-barcode-reader", { verbose: false });
      html5QrCodeRef.current = scanner;

      const config = { fps: 10, qrbox: { width: 280, height: 150 }, aspectRatio: 1.0 };

      stream.getTracks().forEach((t) => t.stop());

      console.log("[BoycottScan] Starting scanner...");
      try {
        await scanner.start(
          { facingMode: "environment" },
          config,
          (text: string) => {
            if (!detectedRef.current) {
              detectedRef.current = true;
              scanner.stop().catch(() => {}).finally(() => { try { scanner.clear?.(); } catch {} });
              onDetected(text);
            }
          },
          () => {},
        );
      } catch (startErr) {
        console.log("[BoycottScan] facingMode start failed, trying fallback...", startErr);
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          await scanner.start(
            cameras[cameras.length - 1].id,
            config,
            (text: string) => {
              if (!detectedRef.current) {
                detectedRef.current = true;
                scanner.stop().catch(() => {}).finally(() => { try { scanner.clear?.(); } catch {} });
                onDetected(text);
              }
            },
            () => {},
          );
        } else {
          throw new Error("No cameras found on this device.");
        }
      }

      console.log("[BoycottScan] Scanner started successfully");
      setHasStarted(true);
      setIsActive(true);
    } catch (err: any) {
      console.error("[BoycottScan] Camera error:", err);
      let errorMessage = "Could not start camera.";
      
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
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-red-700 to-red-900 py-3 text-sm font-medium text-white shadow-md"
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
        <p className="text-xs text-muted-foreground mt-1">Tap “Start Scanner” to open your camera.</p>
        <button
          onClick={startScanner}
          disabled={isStarting}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-red-700 to-red-900 py-3 text-sm font-medium text-white shadow-md active:scale-95 transition-transform disabled:opacity-50"
        >
          {isStarting ? "Starting…" : "Start Scanner"}
        </button>
        <button onClick={onManualEntry} className="mt-3 text-xs font-medium text-primary flex items-center justify-center gap-1 mx-auto">
          <Keyboard size={12} /> Enter barcode manually
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
      <div className="relative bg-foreground/95">
        <div id="boycott-barcode-reader" ref={scannerRef} className="w-full" style={{ minHeight: 300 }} />
        {isActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <motion.div
              animate={{ y: [-60, 60] }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5, ease: "easeInOut" }}
              className="w-64 h-0.5 rounded-full bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.5)]"
            />
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          <button onClick={toggleTorch} className="p-2 rounded-full bg-foreground/40 backdrop-blur-sm text-white">
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

export default BoycottScanPage;
