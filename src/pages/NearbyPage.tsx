import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Navigation, Star, Loader2, RefreshCw, ExternalLink, Phone, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type PlaceType = "mosque" | "restaurant" | "shop" | "butcher";

interface NearbyPlace {
  id: number;
  name: string;
  type: PlaceType;
  lat: number;
  lon: number;
  distance: number;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  cuisine?: string;
  tags: Record<string, string>;
}

// Overpass API query builder for OpenStreetMap
function buildOverpassQuery(lat: number, lon: number, radius: number, type: PlaceType | "all"): string {
  const bbox = `(around:${radius},${lat},${lon})`;
  let filters: string[] = [];

  if (type === "all" || type === "mosque") {
    filters.push(`node["amenity"="place_of_worship"]["religion"="muslim"]${bbox};`);
    filters.push(`way["amenity"="place_of_worship"]["religion"="muslim"]${bbox};`);
    filters.push(`node["building"="mosque"]${bbox};`);
    filters.push(`way["building"="mosque"]${bbox};`);
  }
  if (type === "all" || type === "restaurant") {
    filters.push(`node["amenity"="restaurant"]["diet:halal"="yes"]${bbox};`);
    filters.push(`way["amenity"="restaurant"]["diet:halal"="yes"]${bbox};`);
    filters.push(`node["amenity"="restaurant"]["cuisine"~"halal|arab|turkish|middle_eastern|pakistani|indian|afghan|moroccan|lebanese|persian|syrian|egyptian|somali|bangladeshi|indonesian|malaysian",i]${bbox};`);
    filters.push(`way["amenity"="restaurant"]["cuisine"~"halal|arab|turkish|middle_eastern|pakistani|indian|afghan|moroccan|lebanese|persian|syrian|egyptian|somali|bangladeshi|indonesian|malaysian",i]${bbox};`);
    filters.push(`node["amenity"="fast_food"]["diet:halal"="yes"]${bbox};`);
    filters.push(`node["amenity"="cafe"]["diet:halal"="yes"]${bbox};`);
  }
  if (type === "all" || type === "shop") {
    filters.push(`node["shop"="supermarket"]["diet:halal"="yes"]${bbox};`);
    filters.push(`node["shop"="convenience"]["diet:halal"="yes"]${bbox};`);
    filters.push(`node["shop"~"supermarket|convenience|grocery"]["name"~"halal|islamic|muslim|arab|turkish|pakistani",i]${bbox};`);
    filters.push(`way["shop"~"supermarket|convenience|grocery"]["name"~"halal|islamic|muslim|arab|turkish|pakistani",i]${bbox};`);
    filters.push(`node["shop"="grocery"]["organic"~"halal",i]${bbox};`);
  }
  if (type === "all" || type === "butcher") {
    filters.push(`node["shop"="butcher"]["diet:halal"="yes"]${bbox};`);
    filters.push(`way["shop"="butcher"]["diet:halal"="yes"]${bbox};`);
    filters.push(`node["shop"="butcher"]["name"~"halal|islamic|muslim",i]${bbox};`);
    filters.push(`way["shop"="butcher"]["name"~"halal|islamic|muslim",i]${bbox};`);
  }

  return `[out:json][timeout:25];(\n${filters.join("\n")}\n);out center body;`;
}

function classifyPlace(tags: Record<string, string>): PlaceType {
  if (tags.amenity === "place_of_worship" || tags.building === "mosque") return "mosque";
  if (tags.shop === "butcher") return "butcher";
  if (tags.shop) return "shop";
  return "restaurant";
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

function buildAddress(tags: Record<string, string>): string {
  const parts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : tags["addr:full"] || "";
}

async function fetchOverpassWithRetry(query: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (res.status === 429 && i < retries) {
      await new Promise(r => setTimeout(r, 3000 * (i + 1)));
      continue;
    }
    return res;
  }
  throw new Error("Overpass API rate limited");
}

