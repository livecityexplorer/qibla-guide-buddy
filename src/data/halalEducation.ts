export interface Article {
  id: string;
  title: string;
  category: string;
  icon: string;
  readTime: string;
  summary: string;
  content: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  level: "beginner" | "intermediate" | "advanced";
}

export const LEARN_CATEGORIES = [
  { id: "beginner", label: "Beginner's Guide", icon: "📘", color: "bg-blue-500/10 text-blue-600" },
  { id: "ingredients", label: "Understanding Ingredients", icon: "📗", color: "bg-emerald-mid/10 text-emerald-mid" },
  { id: "enumbers", label: "E-Numbers Guide", icon: "📙", color: "bg-orange-500/10 text-orange-600" },
  { id: "certification", label: "Certification Bodies", icon: "📕", color: "bg-red-500/10 text-red-600" },
  { id: "ramadan", label: "Ramadan & Food", icon: "📓", color: "bg-purple-500/10 text-purple-600" },
  { id: "newmuslim", label: "For New Muslims", icon: "📔", color: "bg-pink-500/10 text-pink-600" },
];

export const ARTICLES: Article[] = [
  {
    id: "10-haram-ingredients",
    title: "10 Haram Ingredients Every Muslim Should Know",
    category: "beginner",
    icon: "🚫",
    readTime: "5 min",
    summary: "Learn the most common Haram ingredients found in everyday products.",
    content: [
      "As Muslims, knowing what goes into our food is an act of worship. Here are the top 10 Haram ingredients to watch for:",
      "**1. Pork Gelatin (E441)** — Found in marshmallows, gummy candy, yogurt, and capsules. Most commercial gelatin comes from pork.",
      "**2. Carmine (E120)** — A red dye made from crushed cochineal insects. Found in yogurt, candy, cosmetics.",
      "**3. Lard** — Rendered pork fat used in baking, pastries, and some traditional recipes.",
      "**4. Alcohol/Ethanol** — Found in vanilla extract, soy sauce, and many flavor extracts.",
      "**5. Pepsin** — A digestive enzyme almost exclusively from pork stomachs.",
      "**6. L-Cysteine (E920)** — A dough conditioner that may come from human hair or pig bristles.",
      "**7. Animal Shortening** — May contain lard (pork fat). Always check the source.",
      "**8. Rennet** — Used in cheese-making, often from calf stomachs. Look for 'microbial rennet'.",
      "**9. Mono & Diglycerides (E471)** — Emulsifiers that can be from pork fat.",
      "**10. Natural Flavors** — A vague term that can hide animal-derived or alcohol-based ingredients.",
      "**Key Tip:** When in doubt, follow the Prophet's (ﷺ) advice: 'Leave what makes you doubt for what does not make you doubt.' (Tirmidhi)",
    ],
  },
  {
    id: "read-food-labels",
    title: "How to Read Food Labels Like a Pro",
    category: "beginner",
    icon: "🏷️",
    readTime: "4 min",
    summary: "Master the art of reading ingredient lists to identify Halal and Haram components.",
    content: [
      "Understanding food labels is essential for maintaining a Halal diet. Here's your step-by-step guide:",
      "**Step 1: Look for Halal Certification** — Check for recognized Halal logos (IFANCA, HFA, MUI, JAKIM). This is the most reliable indicator.",
      "**Step 2: Read the Ingredient List** — Ingredients are listed in order of quantity. Focus on additives at the end.",
      "**Step 3: Watch for E-Numbers** — European food additive codes. Some are Halal (E300), some are Haram (E120), many are doubtful (E471).",
      "**Step 4: Check 'May Contain' Warnings** — Cross-contamination warnings are important for strict observance.",
      "**Step 5: Beware of Vague Terms** — 'Natural flavors', 'enzymes', 'emulsifiers' can hide non-Halal ingredients.",
      "**Step 6: 'Suitable for Vegetarians'** — This is helpful but NOT a guarantee of Halal (may contain alcohol).",
      "**Step 7: Contact the Manufacturer** — When in doubt, email or call. Most companies will clarify ingredient sources.",
      "**Remember:** 'Kosher' does NOT equal 'Halal'. Kosher gelatin can still be from pork in some certifications.",
    ],
  },
  {
    id: "enumbers-complete",
    title: "Complete Guide to E-Numbers for Muslims",
    category: "enumbers",
    icon: "🔢",
    readTime: "8 min",
    summary: "A comprehensive guide to European food additive codes and their Halal status.",
    content: [
      "E-Numbers are codes for food additives used in the European Union. They appear on ingredient lists worldwide.",
      "**🟢 ALWAYS HALAL E-Numbers:**",
      "E100 (Turmeric), E101 (Riboflavin), E133 (Brilliant Blue), E150a (Caramel), E160a (Beta-Carotene), E170 (Calcium Carbonate), E200 (Sorbic Acid), E211 (Sodium Benzoate), E270 (Lactic Acid), E300 (Vitamin C), E322 (Lecithin), E330 (Citric Acid), E406 (Agar), E407 (Carrageenan), E412 (Guar Gum), E415 (Xanthan Gum), E440 (Pectin), E901 (Beeswax), E903 (Carnauba Wax)",
      "**🔴 ALWAYS HARAM E-Numbers:**",
      "E120 (Carmine — from insects), E441 (Gelatin — usually pork), E542 (Bone Phosphate — animal bones)",
      "**🟠 MUSHBOOH (Doubtful) E-Numbers:**",
      "E422 (Glycerol — check source), E471 (Mono/Diglycerides — check source), E472 (Esters — check source), E476 (PGPR — check source), E491 (Sorbitan Monostearate), E570 (Stearic Acid), E572 (Magnesium Stearate), E631 (Disodium Inosinate), E635 (Disodium Ribonucleotides), E904 (Shellac), E920 (L-Cysteine)",
      "**Key Principle:** If an E-Number is from a plant, mineral, or synthetic source, it's generally Halal. If it CAN be from animal sources, it's Mushbooh unless specified.",
      "**Pro Tip:** Save this guide on your phone for quick reference while shopping!",
    ],
  },
  {
    id: "halal-certification-guide",
    title: "Understanding Halal Certification Worldwide",
    category: "certification",
    icon: "✅",
    readTime: "6 min",
    summary: "Learn about major Halal certification bodies and how to verify certificates.",
    content: [
      "Halal certification provides assurance that products meet Islamic dietary requirements. Here's what you need to know:",
      "**Major Certification Bodies:**",
      "🇺🇸 **IFANCA** (Islamic Food and Nutrition Council of America) — One of the oldest and most recognized in the USA.",
      "🇬🇧 **HFA** (Halal Food Authority) — UK's leading Halal certification body.",
      "🇮🇩 **MUI/LPPOM** (Majelis Ulama Indonesia) — Indonesia's authority. The world's largest Muslim country.",
      "🇲🇾 **JAKIM** (Department of Islamic Development Malaysia) — Highly respected globally.",
      "🇸🇬 **MUIS** (Majlis Ugama Islam Singapura) — Singapore's Islamic Religious Council.",
      "🇦🇪 **ESMA** (Emirates Authority for Standardization) — UAE's certification authority.",
      "🇸🇦 **SFDA** (Saudi Food and Drug Authority) — Saudi Arabia's authority.",
      "**How to Verify Certification:**",
      "1. Check the certification number on the product label",
      "2. Visit the certification body's website",
      "3. Look up the product/company in their database",
      "4. Verify the certification hasn't expired",
      "**Warning Signs of Fake Certification:**",
      "- Logo looks different from the official version",
      "- No certification number",
      "- Certification body doesn't exist online",
      "- Company not listed in the certifier's database",
    ],
  },
  {
    id: "ramadan-food-guide",
    title: "Halal Food Guide for Ramadan",
    category: "ramadan",
    icon: "🌙",
    readTime: "5 min",
    summary: "Special considerations for food during the blessed month of Ramadan.",
    content: [
      "Ramadan is the perfect time to be extra mindful about what we consume. Here are special considerations:",
      "**Suhoor (Pre-Dawn Meal):**",
      "- Check your bread for L-Cysteine (E920) — common in commercial bread",
      "- Verify your cereal doesn't contain gelatin-coated vitamins",
      "- Check yogurt for gelatin or carmine (E120) used as coloring",
      "**Iftar (Breaking Fast):**",
      "- Dates: Generally Halal, but check for alcohol-based preservatives in stuffed dates",
      "- Samosas/spring rolls: Check if fried in animal fat or vegetable oil",
      "- Desserts: Watch for gelatin in puddings, mousse, and cheesecake",
      "**Special Ramadan Products:**",
      "- Ramadan gift boxes: May contain candy with gelatin",
      "- Imported sweets: Check E-numbers carefully",
      "- Energy drinks: May contain taurine from animal sources",
      "**Spiritual Reminder:**",
      "The Prophet (ﷺ) said: 'Whoever does not give up false speech and acting upon it and ignorance, Allah has no need of his giving up food and drink.' (Bukhari)",
      "Make this Ramadan about quality — both in worship AND in what you consume.",
    ],
  },
  {
    id: "new-muslim-guide",
    title: "Halal Food Guide for New Muslims",
    category: "newmuslim",
    icon: "🌟",
    readTime: "6 min",
    summary: "A gentle, comprehensive introduction to Islamic dietary guidelines for new Muslims.",
    content: [
      "Welcome to Islam! Understanding Halal food is simpler than it seems. Let's break it down gently:",
      "**The Basics — What is Halal?**",
      "Halal (حلال) means 'permissible' in Arabic. In food, it means what Allah has allowed us to eat.",
      "**What's Generally Halal:**",
      "✅ All fruits and vegetables",
      "✅ All grains (rice, wheat, oats)",
      "✅ Seafood (fish, shrimp — with some scholarly differences)",
      "✅ Eggs",
      "✅ Milk and dairy",
      "✅ Nuts and seeds",
      "✅ Halal-slaughtered meat (beef, chicken, lamb)",
      "**What's Haram (Forbidden):**",
      "❌ Pork and all pork products",
      "❌ Alcohol and intoxicants",
      "❌ Blood",
      "❌ Animals not slaughtered in Allah's name",
      "❌ Carnivorous animals and birds of prey",
      "**Don't Overwhelm Yourself:**",
      "Start with the basics: avoid pork and alcohol. As you learn more, you'll naturally become more aware of hidden ingredients.",
      "Allah says: 'Allah does not burden a soul beyond that it can bear.' (Quran 2:286)",
      "**Practical Tips:**",
      "- Start shopping at Halal grocery stores",
      "- Use this app to scan products when unsure",
      "- Ask your Muslim friends for trusted brands",
      "- Remember: when in doubt, leave it out!",
    ],
  },
  {
    id: "hidden-haram",
    title: "Hidden Haram Ingredients: What Labels Don't Tell You",
    category: "ingredients",
    icon: "🔍",
    readTime: "5 min",
    summary: "Discover ingredients that sound innocent but may contain non-Halal components.",
    content: [
      "Some ingredients hide their true nature behind innocent-sounding names. Here's what to watch for:",
      "**'Natural Flavors'** — This catch-all term can include any flavor from a 'natural' source, including animal-derived ones. Castoreum (from beaver glands) is technically a 'natural flavor'.",
      "**'Enzymes'** — Used in cheese and baking. Can be from animal stomachs (rennet) or microbial sources. Always check.",
      "**'Mono and Diglycerides'** — Sounds chemical, but can be from pork fat. Very common in bread and baked goods.",
      "**'Glycerin'** — Used in countless products. Can be from pork tallow or vegetable oil. Source rarely specified.",
      "**'Vanilla Extract'** — Contains 35%+ alcohol. Consider vanilla powder or alcohol-free vanilla paste instead.",
      "**'Lactic Acid'** — Usually Halal (from fermentation), but CAN be from animal sources in rare cases.",
      "**'Whey'** — From cheese-making. The concern is the rennet used to make the cheese.",
      "**'Lecithin'** — Usually soy-derived (Halal), but rarely can be from animal sources.",
      "**'Confectioner's Glaze'** — This is shellac, derived from lac insect secretions.",
      "**Golden Rule:** If the source isn't specified, treat it as doubtful (Mushbooh).",
    ],
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    question: "What is E120 (Carmine) derived from?",
    options: ["Beet root", "Crushed cochineal insects", "Synthetic dye", "Red peppers"],
    correctIndex: 1,
    explanation: "Carmine (E120) is a red dye made from crushed female cochineal insects. It's considered Haram by most scholars.",
    level: "beginner",
  },
  {
    id: "q2",
    question: "Is soy lecithin (E322) Halal?",
    options: ["Always Haram", "Always Halal", "Depends on source", "Only in small amounts"],
    correctIndex: 1,
    explanation: "Soy lecithin is derived from soybeans and is considered Halal by all scholars.",
    level: "beginner",
  },
  {
    id: "q3",
    question: "What is the main concern with gelatin (E441)?",
    options: ["It contains alcohol", "It's usually from pork", "It's synthetic", "It contains blood"],
    correctIndex: 1,
    explanation: "Most commercial gelatin is derived from pork skin and bones, making it Haram.",
    level: "beginner",
  },
  {
    id: "q4",
    question: "Does 'Kosher' certification mean a product is Halal?",
    options: ["Yes, always", "No, never", "Not necessarily", "Only for meat"],
    correctIndex: 2,
    explanation: "Kosher and Halal have different requirements. Kosher gelatin can still be from pork in some certifications. Alcohol is Kosher but not Halal.",
    level: "beginner",
  },
  {
    id: "q5",
    question: "What does 'Mushbooh' mean?",
    options: ["Halal", "Haram", "Doubtful/Suspicious", "Certified"],
    correctIndex: 2,
    explanation: "Mushbooh means doubtful or suspicious. Products with Mushbooh ingredients should be investigated further or avoided.",
    level: "beginner",
  },
  {
    id: "q6",
    question: "Which of these is a Halal alternative to gelatin?",
    options: ["Pepsin", "Agar-agar", "Rennet", "Tallow"],
    correctIndex: 1,
    explanation: "Agar-agar is derived from seaweed and is a perfect Halal substitute for gelatin.",
    level: "beginner",
  },
  {
    id: "q7",
    question: "What is istihala in Islamic jurisprudence?",
    options: ["A type of prayer", "Chemical transformation", "A type of fasting", "A Halal certification"],
    correctIndex: 1,
    explanation: "Istihala refers to chemical transformation where a substance changes its nature completely. Some scholars argue this can change the Halal ruling of an ingredient.",
    level: "intermediate",
  },
  {
    id: "q8",
    question: "What percentage of alcohol does pure vanilla extract contain?",
    options: ["5%", "15%", "35% or more", "Less than 1%"],
    correctIndex: 2,
    explanation: "FDA requires pure vanilla extract to contain at least 35% alcohol. This is why many scholars consider it Haram unless used in cooking where alcohol evaporates.",
    level: "intermediate",
  },
  {
    id: "q9",
    question: "Which certification body is from Malaysia?",
    options: ["IFANCA", "HFA", "JAKIM", "MUI"],
    correctIndex: 2,
    explanation: "JAKIM (Department of Islamic Development Malaysia) is Malaysia's highly respected Halal certification authority.",
    level: "intermediate",
  },
  {
    id: "q10",
    question: "L-Cysteine (E920) can be sourced from:",
    options: ["Only plants", "Human hair and pig bristles", "Only synthetic sources", "Dairy products"],
    correctIndex: 1,
    explanation: "L-Cysteine can be derived from human hair, duck feathers, or pig bristles. Always verify the source.",
    level: "intermediate",
  },
  {
    id: "q11",
    question: "What Hadith is commonly cited about doubtful matters?",
    options: [
      "\"Actions are judged by intentions\"",
      "\"Leave what makes you doubt for what does not make you doubt\"",
      "\"The strong believer is better\"",
      "\"None of you truly believes until...\"",
    ],
    correctIndex: 1,
    explanation: "This Hadith from Tirmidhi is the guiding principle for dealing with Mushbooh (doubtful) ingredients.",
    level: "beginner",
  },
  {
    id: "q12",
    question: "Shellac (E904) is derived from:",
    options: ["Tree bark", "Mineral deposits", "Lac insect secretions", "Seaweed"],
    correctIndex: 2,
    explanation: "Shellac is a resin secreted by the female lac bug. Its Halal status is debated among scholars.",
    level: "advanced",
  },
];

