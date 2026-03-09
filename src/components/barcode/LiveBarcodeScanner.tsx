import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Keyboard, Flashlight, FlashlightOff, Loader2 } from "lucide-react";

type LiveBarcodeScannerProps = {
  onDetected: (code: string) => void;
  onManualEntry: () => void;
  startLabel?: string;
  readyTitle?: string;
  readySubtitle?: string;
  startButtonClassName?: string;
};

type Html5Scanner = {
  start: (
    cameraIdOrConfig: string | { facingMode: string },
    configuration: Record<string, unknown>,
    onSuccess: (decodedText: string) => void,
    onError?: (errorMessage: string) => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => Promise<void>;
  applyVideoConstraints?: (constraints: MediaTrackConstraints) => Promise<void>;
  getRunningTrackCapabilities?: () => MediaTrackCapabilities | Record<string, unknown>;
};

function normalizeErrorMessage(err: any): string {
  if (err?.name === "NotAllowedError" || String(err?.message || "").includes("Permission") || String(err?.message || "").includes("denied")) {
    return "Camera access denied. Please allow camera permission for this app/site in your phone settings, then tap Try Again.";
  }
  if (err?.name === "NotFoundError" || String(err?.message || "").includes("NotFound")) {
    return "No camera found on this device.";
  }
  if (err?.name === "NotReadableError" || String(err?.message || "").includes("NotReadable")) {
    return "Camera is in use by another app. Please close other apps using the camera and try again.";
  }
  return err?.message ? `Camera error: ${err.message}` : "Could not start camera.";
}

const LiveBarcodeScanner = ({
  onDetected,
  onManualEntry,
  startLabel = "Start Scanner",
  readyTitle = "Ready to Scan",
  readySubtitle = "Tap “Start Scanner” to open your camera.",
  startButtonClassName = "gradient-emerald shadow-emerald",
}: LiveBarcodeScannerProps) => {
  const scannerRef = useRef<Html5Scanner | null>(null);
  const scannerRegionIdRef = useRef(`barcode-scanner-${Math.random().toString(36).slice(2, 10)}`);

  const [cameraError, setCameraError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (scanner) {
      try {
        await scanner.stop();
      } catch {}
      try {
        await scanner.clear();
      } catch {}
    }

    setIsActive(false);
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const handleManualEntry = useCallback(() => {
    void stop().finally(() => onManualEntry());
  }, [stop, onManualEntry]);

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  const start = useCallback(async () => {
    if (isStarting) return;

    setCameraError("");
    setIsStarting(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not available. Please use HTTPS or a supported browser.");
      }

      // Render scanner shell first so container exists.
      setIsActive(true);

      // CRITICAL: first await stays on getUserMedia (direct user gesture chain).
      let warmupStream: MediaStream;
      try {
        warmupStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        warmupStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      warmupStream.getTracks().forEach((track) => track.stop());

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const scannerRegion = document.getElementById(scannerRegionIdRef.current);
      if (!scannerRegion) {
        throw new Error("Scanner container not ready. Please try again.");
      }

      const html5 = await import("html5-qrcode");
      const Html5QrcodeCtor = (html5 as any).Html5Qrcode;
      const scanner = new Html5QrcodeCtor(scannerRegionIdRef.current, { verbose: false }) as Html5Scanner;
      scannerRef.current = scanner;

      const onScanSuccess = (decodedText: string) => {
        if (!decodedText?.trim()) return;
        void stop().then(() => onDetected(decodedText.trim()));
      };

      const scanConfig = {
        fps: 12,
        qrbox: { width: 280, height: 120 },
        aspectRatio: 1.777778,
        disableFlip: false,
        rememberLastUsedCamera: true,
      };

      try {
        await scanner.start({ facingMode: "environment" }, scanConfig, onScanSuccess, () => {});
      } catch (primaryError) {
        const getCameras = (html5 as any).Html5Qrcode?.getCameras;
        if (typeof getCameras !== "function") throw primaryError;

        const cameras = await getCameras();
        const preferred = cameras.find((c: any) => /back|rear|environment/i.test(String(c?.label || ""))) || cameras[0];
        if (!preferred?.id) throw primaryError;

        await scanner.start(preferred.id, scanConfig, onScanSuccess, () => {});
      }

      const caps = scanner.getRunningTrackCapabilities?.() as any;
      setTorchSupported(Boolean(caps?.torch));
    } catch (err: any) {
      await stop();
      setCameraError(normalizeErrorMessage(err));
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, onDetected, stop]);

  const toggleTorch = useCallback(async () => {
    try {
      const scanner = scannerRef.current;
      if (!scanner?.applyVideoConstraints) return;
      const next = !torchOn;
      await scanner.applyVideoConstraints({
        torch: next,
        advanced: [{ torch: next }],
      } as any);
      setTorchOn(next);
    } catch {}
  }, [torchOn]);

  if (cameraError) {
    return (
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border text-center">
        <Camera size={48} className="mx-auto text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium text-foreground">Camera Unavailable</p>
        <p className="text-xs text-muted-foreground mt-1">{cameraError}</p>
        <button
          onClick={() => {
            setCameraError("");
            start();
          }}
          className="mt-4 w-full rounded-xl border border-border py-3 text-sm font-medium text-foreground active:scale-95 transition-transform"
        >
          Try Again
        </button>
        <button
          onClick={handleManualEntry}
          className={`mt-3 w-full rounded-xl py-3 text-sm font-medium text-primary-foreground active:scale-95 transition-transform ${startButtonClassName}`}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Keyboard size={16} /> Enter barcode manually
          </span>
        </button>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border text-center">
        <Camera size={48} className="mx-auto text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium text-foreground">{readyTitle}</p>
        <p className="text-xs text-muted-foreground mt-1">{readySubtitle}</p>
        <button
          onClick={start}
          disabled={isStarting}
          className={`mt-4 w-full rounded-xl py-3 text-sm font-medium text-primary-foreground active:scale-95 transition-transform disabled:opacity-50 ${startButtonClassName}`}
        >
          {isStarting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Starting…
            </span>
          ) : (
            startLabel
          )}
        </button>
        <button
          onClick={handleManualEntry}
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
        <div
          id={scannerRegionIdRef.current}
          className="min-h-[300px] w-full [&>video]:h-[300px] [&>video]:w-full [&>video]:object-cover"
        />

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{ y: [-60, 60] }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5, ease: "easeInOut" }}
            className="w-64 h-0.5 rounded-full bg-primary shadow-[0_0_10px_2px_hsl(var(--primary)/0.45)]"
          />
        </div>

        {torchSupported && (
          <div className="absolute top-3 right-3 flex gap-2">
            <button onClick={toggleTorch} className="p-2 rounded-full bg-foreground/40 backdrop-blur-sm text-primary-foreground">
              {torchOn ? <Flashlight size={18} /> : <FlashlightOff size={18} />}
            </button>
          </div>
        )}
      </div>

      <div className="p-4 text-center">
        <p className="text-sm font-medium text-foreground">Point camera at a barcode</p>
        <p className="text-xs text-muted-foreground mt-1">Hold steady — auto-detection is active</p>
        <button onClick={handleManualEntry} className="mt-3 text-xs font-medium text-primary flex items-center justify-center gap-1 mx-auto">
          <Keyboard size={12} /> Enter barcode manually
        </button>
      </div>
    </div>
  );
};

export default LiveBarcodeScanner;