async function searchNearby(lat: number, lon: number, type: PlaceType | "all", radius = 5000): Promise<NearbyPlace[]> {
  const query = buildOverpassQuery(lat, lon, radius, type);
  const res = await fetchOverpassWithRetry(query);

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
  const data = await res.json();

  const seen = new Set<string>();
  const places: NearbyPlace[] = [];

  for (const el of data.elements || []) {
    const tags = el.tags || {};
    const name = tags.name || tags["name:en"] || tags["name:ar"] || "";
    if (!name) continue;

    // Dedup by name+type
    const key = `${name.toLowerCase()}-${classifyPlace(tags)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const elLat = el.lat || el.center?.lat;
    const elLon = el.lon || el.center?.lon;
    if (!elLat || !elLon) continue;

    places.push({
      id: el.id,
      name,
      type: classifyPlace(tags),
      lat: elLat,
      lon: elLon,
      distance: haversineDistance(lat, lon, elLat, elLon),
      address: buildAddress(tags),
      phone: tags.phone || tags["contact:phone"] || undefined,
      website: tags.website || tags["contact:website"] || undefined,
      openingHours: tags.opening_hours || undefined,
      cuisine: tags.cuisine || undefined,
      tags,
    });
  }

  places.sort((a, b) => a.distance - b.distance);
  return places;
}

// Also search Nominatim for additional results
async function searchNominatim(lat: number, lon: number, type: PlaceType, radius = 5000): Promise<NearbyPlace[]> {
  const queries: Record<PlaceType, string[]> = {
    mosque: ["mosque", "masjid", "islamic center"],
    restaurant: ["halal restaurant", "halal food"],
    shop: ["halal shop", "halal grocery"],
    butcher: ["halal butcher", "halal meat"],
  };

  const degreeSpread = Math.max(0.1, radius / 111000 * 1.5);
  const allResults: NearbyPlace[] = [];

  try {
    for (const q of queries[type]) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=20&lat=${lat}&lon=${lon}&viewbox=${lon - degreeSpread},${lat + degreeSpread},${lon + degreeSpread},${lat - degreeSpread}`,
        { headers: { "User-Agent": "IslamicCompanionApp/1.0" } }
      );
      if (!res.ok) continue;
      const data = await res.json();

      for (const item of data) {
        const itemLat = parseFloat(item.lat);
        const itemLon = parseFloat(item.lon);
        const dist = haversineDistance(lat, lon, itemLat, itemLon);
        if (dist > radius / 1000 * 1.5) continue; // allow some slack beyond radius
        allResults.push({
          id: item.place_id,
          name: item.display_name?.split(",")[0] || "Unknown",
          type,
          lat: itemLat,
          lon: itemLon,
          distance: dist,
          address: item.display_name?.split(",").slice(1, 3).join(",").trim() || "",
          tags: {},
        });
      }
      // Small delay between Nominatim requests to respect rate limits
      await new Promise(r => setTimeout(r, 1100));
    }
    return allResults;
  } catch {
    return [];
  }
}

const NearbyPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<PlaceType | "all">("all");
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchRadius, setSearchRadius] = useState(5000);

  const typeConfig: Record<PlaceType, { emoji: string; label: string }> = {
    mosque: { emoji: "🕌", label: t("nearby.mosque") },
    restaurant: { emoji: "🍽️", label: t("nearby.restaurant") },
    shop: { emoji: "🛒", label: t("nearby.shop") || "Halal Shop" },
    butcher: { emoji: "🥩", label: t("nearby.butcher") || "Halal Butcher" },
  };

  const fetchPlaces = useCallback(async (lat: number, lon: number, type: PlaceType | "all") => {
    setLoading(true);
    setError("");
    try {
      // Fetch from Overpass (main) + Nominatim (supplementary) in parallel
      // Fetch Overpass first, then Nominatim as fallback for each relevant type
      let overpassResults: NearbyPlace[] = [];
      try {
        overpassResults = await searchNearby(lat, lon, type, searchRadius);
      } catch (e) {
        console.warn("Overpass failed, relying on Nominatim:", e);
      }

      const typesToSearch: PlaceType[] = type === "all" 
        ? ["mosque", "restaurant", "shop", "butcher"] 
        : [type];
      
      let nominatimResults: NearbyPlace[] = [];
      for (const t of typesToSearch) {
        const results = await searchNominatim(lat, lon, t, searchRadius);
        nominatimResults.push(...results);
      }

      // Merge and deduplicate
      const merged = [...overpassResults];
      const existingNames = new Set(merged.map((p) => p.name.toLowerCase()));
      for (const np of nominatimResults) {
        if (!existingNames.has(np.name.toLowerCase())) {
          merged.push(np);
          existingNames.add(np.name.toLowerCase());
        }
      }

      merged.sort((a, b) => a.distance - b.distance);
      setPlaces(merged);

      if (merged.length === 0) {
        setError(type === "all"
          ? "No nearby Islamic places found. Try increasing the search radius."
          : `No ${typeConfig[type]?.label || type} found nearby. Try a different category or increase radius.`
        );
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search nearby places. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [searchRadius, t]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude);
        setUserLon(longitude);
        fetchPlaces(latitude, longitude, filter);
      },
      (err) => {
        setError("Location access denied. Please enable location to find nearby places.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (userLat !== null && userLon !== null) {
      fetchPlaces(userLat, userLon, filter);
    }
  }, [filter, searchRadius]);

  const openDirections = (place: NearbyPlace) => {
    window.open(`https://www.openstreetmap.org/directions?from=${userLat},${userLon}&to=${place.lat},${place.lon}`, "_blank");
  };

  const openInMaps = (place: NearbyPlace) => {
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${place.lat},${place.lon}`, "_blank");
  };

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-8 pt-12 islamic-pattern">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} /><span className="text-sm">{t("common.back")}</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">{t("nearby.title")}</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">{t("nearby.subtitle")}</p>
      </div>

      <div className="px-4 -mt-4 pb-6 space-y-4">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "mosque", "restaurant", "shop", "butcher"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                filter === type ? "gradient-emerald text-primary-foreground shadow-emerald" : "bg-card text-muted-foreground"
              }`}
            >
              {type === "all" ? `📍 ${t("common.all")}` : `${typeConfig[type].emoji} ${typeConfig[type].label}`}
            </button>
          ))}
        </div>

        {/* Search Radius */}
        <div className="flex items-center gap-3 rounded-xl bg-card p-3 border border-border">
          <MapPin size={16} className="text-primary shrink-0" />
          <span className="text-xs text-muted-foreground shrink-0">Radius:</span>
          <div className="flex gap-2">
            {[2000, 5000, 10000, 20000].map((r) => (
              <button
                key={r}
                onClick={() => setSearchRadius(r)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  searchRadius === r ? "gradient-emerald text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
              </button>
            ))}
          </div>
        </div>

        {/* Map preview with OSM */}
        {userLat && userLon && (
          <div className="rounded-xl overflow-hidden border border-border shadow-sm">
            <iframe
              title="Nearby Map"
              width="100%"
              height="200"
              frameBorder="0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${userLon - 0.03},${userLat - 0.02},${userLon + 0.03},${userLat + 0.02}&layer=mapnik&marker=${userLat},${userLon}`}
              className="w-full"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Searching nearby places...</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Using OpenStreetMap data</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-destructive">{error}</p>
              {userLat && userLon && (
                <button
                  onClick={() => fetchPlaces(userLat, userLon, filter)}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-primary"
                >
                  <RefreshCw size={12} /> Try again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results count */}
        {!loading && places.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Found <span className="font-semibold text-foreground">{places.length}</span> place{places.length !== 1 ? "s" : ""} within {searchRadius >= 1000 ? `${searchRadius / 1000}km` : `${searchRadius}m`}
          </p>
        )}

        {/* Results */}
        <div className="space-y-3">
          <AnimatePresence>
            {!loading && places.map((place, i) => (
              <motion.div
                key={`${place.id}-${place.name}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.5) }}
                className="rounded-xl bg-card shadow-sm border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === place.id ? null : place.id)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl shrink-0">
                    {typeConfig[place.type].emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{place.name}</p>
                    {place.address && (
                      <p className="text-xs text-muted-foreground truncate">{place.address}</p>
                    )}
                    <div className="mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Navigation size={12} className="text-primary" />
                        {formatDistance(place.distance)}
                      </span>
                      {place.cuisine && (
                        <span className="text-xs text-muted-foreground truncate">{place.cuisine}</span>
                      )}
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {typeConfig[place.type].label}
                      </span>
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedId === place.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border">
                        {place.openingHours && (
                          <div className="flex items-center gap-2 pt-3">
                            <Clock size={14} className="text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">{place.openingHours}</p>
                          </div>
                        )}
                        {place.phone && (
                          <a href={`tel:${place.phone}`} className="flex items-center gap-2 text-xs text-primary">
                            <Phone size={14} /> {place.phone}
                          </a>
                        )}
                        {place.website && (
                          <a href={place.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary truncate">
                            <ExternalLink size={14} /> {place.website}
                          </a>
                        )}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => openInMaps(place)}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg gradient-emerald py-2.5 text-xs font-medium text-primary-foreground"
                          >
                            <Navigation size={14} /> Google Maps
                          </button>
                          <button
                            onClick={() => openDirections(place)}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-secondary py-2.5 text-xs font-medium text-foreground"
                          >
                            <MapPin size={14} /> OpenStreetMap
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

        {/* Refresh */}
        {!loading && userLat && userLon && (
          <button
            onClick={() => fetchPlaces(userLat, userLon, filter)}
            className="w-full flex items-center justify-center gap-2 rounded-xl gradient-emerald py-3 font-medium text-primary-foreground shadow-emerald transition-all active:scale-95"
          >
            <RefreshCw size={16} /> Refresh Results
          </button>
        )}

        {/* Attribution */}
        <p className="text-[10px] text-muted-foreground/50 text-center pt-2">
          Data from OpenStreetMap contributors · Overpass API · Nominatim
        </p>
      </div>
    </div>
  );
};

export default NearbyPage;
