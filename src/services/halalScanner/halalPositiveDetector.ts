import { HALAL_POSITIVE_RULES, type HalalPositiveRule } from "@/data/halalPositiveKeywords";

export type NaturallyHalalMatch = {
  id: HalalPositiveRule["id"];
  label: string;
  matchedKeyword: string;
};

function normalizeForMatch(input: string): string {
  // Lowercase + remove diacritics (safe fallback for environments without Unicode property escapes)
  return (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAsciiWordLike(keyword: string): boolean {
  return /^[a-z0-9][a-z0-9\s-]*$/i.test(keyword);
}

function matchesKeyword(text: string, keyword: string): boolean {
  const t = normalizeForMatch(text);
  const k = normalizeForMatch(keyword).trim();
  if (!k) return false;

  // For simple latin/number keywords: use word boundaries to reduce false positives.
  if (isAsciiWordLike(k)) {
    const re = new RegExp(`\\b${escapeRegExp(k)}\\b`, "i");
    return re.test(t);
  }

  // For non-latin scripts: fallback to substring match.
  return t.includes(k);
}

export function detectNaturallyHalalProduct(name: string, categories: string[]): NaturallyHalalMatch | null {
  const combined = `${name || ""} ${(categories || []).join(" ")}`;

  for (const rule of HALAL_POSITIVE_RULES) {
    for (const kw of rule.keywords) {
      if (matchesKeyword(combined, kw)) {
        return { id: rule.id, label: rule.label, matchedKeyword: kw };
      }
    }
  }

  return null;
}
