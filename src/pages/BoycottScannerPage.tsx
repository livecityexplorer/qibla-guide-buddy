import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ScanLine, ShieldAlert, ShieldCheck, Search, Filter, ChevronDown, ExternalLink, ScanBarcode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { boycottDirectory, searchBoycottDirectory, getLevelConfig, type BoycottEntry, type BoycottLevel } from "@/data/boycottDirectory";

const categories = ["All", ...Array.from(new Set(boycottDirectory.map(e => e.category)))];
const levels: ("all" | BoycottLevel)[] = ["all", "very high", "high", "medium", "low"];

const BoycottScannerPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<BoycottEntry[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState<"all" | BoycottLevel>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleScan = () => {
    if (!query.trim()) return;
    setScanning(true);
    setResults(null);
    setTimeout(() => {
      const found = searchBoycottDirectory(query);
      setResults(found);
      setScanning(false);
    }, 800);
  };

  const browsableList = useMemo(() => {
    let list = boycottDirectory;
    if (selectedCategory !== "All") {
      list = list.filter(e => e.category === selectedCategory);
    }
    if (selectedLevel !== "all") {
      list = list.filter(e => e.level === selectedLevel);
    }
    return list;
  }, [selectedCategory, selectedLevel]);

  const displayList = results !== null ? results : browsableList;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 px-4 pb-8 pt-12">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-white/80">
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Boycott Scanner</h1>
        <p className="mt-1 text-sm text-white/70">Support Palestine 🇵🇸 — Check products & brands</p>
        <p className="mt-0.5 text-xs text-white/50">{boycottDirectory.length} brands tracked</p>
      </div>

      <div className="px-4 -mt-4 pb-24 space-y-4">
        {/* Search */}
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (!e.target.value.trim()) setResults(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="Search brand, product, or sub-brand..."
              className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={scanning || !query.trim()}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-red-700 to-red-900 py-3 font-medium text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {scanning ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <ScanLine size={18} />
                </motion.span>
                Checking...
              </span>
            ) : (
              "Check Product / Brand"
            )}
          </button>
        </div>

        {/* Search result status */}
        {results !== null && (
          <div className="text-center">
            {results.length === 0 ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
                <ShieldCheck size={32} className="mx-auto mb-2 text-emerald-500" />
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">Not Found on Boycott List</p>
                <p className="mt-1 text-xs text-muted-foreground">"{query}" was not found. Always verify with official BDS sources.</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Found <span className="font-semibold text-foreground">{results.length}</span> result{results.length !== 1 ? "s" : ""} for "{query}"
              </p>
            )}
          </div>
        )}

        {/* Filters (only in browse mode) */}
        {results === null && (
          <div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Filter size={14} />
              Filters
              <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Category</p>
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map(c => (
                          <button
                            key={c}
                            onClick={() => setSelectedCategory(c)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                              selectedCategory === c
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Risk Level</p>
                      <div className="flex flex-wrap gap-1.5">
                        {levels.map(l => (
                          <button
                            key={l}
                            onClick={() => setSelectedLevel(l)}
                            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${
                              selectedLevel === l
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {l === "all" ? "All Levels" : l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Brand List */}
        <div className="space-y-3">
          {displayList.map((entry) => {
            const config = getLevelConfig(entry.level);
            const isExpanded = expandedId === entry.id;
            const subBrandNames = entry.subBrands?.map(sb => typeof sb === "string" ? sb : sb.name) || [];
            const relatedNames = entry.related?.map(r => typeof r === "string" ? r : r.name) || [];

            return (
              <motion.div
                key={entry.id}
                layout
                className={`rounded-2xl border ${config.border} ${config.bg} overflow-hidden`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    {entry.logo ? (
                      <img
                        src={entry.logo}
                        alt={entry.name}
                        className="h-14 w-14 rounded-xl object-contain bg-white p-1.5 shadow-sm"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                        <ShieldAlert size={24} className={config.color} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{entry.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                        <span className="text-xs text-muted-foreground">· {entry.country}</span>
                      </div>
                    </div>
                    <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        <p className="text-sm leading-relaxed text-muted-foreground">{entry.reason}</p>

                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                            {entry.category}
                          </span>
                        </div>

                        {subBrandNames.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-1">Sub-brands ({subBrandNames.length})</p>
                            <div className="flex flex-wrap gap-1.5">
                              {subBrandNames.map(name => (
                                <span key={name} className="rounded-full border border-destructive/20 bg-destructive/5 px-2.5 py-0.5 text-[10px] font-medium text-destructive">
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {relatedNames.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-1">Related companies</p>
                            <div className="flex flex-wrap gap-1.5">
                              {relatedNames.map(name => (
                                <span key={name} className="rounded-full border border-muted-foreground/20 bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {entry.alternatives && entry.alternatives.length > 0 && (
                          <div className="rounded-lg bg-emerald-500/10 p-3">
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">💡 Alternatives</p>
                            <p className="mt-1 text-xs text-muted-foreground">{entry.alternatives.join(", ")}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Info */}
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3">🇵🇸 Why Boycott?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The BDS (Boycott, Divestment, Sanctions) movement works to end international support for apartheid 
            and oppression of Palestinians. By choosing where to spend your money, you can make a difference.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BoycottScannerPage;
