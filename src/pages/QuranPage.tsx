import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SURAHS = [
  { number: 1, name: "Al-Fatiha", arabic: "الفاتحة", verses: 7, type: "Meccan" },
  { number: 2, name: "Al-Baqarah", arabic: "البقرة", verses: 286, type: "Medinan" },
  { number: 3, name: "Ali 'Imran", arabic: "آل عمران", verses: 200, type: "Medinan" },
  { number: 4, name: "An-Nisa", arabic: "النساء", verses: 176, type: "Medinan" },
  { number: 5, name: "Al-Ma'idah", arabic: "المائدة", verses: 120, type: "Medinan" },
  { number: 36, name: "Ya-Sin", arabic: "يس", verses: 83, type: "Meccan" },
  { number: 55, name: "Ar-Rahman", arabic: "الرحمن", verses: 78, type: "Medinan" },
  { number: 56, name: "Al-Waqi'ah", arabic: "الواقعة", verses: 96, type: "Meccan" },
  { number: 67, name: "Al-Mulk", arabic: "الملك", verses: 30, type: "Meccan" },
  { number: 112, name: "Al-Ikhlas", arabic: "الإخلاص", verses: 4, type: "Meccan" },
  { number: 113, name: "Al-Falaq", arabic: "الفلق", verses: 5, type: "Meccan" },
  { number: 114, name: "An-Nas", arabic: "الناس", verses: 6, type: "Meccan" },
];

const FATIHA_VERSES = [
  { number: 1, arabic: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ", translation: "In the name of Allah, the Most Gracious, the Most Merciful." },
  { number: 2, arabic: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ", translation: "All praise is due to Allah, Lord of all worlds." },
  { number: 3, arabic: "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ", translation: "The Most Gracious, the Most Merciful." },
  { number: 4, arabic: "مَـٰلِكِ يَوْمِ ٱلدِّينِ", translation: "Master of the Day of Judgment." },
  { number: 5, arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", translation: "You alone we worship, and You alone we ask for help." },
  { number: 6, arabic: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ", translation: "Guide us on the Straight Path." },
  { number: 7, arabic: "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ", translation: "The path of those You have blessed—not those who incurred wrath, nor those who went astray." },
];

const QuranPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);

  const filtered = SURAHS.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.arabic.includes(search)
  );

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-6 pt-12 islamic-pattern">
        <button onClick={() => selectedSurah ? setSelectedSurah(null) : navigate("/")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">Holy Quran</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">Read and reflect</p>
      </div>

      <AnimatePresence mode="wait">
        {selectedSurah === null ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 -mt-3 pb-6">
            {/* Search */}
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search surah..."
                className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              {filtered.map((surah, i) => (
                <motion.button
                  key={surah.number}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => surah.number === 1 && setSelectedSurah(1)}
                  className="flex w-full items-center gap-4 rounded-xl bg-card p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-emerald">
                    <span className="text-sm font-bold text-primary-foreground">{surah.number}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{surah.name}</p>
                    <p className="text-xs text-muted-foreground">{surah.verses} verses · {surah.type}</p>
                  </div>
                  <p className="text-lg font-arabic text-primary">{surah.arabic}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-6 space-y-6">
            <div className="rounded-xl gradient-emerald p-4 text-center shadow-emerald">
              <h2 className="text-xl font-bold text-primary-foreground font-arabic">سُورَةُ الفَاتِحَة</h2>
              <p className="mt-1 text-sm text-primary-foreground/70">Al-Fatiha · The Opening</p>
            </div>
            {FATIHA_VERSES.map((verse, i) => (
              <motion.div
                key={verse.number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl bg-card p-5 shadow-sm"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">{verse.number}</span>
                </div>
                <p className="mt-3 text-right text-2xl leading-loose font-arabic text-foreground">{verse.arabic}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{verse.translation}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuranPage;
