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
  Bookmark,
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

  const handleBookmarkAyah = (ayah: Ayah, index: number) => {
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
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(160,50%,32%)] via-[hsl(160,45%,38%)] to-[hsl(160,40%,45%)]" />
        <div className="absolute inset-0 islamic-pattern opacity-80" />
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full border border-white/10" />
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-white/5" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full border border-white/5 -mb-12 -ml-12" />

        <div className="relative px-4 pb-8 pt-12">
          <div className="flex items-center justify-between mb-6">
            {/* BIGGER Back button */}
            <button
              onClick={() => (selectedSurah ? setSelectedSurah(null) : navigate("/"))}
              className="flex items-center gap-2 rounded-xl bg-white/25 backdrop-blur-sm border border-white/20 px-4 py-2.5 text-white hover:bg-white/30 transition-colors active:scale-95"
            >
              <ArrowLeft size={22} />
              <span className="text-sm font-semibold">Back</span>
            </button>

            {/* BIGGER Reciter selector - lighter colors */}
            <Select value={player.reciter} onValueChange={player.setReciter}>
              <SelectTrigger className="w-auto max-w-[200px] h-11 text-sm bg-white/25 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl px-4 font-medium">
                <Volume2 size={18} className="mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECITERS.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-sm py-3">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title area */}
          <div className="text-center">
            <p className="text-white/80 text-2xl font-arabic mb-1">﷽</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Holy Quran
            </h1>
            <p className="mt-1.5 text-sm text-white/80 font-medium">
              القرآن الكريم
            </p>
            <p className="mt-1 text-xs text-white/70">
              Read, listen & reflect on the words of Allah
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-4 bg-background rounded-t-[24px]" />
      </div>

      {selectedSurah === null ? (
        <motion.div
          key="list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 pb-6"
        >
          {/* Continue where you left off */}
          {bookmark && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              onClick={handleResumeBookmark}
              className="group mb-5 w-full relative overflow-hidden rounded-2xl shadow-emerald active:scale-[0.97] transition-transform"
            >
              <div className="absolute inset-0 gradient-emerald" />
              <div className="absolute inset-0 islamic-pattern opacity-40" />
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full border border-primary-foreground/10" />

              <div className="relative flex items-center gap-4 p-5">
                <div className="h-14 w-14 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-primary-foreground/10">
                  <BookmarkCheck size={26} className="text-primary-foreground" />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <p className="text-lg font-bold text-primary-foreground">Continue Reading</p>
                  <p className="text-sm text-primary-foreground/70 truncate mt-0.5">
                    {bookmark.surahName} · Ayah {bookmark.ayahNumber}
                  </p>
                  <p className="text-[11px] text-primary-foreground/40 mt-1">
                    Last read {new Date(bookmark.timestamp).toLocaleDateString()}
                  </p>
                </div>

                <div className="h-11 w-11 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0 group-hover:bg-primary-foreground/30 transition-colors">
                  <ChevronRight size={22} className="text-primary-foreground" />
                </div>
              </div>
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

          {/* BIGGER Translation selector */}
          <div className="mb-5 flex items-center gap-3 bg-card rounded-xl border border-border p-3 shadow-sm">
            <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Globe size={20} className="text-primary" />
            </div>
            <Select value={translationEdition} onValueChange={handleTranslationChange}>
              <SelectTrigger className="w-full h-11 text-sm border-0 bg-transparent shadow-none font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {TRANSLATION_EDITIONS.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-sm py-2.5">
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
              {/* BIGGER Back to surah list button */}
              <button
                onClick={() => setSelectedSurah(null)}
                className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors mb-3 active:scale-95"
              >
                <ArrowLeft size={22} />
                Back to Surah List
              </button>

              {/* Enhanced Surah header card */}
              <div className="relative rounded-3xl overflow-hidden shadow-luxury">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(160,50%,30%)] via-[hsl(160,45%,36%)] to-[hsl(43,80%,45%)]" />
                <div className="absolute inset-0 islamic-pattern opacity-40" />
                <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full border-2 border-white/8" />
                <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full border border-white/5" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-white/[0.03]" />

                <div className="relative px-6 py-8 text-center">
                  {/* Bismillah ornament */}
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="h-px w-10 bg-gradient-to-r from-transparent to-white/30" />
                    <p className="text-white/60 text-2xl font-arabic">﷽</p>
                    <div className="h-px w-10 bg-gradient-to-l from-transparent to-white/30" />
                  </div>

                  {/* Surah Arabic name */}
                  <h2 className="text-4xl font-bold text-white font-arabic leading-relaxed drop-shadow-sm">
                    {arabicData.name}
                  </h2>

                  {/* English name + translation */}
                  <div className="mt-3 inline-flex items-center gap-2.5">
                    <span className="text-lg font-semibold text-white/95 tracking-wide">
                      {arabicData.englishName}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span className="text-sm text-white/70 italic">
                      {arabicData.englishNameTranslation}
                    </span>
                  </div>

                  {/* Info badges */}
                  <div className="mt-3 flex items-center justify-center gap-2.5">
                    <span className="text-xs font-medium text-white/80 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                      📖 {arabicData.numberOfAyahs} Ayahs
                    </span>
                    <span className="text-xs font-medium text-white/80 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                      🕌 {arabicData.revelationType}
                    </span>
                  </div>

                  {/* Play button */}
                  <button
                    onClick={handlePlayAll}
                    className="mt-5 inline-flex items-center gap-3 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 px-8 py-4 text-base font-bold text-white hover:bg-white/30 transition-all active:scale-95 shadow-lg"
                  >
                    <div className="h-8 w-8 rounded-full bg-white/25 flex items-center justify-center">
                      <Play size={18} className="ml-0.5" />
                    </div>
                    Play Entire Surah
                  </button>
                </div>
              </div>

              {/* BIGGER Translation selector inside reading view */}
              <div className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Globe size={20} className="text-primary" />
                </div>
                <Select value={translationEdition} onValueChange={handleTranslationChange}>
                  <SelectTrigger className="w-full h-11 text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TRANSLATION_EDITIONS.map((e) => (
                      <SelectItem key={e.id} value={e.id} className="text-sm py-2.5">
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* BIGGER Text Size Controls */}
              <div className="flex items-center gap-4 rounded-xl bg-card p-4 border border-border">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0 font-medium">Arabic</span>
                  <button
                    onClick={() => adjustSize("arabic", -2)}
                    className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-sm font-bold text-foreground w-8 text-center">{arabicSize}</span>
                  <button
                    onClick={() => adjustSize("arabic", 2)}
                    className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0 font-medium">Trans</span>
                  <button
                    onClick={() => adjustSize("trans", -1)}
                    className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-sm font-bold text-foreground w-8 text-center">{translationSize}</span>
                  <button
                    onClick={() => adjustSize("trans", 1)}
                    className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Plus size={18} />
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
                const isBookmarked =
                  bookmark?.surahNumber === arabicData.number &&
                  bookmark?.ayahIndex === i;

                return (
                  <div
                    key={ayah.number}
                    ref={(el) => setAyahRef(i, el)}
                    onClick={() => handleAyahVisible(ayah, i)}
                    className={`rounded-2xl p-5 shadow-sm transition-all duration-500 border ${
                      isCurrentlyPlaying
                        ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20 shadow-emerald"
                        : "bg-card border-border/40 hover:border-border"
                    }`}
                  >
                    {/* Ayah number row */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                            isCurrentlyPlaying
                              ? "gradient-emerald text-white shadow-emerald"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {ayah.numberInSurah}
                        </span>
                        {isCurrentlyPlaying && (
                          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full animate-pulse">
                            ♫ Now Playing
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookmarkAyah(ayah, i);
                          }}
                          className={`p-2.5 rounded-xl transition-all ${
                            isBookmarked
                              ? "bg-primary/15 text-primary scale-110"
                              : "bg-secondary/60 hover:bg-secondary text-muted-foreground"
                          }`}
                        >
                          {isBookmarked ? (
                            <BookmarkCheck size={18} />
                          ) : (
                            <Bookmark size={18} />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAyah(ayah, i);
                          }}
                          className={`p-2.5 rounded-xl transition-all ${
                            isCurrentlyPlaying
                              ? "gradient-emerald shadow-emerald"
                              : "bg-secondary/60 hover:bg-secondary"
                          }`}
                        >
                          {isCurrentlyPlaying && player.isPlaying ? (
                            <Pause size={18} className={isCurrentlyPlaying ? "text-white" : "text-foreground"} />
                          ) : (
                            <Play size={18} className={isCurrentlyPlaying ? "text-white" : "text-foreground"} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Arabic text */}
                    <p
                      className="text-right leading-[2.4] font-arabic text-foreground"
                      translate="no"
                      style={{ fontSize: `${arabicSize}px` }}
                    >
                      {ayah.text}
                    </p>

                    {/* Translation */}
                    {translation && (
                      <div className="mt-4 pt-3 border-t border-border/50">
                        <p
                          className="leading-relaxed text-muted-foreground"
                          style={{ fontSize: `${translationSize}px` }}
                        >
                          {translation.text}
                        </p>
                      </div>
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
