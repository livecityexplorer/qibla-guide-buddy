import { ingredientDatabase, findIngredient, analyzeIngredientList, getOverallStatus, type HalalStatus, HARAM_PORK_KEYWORDS } from "@/data/ingredientDatabase";

export interface ProductResult {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  image: string;
  categories: string[];
  ingredients: string[];
  ingredientsText: string;
  status: HalalStatus;
  summary: string;
  confidence: "certified" | "high" | "analysis-based" | "low";
  analysis: { ingredient: string; info: any; status: HalalStatus }[];
  source: "openfoodfacts" | "local" | "manual";
}

const OFF_API = "https://world.openfoodfacts.org";

function parseIngredients(text: string): string[] {
  if (!text) return [];
  return text
    .replace(/\([^)]*\)/g, "") // remove parenthetical info
    .split(/[,;]/)
    .map(s => s.replace(/\d+(\.\d+)?%/g, "").trim())
    .filter(s => s.length > 1 && s.length < 80);
}

function generateSummary(analysis: { ingredient: string; status: HalalStatus }[], overallStatus: HalalStatus): string {
  const haramIngredients = analysis.filter(a => a.status === "haram").map(a => a.ingredient);
  const mushboohIngredients = analysis.filter(a => a.status === "mushbooh").map(a => a.ingredient);

  if (overallStatus === "haram") {
    return `Contains Haram ingredient(s): ${haramIngredients.join(", ")}. Not suitable for Muslim consumption.`;
  }
  if (overallStatus === "mushbooh") {
    if (haramIngredients.length > 0) {
      return `Contains Haram ingredient(s): ${haramIngredients.join(", ")}. Also has doubtful: ${mushboohIngredients.join(", ")}.`;
    }
    return `Contains doubtful ingredient(s): ${mushboohIngredients.join(", ")}. Verify source with manufacturer.`;
  }
  return "All identified ingredients appear to be Halal. Always verify with certification bodies for full assurance.";
}

// Check product name and categories for pork indicators
function detectPorkFromMetadata(name: string, categories: string[]): string[] {
  const detected: string[] = [];
  const combined = `${name} ${categories.join(" ")}`.toLowerCase();
  for (const kw of HARAM_PORK_KEYWORDS) {
    if (combined.includes(kw.toLowerCase())) {
      detected.push(kw);
    }
  }
  return detected;
}

export async function searchByBarcode(barcode: string): Promise<ProductResult | null> {
  try {
    const res = await fetch(`${OFF_API}/api/v2/product/${barcode}?fields=code,product_name,brands,image_front_url,categories_tags,ingredients_text_en,ingredients_text`);
    const data = await res.json();
    if (data.status === 0 || !data.product) return null;
    const p = data.product;
    const ingredientsText = p.ingredients_text_en || p.ingredients_text || "";
    const ingredients = parseIngredients(ingredientsText);
    const categories = (p.categories_tags || []).map((c: string) => c.replace("en:", "").replace(/-/g, " "));
    
    // Also check product name and categories for pork
    const porkFromMeta = detectPorkFromMetadata(p.product_name || "", categories);
    const allIngredients = [...ingredients];
    for (const pk of porkFromMeta) {
      if (!allIngredients.some(i => i.toLowerCase().includes(pk.toLowerCase()))) {
        allIngredients.push(pk);
      }
    }
    
    const analysis = analyzeIngredientList(allIngredients);
    const status = getOverallStatus(analysis);

    return {
      id: p.code || barcode,
      barcode: p.code || barcode,
      name: p.product_name || "Unknown Product",
      brand: p.brands || "Unknown Brand",
      image: p.image_front_url || "",
      categories,
      ingredients: allIngredients,
      ingredientsText,
      status,
      summary: generateSummary(analysis, status),
      confidence: ingredients.length > 3 ? "analysis-based" : "low",
      analysis,
      source: "openfoodfacts",
    };
  } catch {
    return null;
  }
}

