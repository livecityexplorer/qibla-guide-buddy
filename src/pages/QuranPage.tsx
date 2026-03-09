import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Play,
  Pause,
  Volume2,
  Globe,
  Loader2,
  BookmarkCheck,
  Minus,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface QuranBookmark {
  surahNumber: number;
  surahName: string;
  ayahIndex: number;
  ayahNumber: number;
  timestamp: number;
}

function getBookmark(): QuranBookmark | null {
  try {
    const raw = localStorage.getItem("quran-bookmark");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveBookmark(b: QuranBookmark) {
  localStorage.setItem("quran-bookmark", JSON.stringify(b));
}

const QuranPage = () => {
  const navigate = useNavigate();
  const player = useQuranPlayer();
  const [search, setSearch] = useState("");
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [arabicData, setArabicData] = useState<SurahData | null>(null);
  const [translationData, setTranslationData] = useState<SurahData | null>(null);
  const [translationEdition, setTranslationEdition] = useState(
    localStorage.getItem("quran-translation") || "en.sahih",
  );
  const [loading, setLoading] = useState(false);
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [bookmark, setBookmark] = useState<QuranBookmark | null>(getBookmark);
  const [arabicSize, setArabicSize] = useState(() =>
    parseInt(localStorage.getItem("quran-arabic-size") || "24", 10),
  );
  const [translationSize, setTranslationSize] = useState(() =>
    parseInt(localStorage.getItem("quran-trans-size") || "14", 10),
  );

  // Refs for auto-scroll
  const ayahRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const lastScrolledAyah = useRef<number>(-1);

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

  // Auto-scroll to current ayah when it changes during playback
  useEffect(() => {
    if (
      player.isPlaying &&
      player.mode === "surah" &&
      player.currentAyahIndex !== lastScrolledAyah.current &&
      arabicData &&
      player.currentSurahNumber === arabicData.number
    ) {
      lastScrolledAyah.current = player.currentAyahIndex;
      const el = ayahRefs.current.get(player.currentAyahIndex);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [
    player.currentAyahIndex,
    player.isPlaying,
    player.mode,
    player.currentSurahNumber,
    arabicData,
  ]);

  const handleTranslationChange = (edition: string) => {
    setTranslationEdition(edition);
    localStorage.setItem("quran-translation", edition);
  };

  const filtered = surahs.filter(
    (s) =>
      s.englishName.toLowerCase().includes(search.toLowerCase()) ||
      s.name.includes(search) ||
      s.number.toString() === search,
  );

  const handlePlayAyah = (ayah: Ayah, index: number) => {
    if (!arabicData) return;
    player.play(ayah, arabicData.englishName, arabicData.ayahs, index);
    const bm: QuranBookmark = {
      surahNumber: arabicData.number,
      surahName: arabicData.englishName,
      ayahIndex: index,
      ayahNumber: ayah.numberInSurah,
      timestamp: Date.now(),
    };
    saveBookmark(bm);
    setBookmark(bm);
  };

  const handlePlayAll = () => {
    if (!arabicData) return;
    player.playAll(arabicData.ayahs, arabicData.englishName, arabicData.number);
  };

  const handleAyahVisible = useCallback(
    (ayah: Ayah, index: number) => {
      if (!arabicData) return;
      const bm: QuranBookmark = {
        surahNumber: arabicData.number,
        surahName: arabicData.englishName,
        ayahIndex: index,
        ayahNumber: ayah.numberInSurah,
        timestamp: Date.now(),
      };
      saveBookmark(bm);
      setBookmark(bm);
    },
    [arabicData],
  );

  const handleResumeBookmark = () => {
    if (bookmark) setSelectedSurah(bookmark.surahNumber);
  };

  const adjustSize = (type: "arabic" | "trans", delta: number) => {
    if (type === "arabic") {
      const newSize = Math.max(16, Math.min(40, arabicSize + delta));
      setArabicSize(newSize);
      localStorage.setItem("quran-arabic-size", String(newSize));
    } else {
      const newSize = Math.max(10, Math.min(24, translationSize + delta));
      setTranslationSize(newSize);
      localStorage.setItem("quran-trans-size", String(newSize));
    }
  };

  const setAyahRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      ayahRefs.current.set(index, el);
    } else {
      ayahRefs.current.delete(index);
    }
  }, []);

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

      {selectedSurah === null ? (
        <motion.div
          key="list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 -mt-3 pb-6"
        >
          {/* Resume bookmark */}
          {bookmark && (
            <button
              onClick={handleResumeBookmark}
              className="mb-3 w-full flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 p-3 text-left transition-all active:scale-[0.98]"
            >
              <BookmarkCheck size={20} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Continue Reading</p>
                <p className="text-xs text-muted-foreground truncate">
                  {bookmark.surahName} · Ayah {bookmark.ayahNumber}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(bookmark.timestamp).toLocaleDateString()}
              </span>
            </button>
          )}

          {/* Search */}
          <div className="relative mb-3">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
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
        <motion.div
          key="reading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-4 space-y-4"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : arabicData ? (
            <>
              {/* Back to surah list button */}
              <button
                onClick={() => setSelectedSurah(null)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft size={18} />
                Back to Surah List
              </button>

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

              {/* Text Size + Translation selector */}
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

              {/* Text Size Controls */}
              <div className="flex items-center gap-4 rounded-xl bg-card p-3 border border-border">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">Arabic</span>
                  <button
                    onClick={() => adjustSize("arabic", -2)}
                    className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-medium text-foreground w-6 text-center">{arabicSize}</span>
                  <button
                    onClick={() => adjustSize("arabic", 2)}
                    className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">Trans</span>
                  <button
                    onClick={() => adjustSize("trans", -1)}
                    className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-medium text-foreground w-6 text-center">{translationSize}</span>
                  <button
                    onClick={() => adjustSize("trans", 1)}
                    className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Ayahs */}
              {arabicData.ayahs.map((ayah, i) => {
                const translation = translationData?.ayahs?.[i];
                const isCurrentlyPlaying =
                  player.mode === "surah"
                    ? player.currentAyahIndex === i &&
                      player.currentSurahNumber === arabicData.number &&
                      player.isPlaying
                    : player.currentAyah?.number === ayah.number;

                return (
                  <div
                    key={ayah.number}
                    ref={(el) => setAyahRef(i, el)}
                    onClick={() => handleAyahVisible(ayah, i)}
                    className={`rounded-xl p-5 shadow-sm transition-all duration-500 ${
                      isCurrentlyPlaying
                        ? "bg-primary/10 border-2 border-primary/40 ring-2 ring-primary/20"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isCurrentlyPlaying
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {ayah.numberInSurah}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAyah(ayah, i);
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          isCurrentlyPlaying
                            ? "gradient-emerald"
                            : "bg-secondary hover:bg-secondary/80"
                        }`}
                      >
                        {isCurrentlyPlaying && player.isPlaying ? (
                          <Pause
                            size={14}
                            className={
                              isCurrentlyPlaying ? "text-primary-foreground" : "text-foreground"
                            }
                          />
                        ) : (
                          <Play
                            size={14}
                            className={
                              isCurrentlyPlaying ? "text-primary-foreground" : "text-foreground"
                            }
                          />
                        )}
                      </button>
                    </div>
                    <p
                      className="text-right leading-[2.2] font-arabic text-foreground"
                      translate="no"
                      style={{ fontSize: `${arabicSize}px` }}
                    >
                      {ayah.text}
                    </p>
                    {translation && (
                      <p
                        className="mt-3 leading-relaxed text-muted-foreground border-t border-border pt-3"
                        style={{ fontSize: `${translationSize}px` }}
                      >
                        {translation.text}
                      </p>
                    )}
                  </div>
                );
              })}
            </>
          ) : null}
        </motion.div>
      )}
    </div>
  );
};

export default QuranPage;
