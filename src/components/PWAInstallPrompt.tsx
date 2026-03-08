import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, ChevronRight, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as any).standalone === true
  );
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or recently dismissed
    if (isStandalone()) return;
    const lastDismissed = localStorage.getItem("pwa-install-dismissed");
    if (lastDismissed) {
      const hoursSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60);
      if (hoursSince < 24) return; // Don't show again for 24 hours
    }

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS - show after a short delay
    if (isIOS()) {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => { clearTimeout(timer); window.removeEventListener("beforeinstallprompt", handler); };
    }

    // Fallback: show banner after delay for browsers that support PWA but don't fire beforeinstallprompt
    const fallbackTimer = setTimeout(() => {
      if (!isStandalone()) setShowBanner(true);
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS()) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem("pwa-install-dismissed", String(Date.now()));
  };

  if (isStandalone() || dismissed || !showBanner) return null;

  return (
    <AnimatePresence>
      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            className="mx-3 mb-6 w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-luxury"
          >
            <div className="flex justify-between items-start mb-5">
              <div className="h-14 w-14 rounded-2xl gradient-emerald flex items-center justify-center shadow-emerald">
                <Smartphone size={28} className="text-primary-foreground" />
              </div>
              <button onClick={handleDismiss} className="p-2 rounded-full bg-secondary">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-foreground mb-2">Install Iman Guide</h3>
            <p className="text-sm text-muted-foreground mb-6">Follow these steps to add the app to your home screen:</p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-gold text-sm font-bold text-primary-foreground">1</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Tap the Share button</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Share size={12} /> at the bottom of Safari
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-gold text-sm font-bold text-primary-foreground">2</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Scroll down and tap</p>
                  <p className="text-xs text-muted-foreground">"Add to Home Screen"</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-gold text-sm font-bold text-primary-foreground">3</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Tap "Add"</p>
                  <p className="text-xs text-muted-foreground">The app will appear on your home screen</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="mt-6 w-full rounded-2xl bg-secondary py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/80"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Main Install Banner */}
      {!showIOSGuide && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300, delay: 0.5 }}
          className="fixed top-0 left-0 right-0 z-[100] safe-area-top"
        >
          <div className="mx-3 mt-3 rounded-3xl bg-card border border-border shadow-luxury overflow-hidden">
            {/* Decorative top bar */}
            <div className="h-1 gradient-emerald" />
            
            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* App icon */}
                <div className="shrink-0">
                  <div className="h-16 w-16 rounded-2xl gradient-emerald flex items-center justify-center shadow-emerald islamic-pattern">
                    <img src="/pwa-192x192.png" alt="Iman Guide" className="h-12 w-12 rounded-xl" />
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground leading-tight">Iman Guide</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Islamic Lifestyle Companion</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">✨ Free</span>
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">📱 Works Offline</span>
                  </div>
                </div>

                {/* Close */}
                <button onClick={handleDismiss} className="p-1.5 rounded-full bg-secondary/80 shrink-0">
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>

              {/* Features row */}
              <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                <span>🕌 Prayer Times</span>
                <span>•</span>
                <span>📖 Quran</span>
                <span>•</span>
                <span>🧭 Qibla</span>
                <span>•</span>
                <span>🔍 Halal Check</span>
              </div>

              {/* Install button */}
              <button
                onClick={handleInstall}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl gradient-emerald py-3.5 text-sm font-bold text-primary-foreground shadow-emerald transition-all active:scale-[0.98]"
              >
                <Download size={18} />
                {isIOS() ? "Install App" : "Install Now"}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
