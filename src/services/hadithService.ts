// Hadith API Service using free APIs
// Primary: https://random-hadith-generator.vercel.app
// Fallback: local collection

export interface HadithData {
  text: string;
  narrator?: string;
  source: string;
  collection: string;
  chapter?: string;
  hadithNumber?: number;
  grade?: string;
}

export const HADITH_COLLECTIONS = [
  { id: "bukhari", label: "Sahih al-Bukhari", apiKey: "bukhari" },
  { id: "muslim", label: "Sahih Muslim", apiKey: "muslim" },
  { id: "abudawud", label: "Sunan Abu Dawud", apiKey: "abudawud" },
  { id: "tirmidhi", label: "Jami at-Tirmidhi", apiKey: "tirmidhi" },
  { id: "nasai", label: "Sunan an-Nasa'i", apiKey: "nasai" },
  { id: "ibnmajah", label: "Sunan Ibn Majah", apiKey: "ibnmajah" },
] as const;

// Fallback hadiths for offline use
const FALLBACK_HADITHS: HadithData[] = [
  {
    text: "The best of you are those who learn the Quran and teach it.",
    narrator: "Abu Hurairah (RA)",
    source: "Sahih al-Bukhari 5027",
    collection: "bukhari",
    grade: "Sahih",
  },
  {
    text: "None of you truly believes until he loves for his brother what he loves for himself.",
    narrator: "Anas ibn Malik (RA)",
    source: "Sahih al-Bukhari 13",
    collection: "bukhari",
    grade: "Sahih",
  },
  {
    text: "Whoever believes in Allah and the Last Day, let him speak good or remain silent.",
    narrator: "Abu Hurairah (RA)",
    source: "Sahih al-Bukhari 6018",
    collection: "bukhari",
    grade: "Sahih",
  },
  {
    text: "The most beloved deed to Allah is the prayer performed on time.",
    narrator: "Abdullah ibn Umar (RA)",
    source: "Sahih al-Bukhari 527",
    collection: "bukhari",
    grade: "Sahih",
  },
  {
    text: "Your smile in the face of your brother is charity.",
    narrator: "Abu Dharr (RA)",
    source: "Jami at-Tirmidhi 1956",
    collection: "tirmidhi",
    grade: "Sahih",
  },
  {
    text: "The strong person is not the one who can wrestle someone else down. The strong person is the one who can control himself when he is angry.",
    narrator: "Abu Hurairah (RA)",
    source: "Sahih al-Bukhari 6114",
    collection: "bukhari",
    grade: "Sahih",
  },
  {
    text: "Whoever treads a path seeking knowledge, Allah will make easy for him the path to Paradise.",
    narrator: "Abu Hurairah (RA)",
    source: "Sahih Muslim 2699",
    collection: "muslim",
    grade: "Sahih",
  },
  {
    text: "The best among you are those who have the best manners and character.",
    narrator: "Abdullah ibn Amr (RA)",
    source: "Sahih al-Bukhari 3559",
    collection: "bukhari",
    grade: "Sahih",
  },
  {
    text: "Make things easy and do not make them difficult. Give glad tidings and do not drive people away.",
    narrator: "Anas ibn Malik (RA)",
    source: "Sahih al-Bukhari 69",
    collection: "bukhari",
    grade: "Sahih",
  },
  {
    text: "Allah does not look at your figures, nor at your attire but He looks at your hearts and your deeds.",
    narrator: "Abu Hurairah (RA)",
    source: "Sahih Muslim 2564",
    collection: "muslim",
    grade: "Sahih",
  },
  {
    text: "The world is a prison for the believer and a paradise for the disbeliever.",
    narrator: "Abu Hurairah (RA)",
    source: "Sahih Muslim 2956",
    collection: "muslim",
    grade: "Sahih",
  },
  {
    text: "Richness is not having many possessions. Rather, true richness is the richness of the soul.",
    narrator: "Abu Hurairah (RA)",
    source: "Sahih al-Bukhari 6446",
    collection: "bukhari",
    grade: "Sahih",
  },
  {
    text: "He who does not show mercy to people, Allah will not show mercy to him.",
    narrator: "Jarir ibn Abdullah (RA)",
    source: "Sahih al-Bukhari 7376",
    collection: "bukhari",
    grade: "Sahih",
  },
  {
    text: "A Muslim is the one from whose tongue and hands the people are safe.",
    narrator: "Abdullah ibn Amr (RA)",
    source: "Sahih al-Bukhari 10",
    collection: "bukhari",
    grade: "Sahih",
  },
  {
    text: "Take advantage of five before five: your youth before your old age, your health before your illness, your riches before your poverty, your free time before your work, and your life before your death.",
    narrator: "Abdullah ibn Abbas (RA)",
    source: "Shu'ab al-Iman 10248",
    collection: "bukhari",
    grade: "Sahih",
  },
];

export async function getRandomHadith(collection: string = "bukhari"): Promise<HadithData> {
  try {
    const res = await fetch(
      `https://random-hadith-generator.vercel.app/api/${collection}/`
    );
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    
    return {
      text: data.data?.hadith_english || data.data?.text || data.hadith_english || "",
      narrator: data.data?.header || data.data?.narrator || "",
      source: `${collection} ${data.data?.id || data.data?.hadithNumber || ""}`,
      collection,
      hadithNumber: data.data?.id || data.data?.hadithNumber,
      chapter: data.data?.chapterName || data.data?.chapter || "",
      grade: data.data?.grade || "",
    };
  } catch {
    // Fallback to local collection
    const filtered = FALLBACK_HADITHS.filter(
      (h) => h.collection === collection || collection === "bukhari"
    );
    return filtered[Math.floor(Math.random() * filtered.length)] || FALLBACK_HADITHS[0];
  }
}

export function getDailyHadith(): HadithData {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return FALLBACK_HADITHS[dayOfYear % FALLBACK_HADITHS.length];
}

export function getAllLocalHadiths(): HadithData[] {
  return FALLBACK_HADITHS;
}
