import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Keyboard, Flashlight, FlashlightOff, Loader2 } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";

type LiveBarcodeScannerProps = {
  onDetected: (code: string) => void;
  onManualEntry: () => void;
  startLabel?: string;
  readyTitle?: string;
  readySubtitle?: string;
  startButtonClassName?: string;
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void; switchTorch?: () => Promise<void> } | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [cameraError, setCameraError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stop = useCallback(() => {
    try {
      controlsRef.current?.stop?.();
    } catch {}
    controlsRef.current = null;

    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;

    try {
      if (videoRef.current) {
        videoRef.current.pause?.();
        videoRef.current.srcObject = null;
      }
    } catch {}

    setIsActive(false);
    setTorchOn(false);
  }, []);

  const waitForVideoElement = useCallback(async () => {
    for (let i = 0; i < 12; i++) {
      const el = videoRef.current;
      if (el) return el;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    return null;
  }, []);

  useEffect(() => {
    return () => {
      stop();
      readerRef.current = null;
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

      // Render scanner shell first so <video> definitely exists.
      setIsActive(true);

      // Stop prior scanner session before creating a new one.
      try {
        controlsRef.current?.stop?.();
      } catch {}
      controlsRef.current = null;
      try {
        readerRef.current?.reset?.();
      } catch {}
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      streamRef.current = null;

      // CRITICAL: first awaited call remains getUserMedia from click handler.
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      const videoEl = await waitForVideoElement();
      if (!videoEl) throw new Error("Video element not ready yet. Please try again.");

      videoEl.srcObject = stream;
      videoEl.playsInline = true;
      videoEl.muted = true;
      videoEl.autoplay = true;
      videoEl.setAttribute("playsinline", "true");
      videoEl.setAttribute("webkit-playsinline", "true");

      try {
        await videoEl.play();
      } catch {}

      const hints = new Map();
      hints.set(2 /* DecodeHintType.TRY_HARDER */, true);
      readerRef.current = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 120,
        delayBetweenScanSuccess: 400,
      });

      const controls = await readerRef.current.decodeFromStream(stream, videoEl, (result, _error, controls) => {
        if (!result) return;
        const text = (result as any).getText?.() ?? (result as any).text;
        if (typeof text === "string" && text.trim()) {
          controls?.stop?.();
          stop();
          onDetected(text);
        }
      });

      controlsRef.current = controls as any;
    } catch (err: any) {
      stop();
      setCameraError(normalizeErrorMessage(err));
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, onDetected, stop, waitForVideoElement]);

  const toggleTorch = useCallback(async () => {
    try {
      if (!controlsRef.current?.switchTorch) return;
      await controlsRef.current.switchTorch();
      setTorchOn((v) => !v);
    } catch {}
  }, []);

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
          onClick={onManualEntry}
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
        <video ref={videoRef} className="w-full" style={{ minHeight: 300 }} />

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{ y: [-60, 60] }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5, ease: "easeInOut" }}
            className="w-64 h-0.5 rounded-full bg-primary shadow-[0_0_10px_2px_hsl(var(--primary)/0.45)]"
          />
        </div>

        {controlsRef.current?.switchTorch && (
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
        <button onClick={onManualEntry} className="mt-3 text-xs font-medium text-primary flex items-center justify-center gap-1 mx-auto">
          <Keyboard size={12} /> Enter barcode manually
        </button>
      </div>
    </div>
  );
};

export default LiveBarcodeScanner;