export const INGREDIENT_OF_THE_DAY = [
  { name: "Gelatin", emoji: "🍬", fact: "Found in 60% of processed foods. Most is from pork." },
  { name: "Carmine (E120)", emoji: "🔴", fact: "Made from 70,000 crushed insects to produce 1 pound of dye." },
  { name: "Agar-Agar", emoji: "🌊", fact: "A perfect Halal gelatin substitute made from seaweed." },
  { name: "Vanilla Extract", emoji: "🍦", fact: "Contains 35%+ alcohol. Use vanilla powder as a Halal alternative." },
  { name: "L-Cysteine (E920)", emoji: "🍞", fact: "A dough conditioner that may come from human hair." },
  { name: "Pectin (E440)", emoji: "🍎", fact: "A Halal gelling agent from fruit. Great for jams and desserts." },
  { name: "Natural Flavors", emoji: "🏷️", fact: "Can hide animal-derived or alcohol-based ingredients." },
];

export function getTodaysIngredient() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return INGREDIENT_OF_THE_DAY[dayOfYear % INGREDIENT_OF_THE_DAY.length];
}

// Learning progress stored in localStorage
const PROGRESS_KEY = "halal_learning_progress";

export interface LearningProgress {
  articlesRead: string[];
  quizScores: { quizId: string; score: number; total: number; date: string }[];
  badges: string[];
  streak: number;
  lastActiveDate: string;
}

