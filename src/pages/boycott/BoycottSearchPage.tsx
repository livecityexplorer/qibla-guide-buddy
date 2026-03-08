import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, Clipboard, Loader2, ShieldAlert, ShieldCheck,
  Package, Factory, MapPin, Tag, Leaf, ChevronDown, ScanLine, Hash
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  lookupBarcode, searchProductsByName, matchWithBoycott,
  type BoycottScanResult, type ProductInfo
} from "@/services/boycottScanService";
import { getLevelConfig } from "@/data/boycottDirectory";

const BoycottSearchPage = () => {
  const navigate = useNavigate();
  const [searchMode, setSearchMode] = useState<"name" | "barcode">("name");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<BoycottScanResult | null>(null);
  const [multiResults, setMultiResults] = useState<BoycottScanResult[] | null>(null);
  const [error, setError] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setSingleResult(null);
    setMultiResults(null);
    setError("");
    setQuery("");
    setExpandedIdx(null);
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSingleResult(null);
    setMultiResults(null);
    setExpandedIdx(null);

    try {
      if (searchMode === "barcode") {
        const product = await lookupBarcode(query.trim());
        if (product) {
          setSingleResult(matchWithBoycott(product));
        } else {
          setError("Product not found. Try a different barcode or search by name.");
        }
      } else {
        const products = await searchProductsByName(query.trim());
        if (products.length > 0) {
          const results = products.map(p => matchWithBoycott(p));
          setMultiResults(results);
        } else {
          setError("No products found. Try different keywords or search by barcode.");
        }
      }
    } catch {
      setError("Search failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [query, searchMode]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setQuery(text.trim());
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-900 via-pink-800 to-red-900 px-4 pb-8 pt-12">
        <button onClick={() => navigate("/boycott")} className="mb-4 flex items-center gap-2 text-white/80">
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Search Product</h1>
        <p className="mt-1 text-sm text-white/70">Search by product name or enter a barcode number</p>
      </div>

      <div className="px-4 -mt-4 pb-24 space-y-4">
        {/* Mode Toggle */}
        <div className="flex rounded-xl bg-card border border-border overflow-hidden shadow-sm">
          <button
            onClick={() => { setSearchMode("name"); reset(); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              searchMode === "name" ? "bg-gradient-to-r from-rose-700 to-pink-800 text-white" : "text-muted-foreground"
            }`}
          >
            <Search size={16} className="inline mr-1" /> By Name
          </button>
          <button
            onClick={() => { setSearchMode("barcode"); reset(); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              searchMode === "barcode" ? "bg-gradient-to-r from-rose-700 to-pink-800 text-white" : "text-muted-foreground"
            }`}
          >
            <Hash size={16} className="inline mr-1" /> By Barcode
          </button>
        </div>

        {/* Search Input */}
        {!singleResult && !multiResults && !loading && (
          <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                inputMode={searchMode === "barcode" ? "numeric" : "text"}
                placeholder={searchMode === "name" ? "e.g. Coca-Cola, Oreo, Nescafé..." : "Enter barcode number..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
              {searchMode === "barcode" && (
                <button onClick={handlePaste} className="rounded-xl border border-border p-3 text-muted-foreground hover:text-foreground" title="Paste">
                  <Clipboard size={18} />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-rose-700 to-pink-800 py-3 font-medium text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {searchMode === "name" ? "Search Products" : "Look Up Barcode"}
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-card p-8 border border-border text-center">
            <Loader2 size={40} className="mx-auto animate-spin text-rose-600" />
            <p className="mt-4 font-medium text-foreground">
              {searchMode === "name" ? "Searching global databases..." : "Looking up product..."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Open Food Facts, Beauty Facts & Pet Food Facts</p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-destructive/10 border border-destructive/30 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={reset} className="mt-2 text-xs font-medium text-primary">Try again →</button>
          </motion.div>
        )}

        {/* Single Result (barcode) */}
        <AnimatePresence>
          {singleResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <ResultCard result={singleResult} defaultExpanded />
              <button onClick={reset} className="w-full rounded-xl bg-gradient-to-r from-rose-700 to-pink-800 py-3 font-medium text-white shadow-md active:scale-95">
                Search Another
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Multi Results (name search) */}
        <AnimatePresence>
          {multiResults && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found <span className="font-semibold text-foreground">{multiResults.length}</span> product{multiResults.length !== 1 ? "s" : ""}
                </p>
                <button onClick={reset} className="text-xs font-medium text-primary">New search →</button>
              </div>

              {multiResults.map((r, i) => (
                <ResultCard
                  key={`${r.product.barcode}-${i}`}
                  result={r}
                  defaultExpanded={expandedIdx === i}
                  onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  compact
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sample barcodes for barcode mode */}
        {!singleResult && !multiResults && !loading && searchMode === "barcode" && (
          <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Try These Barcodes</h3>
            <div className="space-y-2">
              {[
                { code: "5449000000996", label: "Coca-Cola" },
                { code: "7622210449283", label: "Oreo Cookies" },
                { code: "5000159484695", label: "Cadbury Dairy Milk" },
                { code: "3017620422003", label: "Nutella" },
                { code: "5000112637922", label: "Nescafé" },
              ].map((s) => (
                <button
                  key={s.code}
                  onClick={() => { setQuery(s.code); }}
                  className="w-full flex items-center justify-between rounded-lg bg-muted p-3 text-left active:scale-[0.98] transition-transform"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.code}</p>
                  </div>
                  <ScanLine size={16} className="text-rose-600" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sample names for name mode */}
        {!singleResult && !multiResults && !loading && searchMode === "name" && (
          <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Try These Searches</h3>
            <div className="flex flex-wrap gap-2">
              {["Coca-Cola", "Nestlé", "Pepsi", "Oreo", "Starbucks", "Danone", "L'Oréal", "Maggi"].map((name) => (
                <button
                  key={name}
                  onClick={() => setQuery(name)}
                  className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground active:scale-95 transition-transform"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Result Card ── */
const ResultCard = ({
  result, defaultExpanded = false, onToggle, compact = false
}: {
  result: BoycottScanResult;
  defaultExpanded?: boolean;
  onToggle?: () => void;
  compact?: boolean;
}) => {
  const [showDetails, setShowDetails] = useState(defaultExpanded);

  const toggleDetails = () => {
    if (onToggle) onToggle();
    else setShowDetails(!showDetails);
  };

  const isExpanded = onToggle ? defaultExpanded : showDetails;

  return (
    <div className="space-y-3">
      {/* Boycott Status */}
      {result.boycottMatch ? (
        <div className={`rounded-2xl border ${getLevelConfig(result.boycottMatch.level).border} ${getLevelConfig(result.boycottMatch.level).bg} p-4`}>
          <div className="flex items-center gap-3">
            <ShieldAlert size={28} className={getLevelConfig(result.boycottMatch.level).color} />
            <div>
              <p className={`text-base font-bold ${getLevelConfig(result.boycottMatch.level).color}`}>⛔ ON BOYCOTT LIST</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {result.matchType === "direct" && `Direct match: ${result.matchedOn}`}
                {result.matchType === "sub-brand" && `Sub-brand of: ${result.boycottMatch.name}`}
                {result.matchType === "related" && `Related to: ${result.boycottMatch.name}`}
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${getLevelConfig(result.boycottMatch.level).color}`}>
                {getLevelConfig(result.boycottMatch.level).label}
              </span>
              <span className="text-xs text-muted-foreground">· {result.boycottMatch.country}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                {result.boycottMatch.category}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.boycottMatch.reason}</p>
            {result.boycottMatch.alternatives && result.boycottMatch.alternatives.length > 0 && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 mt-2">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">💡 Alternatives</p>
                <p className="mt-1 text-xs text-muted-foreground">{result.boycottMatch.alternatives.join(", ")}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
          <ShieldCheck size={32} className="mx-auto mb-1 text-emerald-500" />
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">Not on Boycott List ✅</p>
          <p className="mt-1 text-xs text-muted-foreground">Always verify with official BDS sources.</p>
        </div>
      )}

      {/* Product Info */}
      <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
        <div className="flex gap-3">
          {result.product.imageUrl ? (
            <img src={result.product.imageUrl} alt={result.product.name} className="h-20 w-20 rounded-xl object-contain bg-white p-1 shadow-sm" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted">
              <Package size={28} className="text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-foreground leading-tight">{result.product.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{result.product.brand}</p>
            {result.product.quantity && <p className="text-xs text-muted-foreground">{result.product.quantity}</p>}
            <div className="flex items-center gap-2 mt-1.5">
              {result.product.nutriscoreGrade && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  result.product.nutriscoreGrade === "a" ? "bg-emerald-500/20 text-emerald-600" :
                  result.product.nutriscoreGrade === "b" ? "bg-green-500/20 text-green-600" :
                  result.product.nutriscoreGrade === "c" ? "bg-yellow-500/20 text-yellow-600" :
                  result.product.nutriscoreGrade === "d" ? "bg-orange-500/20 text-orange-600" :
                  "bg-red-500/20 text-red-600"
                }`}>Nutri-Score {result.product.nutriscoreGrade.toUpperCase()}</span>
              )}
              {result.product.novaGroup && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  NOVA {result.product.novaGroup}
                </span>
              )}
            </div>
          </div>
        </div>

        <button onClick={toggleDetails} className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-primary">
          {isExpanded ? "Hide" : "Show"} details
          <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                {result.product.manufacturer && <DetailRow icon={Factory} label="Manufacturer" value={result.product.manufacturer} />}
                {result.product.categories && <DetailRow icon={Tag} label="Categories" value={result.product.categories} />}
                {result.product.origins && <DetailRow icon={MapPin} label="Origins" value={result.product.origins} />}
                {result.product.countries && <DetailRow icon={MapPin} label="Sold in" value={result.product.countries} />}
                {result.product.stores && <DetailRow icon={Package} label="Stores" value={result.product.stores} />}
                {result.product.labels && <DetailRow icon={Leaf} label="Labels" value={result.product.labels} />}
                {result.product.packaging && <DetailRow icon={Package} label="Packaging" value={result.product.packaging} />}
                {result.product.ingredients && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Ingredients</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{result.product.ingredients}</p>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">
                  Source: {result.product.source === "openfoodfacts" ? "Open Food Facts" :
                    result.product.source === "openbeautyfacts" ? "Open Beauty Facts" : "Open Pet Food Facts"}
                  {" · Barcode: "}{result.product.barcode}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <Icon size={14} className="mt-0.5 text-muted-foreground shrink-0" />
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xs text-foreground">{value}</p>
    </div>
  </div>
);

export default BoycottSearchPage;
