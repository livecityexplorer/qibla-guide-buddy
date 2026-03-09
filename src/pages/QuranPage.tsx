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
  ChevronRight,
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

  const pendingScrollRef = useRef<number | null>(null);

  const handleResumeBookmark = () => {
    if (bookmark) {
      pendingScrollRef.current = bookmark.ayahIndex;
      setSelectedSurah(bookmark.surahNumber);
    }
  };

  // Auto-scroll to bookmarked ayah after surah loads
  useEffect(() => {
    if (!loading && arabicData && pendingScrollRef.current !== null) {
      const idx = pendingScrollRef.current;
      pendingScrollRef.current = null;
      // Wait for DOM to render ayahs
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = ayahRefs.current.get(idx);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      });
    }
  }, [loading, arabicData]);

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
      {/* ── Enhanced Hero Header ── */}
      <div className="relative overflow-hidden">
        {/* Layered gradient background */}
        <div className="absolute inset-0 gradient-emerald" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10" />
        <div className="absolute inset-0 islamic-pattern opacity-80" />
        {/* Decorative geometric circles */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full border border-primary-foreground/10" />
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-primary-foreground/5" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full border border-primary-foreground/5 -mb-12 -ml-12" />

        <div className="relative px-4 pb-8 pt-12">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => (selectedSurah ? setSelectedSurah(null) : navigate("/"))}
              className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Reciter selector */}
            <Select value={player.reciter} onValueChange={player.setReciter}>
              <SelectTrigger className="w-auto max-w-[160px] h-8 text-xs bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground rounded-full px-3">
                <Volume2 size={12} className="mr-1.5" />
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

          {/* Title area with decorative Bismillah */}
          <div className="text-center">
            <p className="text-primary-foreground/40 text-2xl font-arabic mb-1">﷽</p>
            <h1 className="text-3xl font-bold text-primary-foreground tracking-tight">
              Holy Quran
            </h1>
            <p className="mt-1.5 text-sm text-primary-foreground/60 font-medium">
              القرآن الكريم
            </p>
            <p className="mt-1 text-xs text-primary-foreground/40">
              Read, listen & reflect on the words of Allah
            </p>
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-background rounded-t-[24px]" />
      </div>

      {selectedSurah === null ? (
        <motion.div
          key="list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 pb-6"
        >
          {/* Resume bookmark */}
          {bookmark && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleResumeBookmark}
              className="mb-4 w-full flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-4 text-left transition-all active:scale-[0.98] shadow-sm"
            >
              <div className="h-10 w-10 rounded-xl gradient-emerald flex items-center justify-center shadow-emerald shrink-0">
                <BookmarkCheck size={18} className="text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Continue Reading</p>
                <p className="text-xs text-muted-foreground truncate">
                  {bookmark.surahName} · Ayah {bookmark.ayahNumber}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 bg-muted px-2 py-1 rounded-full">
                {new Date(bookmark.timestamp).toLocaleDateString()}
              </span>
            </motion.button>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search surah by name or number..."
              className="w-full rounded-2xl border border-border bg-card py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-shadow focus:shadow-md"
            />
          </div>

          {/* Translation selector */}
          <div className="mb-5 flex items-center gap-2 bg-card rounded-xl border border-border p-2.5 shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Globe size={14} className="text-primary" />
            </div>
            <Select value={translationEdition} onValueChange={handleTranslationChange}>
              <SelectTrigger className="w-full h-9 text-xs border-0 bg-transparent shadow-none">
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

          {/* Surah count badge */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground">All Surahs</h2>
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {filtered.length} of 114
            </span>
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
                  transition={{ delay: Math.min(i * 0.015, 0.4) }}
                  onClick={() => setSelectedSurah(surah.number)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-sm border border-border/50 transition-all hover:shadow-md hover:border-primary/20 active:scale-[0.98]"
                >
                  {/* Surah number diamond */}
                  <div className="relative h-11 w-11 shrink-0">
                    <div className="absolute inset-0 rotate-45 rounded-lg gradient-emerald shadow-emerald" />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary-foreground">
                      {surah.number}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-[15px]">{surah.englishName}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {surah.englishNameTranslation} · {surah.numberOfAyahs} ayahs
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-medium text-primary/70 bg-primary/8 px-1.5 py-0.5 rounded">
                      {surah.revelationType}
                    </span>
                  </div>
                  <p className="text-xl font-arabic text-primary shrink-0 leading-tight">{surah.name}</p>
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
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <ArrowLeft size={18} />
                Back to Surah List
              </button>

              {/* Enhanced Surah header card */}
              <div className="relative rounded-2xl overflow-hidden shadow-emerald">
                <div className="absolute inset-0 gradient-emerald" />
                <div className="absolute inset-0 islamic-pattern opacity-60" />
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full border border-primary-foreground/10" />
                <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full border border-primary-foreground/8" />
                <div className="relative p-6 text-center">
                  <p className="text-primary-foreground/30 text-lg font-arabic mb-2">﷽</p>
                  <h2 className="text-3xl font-bold text-primary-foreground font-arabic leading-relaxed">
                    {arabicData.name}
                  </h2>
                  <div className="mt-2 inline-flex items-center gap-2">
                    <span className="text-base font-semibold text-primary-foreground/90">
                      {arabicData.englishName}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-primary-foreground/40" />
                    <span className="text-sm text-primary-foreground/60">
                      {arabicData.englishNameTranslation}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <span className="text-xs text-primary-foreground/50 bg-primary-foreground/10 px-2.5 py-1 rounded-full">
                      {arabicData.numberOfAyahs} Ayahs
                    </span>
                    <span className="text-xs text-primary-foreground/50 bg-primary-foreground/10 px-2.5 py-1 rounded-full">
                      {arabicData.revelationType}
                    </span>
                  </div>
                  <button
                    onClick={handlePlayAll}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/20 backdrop-blur-sm border border-primary-foreground/20 px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/30 transition-colors active:scale-95"
                  >
                    <Play size={14} /> Play Entire Surah
                  </button>
                </div>
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
