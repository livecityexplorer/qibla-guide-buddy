import boycottDirectoryRtf from "./boycottDirectorySource.rtf?raw";

export type BoycottLevel = "very high" | "high" | "medium" | "low";

export type SubBrand = {
  name: string;
  logo?: string;
};

type BrandRef = SubBrand | string;

export type BoycottEntry = {
  id: string;
  name: string;
  category: string;
  reason: string;
  level: BoycottLevel;
  country: string;
  logo?: string;
  icon?: string;
  subBrands?: BrandRef[];
  related?: BrandRef[];
  alternatives?: string[];
};

type UnknownRecord = Record<string, unknown>;

const CP1252_MAP: Record<number, string> = {
  0x80: "€",
  0x82: "‚",
  0x83: "ƒ",
  0x84: "„",
  0x85: "…",
  0x86: "†",
  0x87: "‡",
  0x88: "ˆ",
  0x89: "‰",
  0x8a: "Š",
  0x8b: "‹",
  0x8c: "Œ",
  0x8e: "Ž",
  0x91: "‘",
  0x92: "’",
  0x93: "“",
  0x94: "”",
  0x95: "•",
  0x96: "–",
  0x97: "—",
  0x98: "˜",
  0x99: "™",
  0x9a: "š",
  0x9b: "›",
  0x9c: "œ",
  0x9e: "ž",
  0x9f: "Ÿ",
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const parseLevel = (value: unknown): BoycottLevel => {
  const normalized = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (normalized === "very high" || normalized === "high" || normalized === "medium" || normalized === "low") {
    return normalized;
  }
  return "medium";
};

const toStringOrEmpty = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const decodeRtfHexEscapes = (input: string): string =>
  input.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex: string) => {
    const code = Number.parseInt(hex, 16);
    return CP1252_MAP[code] ?? String.fromCharCode(code);
  });

const extractJsonFromRtf = (rtf: string): string => {
  const start = rtf.indexOf("[");
  const end = rtf.lastIndexOf("]");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON array found in uploaded RTF file.");
  }

  return decodeRtfHexEscapes(rtf.slice(start, end + 1))
    .replace(/\\\r?\n/g, "\n")
    .replace(/\\([{}\\])/g, "$1")
    .trim();
};

const normalizeBrandRef = (value: unknown): BrandRef | null => {
  if (typeof value === "string") {
    const name = value.trim();
    return name ? name : null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const name = toStringOrEmpty(value.name);
  if (!name) {
    return null;
  }

  const logo = toStringOrEmpty(value.logo);
  return logo ? { name, logo } : { name };
};

const normalizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
};

const normalizeBrandRefArray = (value: unknown): BrandRef[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.map(normalizeBrandRef).filter((item): item is BrandRef => item !== null);
  return items.length > 0 ? items : undefined;
};

const normalizeEntry = (value: unknown): BoycottEntry | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = toStringOrEmpty(value.id);
  const name = toStringOrEmpty(value.name);
  const category = toStringOrEmpty(value.category);
  const reason = toStringOrEmpty(value.reason);
  const country = toStringOrEmpty(value.country);

  if (!id || !name || !category || !reason || !country) {
    return null;
  }

  const logo = toStringOrEmpty(value.logo);
  const icon = toStringOrEmpty(value.icon);

  return {
    id,
    name,
    category,
    reason,
    level: parseLevel(value.level),
    country,
    logo: logo || undefined,
    icon: icon || undefined,
    subBrands: normalizeBrandRefArray(value.subBrands),
    related: normalizeBrandRefArray(value.related),
    alternatives: normalizeStringArray(value.alternatives),
  };
};

const parseBoycottDirectory = (rtf: string): BoycottEntry[] => {
  try {
    const rawJson = extractJsonFromRtf(rtf);
    const parsed = JSON.parse(rawJson) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    const uniqueById = new Map<string, BoycottEntry>();

    for (const entry of parsed.map(normalizeEntry)) {
      if (entry && !uniqueById.has(entry.id)) {
        uniqueById.set(entry.id, entry);
      }
    }

    return Array.from(uniqueById.values());
  } catch (error) {
    console.error("Failed to parse boycott directory from uploaded file", error);
    return [];
  }
};

export const boycottDirectory: BoycottEntry[] = parseBoycottDirectory(boycottDirectoryRtf);

// Build a search index for fast lookups across names, sub-brands, and related companies
export function searchBoycottDirectory(query: string): BoycottEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: { entry: BoycottEntry; score: number }[] = [];

  for (const entry of boycottDirectory) {
    let score = 0;

    const nameLower = entry.name.toLowerCase();
    if (nameLower === q) {
      score = 100;
    } else if (nameLower.includes(q) || q.includes(nameLower)) {
      score = 80;
    }

    if (score === 0 && entry.subBrands) {
      for (const sb of entry.subBrands) {
        const sbName = (typeof sb === "string" ? sb : sb.name).toLowerCase();
        if (sbName === q) {
          score = 70;
          break;
        }
        if (sbName.includes(q) || q.includes(sbName)) {
          score = 60;
          break;
        }
      }
    }

    if (score === 0 && entry.related) {
      for (const r of entry.related) {
        const rName = (typeof r === "string" ? r : r.name).toLowerCase();
        if (rName === q) {
          score = 50;
          break;
        }
        if (rName.includes(q) || q.includes(rName)) {
          score = 40;
          break;
        }
      }
    }

    if (score === 0 && entry.category.toLowerCase().includes(q)) {
      score = 20;
    }

    if (score > 0) {
      results.push({ entry, score });
    }
  }

  return results.sort((a, b) => b.score - a.score).map((result) => result.entry);
}

export function getLevelConfig(level: BoycottLevel) {
  switch (level) {
    case "very high":
      return {
        label: "⛔ Very High Risk",
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
      };
    case "high":
      return {
        label: "🔴 High Risk",
        color: "text-red-500 dark:text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
      };
    case "medium":
      return {
        label: "🟠 Medium Risk",
        color: "text-orange-500 dark:text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
      };
    case "low":
      return {
        label: "🟡 Low Risk",
        color: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
      };
  }
}
