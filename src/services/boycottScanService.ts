/**
 * Boycott Scan Service
 * Uses Open Food Facts + Open Beauty Facts + Open Pet Food Facts
 * to look up barcodes and cross-reference with the boycott directory.
 */

import {
  boycottDirectory,
  searchBoycottDirectory,
  getLevelConfig,
  type BoycottEntry,
} from "@/data/boycottDirectory";

export type ProductInfo = {
  barcode: string;
  name: string;
  brand: string;
  manufacturer?: string;
  categories?: string;
  imageUrl?: string;
  imageFrontUrl?: string;
  ingredients?: string;
  origins?: string;
  countries?: string;
  stores?: string;
  nutriscoreGrade?: string;
  novaGroup?: number;
  quantity?: string;
  packaging?: string;
  labels?: string;
  source: "openfoodfacts" | "openbeautyfacts" | "openpetfoodfacts";
};

export type BoycottScanResult = {
  product: ProductInfo;
  boycottMatch: BoycottEntry | null;
  matchType: "direct" | "sub-brand" | "related" | "none";
  matchedOn?: string;
};

const API_SOURCES = [
  { base: "https://world.openfoodfacts.org/api/v2/product", source: "openfoodfacts" as const },
  { base: "https://world.openbeautyfacts.org/api/v2/product", source: "openbeautyfacts" as const },
  { base: "https://world.openpetfoodfacts.org/api/v2/product", source: "openpetfoodfacts" as const },
];

function extractProduct(data: any, source: ProductInfo["source"]): ProductInfo | null {
  const p = data?.product;
  if (!p) return null;

  return {
    barcode: p.code || "",
    name: p.product_name || p.product_name_en || "Unknown Product",
    brand: p.brands || "Unknown Brand",
    manufacturer: p.manufacturing_places || p.manufacturer || undefined,
    categories: p.categories || undefined,
    imageUrl: p.image_url || p.image_front_url || undefined,
    imageFrontUrl: p.image_front_url || p.image_front_small_url || undefined,
    ingredients: p.ingredients_text || p.ingredients_text_en || undefined,
    origins: p.origins || undefined,
    countries: p.countries || undefined,
    stores: p.stores || undefined,
    nutriscoreGrade: p.nutriscore_grade || undefined,
    novaGroup: p.nova_group || undefined,
    quantity: p.quantity || undefined,
    packaging: p.packaging || undefined,
    labels: p.labels || undefined,
    source,
  };
}

export async function lookupBarcode(barcode: string): Promise<ProductInfo | null> {
  for (const { base, source } of API_SOURCES) {
    try {
      const res = await fetch(`${base}/${barcode}.json`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status === 1) {
        const product = extractProduct(data, source);
        if (product) return product;
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Search products by name/keyword via Open Food Facts search API.
 * Returns an array of products found.
 */
export async function searchProductsByName(query: string): Promise<ProductInfo[]> {
  const results: ProductInfo[] = [];
  const queryLower = query.toLowerCase().trim();
  const searchApis = [
    { base: "https://world.openfoodfacts.org/api/v2/search", source: "openfoodfacts" as const },
    { base: "https://world.openbeautyfacts.org/api/v2/search", source: "openbeautyfacts" as const },
    { base: "https://world.openpetfoodfacts.org/api/v2/search", source: "openpetfoodfacts" as const },
  ];

  const fetches = searchApis.map(async ({ base, source }) => {
    try {
      const url = `${base}?search_terms=${encodeURIComponent(query)}&page_size=20&fields=code,product_name,product_name_en,brands,manufacturing_places,manufacturer,categories,image_url,image_front_url,image_front_small_url,ingredients_text,ingredients_text_en,origins,countries,stores,nutriscore_grade,nova_group,quantity,packaging,labels`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      const products = (data.products || [])
        .map((p: any) => extractProduct({ product: { ...p, code: p.code } }, source))
        .filter(Boolean) as ProductInfo[];
      // Filter to only include products that actually match the query in name or brand
      return products.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const brand = (p.brand || "").toLowerCase();
        const categories = (p.categories || "").toLowerCase();
        return name.includes(queryLower) || brand.includes(queryLower) || categories.includes(queryLower) || queryLower.includes(brand) || queryLower.includes(name);
      });
    } catch {
      return [];
    }
  });

  const allResults = await Promise.all(fetches);
  for (const batch of allResults) {
    results.push(...batch);
  }

  // Deduplicate by barcode
  const seen = new Set<string>();
  return results.filter((p) => {
    if (!p.barcode || seen.has(p.barcode)) return false;
    seen.add(p.barcode);
    return true;
  });
}

export function matchWithBoycott(product: ProductInfo): BoycottScanResult {
  const brandLower = product.brand.toLowerCase();
  const nameLower = product.name.toLowerCase();
  const manufacturerLower = (product.manufacturer || "").toLowerCase();

  // Check each term against the boycott directory
  const searchTerms = [
    product.brand,
    product.name,
    product.manufacturer || "",
    // Split brand by comma in case of multiple brands
    ...product.brand.split(",").map((b) => b.trim()),
  ].filter(Boolean);

  for (const entry of boycottDirectory) {
    const entryNameLower = entry.name.toLowerCase();

    // Direct brand match
    if (
      brandLower.includes(entryNameLower) ||
      entryNameLower.includes(brandLower) ||
      nameLower.includes(entryNameLower) ||
      manufacturerLower.includes(entryNameLower)
    ) {
      return { product, boycottMatch: entry, matchType: "direct", matchedOn: entry.name };
    }

    // Sub-brand match
    if (entry.subBrands) {
      for (const sb of entry.subBrands) {
        const sbName = (typeof sb === "string" ? sb : sb.name).toLowerCase();
        if (
          brandLower.includes(sbName) ||
          sbName.includes(brandLower) ||
          nameLower.includes(sbName)
        ) {
          return { product, boycottMatch: entry, matchType: "sub-brand", matchedOn: typeof sb === "string" ? sb : sb.name };
        }
      }
    }

    // Related company match
    if (entry.related) {
      for (const r of entry.related) {
        const rName = (typeof r === "string" ? r : r.name).toLowerCase();
        if (
          brandLower.includes(rName) ||
          rName.includes(brandLower) ||
          manufacturerLower.includes(rName)
        ) {
          return { product, boycottMatch: entry, matchType: "related", matchedOn: typeof r === "string" ? r : r.name };
        }
      }
    }
  }

  // Also try fuzzy search
  for (const term of searchTerms) {
    const results = searchBoycottDirectory(term);
    if (results.length > 0) {
      return { product, boycottMatch: results[0], matchType: "related", matchedOn: term };
    }
  }

  return { product, boycottMatch: null, matchType: "none" };
}
