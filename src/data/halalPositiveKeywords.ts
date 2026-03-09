export type HalalPositiveRuleId =
  | "honey"
  | "water"
  | "salt"
  | "sugar"
  | "rice"
  | "olive_oil"
  | "tea"
  | "coffee"
  | "dates";

export type HalalPositiveRule = {
  id: HalalPositiveRuleId;
  label: string;
  /**
   * Keywords across languages/scripts. Matching is case-insensitive and diacritics-insensitive.
   * Keep keywords as common “product-name” forms (not ingredients).
   */
  keywords: string[];
};

// NOTE: These rules are only applied when ingredient data is missing/weak.
export const HALAL_POSITIVE_RULES: HalalPositiveRule[] = [
  {
    id: "honey",
    label: "Honey",
    keywords: [
      // English
      "honey",
      "raw honey",
      // French / Spanish / Portuguese / Italian / Catalan / Romanian
      "miel",
      "miel de",
      "mel",
      "miele",
      "mel de",
      "miere",
      // German / Dutch
      "honig",
      "honing",
      // Nordic
      "honning", // da/no
      "hunaja", // fi
      "hunang", // is
      // Slavic
      "мёд",
      "мед",
      "мiód",
      "med", // cs/sk/sl/bs/hr/sr (latin)
      "мед", // bg/mk (cyrillic)
      "медо", // common stem
      "медов",
      "medus", // lt
      "medus", // lv
      // Greek
      "μέλι",
      "μελι",
      // Turkish / Azerbaijani
      "bal",
      // Arabic / Persian / Urdu
      "عسل",
      "شهد", // sometimes used for honey in Arabic
      "اسل", // common transliteration variations
      "عَسَل",
      "عسل النحل",
      "عسل طبيعي",
      "عسل خام",
      "عسل الزهور",
      "عسل الأزهار",
      "عسل سدر",
      "عسل مانوكا",
      "عسل مانوكا",
      "عسل", // dup ok
      "عسل", // keep
      "عسل", // keep
      "عسل", // keep
      "شہد", // Urdu
      "عسل", // Persian/Arabic overlap
      "عسل", // keep
      "عسل", // keep
      // Hebrew
      "דבש",
      // South & SE Asia
      "madu", // id/ms
      "mật ong", // vi
      "น้ำผึ้ง", // th
      "madu lebah", // id/ms
      "মধু", // bn
      "मधु", // hi
      "मध", // mr/ne
      "தேன்", // ta
      "తేనె", // te
      "ಜೇನು", // kn
      "തേൻ", // ml
      "මී පැණි", // si
      "ပျားရည်", // my
      "ទឹកឃ្មុំ", // km
      "້ນໍ້າເຜິ້ງ", // lo
      // East Asia
      "蜂蜜", // zh
      "はちみつ", // ja
      "ハチミツ", // ja katakana
      "꿀", // ko
      // Africa
      "zuma", // hausa (honey)
      "malab", // so (honey)
      "የማር", // am (honey)
    ],
  },
  {
    id: "water",
    label: "Water",
    keywords: [
      "water",
      "mineral water",
      "spring water",
      "eau",
      "agua",
      "acqua",
      "wasser",
      "agua mineral",
      "eau minérale",
      "ماء",
      "آب",
      "su",
      "вода",
      "水",
      "お水",
      "물",
    ],
  },
  {
    id: "salt",
    label: "Salt",
    keywords: [
      "salt",
      "sea salt",
      "sel",
      "sal",
      "sale",
      "salz",
      "sól",
      "tuz",
      "ملح",
      "نمک",
      "盐",
      "塩",
      "소금",
      "соль",
    ],
  },
  {
    id: "sugar",
    label: "Sugar",
    keywords: [
      "sugar",
      "granulated sugar",
      "sucre",
      "azúcar",
      "acucar",
      "açúcar",
      "zucchero",
      "zucker",
      "cukier",
      "şeker",
      "سكر",
      "شکر",
      "糖",
      "砂糖",
      "설탕",
      "сахар",
    ],
  },
  {
    id: "rice",
    label: "Rice",
    keywords: [
      "rice",
      "riz",
      "arroz",
      "riso",
      "reis",
      "ryż",
      "pirinç",
      "رز",
      "برنج",
      "米",
      "ご飯",
      "쌀",
      "рис",
    ],
  },
  {
    id: "olive_oil",
    label: "Olive oil",
    keywords: [
      "olive oil",
      "huile d'olive",
      "huile dolive",
      "aceite de oliva",
      "aceite de olivo",
      "azeite",
      "olio d'oliva",
      "olivenöl",
      "olijfolie",
      "zeytinyağı",
      "زيت زيتون",
      "روغن زیتون",
      "橄榄油",
      "オリーブオイル",
      "올리브유",
      "оливковое масло",
    ],
  },
  {
    id: "tea",
    label: "Tea",
    keywords: [
      "tea",
      "black tea",
      "green tea",
      "thé",
      "té",
      "cha",
      "chai",
      "çay",
      "شاي",
      "چای",
      "茶",
      "お茶",
      "차",
      "чай",
    ],
  },
  {
    id: "coffee",
    label: "Coffee",
    keywords: [
      "coffee",
      "café",
      "cafe",
      "caffè",
      "kaffee",
      "koffie",
      "kahve",
      "قهوة",
      "قهوه",
      "咖啡",
      "コーヒー",
      "커피",
      "кофе",
    ],
  },
  {
    id: "dates",
    label: "Dates",
    keywords: [
      "dates",
      "date",
      "dattes",
      "dátil",
      "dátiles",
      "datteri",
      "datteln",
      "kurma",
      "khajoor",
      "تمر",
      "خرما",
      "枣",
      "红枣",
      "ナツメヤシ",
      "대추야자",
      "финики",
    ],
  },
];
