export type BoycottLevel = "very high" | "high" | "medium" | "low";

export type SubBrand = {
  name: string;
  logo?: string;
};

export type BoycottEntry = {
  id: string;
  name: string;
  category: string;
  reason: string;
  level: BoycottLevel;
  country: string;
  logo?: string;
  subBrands?: (SubBrand | string)[];
  related?: (SubBrand | string)[];
  alternatives?: string[];
};

export const boycottDirectory: BoycottEntry[] = [
  {
    id: "tech-1",
    name: "Apple",
    category: "Technology and Computers",
    reason: "Acquired several Israeli companies and conducts limited R&D activities in Israel focusing on semiconductor technologies. Apple matches worker donations to IDF and illegal settlements, employees allege although not confirmed.",
    level: "low",
    country: "United States",
    subBrands: [
      { name: "Beats Electronics" },
      { name: "Beddit" },
      { name: "FileMaker" },
      { name: "NextVR" },
      "Shazam",
      "Texture"
    ],
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1280px-Apple_logo_black.svg.png",
  },
  {
    id: "tech-2",
    name: "Cisco",
    category: "Technology and Computers",
    reason: "Through its fully owned Israeli subsidiaries, Cisco Systems has a broad base of complicity with Israel's occupation economy, predominantly through the provision of services to the Israeli military.",
    level: "high",
    country: "United States",
    related: ["AppDynamics", "Duo Security", "Jasper", "Meraki", "OpenDNS", "ThousandEyes", "Webex"],
    logo: "https://files.brandlogos.net/svg/WMXi7xYVyY/Cisco_Systems-Olb30StWU_brandlogos.net.svg",
  },
  {
    id: "tech-3",
    name: "Dell",
    category: "Technology and Computers",
    reason: "In 2023, Dell Technologies won the Israeli Ministry of Defense's server tender (USD 150 million) to provide servers and maintenance to the Israeli military. The Michael & Susan Dell Foundation provides direct support to Israel.",
    level: "high",
    country: "United States",
    related: [
      { name: "Alienware" },
      { name: "Boomi" },
      { name: "EMC" },
      { name: "EqualLogic" },
      { name: "RSA Security" },
      { name: "Secureworks" },
      { name: "VMware" }
    ],
    logo: "https://files.brandlogos.net/svg/MQGdjK3rZi/dell-logo-B8F74mUG_brandlogos.net.svg",
  },
  {
    id: "tech-4",
    name: "General Electric",
    category: "Technology and Computers",
    reason: "Provides wind turbines and maintenance services to two large wind energy projects in the occupied Syrian Golan, the largest renewable energy projects in Israel.",
    level: "medium",
    country: "United States",
    related: [
      { name: "Baker Hughes" },
      { name: "GE Aerospace" },
      { name: "GE Capital" },
      { name: "GE HealthCare" },
      { name: "GE Vernova" }
    ],
  },
  {
    id: "tech-5",
    name: "Google (Alphabet)",
    category: "Technology and Computers",
    reason: "Has R&D centers in Israel and acquired Israeli startups including Waze. In collaboration with Amazon, launched Project Nimbus in 2021 to provide cloud services to the Israeli government and military.",
    level: "medium",
    country: "United States",
    subBrands: [
      { name: "Android" },
      { name: "Chrome" },
      { name: "DeepMind" },
      { name: "Waymo" },
      { name: "YouTube" }
    ],
    alternatives: ["Firefox", "DuckDuckGo"],
    related: [
      { name: "AdMob" }, { name: "DoubleClick" }, { name: "Fitbit" },
      { name: "Kaggle" }, { name: "Looker" }, { name: "Mandiant" },
      { name: "Nest" }, { name: "Verily" }, { name: "Wing" }, { name: "X Development" }
    ],
    logo: "https://files.brandlogos.net/svg/4yu3BbTeAj/Google-OfwXGx0Sl_brandlogos.net.svg",
  },
  {
    id: "tech-6",
    name: "HP",
    category: "Technology and Computers",
    reason: "HP has R&D centers in Kiryat Gat. HP was the sole provider of Itanium servers for the Aviv System, Israel's Administration of Border Crossings, Population and Immigration.",
    level: "high",
    country: "United States",
    subBrands: ["Fitstation", "HP Wolf Security", "HyperX", "OMEN", "Z"],
    related: ["Aruba Networks", "Poly", "Teradici"],
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/640px-HP_logo_2012.svg.png",
  },
  {
    id: "tech-7",
    name: "IBM",
    category: "Technology and Computers",
    reason: "Has a strong R&D presence in Israel focusing on cloud, AI, and cybersecurity technologies and has acquired several Israeli tech companies.",
    level: "medium",
    country: "United States",
    related: ["Aspera", "Red Hat", "StepZen", "The Weather Company", "Trusteer"],
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/IBM_Logo_1956_1972.svg/640px-IBM_Logo_1956_1972.svg.png",
  },
  {
    id: "tech-8",
    name: "Intel",
    category: "Technology and Computers",
    reason: "Has multiple facilities in Israel and developed several chips at its Israeli R&D centers. In December 2023, Intel announced a $25 billion plan to construct a new chip factory in Israel.",
    level: "very high",
    country: "United States",
    alternatives: ["AMD"],
    related: ["Altera", "Habana Labs", "McAfee", "Mobileye", "Moovit", "Screenovate"],
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Intel_logo_%282006-2020%29.svg/640px-Intel_logo_%282006-2020%29.svg.png",
  },
  {
    id: "tech-9",
    name: "Micron",
    category: "Technology and Computers",
    reason: "One of Micron's factories is based in Kiryat Gat which is founded just west of the ruins of an old Palestinian village.",
    level: "medium",
    country: "United States",
    alternatives: ["TSMC or Samsung produced chips"],
    related: ["Ballistix", "Crucial", "Elpida Memory", "Inotera", "Lexar", "Numonyx"],
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Micron_Technology_logo.svg/640px-Micron_Technology_logo.svg.png",
  },
  {
    id: "tech-10",
    name: "Microsoft",
    category: "Technology and Computers",
    reason: "Acquired several Israeli startups and has a large R&D presence specializing in cybersecurity and AI. Close ties to the Israeli military. In 2023, expected to open the first Cloud Datacenter Region in Israel.",
    level: "medium",
    country: "United States",
    alternatives: ["Linux", "MacOS"],
    related: [
      "Activision Blizzard", "Bethesda Softworks", "GitHub", "LinkedIn",
      "Mojang", "Nuance Communications", "Skype", "Xbox"
    ],
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/640px-Microsoft_logo.svg.png",
  },
  {
    id: "tech-11",
    name: "NVIDIA",
    category: "Technology and Computers",
    reason: "Operations in Israel involve AI and deep learning. Acquired Israeli company Mellanox Technologies. Raised $10 million for Israeli charities and donated computers to evacuees.",
    level: "medium",
    country: "United States",
    alternatives: ["AMD"],
    related: ["3dfx Interactive", "Ageia", "Cumulus Networks", "Icera", "Mellanox Technologies", "Mental Images"],
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Nvidia_Logo.svg/640px-Nvidia_Logo.svg.png",
  },
  {
    id: "tech-12",
    name: "Oracle",
    category: "Technology and Computers",
    reason: "Acquired several Israeli companies and has a presence in Israel mainly through sales and support services.",
    level: "low",
    country: "United States",
    related: ["BEA Systems", "Cerner", "Hyperion", "NetSuite", "PeopleSoft", "Siebel Systems", "Sun Microsystems"],
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Oracle_Corporation_logo.svg/640px-Oracle_Corporation_logo.svg.png",
  },
  {
    id: "tech-13",
    name: "Qualcomm",
    category: "Technology and Computers",
    reason: "Qualcomm operates R&D facilities in Israel focusing on wireless communication technologies.",
    level: "low",
    country: "United States",
    alternatives: ["TSMC or Samsung produced chips"],
    related: ["Atheros", "Autotalks", "Cellwize", "CSR", "DesignArt Networks", "Snapdragon", "Wilocity"],
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Qualcomm-Logo.svg/640px-Qualcomm-Logo.svg.png",
  },
  {
    id: "tech-14",
    name: "Siemens",
    category: "Technology and Computers",
    reason: "Siemens traffic control systems documented on roads in the occupied West Bank where Palestinians are forbidden from travelling. Signed a USD 917 million contract with Israel Railways.",
    level: "high",
    country: "Germany",
    related: ["Mendix", "Mentor Graphics", "Siemens Energy", "Siemens Healthineers", "Siemens Mobility", "Varian Medical Systems"],
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Siemens-logo.svg/640px-Siemens-logo.svg.png",
  },
  {
    id: "food-1",
    name: "Achva",
    category: "Food and Beverages",
    reason: "An Israeli food company specializing in tahini, halva, and other similar products. Products distributed domestically and internationally.",
    level: "medium",
    country: "Israel",
    subBrands: [
      { name: "Achva Baked Goods" },
      { name: "Achva Halva" },
      { name: "Achva Tahini" }
    ],
  },
  {
    id: "food-2",
    name: "Carrefour",
    category: "Food and Beverages",
    reason: "In 2022, unveiled a franchise agreement in Israel, partnering with Electra Consumer Products and Yenot Bitan, entities engaged in activities within Israeli settlements.",
    level: "high",
    country: "France",
    subBrands: [
      { name: "Atacadão" }, { name: "Bio c' Bon" }, { name: "Carrefour Bio" },
      { name: "Carrefour City" }, { name: "Carrefour Express" },
      { name: "Carrefour Market" }, { name: "Promocash" }, { name: "So.bio" }, { name: "Supeco" }
    ],
    related: [{ name: "Electra Consumer Products" }, { name: "Yenot Bitan" }],
    logo: "https://upload.wikimedia.org/wikipedia/fr/thumb/3/3b/Logo_Carrefour.svg/1280px-Logo_Carrefour.svg.png",
  },
  {
    id: "food-3",
    name: "Coca-Cola",
    category: "Food and Beverages",
    reason: "The Central Beverage Company (Coca-Cola Israel) is a private Israeli manufacturer and distributor. The company is the exclusive franchisee of The Coca-Cola Company in Israel.",
    level: "high",
    country: "Israel",
    subBrands: [
      { name: "Coca Cola" }, { name: "Dasani" }, { name: "Fanta" }, { name: "FUZE tea" },
      { name: "Minute Maid" }, { name: "Powerade" }, { name: "Sprite" },
      { name: "Appletiser" }, { name: "Costa Coffee" }, { name: "Fairlife" },
      { name: "Innocent Drinks" }, { name: "Schweppes" }, { name: "Smartwater" }, { name: "Vitaminwater" }
    ],
    alternatives: ["Local soft drinks"],
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Coca-Cola_logo.svg/3840px-Coca-Cola_logo.svg.png",
  },
  {
    id: "food-4",
    name: "Elite",
    category: "Food and Beverages",
    reason: "Part of the Strauss Group, Elite has a significant presence in confectionery, chocolate, and coffee market in Israel.",
    level: "medium",
    country: "Israel",
    subBrands: [
      "Cow Chocolate", "Elite Coffee", "Energy", "Kif Kef", "Megadim",
      "Mekupelet", "Must", "Pesek Zman", "Splendid", "Taami", "Tortit", "Twist"
    ],
    related: ["Strauss Group"],
  },
  {
    id: "food-5",
    name: "McDonald's",
    category: "Food and Beverages",
    reason: "Has multiple restaurants in Israel. Provided free meals to Israeli troops amid war with Hamas. One of their largest investors donates large amounts to causes in Israel.",
    level: "low",
    country: "United States",
    subBrands: [
      { name: "Happy Meal" }, { name: "McCafé" }, { name: "McDelivery" },
      { name: "McFlurry" }, { name: "McNuggets" }
    ],
    related: [
      { name: "Alonyal Limited" }, { name: "Boston Market" },
      { name: "Chipotle Mexican Grill" }, { name: "Donatos Pizza" }, { name: "Pret A Manger" }
    ],
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/McDonald%27s_logo.svg/1280px-McDonald%27s_logo.svg.png",
  },
  {
    id: "food-6",
    name: "Nestlé",
    category: "Food and Beverages",
    reason: "Has a presence in Israel through its investment in Osem, a major Israeli food producer, connecting Nestlé to various local industries and markets.",
    level: "high",
    country: "Switzerland",
    subBrands: [
      { name: "Aero" }, { name: "Carnation" }, { name: "Cerelac" }, { name: "Cheerios" },
      { name: "Coffee-Mate" }, { name: "Cookie Crisp" }, { name: "Crunch" },
      { name: "Dreyer's" }, { name: "Fancy Feast" }, { name: "Felix" },
      { name: "Friskies" }, { name: "Gerber" }, { name: "Häagen-Dazs" },
      { name: "Hot Pockets" }, { name: "Kit Kat" }, { name: "Lean Cuisine" },
      { name: "Maggi" }, { name: "Milo" }, { name: "Nescafé" }, { name: "Nespresso" },
      { name: "Nesquik" }, { name: "Nestea" }, { name: "NIDO" },
      { name: "Perrier" }, { name: "Poland Spring" }, { name: "Purina" },
      { name: "Quality Street" }, { name: "S.Pellegrino" }, { name: "Smarties" },
      { name: "Stouffer's" }, { name: "Toll House" }
    ],
    alternatives: ["Local and ethical food brands"],
    related: [{ name: "L'Oréal" }, { name: "Osem" }, { name: "Tivall" }],
    logo: "https://cdn.worldvectorlogo.com/logos/nestle-4.svg",
  },
  {
    id: "food-7",
    name: "Osem",
    category: "Food and Beverages",
    reason: "A subsidiary of Nestlé headquartered in Israel. Produces a wide range of food products consumed domestically and internationally.",
    level: "medium",
    country: "Israel",
    subBrands: ["Bamba", "Beit Hashita", "Bissli", "Mana", "Manna", "Of Tov", "Shkedei Marak", "Tivall", "Vitashea"],
    related: ["Nestlé", "Sabra"],
  },
  {
    id: "food-8",
    name: "PepsiCo",
    category: "Food and Beverages",
    reason: "In 2018, acquired SodaStream (Israel-based) for US$3.2 billion. Also has a joint venture with Sabra.",
    level: "medium",
    country: "United States",
    subBrands: [
      { name: "7 Up" }, { name: "Aquafina" }, { name: "Cheetos" }, { name: "Doritos" },
      { name: "Fritos" }, { name: "Gatorade" }, { name: "Lay's" }, { name: "Mirinda" },
      { name: "Mountain Dew" }, { name: "Naked Juice" }, { name: "Pepsi" },
      { name: "Quaker Oats" }, { name: "Rockstar Energy" }, { name: "Ruffles" },
      { name: "SodaStream" }, { name: "Tostitos" }, { name: "Tropicana" }, { name: "Walkers" },
      { name: "Bubly" }, { name: "Captain Crunch" }, { name: "Cracker Jack" },
      { name: "Diet Pepsi" }, { name: "Funyuns" }, { name: "Mug Root Beer" },
      { name: "PopCorners" }, { name: "Rice-A-Roni" }, { name: "Smartfood" },
      { name: "SunChips" }, { name: "Stacy's" }
    ],
    alternatives: ["Local soft drinks"],
    related: [{ name: "PepsiCo" }, { name: "Sabra" }, "SodaStream"],
    logo: "https://download.logo.wine/logo/PepsiCo/PepsiCo-Logo.wine.png",
  },
  {
    id: "food-9",
    name: "Prigat",
    category: "Food and Beverages",
    reason: "Produces juice products, owned by Gan Shmuel Foods. Operations based in Israel with exports to various countries.",
    level: "medium",
    country: "Israel",
    subBrands: [{ name: "Prigat Clear" }, { name: "Prigat Mix" }, { name: "Prigat Squeeze" }],
    related: [{ name: "Central Bottling Company" }, { name: "Gan Shmuel Foods" }, { name: "Ocean Spray" }],
  },
  {
    id: "food-10",
    name: "Sabra",
    category: "Food and Beverages",
    reason: "Partially owned by Strauss Group, an Israeli corporation. Supporting Sabra indirectly contributes due to Strauss Group's reported support for the Israeli Defense Forces.",
    level: "high",
    country: "Israel",
    subBrands: [{ name: "Sabra Guacamole" }, { name: "Sabra Hummus" }, { name: "Sabra Salsa" }],
    related: [{ name: "Obela" }, { name: "PepsiCo" }, { name: "Strauss Group" }],
  },
  {
    id: "food-11",
    name: "SodaStream",
    category: "Food and Beverages",
    reason: "An Israeli manufacturing company for carbonated water devices. Acquired by PepsiCo but primary operations remain in Israel in disputed territories.",
    level: "high",
    country: "Israel",
    subBrands: ["SodaStream Art", "SodaStream Crystal", "SodaStream Duo", "SodaStream Flavors", "SodaStream Spirit", "SodaStream Terra"],
    related: ["Carbonating Cylinders", "Flavor Concentrates", { name: "PepsiCo" }, "Soda-Club"],
  },
  {
    id: "food-12",
    name: "Starbucks",
    category: "Food and Beverages",
    reason: "Howard Shultz, largest private owner of Starbucks shares, is a staunch zionist who invests heavily in Israel's economy including a $1.7 Billion investment in cybersecurity startup Wiz.",
    level: "medium",
    country: "United States",
    subBrands: [
      "Ethos Water", "Evolution Fresh", "Frappuccino", "Princi",
      "Seattle's Best Coffee", "Siren Retail", "Starbucks Reserve", "Teavana", "Torrefazione Italia"
    ],
    logo: "https://upload.wikimedia.org/wikipedia/sco/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/500px-Starbucks_Corporation_Logo_2011.svg.png",
  },
  {
    id: "food-13",
    name: "Strauss Group",
    category: "Food and Beverages",
    reason: "An Israeli multinational food company, significant in dairy products and snacks, with partnerships across Israel and globally.",
    level: "high",
    country: "Israel",
    subBrands: [
      "Achla", "B&D", "BeanZ", "Cafe Joe", "Cow Chocolate", "Elite", "Elite Coffee",
      "Energy", "Kif Kef", "Max Brenner", "Megadim", "Mekupelet", "Milki", "Must",
      { name: "Obela" }, "Pesek Zman", { name: "Sabra" }, "Ski", "Splendid",
      "Strauss Water", "Symphony", "Taami", "Tami 4", "Tapuchips", "Tortit", "Twist",
      "Virgin Water", "Yad Mordechai", "Yotvata"
    ],
    related: ["Danone", { name: "PepsiCo" }, "Sabra Dipping Company"],
  },
  {
    id: "food-14",
    name: "Tara",
    category: "Food and Beverages",
    reason: "A dairy company with significant presence in the Israeli market. Purchased by Coca Cola in 1997.",
    level: "medium",
    country: "Israel",
    subBrands: ["Gvinat HaEmek", "Meshek Zuriel Dairy", "Muller (Israel)", "Noam", "Tara Dairy"],
    related: [{ name: "Central Bottling Company" }],
  },
];

