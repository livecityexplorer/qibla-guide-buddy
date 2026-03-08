// Al-Quran Cloud API Service - Free, no API key needed
// Docs: https://alquran.cloud/api

const BASE_URL = "https://api.alquran.cloud/v1";
const QDC_BASE = "https://api.qurancdn.com/api/qdc";

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;          // global ayah number
  numberInSurah: number;
  text: string;
  audio?: string;
  surah?: { number: number; name: string; englishName: string };
}

export interface Edition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
  direction: string | null;
}

export interface SurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
}

export interface VerseTiming {
  verseKey: string;       // e.g. "1:1"
  timestampFrom: number;  // ms
  timestampTo: number;    // ms
}

export interface SurahAudioInfo {
  audioUrl: string;
  duration: number;       // ms
  verseTimings: VerseTiming[];
}

// Popular translation editions by language
export const TRANSLATION_EDITIONS: { id: string; label: string; lang: string }[] = [
  { id: "en.asad", label: "English - Muhammad Asad", lang: "en" },
  { id: "en.sahih", label: "English - Saheeh International", lang: "en" },
  { id: "fr.hamidullah", label: "French - Hamidullah", lang: "fr" },
  { id: "de.aburida", label: "German - Abu Rida", lang: "de" },
  { id: "es.cortes", label: "Spanish - Julio Cortes", lang: "es" },
  { id: "tr.diyanet", label: "Turkish - Diyanet Isleri", lang: "tr" },
  { id: "ur.jalandhry", label: "Urdu - Jalandhry", lang: "ur" },
  { id: "id.indonesian", label: "Indonesian", lang: "id" },
  { id: "bn.bengali", label: "Bengali", lang: "bn" },
  { id: "ru.kuliev", label: "Russian - Kuliev", lang: "ru" },
  { id: "ml.abdulhameed", label: "Malayalam", lang: "ml" },
  { id: "hi.hindi", label: "Hindi", lang: "hi" },
  { id: "fa.makarem", label: "Persian - Makarem", lang: "fa" },
  { id: "it.piccardo", label: "Italian - Piccardo", lang: "it" },
  { id: "nl.keyzer", label: "Dutch - Keyzer", lang: "nl" },
  { id: "pt.elhayek", label: "Portuguese - El-Hayek", lang: "pt" },
  { id: "zh.majian", label: "Chinese - Ma Jian", lang: "zh" },
  { id: "ja.japanese", label: "Japanese", lang: "ja" },
  { id: "ko.korean", label: "Korean", lang: "ko" },
  { id: "th.thai", label: "Thai", lang: "th" },
  { id: "sw.barwani", label: "Swahili - Barwani", lang: "sw" },
  { id: "sq.ahmeti", label: "Albanian - Ahmeti", lang: "sq" },
  { id: "az.mammadaliyev", label: "Azerbaijani", lang: "az" },
  { id: "ms.basmeih", label: "Malay - Basmeih", lang: "ms" },
];

export const RECITERS = [
  { id: "ar.alafasy", label: "Mishary Rashid Alafasy", qdcId: 7 },
  { id: "ar.abdulbasitmurattal", label: "Abdul Basit (Murattal)", qdcId: 1 },
  { id: "ar.abdurrahmaansudais", label: "Abdurrahman As-Sudais", qdcId: 6 },
  { id: "ar.husary", label: "Mahmoud Khalil Al-Husary", qdcId: 5 },
  { id: "ar.minshawi", label: "Mohamed Siddiq El-Minshawi", qdcId: 8 },
  { id: "ar.saoodshuraym", label: "Saud Al-Shuraim", qdcId: 10 },
];

async function fetchApi<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.data || "API error");
  return json.data as T;
}

export async function getAllSurahs(): Promise<Surah[]> {
  return fetchApi<Surah[]>("/surah");
}

export async function getSurahArabic(surahNumber: number): Promise<SurahData> {
  return fetchApi<SurahData>(`/surah/${surahNumber}/quran-uthmani`);
}

export async function getSurahTranslation(surahNumber: number, edition: string): Promise<SurahData> {
  return fetchApi<SurahData>(`/surah/${surahNumber}/${edition}`);
}

export async function getSurahAudio(surahNumber: number, reciter: string): Promise<SurahData> {
  return fetchApi<SurahData>(`/surah/${surahNumber}/${reciter}`);
}

// Get ayah audio URL from CDN directly
export function getAyahAudioUrl(ayahGlobalNumber: number, reciter: string = "ar.alafasy"): string {
  return `https://cdn.islamic.network/quran/audio/128/${reciter}/${ayahGlobalNumber}.mp3`;
}

// Get full surah audio URL from CDN (single continuous file)
export function getSurahAudioUrl(surahNumber: number, reciter: string = "ar.alafasy"): string {
  return `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${surahNumber}.mp3`;
}

// Get QDC reciter ID from our reciter identifier
function getQdcReciterId(reciter: string): number {
  const found = RECITERS.find((r) => r.id === reciter);
  return found?.qdcId ?? 7; // default to Alafasy
}

// Fetch surah audio info with verse timings from Quran.com CDN
export async function getSurahAudioWithTimings(surahNumber: number, reciter: string): Promise<SurahAudioInfo> {
  const qdcId = getQdcReciterId(reciter);
  const res = await fetch(`${QDC_BASE}/audio/reciters/${qdcId}/audio_files?chapter=${surahNumber}&segments=true`);
  if (!res.ok) throw new Error(`QDC API error: ${res.status}`);
  const json = await res.json();
  const audioFile = json.audio_files?.[0];
  if (!audioFile) throw new Error("No audio file found");

  return {
    audioUrl: audioFile.audio_url,
    duration: audioFile.duration,
    verseTimings: (audioFile.verse_timings || []).map((vt: any) => ({
      verseKey: vt.verse_key,
      timestampFrom: vt.timestamp_from,
      timestampTo: vt.timestamp_to,
    })),
  };
}
