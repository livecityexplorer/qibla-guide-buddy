import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Loader2, BookOpen, Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getRandomHadith, getAllLocalHadiths, HADITH_COLLECTIONS, type HadithData } from "@/services/hadithService";

const HadithPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedCollection, setSelectedCollection] = useState("bukhari");
  const [currentHadith, setCurrentHadith] = useState<HadithData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const localHadiths = getAllLocalHadiths();
  const [textSize, setTextSize] = useState(() => parseInt(localStorage.getItem("hadith-text-size") || "16", 10));

  const fetchHadith = async (collection?: string) => {
    setLoading(true);
    setError(false);
    try {
      const hadith = await getRandomHadith(collection || selectedCollection);
      setCurrentHadith(hadith);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHadith();
  }, []);

  const handleCollectionChange = (col: string) => {
    setSelectedCollection(col);
    fetchHadith(col);
  };

  const adjustSize = (delta: number) => {
    const newSize = Math.max(12, Math.min(28, textSize + delta));
    setTextSize(newSize);
    localStorage.setItem("hadith-text-size", String(newSize));
  };

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-8 pt-12 islamic-pattern">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} />
          <span className="text-sm">{t("common.back")}</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">{t("hadith.title")}</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">{t("hadith.subtitle")}</p>
      </div>

      <div className="px-4 -mt-4 pb-6">
        {/* Collection Selector */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {HADITH_COLLECTIONS.map((col) => (
            <button
              key={col.id}
              onClick={() => handleCollectionChange(col.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                selectedCollection === col.id
                  ? "gradient-emerald text-primary-foreground shadow-emerald"
                  : "bg-card text-muted-foreground"
              }`}
            >
              {t(`hadith.${col.id}`)}
            </button>
          ))}
        </div>

        {/* Text Size Control */}
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-card p-3 border border-border">
          <span className="text-xs text-muted-foreground">Text Size</span>
          <button onClick={() => adjustSize(-2)} className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center"><Minus size={12} /></button>
          <span className="text-xs font-medium text-foreground w-6 text-center">{textSize}</span>
          <button onClick={() => adjustSize(2)} className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center"><Plus size={12} /></button>
        </div>

        {/* Current Hadith */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="ml-3 text-sm text-muted-foreground">{t("hadith.loadingHadith")}</span>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-card p-6 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">{t("hadith.errorLoading")}</p>
            <button onClick={() => fetchHadith()} className="mt-3 rounded-lg gradient-emerald px-4 py-2 text-sm font-medium text-primary-foreground">
              {t("hadith.retry")}
            </button>
          </div>
        ) : currentHadith ? (
          <motion.div
            key={currentHadith.text?.substring(0, 30)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-card p-6 shadow-sm"
          >
            {currentHadith.chapter && (
              <div className="mb-3 inline-block rounded-full bg-secondary px-3 py-1">
                <span className="text-xs font-semibold text-secondary-foreground">{currentHadith.chapter}</span>
              </div>
            )}
            
            <p className="leading-relaxed text-foreground" style={{ fontSize: `${textSize}px` }}>"{currentHadith.text}"</p>

            <div className="mt-6 border-t border-border pt-4 space-y-1">
              {currentHadith.narrator && (
                <p className="text-sm font-medium text-primary">{currentHadith.narrator}</p>
              )}
              <p className="text-xs text-muted-foreground">{currentHadith.source}</p>
              {currentHadith.grade && (
                <p className="text-xs text-accent">{t("hadith.grade")}: {currentHadith.grade}</p>
              )}
            </div>
          </motion.div>
        ) : null}

        <button
          onClick={() => fetchHadith()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl gradient-emerald py-3 font-medium text-primary-foreground shadow-emerald transition-all active:scale-95"
        >
          <RefreshCw size={18} />
          {t("hadith.nextHadith")}
        </button>

        {/* Browse Local Hadiths */}
        <h3 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <BookOpen size={14} className="inline mr-1" />
          {t("hadith.browseHadiths")}
        </h3>
        <div className="space-y-2">
          {localHadiths.map((h, i) => (
            <button
              key={i}
              onClick={() => { setCurrentHadith(h); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={`w-full rounded-xl p-4 text-left transition-all ${
                currentHadith?.text === h.text ? "bg-secondary ring-2 ring-primary" : "bg-card"
              } shadow-sm`}
            >
              <p className="text-sm font-medium text-foreground line-clamp-2">"{h.text}"</p>
              <p className="mt-1 text-xs text-muted-foreground">{h.source}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HadithPage;
