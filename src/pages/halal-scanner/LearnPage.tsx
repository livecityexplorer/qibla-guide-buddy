import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, CheckCircle, XCircle, RotateCcw, Trophy, ChevronRight, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LEARN_CATEGORIES, ARTICLES, QUIZ_QUESTIONS, getLearningProgress, markArticleRead, saveQuizScore, type Article } from "@/data/halalEducation";

const BADGES: Record<string, { label: string; icon: string }> = {
  "knowledge-seeker": { label: "Knowledge Seeker", icon: "📚" },
  "article-master": { label: "Article Master", icon: "🎓" },
  "perfect-score": { label: "Perfect Score", icon: "🌟" },
  "quiz-lover": { label: "Quiz Lover", icon: "🧠" },
};

const LearnPage = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"home" | "article" | "quiz">("home");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const progress = getLearningProgress();

  // Quiz state
  const [quizLevel, setQuizLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  const quizQuestions = QUIZ_QUESTIONS.filter(q => q.level === quizLevel);
  const currentQ = quizQuestions[quizIndex];

  const openArticle = (article: Article) => {
    setSelectedArticle(article);
    setView("article");
    markArticleRead(article.id);
  };

  const startQuiz = (level: "beginner" | "intermediate" | "advanced") => {
    setQuizLevel(level);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizDone(false);
    setView("quiz");
  };

  const answerQuiz = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    if (idx === currentQ.correctIndex) setQuizScore(s => s + 1);
  };

  const nextQuestion = () => {
    if (quizIndex + 1 >= quizQuestions.length) {
      setQuizDone(true);
      saveQuizScore(quizScore + (selectedAnswer === currentQ.correctIndex ? 0 : 0), quizQuestions.length);
    } else {
      setQuizIndex(i => i + 1);
      setSelectedAnswer(null);
    }
  };

  const filteredArticles = categoryFilter
    ? ARTICLES.filter(a => a.category === categoryFilter)
    : ARTICLES;

  if (view === "article" && selectedArticle) {
    return (
      <div className="min-h-screen">
        <div className="gradient-emerald px-4 pb-6 pt-12 islamic-pattern">
          <button onClick={() => setView("home")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
            <ArrowLeft size={20} /><span className="text-sm">Back</span>
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">{selectedArticle.title}</h1>
          <p className="text-xs text-primary-foreground/60 mt-1">⏱️ {selectedArticle.readTime} read</p>
        </div>
        <div className="px-4 -mt-3 pb-6">
          <div className="rounded-2xl bg-card p-5 border border-border space-y-4">
            {selectedArticle.content.map((paragraph, i) => (
              <div key={i} className="text-sm text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: paragraph
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                    .replace(/✅/g, '<span class="text-emerald-mid">✅</span>')
                    .replace(/❌/g, '<span class="text-destructive">❌</span>')
                }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === "quiz") {
    if (quizDone) {
      const percentage = Math.round((quizScore / quizQuestions.length) * 100);
      return (
        <div className="min-h-screen flex flex-col">
          <div className="gradient-emerald px-4 pb-6 pt-12 islamic-pattern">
            <button onClick={() => setView("home")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
              <ArrowLeft size={20} /><span className="text-sm">Back</span>
            </button>
            <h1 className="text-2xl font-bold text-primary-foreground">Quiz Complete!</h1>
          </div>
          <div className="px-4 -mt-3 pb-6 flex-1 flex flex-col items-center justify-center">
            <div className="rounded-2xl bg-card p-8 border border-border text-center w-full">
              <Trophy size={48} className="mx-auto text-accent" />
              <p className="mt-4 text-3xl font-bold text-foreground">{quizScore}/{quizQuestions.length}</p>
              <p className="text-sm text-muted-foreground mt-1">{percentage}% correct</p>
              <p className="mt-3 text-sm text-foreground">
                {percentage >= 80 ? "Excellent! MashaAllah! 🌟" : percentage >= 60 ? "Good effort! Keep learning! 📖" : "Keep studying, you'll improve! 💪"}
              </p>
              <div className="flex gap-2 mt-6">
                <button onClick={() => startQuiz(quizLevel)} className="flex-1 rounded-xl gradient-emerald py-2.5 text-sm font-medium text-primary-foreground flex items-center justify-center gap-1">
                  <RotateCcw size={14} /> Retry
                </button>
                <button onClick={() => setView("home")} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen">
        <div className="gradient-emerald px-4 pb-6 pt-12 islamic-pattern">
          <button onClick={() => setView("home")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
            <ArrowLeft size={20} /><span className="text-sm">Back</span>
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary-foreground">Quiz: {quizLevel}</h1>
            <span className="text-sm text-primary-foreground/70">{quizIndex + 1}/{quizQuestions.length}</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-primary-foreground/20">
            <div className="h-full rounded-full bg-primary-foreground transition-all" style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }} />
          </div>
        </div>

        <div className="px-4 -mt-3 pb-6 space-y-4">
          <div className="rounded-2xl bg-card p-5 border border-border">
            <p className="text-base font-semibold text-foreground">{currentQ.question}</p>
            <div className="mt-4 space-y-2">
              {currentQ.options.map((opt, i) => {
                let cls = "border-border bg-muted/50 text-foreground";
                if (selectedAnswer !== null) {
                  if (i === currentQ.correctIndex) cls = "border-emerald-mid/50 bg-emerald-mid/10 text-emerald-mid";
                  else if (i === selectedAnswer) cls = "border-destructive/50 bg-destructive/10 text-destructive";
                }
                return (
                  <button key={i} onClick={() => answerQuiz(i)}
                    className={`w-full rounded-xl border p-3 text-left text-sm font-medium transition-colors ${cls}`}>
                    <span className="mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                    {selectedAnswer !== null && i === currentQ.correctIndex && <CheckCircle size={16} className="inline ml-2 text-emerald-mid" />}
                    {selectedAnswer !== null && i === selectedAnswer && i !== currentQ.correctIndex && <XCircle size={16} className="inline ml-2 text-destructive" />}
                  </button>
                );
              })}
            </div>
            {selectedAnswer !== null && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-foreground">{currentQ.explanation}</p>
              </motion.div>
            )}
          </div>

          {selectedAnswer !== null && (
            <button onClick={nextQuestion} className="w-full rounded-xl gradient-emerald py-3 text-sm font-medium text-primary-foreground flex items-center justify-center gap-1">
              {quizIndex + 1 >= quizQuestions.length ? "See Results" : "Next Question"} <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Home view
  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-6 pt-12 islamic-pattern">
        <button onClick={() => navigate("/halal-scanner")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} /><span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground flex items-center gap-2">
          <BookOpen size={24} /> Halal Education
        </h1>
        <p className="mt-1 text-sm text-primary-foreground/70">Your learning journey</p>
      </div>

      <div className="px-4 -mt-3 pb-6 space-y-4">
        {/* Progress */}
        <div className="rounded-2xl bg-card p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground">Learning Progress</p>
            <p className="text-xs text-muted-foreground">{progress.articlesRead.length}/{ARTICLES.length} articles</p>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-full rounded-full gradient-emerald transition-all" style={{ width: `${(progress.articlesRead.length / ARTICLES.length) * 100}%` }} />
          </div>
          {progress.badges.length > 0 && (
            <div className="flex gap-2 mt-3">
              {progress.badges.map(b => (
                <span key={b} className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent-foreground">
                  {BADGES[b]?.icon} {BADGES[b]?.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quiz Section */}
        <div className="rounded-2xl bg-card p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">🧠 Test Your Knowledge</h3>
          <div className="grid grid-cols-3 gap-2">
            {(["beginner", "intermediate", "advanced"] as const).map(level => (
              <button key={level} onClick={() => startQuiz(level)}
                className="rounded-xl bg-muted p-3 text-center active:scale-95 transition-transform">
                <p className="text-lg">{level === "beginner" ? "🌱" : level === "intermediate" ? "🌿" : "🌳"}</p>
                <p className="text-xs font-medium text-foreground capitalize mt-1">{level}</p>
                <p className="text-[10px] text-muted-foreground">{QUIZ_QUESTIONS.filter(q => q.level === level).length} Q</p>
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Categories</h3>
          <div className="grid grid-cols-2 gap-2">
            {LEARN_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
                className={`rounded-xl p-3 text-left border transition-colors ${
                  categoryFilter === cat.id ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}>
                <span className="text-lg">{cat.icon}</span>
                <p className="text-xs font-medium text-foreground mt-1">{cat.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Articles */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {categoryFilter ? LEARN_CATEGORIES.find(c => c.id === categoryFilter)?.label : "All Articles"}
          </h3>
          <div className="space-y-2">
            {filteredArticles.map(article => {
              const isRead = progress.articlesRead.includes(article.id);
              return (
                <button key={article.id} onClick={() => openArticle(article)}
                  className="w-full rounded-xl bg-card border border-border p-4 text-left active:scale-[0.98] transition-transform">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{article.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{article.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{article.summary}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground">⏱️ {article.readTime}</span>
                        {isRead && <span className="text-[10px] text-emerald-mid font-medium">✅ Read</span>}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnPage;