// Build a search index for fast lookups across names, sub-brands, and related companies
export function searchBoycottDirectory(query: string): BoycottEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: { entry: BoycottEntry; score: number }[] = [];

  for (const entry of boycottDirectory) {
    let score = 0;

    // Exact name match
    const nameLower = entry.name.toLowerCase();
    if (nameLower === q) {
      score = 100;
    } else if (nameLower.includes(q) || q.includes(nameLower)) {
      score = 80;
    }

    // Search sub-brands
    if (score === 0 && entry.subBrands) {
      for (const sb of entry.subBrands) {
        const sbName = (typeof sb === "string" ? sb : sb.name).toLowerCase();
        if (sbName === q) { score = 70; break; }
        if (sbName.includes(q) || q.includes(sbName)) { score = 60; break; }
      }
    }

    // Search related
    if (score === 0 && entry.related) {
      for (const r of entry.related) {
        const rName = (typeof r === "string" ? r : r.name).toLowerCase();
        if (rName === q) { score = 50; break; }
        if (rName.includes(q) || q.includes(rName)) { score = 40; break; }
      }
    }

    // Search category
    if (score === 0 && entry.category.toLowerCase().includes(q)) {
      score = 20;
    }

    if (score > 0) {
      results.push({ entry, score });
    }
  }

  return results.sort((a, b) => b.score - a.score).map(r => r.entry);
}

export function getLevelConfig(level: BoycottLevel) {
  switch (level) {
    case "very high":
      return { label: "⛔ Very High Risk", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
    case "high":
      return { label: "🔴 High Risk", color: "text-red-500 dark:text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
    case "medium":
      return { label: "🟠 Medium Risk", color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" };
    case "low":
      return { label: "🟡 Low Risk", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" };
  }
}
