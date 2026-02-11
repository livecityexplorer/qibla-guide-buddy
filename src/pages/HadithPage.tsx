import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HADITHS = [
  {
    narrator: "Abu Hurairah (RA)",
    text: "The Messenger of Allah (ﷺ) said: 'The best of you are those who learn the Quran and teach it.'",
    source: "Sahih al-Bukhari 5027",
    topic: "Knowledge",
  },
  {
    narrator: "Anas ibn Malik (RA)",
    text: "The Prophet (ﷺ) said: 'None of you truly believes until he loves for his brother what he loves for himself.'",
    source: "Sahih al-Bukhari 13",
    topic: "Faith",
  },
  {
    narrator: "Abu Hurairah (RA)",
    text: "The Prophet (ﷺ) said: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.'",
    source: "Sahih al-Bukhari 6018",
    topic: "Manners",
  },
  {
    narrator: "Abdullah ibn Umar (RA)",
    text: "The Prophet (ﷺ) said: 'The most beloved deed to Allah is the prayer performed on time.'",
    source: "Sahih al-Bukhari 527",
    topic: "Prayer",
  },
  {
    narrator: "Abu Dharr (RA)",
    text: "The Prophet (ﷺ) said: 'Your smile in the face of your brother is charity.'",
    source: "Jami at-Tirmidhi 1956",
    topic: "Charity",
  },
];

const HadithPage = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const hadith = HADITHS[currentIndex];

  const nextHadith = () => {
    setCurrentIndex((prev) => (prev + 1) % HADITHS.length);
  };

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-8 pt-12 islamic-pattern">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">Hadith</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">Words of the Prophet ﷺ</p>
      </div>

      <div className="px-4 -mt-4 pb-6">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-card p-6 shadow-sm"
        >
          <div className="mb-4 inline-block rounded-full bg-secondary px-3 py-1">
            <span className="text-xs font-semibold text-secondary-foreground">{hadith.topic}</span>
          </div>

          <p className="text-lg leading-relaxed text-foreground">"{hadith.text}"</p>

          <div className="mt-6 border-t border-border pt-4">
            <p className="text-sm font-medium text-primary">{hadith.narrator}</p>
            <p className="text-xs text-muted-foreground">{hadith.source}</p>
          </div>
        </motion.div>

        <button
          onClick={nextHadith}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl gradient-emerald py-3 font-medium text-primary-foreground shadow-emerald transition-all active:scale-95"
        >
          <RefreshCw size={18} />
          Next Hadith
        </button>

        {/* All Hadiths List */}
        <h3 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Browse Hadiths</h3>
        <div className="space-y-2">
          {HADITHS.map((h, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-full rounded-xl p-4 text-left transition-all ${
                i === currentIndex ? "bg-secondary ring-2 ring-primary" : "bg-card"
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
