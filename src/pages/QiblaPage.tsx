import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const QiblaPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [heading, setHeading] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const qiblaDirection = 136;

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) { setHeading(e.alpha); setPermissionGranted(true); }
    };
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      (DeviceOrientationEvent as any).requestPermission().then((response: string) => {
        if (response === "granted") { window.addEventListener("deviceorientation", handleOrientation); setPermissionGranted(true); }
      });
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
      setPermissionGranted(true);
    }
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, []);

  const rotation = qiblaDirection - heading;

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-8 pt-12 islamic-pattern">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} /><span className="text-sm">{t("common.back")}</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">{t("qibla.title")}</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">{t("qibla.subtitle")}</p>
      </div>
      <div className="flex flex-col items-center justify-center px-4 pt-12">
        <motion.div className="relative flex h-64 w-64 items-center justify-center" animate={{ rotate: rotation }} transition={{ type: "spring", stiffness: 50, damping: 15 }}>
          <div className="absolute inset-0 rounded-full border-4 border-border" />
          <div className="absolute inset-2 rounded-full border-2 border-muted" />
          {["N", "E", "S", "W"].map((dir, i) => (
            <span key={dir} className="absolute text-sm font-bold text-muted-foreground" style={{ top: i === 0 ? "8px" : i === 2 ? "auto" : "50%", bottom: i === 2 ? "8px" : "auto", left: i === 3 ? "8px" : i === 1 ? "auto" : "50%", right: i === 1 ? "8px" : "auto", transform: i === 0 || i === 2 ? "translateX(-50%)" : "translateY(-50%)" }}>{dir}</span>
          ))}
          <div className="flex flex-col items-center">
            <div className="h-20 w-1 rounded-full gradient-gold" />
            <div className="mt-1 text-2xl">🕋</div>
            <p className="mt-2 text-xs font-semibold text-accent">{t("qibla.kaaba")}</p>
          </div>
        </motion.div>
        <div className="mt-8 text-center">
          <p className="text-lg font-semibold text-foreground">{Math.round(rotation + 360) % 360}°</p>
          <p className="text-sm text-muted-foreground">{permissionGranted ? t("qibla.pointPhone") : t("qibla.enableCompass")}</p>
        </div>
        {!permissionGranted && (
          <button onClick={() => { if (typeof (DeviceOrientationEvent as any).requestPermission === "function") { (DeviceOrientationEvent as any).requestPermission(); } }} className="mt-6 rounded-xl gradient-emerald px-6 py-3 font-medium text-primary-foreground shadow-emerald">
            {t("common.enableCompass")}
          </button>
        )}
      </div>
    </div>
  );
};

export default QiblaPage;
