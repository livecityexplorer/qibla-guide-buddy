import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Navigation, MapPin, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

function calculateQibla(lat: number, lng: number): number {
  const phiK = toRad(KAABA_LAT);
  const lambdaK = toRad(KAABA_LNG);
  const phi = toRad(lat);
  const lambda = toRad(lng);
  const num = Math.sin(lambdaK - lambda);
  const den = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);
  let qibla = toDeg(Math.atan2(num, den));
  return (qibla + 360) % 360;
}

const TICK_COUNT = 72; // every 5 degrees
const CARDINAL = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const QiblaPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [heading, setHeading] = useState<number | null>(null);
  const [qiblaAngle, setQiblaAngle] = useState<number>(136); // default fallback
  const [permissionState, setPermissionState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [accuracy, setAccuracy] = useState<"high" | "low" | "none">("none");

  // Get user location for accurate Qibla calculation
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setQiblaAngle(calculateQibla(latitude, longitude));
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.municipality || "";
            const country = addr.country || "";
            setLocationName(city ? `${city}, ${country}` : country);
          }
        } catch {}
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  const startCompass = useCallback(async () => {
    setPermissionState("requesting");

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Use webkitCompassHeading for iOS, alpha for Android
      const compassHeading = (e as any).webkitCompassHeading;
      if (typeof compassHeading === "number") {
        setHeading(compassHeading);
        setAccuracy("high");
      } else if (e.alpha !== null) {
        // Android: alpha is relative to device, need to adjust
        // If absolute is true, alpha is relative to north
        if (e.absolute) {
          setHeading((360 - e.alpha) % 360);
          setAccuracy("high");
        } else {
          setHeading((360 - e.alpha) % 360);
          setAccuracy("low");
        }
      }
      setPermissionState("granted");
    };

    try {
      if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === "granted") {
          window.addEventListener("deviceorientation", handleOrientation, true);
        } else {
          setPermissionState("denied");
          return;
        }
      } else {
        // Try absolute orientation first (better accuracy on Android)
        const w = window as any;
        if (w.ondeviceorientationabsolute !== undefined) {
          w.addEventListener("deviceorientationabsolute", handleOrientation, true);
        } else {
          w.addEventListener("deviceorientation", handleOrientation, true);
        }
      }
      setPermissionState("granted");
    } catch {
      setPermissionState("denied");
    }
  }, []);

  // Auto-start on mount for non-iOS
  useEffect(() => {
    if (typeof (DeviceOrientationEvent as any).requestPermission !== "function") {
      startCompass();
    }
  }, [startCompass]);

  const compassRotation = heading !== null ? -heading : 0;
  const qiblaPointerRotation = heading !== null ? qiblaAngle - heading : qiblaAngle;
  const isAligned = heading !== null && Math.abs(((qiblaAngle - heading + 540) % 360) - 180) < 5;
  const displayDegrees = heading !== null ? Math.round((qiblaAngle - heading + 360) % 360) : Math.round(qiblaAngle);

  return (
    <div className="min-h-screen">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-emerald" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/10" />
        <div className="absolute inset-0 islamic-pattern opacity-70" />
        <div className="absolute -top-14 -right-14 w-44 h-44 rounded-full border border-primary-foreground/10" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full border border-primary-foreground/5" />

        <div className="relative px-4 pb-8 pt-12">
          <button
            onClick={() => navigate("/")}
            className="mb-5 flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">{t("common.back")}</span>
          </button>
          <h1 className="text-3xl font-bold text-primary-foreground tracking-tight">
            {t("qibla.title")}
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/60">{t("qibla.subtitle")}</p>
          {locationName && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary-foreground/50 bg-primary-foreground/10 px-3 py-1 rounded-full">
              <MapPin size={10} />
              {locationName}
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-background rounded-t-[24px]" />
      </div>

      {/* Compass Area */}
      <div className="flex flex-col items-center justify-center px-4 pt-6 pb-20">
        {/* Status indicator */}
        <div className={`mb-6 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          isAligned
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : heading !== null
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        }`}>
          {isAligned ? (
            <>🕋 Facing Qibla!</>
          ) : heading !== null ? (
            <><Navigation size={14} className="animate-pulse" /> Qibla is {displayDegrees}° away</>
          ) : (
            <><RotateCcw size={14} /> Compass inactive</>
          )}
        </div>

        {/* Main compass */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80">
          {/* Outer glow when aligned */}
          <div className={`absolute -inset-3 rounded-full transition-all duration-700 ${
            isAligned ? "bg-emerald-500/10 shadow-[0_0_40px_10px_hsl(var(--emerald-mid)/0.2)]" : ""
          }`} />

          {/* Compass dial - rotates with device */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ rotate: compassRotation }}
            transition={{ type: "spring", stiffness: 60, damping: 20, mass: 0.8 }}
          >
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-[3px] border-border shadow-lg" />
            {/* Inner ring */}
            <div className="absolute inset-3 rounded-full border border-muted" />

            {/* Degree ticks */}
            {Array.from({ length: TICK_COUNT }, (_, i) => {
              const deg = i * 5;
              const isMajor = deg % 45 === 0;
              const isMinor = deg % 15 === 0;
              return (
                <div
                  key={i}
                  className="absolute left-1/2 top-0 -translate-x-1/2 origin-[50%_144px] sm:origin-[50%_160px]"
                  style={{ transform: `translateX(-50%) rotate(${deg}deg)` }}
                >
                  <div className={`mx-auto rounded-full ${
                    isMajor
                      ? "w-0.5 h-4 bg-foreground/70"
                      : isMinor
                      ? "w-0.5 h-2.5 bg-muted-foreground/40"
                      : "w-px h-1.5 bg-muted-foreground/20"
                  }`} />
                </div>
              );
            })}

            {/* Cardinal directions */}
            {CARDINAL.map((dir, i) => {
              const deg = i * 45;
              const isMain = i % 2 === 0;
              return (
                <div
                  key={dir}
                  className="absolute left-1/2 top-0 -translate-x-1/2 origin-[50%_144px] sm:origin-[50%_160px]"
                  style={{ transform: `translateX(-50%) rotate(${deg}deg)` }}
                >
                  <span
                    className={`block text-center ${
                      dir === "N"
                        ? "text-red-500 font-bold text-sm mt-5"
                        : isMain
                        ? "font-bold text-xs text-foreground/80 mt-5"
                        : "font-medium text-[10px] text-muted-foreground mt-6"
                    }`}
                    style={{ transform: `rotate(-${deg}deg)` }}
                  >
                    {dir}
                  </span>
                </div>
              );
            })}

            {/* North pointer (red triangle) */}
            <div className="absolute left-1/2 top-3 -translate-x-1/2">
              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[10px] border-l-transparent border-r-transparent border-b-red-500" />
            </div>
          </motion.div>

          {/* Qibla pointer - fixed relative to screen, points to Qibla */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ rotate: qiblaPointerRotation }}
            transition={{ type: "spring", stiffness: 60, damping: 20, mass: 0.8 }}
          >
            {/* Qibla line */}
            <div className="absolute left-1/2 top-6 -translate-x-1/2 w-1 h-[calc(50%-24px)] rounded-full gradient-gold shadow-[0_0_8px_2px_hsl(var(--gold)/0.3)]" />
            {/* Kaaba icon at tip */}
            <div className="absolute left-1/2 top-3 -translate-x-1/2 -translate-y-1/2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isAligned
                  ? "bg-emerald-500 shadow-[0_0_16px_4px_hsl(var(--emerald-mid)/0.4)] scale-110"
                  : "gradient-gold shadow-gold"
              }`}>
                <span className="text-sm">🕋</span>
              </div>
            </div>
          </motion.div>

          {/* Center hub */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-500 ${
              isAligned
                ? "gradient-emerald shadow-emerald"
                : "bg-card border-2 border-border shadow-md"
            }`}>
              <span className={`text-lg font-bold ${isAligned ? "text-primary-foreground" : "text-foreground"}`}>
                {displayDegrees}°
              </span>
            </div>
          </div>
        </div>

        {/* Info text */}
        <div className="mt-8 text-center space-y-1">
          <p className="text-sm font-medium text-foreground">
            {heading !== null
              ? isAligned
                ? "You are facing the Qibla ✓"
                : "Rotate your device toward the Kaaba"
              : permissionState === "granted"
              ? "Calibrating compass..."
              : t("qibla.pointPhone")}
          </p>
          {userCoords && (
            <p className="text-xs text-muted-foreground">
              Qibla bearing: {Math.round(qiblaAngle)}° from North
            </p>
          )}
          {accuracy === "low" && heading !== null && (
            <p className="text-[10px] text-amber-500">
              ⚠ Low accuracy — wave your phone in a figure-8 to calibrate
            </p>
          )}
        </div>

        {/* Enable button for iOS or when not started */}
        {(permissionState === "idle" || permissionState === "denied") && (
          <button
            onClick={startCompass}
            className="mt-6 rounded-2xl gradient-emerald px-8 py-3.5 font-semibold text-primary-foreground shadow-emerald active:scale-95 transition-transform"
          >
            {permissionState === "denied" ? "Retry Compass Access" : t("common.enableCompass")}
          </button>
        )}

        {permissionState === "denied" && (
          <p className="mt-3 text-xs text-muted-foreground text-center max-w-xs">
            Compass access was denied. Please enable motion/orientation permissions in your browser or device settings.
          </p>
        )}

        {/* Qibla info card */}
        <div className="mt-8 w-full max-w-sm rounded-2xl bg-card border border-border p-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-2">About Qibla</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Qibla is the direction of the Kaaba in Mecca, Saudi Arabia. Muslims around the world
            face this direction during their daily prayers. The direction is calculated based on your
            current GPS location for maximum accuracy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QiblaPage;