export async function searchByName(query: string, page = 1): Promise<{ products: ProductResult[]; count: number }> {
  try {
    const res = await fetch(
      `${OFF_API}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=20&fields=code,product_name,brands,image_front_small_url,categories_tags,ingredients_text_en,ingredients_text`
    );
    const data = await res.json();
    const products: ProductResult[] = (data.products || [])
      .filter((p: any) => p.product_name)
      .map((p: any) => {
        const ingredientsText = p.ingredients_text_en || p.ingredients_text || "";
        const ingredients = parseIngredients(ingredientsText);
        const categories = (p.categories_tags || []).slice(0, 3).map((c: string) => c.replace("en:", "").replace(/-/g, " "));
        
        // Also check product name and categories for pork
        const porkFromMeta = detectPorkFromMetadata(p.product_name || "", categories);
        const allIngredients = [...ingredients];
        for (const pk of porkFromMeta) {
          if (!allIngredients.some(i => i.toLowerCase().includes(pk.toLowerCase()))) {
            allIngredients.push(pk);
          }
        }
        
        const analysis = analyzeIngredientList(allIngredients);
        const status = getOverallStatus(analysis);
        return {
          id: p.code,
          barcode: p.code,
          name: p.product_name,
          brand: p.brands || "Unknown",
          image: p.image_front_small_url || "",
          categories,
          ingredients: allIngredients,
          ingredientsText,
          status,
          summary: generateSummary(analysis, status),
          confidence: ingredients.length > 3 ? "analysis-based" : "low",
          analysis,
          source: "openfoodfacts" as const,
        };
      });
    return { products, count: data.count || 0 };
  } catch {
    return { products: [], count: 0 };
  }
}

export function searchIngredientDB(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return ingredientDatabase;
  return ingredientDatabase.filter(
    i =>
      i.name.toLowerCase().includes(q) ||
      i.eNumbers.some(e => e.toLowerCase().includes(q)) ||
      i.otherNames.some(n => n.toLowerCase().includes(q)) ||
      i.category.toLowerCase().includes(q)
  );
}

// History & Favorites localStorage helpers
const HISTORY_KEY = "halal_scan_history";
const FAVORITES_KEY = "halal_favorites";
const SETTINGS_KEY = "halal_scanner_settings";

export interface ScanHistoryItem {
  product: ProductResult;
  scannedAt: string;
  note?: string;
}

export interface FavoriteItem {
  product: ProductResult;
  savedAt: string;
  note?: string;
  collection?: string;
}

export interface ScannerSettings {
  autoSave: boolean;
  scanSound: boolean;
  vibration: boolean;
  showArabic: boolean;
  showScholarlyRefs: boolean;
  learningLevel: "beginner" | "intermediate" | "advanced";
  compactView: boolean;
  showImages: boolean;
  ingredientHighlighting: boolean;
}

export const DEFAULT_SETTINGS: ScannerSettings = {
  autoSave: true,
  scanSound: true,
  vibration: true,
  showArabic: true,
  showScholarlyRefs: true,
  learningLevel: "beginner",
  compactView: false,
  showImages: true,
  ingredientHighlighting: true,
};

export function getHistory(): ScanHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch { return []; }
}
export function addToHistory(item: ScanHistoryItem) {
  const history = getHistory();
  // prevent duplicates by barcode
  const filtered = history.filter(h => h.product.barcode !== item.product.barcode);
  filtered.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 500)));
}
export function clearHistory() { localStorage.removeItem(HISTORY_KEY); }
export function removeFromHistory(barcode: string) {
  const history = getHistory().filter(h => h.product.barcode !== barcode);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getFavorites(): FavoriteItem[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch { return []; }
}
export function addToFavorites(item: FavoriteItem) {
  const favs = getFavorites();
  if (!favs.some(f => f.product.barcode === item.product.barcode)) {
    favs.unshift(item);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  }
}
export function removeFromFavorites(barcode: string) {
  const favs = getFavorites().filter(f => f.product.barcode !== barcode);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}
export function isFavorite(barcode: string): boolean {
  return getFavorites().some(f => f.product.barcode === barcode);
}
export function updateFavoriteNote(barcode: string, note: string) {
  const favs = getFavorites().map(f => f.product.barcode === barcode ? { ...f, note } : f);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

export function getSettings(): ScannerSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch { return DEFAULT_SETTINGS; }
}
export function saveSettings(settings: ScannerSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
