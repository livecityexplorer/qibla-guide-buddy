import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Navigation, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type PlaceType = "mosque" | "restaurant" | "market";

const PLACES = [
  { name: "Al-Noor Mosque", type: "mosque" as PlaceType, distance: "0.3 km", rating: 4.8, address: "123 Main Street" },
  { name: "Istanbul Grill", type: "restaurant" as PlaceType, distance: "0.5 km", rating: 4.5, address: "45 Oak Avenue" },
  { name: "Halal Market", type: "market" as PlaceType, distance: "0.8 km", rating: 4.3, address: "78 Pine Road" },
  { name: "Masjid Al-Rahman", type: "mosque" as PlaceType, distance: "1.2 km", rating: 4.9, address: "200 Elm Boulevard" },
  { name: "Salam Restaurant", type: "restaurant" as PlaceType, distance: "1.5 km", rating: 4.6, address: "55 Cedar Lane" },
  { name: "Barakah Foods", type: "market" as PlaceType, distance: "2.0 km", rating: 4.2, address: "90 Maple Drive" },
];

const NearbyPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<PlaceType | "all">("all");

  const typeConfig = {
    mosque: { emoji: "🕌", label: t("nearby.mosque") },
    restaurant: { emoji: "🍽️", label: t("nearby.restaurant") },
    market: { emoji: "🛒", label: t("nearby.market") },
  };

  const filtered = filter === "all" ? PLACES : PLACES.filter((p) => p.type === filter);

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-8 pt-12 islamic-pattern">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} /><span className="text-sm">{t("common.back")}</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">{t("nearby.title")}</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">{t("nearby.subtitle")}</p>
      </div>
      <div className="px-4 -mt-4 pb-6">
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {(["all", "mosque", "restaurant", "market"] as const).map((type) => (
            <button key={type} onClick={() => setFilter(type)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${filter === type ? "gradient-emerald text-primary-foreground shadow-emerald" : "bg-card text-muted-foreground"}`}>
              {type === "all" ? `📍 ${t("common.all")}` : `${typeConfig[type].emoji} ${typeConfig[type].label}`}
            </button>
          ))}
        </div>
        <div className="mb-4 flex h-40 items-center justify-center rounded-xl bg-muted">
          <div className="text-center"><MapPin size={32} className="mx-auto text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">{t("nearby.mapComingSoon")}</p></div>
        </div>
        <div className="space-y-3">
          {filtered.map((place, i) => (
            <motion.div key={place.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl">{typeConfig[place.type].emoji}</div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{place.name}</p>
                <p className="text-xs text-muted-foreground">{place.address}</p>
                <div className="mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-accent-foreground"><Star size={12} className="fill-accent text-accent" />{place.rating}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Navigation size={12} />{place.distance}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NearbyPage;
