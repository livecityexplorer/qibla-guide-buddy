import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, ScanLine, CheckCircle, XCircle, AlertTriangle, HelpCircle, Search, Loader2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchByName, addToHistory, getSettings, type ProductResult } from "@/services/halalScannerService";
import type { HalalStatus } from "@/data/ingredientDatabase";

const statusConfig = {
  halal: { icon: CheckCircle, label: "Halal ✅", bgClass: "bg-emerald-mid/10", textClass: "text-emerald-mid", borderClass: "border-emerald-mid/30" },
  haram: { icon: XCircle, label: "Haram ❌", bgClass: "bg-destructive/10", textClass: "text-destructive", borderClass: "border-destructive/30" },
  mushbooh: { icon: AlertTriangle, label: "Doubtful ⚠️", bgClass: "bg-accent/20", textClass: "text-accent-foreground", borderClass: "border-accent/30" },
  unknown: { icon: HelpCircle, label: "Unknown ❓", bgClass: "bg-muted", textClass: "text-muted-foreground", borderClass: "border-border" },
};

const HalalScannerPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchByName(query.trim());
      setResults(data.products);
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
  };

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-8 pt-12 islamic-pattern">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">Halal Scanner</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">Check if food products are Halal</p>
      </div>

      <div className="px-4 -mt-4 pb-6 space-y-4">
        {/* Search by Name */}
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Search size={18} className="text-primary" /> Search by Product Name
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Oreo, Nutella, Doritos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={loading || query.trim().length < 2}
              className="rounded-xl gradient-emerald px-4 py-3 text-primary-foreground font-medium shadow-emerald transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Powered by Open Food Facts — searches thousands of products worldwide
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-8">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Searching products...</p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{results.length} products found</p>
            {results.map((product) => {
              const config = statusConfig[product.status];
              const Icon = config.icon;
              return (
                <motion.button
                  key={product.barcode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/halal-scanner/product/${product.barcode}`)}
                  className={`w-full rounded-2xl border ${config.borderClass} ${config.bgClass} p-4 text-left active:scale-[0.98] transition-transform`}
                >
                  <div className="flex items-center gap-3">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-14 w-14 rounded-xl object-contain bg-background" />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center">
                        <ScanLine size={20} className="text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className={config.textClass} />
                        <span className={`text-xs font-semibold ${config.textClass}`}>{config.label}</span>
                      </div>
                      <p className="font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{product.brand}</p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed truncate">{product.summary}</p>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {searched && !loading && results.length === 0 && (
          <div className="text-center py-8">
            <Search size={40} className="mx-auto text-muted-foreground/20" />
            <p className="mt-3 text-sm font-medium text-foreground">No products found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different name or spelling</p>
          </div>
        )}

        {/* Advanced Scanner Link */}
        <button
          onClick={() => navigate("/halal-scanner")}
          className="w-full rounded-2xl bg-card p-4 shadow-sm border border-border flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-emerald">
            <Camera size={20} className="text-primary-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">Advanced Halal Scanner</p>
            <p className="text-xs text-muted-foreground">Barcode scan, ingredient database, quizzes & more</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

        {/* How it works */}
        <div className="rounded-xl bg-card p-5 shadow-sm border border-border">
          <h3 className="font-semibold text-foreground">How it works</h3>
          <div className="mt-3 space-y-3">
            {[
              { step: "1", text: "Type a product name and search our database" },
              { step: "2", text: "AI analyzes ingredients against Islamic dietary guidelines" },
              { step: "3", text: "Get instant Halal / Haram / Doubtful verification with details" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full gradient-emerald">
                  <span className="text-xs font-bold text-primary-foreground">{item.step}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl bg-muted/50 p-4 border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            ⚠️ <strong>Disclaimer:</strong> For educational purposes only. Always verify with trusted scholars and certification bodies.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HalalScannerPage;