export function getLearningProgress(): LearningProgress {
  try {
    const stored = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return {
      articlesRead: stored.articlesRead || [],
      quizScores: stored.quizScores || [],
      badges: stored.badges || [],
      streak: stored.streak || 0,
      lastActiveDate: stored.lastActiveDate || "",
    };
  } catch { return { articlesRead: [], quizScores: [], badges: [], streak: 0, lastActiveDate: "" }; }
}

export function saveLearningProgress(progress: LearningProgress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function markArticleRead(articleId: string) {
  const progress = getLearningProgress();
  if (!progress.articlesRead.includes(articleId)) {
    progress.articlesRead.push(articleId);
  }
  const today = new Date().toDateString();
  if (progress.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    progress.streak = progress.lastActiveDate === yesterday ? progress.streak + 1 : 1;
    progress.lastActiveDate = today;
  }
  // Check for badges
  if (progress.articlesRead.length >= 5 && !progress.badges.includes("knowledge-seeker")) {
    progress.badges.push("knowledge-seeker");
  }
  if (progress.articlesRead.length >= ARTICLES.length && !progress.badges.includes("article-master")) {
    progress.badges.push("article-master");
  }
  saveLearningProgress(progress);
  return progress;
}

export function saveQuizScore(score: number, total: number) {
  const progress = getLearningProgress();
  progress.quizScores.push({ quizId: `quiz-${Date.now()}`, score, total, date: new Date().toISOString() });
  if (score === total && !progress.badges.includes("perfect-score")) {
    progress.badges.push("perfect-score");
  }
  if (progress.quizScores.length >= 5 && !progress.badges.includes("quiz-lover")) {
    progress.badges.push("quiz-lover");
  }
  saveLearningProgress(progress);
  return progress;
}
