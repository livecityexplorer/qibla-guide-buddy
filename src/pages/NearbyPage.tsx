import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Navigation, Loader2, RefreshCw, ExternalLink, Phone, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Mosque {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  address?: string;
  phone?: string;
  website?: string;
  timezone?: string;
  source: string;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// MasjidiApp API
async function searchMasjidiApp(lat: number, lon: number): Promise<Mosque[]> {
  try {
    const res = await fetch(
      `https://api.masjidiapp.com/api/v2/masjid?lat=${lat}&long=${lon}&range=20`,
      { headers: { "x-api-key": "123-test-key" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : data?.data || data?.masjids || [];
    return items.map((m: any) => ({
      id: `masjidi-${m.id || m._id || Math.random()}`,
      name: m.name || m.masjidName || "Unknown Mosque",
      lat: m.latitude || m.lat || m.location?.lat || 0,
      lon: m.longitude || m.long || m.lng || m.location?.lng || 0,
      distance: haversineDistance(lat, lon, m.latitude || m.lat || m.location?.lat || 0, m.longitude || m.long || m.lng || m.location?.lng || 0),
      address: m.address || [m.street, m.city, m.state, m.country].filter(Boolean).join(", ") || undefined,
      phone: m.phone || m.phoneNumber || undefined,
      website: m.website || m.url || undefined,
      timezone: m.timezone || undefined,
      source: "MasjidiApp",
    })).filter((m: Mosque) => m.lat !== 0 && m.lon !== 0);
  } catch {
    return [];
  }
}

// Overpass API (OpenStreetMap) for mosques
async function searchOverpass(lat: number, lon: number, radius: number): Promise<Mosque[]> {
  try {
    const bbox = `(around:${radius},${lat},${lon})`;
    const query = `[out:json][timeout:20];(
      node["amenity"="place_of_worship"]["religion"="muslim"]${bbox};
      way["amenity"="place_of_worship"]["religion"="muslim"]${bbox};
      node["building"="mosque"]${bbox};
      way["building"="mosque"]${bbox};
      node["amenity"="place_of_worship"]["religion"="islam"]${bbox};
      way["amenity"="place_of_worship"]["religion"="islam"]${bbox};
      node["amenity"="place_of_worship"]["name"~"mosque|masjid|mezquita|mosquée|مسجد|cami",i]${bbox};
      way["amenity"="place_of_worship"]["name"~"mosque|masjid|mezquita|mosquée|مسجد|cami",i]${bbox};
    );out center body;`;
    
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return [];
    const data = await res.json();

    const seen = new Set<string>();
    return (data.elements || [])
      .map((el: any) => {
        const tags = el.tags || {};
        const name = tags.name || tags["name:en"] || tags["name:ar"] || "";
        if (!name) return null;
        const key = name.toLowerCase();
        if (seen.has(key)) return null;
        seen.add(key);
        const eLat = el.lat || el.center?.lat;
        const eLon = el.lon || el.center?.lon;
        if (!eLat || !eLon) return null;
        const parts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean);
        return {
          id: `osm-${el.id}`,
          name,
          lat: eLat,
          lon: eLon,
          distance: haversineDistance(lat, lon, eLat, eLon),
          address: parts.length > 0 ? parts.join(", ") : tags["addr:full"] || undefined,
          phone: tags.phone || tags["contact:phone"] || undefined,
          website: tags.website || tags["contact:website"] || undefined,
          source: "OpenStreetMap",
        } as Mosque;
      })
      .filter(Boolean) as Mosque[];
  } catch {
    return [];
  }
}

const NearbyPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [locationBlocked, setLocationBlocked] = useState(false);

  const fetchMosques = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError("");
    try {
      const [masjidiResults, overpassResults] = await Promise.all([
        searchMasjidiApp(lat, lon),
        searchOverpass(lat, lon, 20000),
      ]);

      // Merge & deduplicate by name similarity
      const merged: Mosque[] = [...masjidiResults];
      const existingNames = new Set(merged.map(m => m.name.toLowerCase().trim()));
      for (const m of overpassResults) {
        if (!existingNames.has(m.name.toLowerCase().trim())) {
          merged.push(m);
          existingNames.add(m.name.toLowerCase().trim());
        }
      }
      merged.sort((a, b) => a.distance - b.distance);
      setMosques(merged);

      if (merged.length === 0) {
        setError("No mosques found nearby. Try again later or check your location.");
      }
    } catch {
      setError("Failed to search for mosques. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    setLoading(true);
    setError("");
    setLocationBlocked(false);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLon(pos.coords.longitude);
        fetchMosques(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocationBlocked(true);
        setError("Location access denied. Please enable location to find nearby mosques.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  }, [fetchMosques]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const openDirections = (mosque: Mosque) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${mosque.lat},${mosque.lon}&travelmode=driving`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(160,40%,32%)] via-[hsl(160,38%,38%)] to-[hsl(43,70%,45%)] px-4 pb-10 pt-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 islamic-pattern" />
        <div className="relative z-10">
          <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <ArrowLeft size={20} /><span className="text-sm">{t("common.back")}</span>
          </button>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🕌</span>
            <h1 className="text-2xl font-bold text-white">Mosques Nearby</h1>
          </div>
          <p className="text-sm text-white/70 ml-12">Find mosques around your location</p>
        </div>
      </div>

      <div className="px-4 -mt-5 pb-24 space-y-3 relative z-10">
        {/* Info Card */}
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <span className="text-sm text-muted-foreground">
                {userLat && userLon
                  ? `${userLat.toFixed(4)}, ${userLon.toFixed(4)}`
                  : t("common.locationUnavailable")}
              </span>
            </div>
            <button
              onClick={requestLocation}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Powered by MasjidiApp & OpenStreetMap · Showing mosques within 20 km
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-sm text-muted-foreground">Searching for mosques nearby...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
            <AlertCircle className="mx-auto mb-2 text-destructive" size={24} />
            <p className="text-sm text-destructive">{error}</p>
            {locationBlocked && (
              <button onClick={requestLocation} className="mt-3 text-xs font-medium text-primary underline">
                Try Again
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        {!loading && mosques.length > 0 && (
          <p className="text-xs text-muted-foreground px-1">
            {mosques.length} mosque{mosques.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Mosque List */}
        <AnimatePresence>
          {!loading && mosques.map((mosque, i) => (
            <motion.div
              key={mosque.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
              className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setExpandedId(expandedId === mosque.id ? null : mosque.id)}
                className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
                  🕌
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">{mosque.name}</h3>
                  {mosque.address && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{mosque.address}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-primary">{formatDistance(mosque.distance)}</span>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{mosque.source}</p>
                </div>
              </button>

              <AnimatePresence>
                {expandedId === mosque.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-border/30 space-y-3">
                      {mosque.address && (
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-xs text-muted-foreground">{mosque.address}</span>
                        </div>
                      )}
                      {mosque.phone && (
                        <a href={`tel:${mosque.phone}`} className="flex items-center gap-2 text-xs text-primary">
                          <Phone size={14} />{mosque.phone}
                        </a>
                      )}
                      {mosque.website && (
                        <a href={mosque.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary">
                          <ExternalLink size={14} />Website
                        </a>
                      )}
                      {mosque.timezone && (
                        <p className="text-xs text-muted-foreground">🕐 {mosque.timezone}</p>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => openDirections(mosque)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-xl py-2.5 text-xs font-semibold hover:bg-primary/90 transition-colors"
                        >
                          <Navigation size={14} />
                          Get Directions
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NearbyPage;
