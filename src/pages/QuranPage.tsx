import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Play, Pause, Volume2, Globe, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuranPlayer } from "@/contexts/QuranPlayerContext";
import {
  getAllSurahs,
  getSurahArabic,
  getSurahTranslation,
  TRANSLATION_EDITIONS,
  RECITERS,
  type Surah,
  type Ayah,
  type SurahData,
} from "@/services/quranService";

const QuranPage = () => {
  const navigate = useNavigate();
  const player = useQuranPlayer();
  const [search, setSearch] = useState("");
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [arabicData, setArabicData] = useState<SurahData | null>(null);
  const [translationData, setTranslationData] = useState<SurahData | null>(null);
  const [translationEdition, setTranslationEdition] = useState(
    localStorage.getItem("quran-translation") || "en.sahih"
  );
  const [loading, setLoading] = useState(false);
  const [loadingSurahs, setLoadingSurahs] = useState(true);

  // Load all surahs on mount
  useEffect(() => {
    getAllSurahs()
      .then(setSurahs)
      .catch(console.error)
      .finally(() => setLoadingSurahs(false));
  }, []);

  // Load surah data when selected
  useEffect(() => {
    if (!selectedSurah) return;
    setLoading(true);
    Promise.all([
      getSurahArabic(selectedSurah),
      getSurahTranslation(selectedSurah, translationEdition),
    ])
      .then(([arabic, translation]) => {
        setArabicData(arabic);
        setTranslationData(translation);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedSurah, translationEdition]);

  const handleTranslationChange = (edition: string) => {
    setTranslationEdition(edition);
    localStorage.setItem("quran-translation", edition);
  };

  const filtered = surahs.filter(
    (s) =>
      s.englishName.toLowerCase().includes(search.toLowerCase()) ||
      s.name.includes(search) ||
      s.number.toString() === search
  );

  const handlePlayAyah = (ayah: Ayah, index: number) => {
    if (!arabicData) return;
    player.play(ayah, arabicData.englishName, arabicData.ayahs, index);
  };

  const handlePlayAll = () => {
    if (!arabicData) return;
    player.playAll(arabicData.ayahs, arabicData.englishName);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-emerald px-4 pb-6 pt-12 islamic-pattern">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => (selectedSurah ? setSelectedSurah(null) : navigate("/"))}
            className="flex items-center gap-2 text-primary-foreground/80"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Back</span>
          </button>

          {/* Reciter selector */}
          <Select value={player.reciter} onValueChange={player.setReciter}>
            <SelectTrigger className="w-auto max-w-[160px] h-8 text-xs bg-primary-foreground/20 border-0 text-primary-foreground">
              <Volume2 size={12} className="mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECITERS.map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-xs">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground">Holy Quran</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">Read, listen & reflect</p>
      </div>

      <AnimatePresence mode="wait">
        {selectedSurah === null ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 -mt-3 pb-6">
            {/* Search */}
            <div className="relative mb-3">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search surah..."
                className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Translation selector */}
            <div className="mb-4 flex items-center gap-2">
              <Globe size={14} className="text-muted-foreground shrink-0" />
              <Select value={translationEdition} onValueChange={handleTranslationChange}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TRANSLATION_EDITIONS.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-xs">
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loadingSurahs ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((surah, i) => (
                  <motion.button
                    key={surah.number}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    onClick={() => setSelectedSurah(surah.number)}
                    className="flex w-full items-center gap-4 rounded-xl bg-card p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-emerald shrink-0">
                      <span className="text-sm font-bold text-primary-foreground">{surah.number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{surah.englishName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {surah.englishNameTranslation} · {surah.numberOfAyahs} ayahs · {surah.revelationType}
                      </p>
                    </div>
                    <p className="text-lg font-arabic text-primary shrink-0">{surah.name}</p>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : arabicData ? (
              <>
                {/* Surah header */}
                <div className="rounded-xl gradient-emerald p-4 text-center shadow-emerald">
                  <h2 className="text-xl font-bold text-primary-foreground font-arabic">{arabicData.name}</h2>
                  <p className="mt-1 text-sm text-primary-foreground/70">
                    {arabicData.englishName} · {arabicData.englishNameTranslation}
                  </p>
                  <p className="text-xs text-primary-foreground/50 mt-1">
                    {arabicData.numberOfAyahs} ayahs · {arabicData.revelationType}
                  </p>
                  <button
                    onClick={handlePlayAll}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary-foreground/20 px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    <Play size={14} /> Play All
                  </button>
                </div>

                {/* Translation selector inline */}
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-muted-foreground shrink-0" />
                  <Select value={translationEdition} onValueChange={handleTranslationChange}>
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {TRANSLATION_EDITIONS.map((e) => (
                        <SelectItem key={e.id} value={e.id} className="text-xs">
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ayahs */}
                {arabicData.ayahs.map((ayah, i) => {
                  const translation = translationData?.ayahs?.[i];
                  const isCurrentlyPlaying = player.currentAyah?.number === ayah.number;
                  return (
                    <motion.div
                      key={ayah.number}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 1) }}
                      className={`rounded-xl p-5 shadow-sm transition-colors ${
                        isCurrentlyPlaying ? "bg-secondary border-2 border-primary/30" : "bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                          {ayah.numberInSurah}
                        </span>
                        <button
                          onClick={() => handlePlayAyah(ayah, i)}
                          className={`p-2 rounded-full transition-colors ${
                            isCurrentlyPlaying ? "gradient-emerald" : "bg-secondary hover:bg-secondary/80"
                          }`}
                        >
                          {isCurrentlyPlaying && player.isPlaying ? (
                            <Pause size={14} className={isCurrentlyPlaying ? "text-primary-foreground" : "text-foreground"} />
                          ) : (
                            <Play size={14} className={isCurrentlyPlaying ? "text-primary-foreground" : "text-foreground"} />
                          )}
                        </button>
                      </div>
                      <p className="text-right text-2xl leading-[2.2] font-arabic text-foreground">{ayah.text}</p>
                      {translation && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground border-t border-border pt-3">
                          {translation.text}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuranPage;
