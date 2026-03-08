import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, X, Loader2, ScanLine, Grid, List, CheckCircle, XCircle, AlertTriangle, HelpCircle, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchByName, addToHistory, getSettings, isFavorite, addToFavorites, removeFromFavorites, type ProductResult } from "@/services/halalScannerService";

const statusIcons = { halal: CheckCircle, haram: XCircle, mushbooh: AlertTriangle, unknown: HelpCircle };
const statusColors: Record<string, string> = {
  halal: "bg-emerald-mid/20 text-emerald-mid",
  haram: "bg-destructive/20 text-destructive",
  mushbooh: "bg-accent/20 text-accent-foreground",
  unknown: "bg-muted text-muted-foreground",
};
const statusLabels: Record<string, string> = { halal: "Halal", haram: "Haram", mushbooh: "Doubtful", unknown: "Unknown" };

const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [, setRefresh] = useState(0);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchByName(q);
      setResults(data.products);
      setTotal(data.count);
      // Auto-save to history
      const settings = getSettings();
      if (settings.autoSave) {
        data.products.slice(0, 3).forEach(p => {
          addToHistory({ product: p, scannedAt: new Date().toISOString() });
        });
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (query.length >= 3) doSearch(query); }, 500);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const filteredResults = statusFilter === "all" ? results : results.filter(r => r.status === statusFilter);

  const toggleFav = (product: ProductResult) => {
    if (isFavorite(product.barcode)) {
      removeFromFavorites(product.barcode);
    } else {
      addToFavorites({ product, savedAt: new Date().toISOString() });
    }
    setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-6 pt-12 islamic-pattern">
        <button onClick={() => navigate("/halal-scanner")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} /><span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">Search Products</h1>
      </div>

      <div className="px-4 -mt-3 pb-6 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by product name or brand..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-input bg-card pl-10 pr-10 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); setSearched(false); }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={18} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["all", "halal", "haram", "mushbooh", "unknown"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? "gradient-emerald text-primary-foreground border-transparent"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {s === "all" ? "All" : statusLabels[s]}
            </button>
          ))}
          <div className="ml-auto flex gap-1 shrink-0">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "text-primary" : "text-muted-foreground"}`}>
              <Grid size={16} />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === "list" ? "text-primary" : "text-muted-foreground"}`}>
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        )}

        {/* Results Count */}
        {searched && !loading && (
          <p className="text-xs text-muted-foreground">
            {total > 0 ? `${filteredResults.length} of ${total} products` : ""}
          </p>
        )}

        {/* Results */}
        {!loading && filteredResults.length > 0 && (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-2"}>
            {filteredResults.map((product) => {
              const Icon = statusIcons[product.status];
              const fav = isFavorite(product.barcode);
              return viewMode === "grid" ? (
                <motion.button
                  key={product.barcode}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => navigate(`/halal-scanner/product/${product.barcode}`)}
                  className="rounded-xl bg-card p-3 shadow-sm border border-border text-left active:scale-95 transition-transform"
                >
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-24 w-full object-contain rounded-lg bg-muted" />
                  ) : (
                    <div className="h-24 w-full rounded-lg bg-muted flex items-center justify-center">
                      <ScanLine size={24} className="text-muted-foreground/30" />
                    </div>
                  )}
                  <p className="mt-2 text-xs font-medium text-foreground truncate">{product.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{product.brand}</p>
                  <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[product.status]}`}>
                    <Icon size={10} /> {statusLabels[product.status]}
                  </span>
                </motion.button>
              ) : (
                <motion.div
                  key={product.barcode}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm border border-border"
                >
                  <button onClick={() => navigate(`/halal-scanner/product/${product.barcode}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-14 w-14 rounded-lg object-contain bg-muted shrink-0" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <ScanLine size={18} className="text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{product.brand}</p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[product.status]}`}>
                        <Icon size={10} /> {statusLabels[product.status]}
                      </span>
                    </div>
                  </button>
                  <button onClick={() => toggleFav(product)} className="shrink-0 p-2">
                    <Heart size={18} className={fav ? "fill-destructive text-destructive" : "text-muted-foreground"} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {searched && !loading && filteredResults.length === 0 && (
          <div className="text-center py-12">
            <Search size={40} className="mx-auto text-muted-foreground/30" />
            <p className="mt-3 text-sm font-medium text-foreground">No products found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
            <button
              onClick={() => navigate("/halal-scanner/scan")}
              className="mt-3 text-xs font-medium text-primary"
            >
              Search by barcode instead →
            </button>
          </div>
        )}

        {/* Initial State */}
        {!searched && !loading && (
          <div className="text-center py-8">
            <Search size={40} className="mx-auto text-muted-foreground/20" />
            <p className="mt-3 text-sm text-muted-foreground">Type at least 3 characters to search</p>
            <p className="text-xs text-muted-foreground mt-1">Search Open Food Facts database</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
