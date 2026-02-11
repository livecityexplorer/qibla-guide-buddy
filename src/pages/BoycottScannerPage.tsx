import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ScanLine, ShieldAlert, ShieldCheck, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

type BoycottResult = {
  status: "boycott" | "safe" | "unknown";
  brand: string;
  parent: string;
  reason: string;
  alternatives?: string;
};

const BOYCOTT_DATABASE: Record<string, BoycottResult> = {
  "starbucks": { status: "boycott", brand: "Starbucks", parent: "Starbucks Corp.", reason: "Linked to funding activities supporting apartheid. Multiple BDS campaigns active.", alternatives: "Support local coffee shops and Palestinian-owned businesses." },
  "mcdonald": { status: "boycott", brand: "McDonald's", parent: "McDonald's Corp.", reason: "Franchise operations and corporate ties to apartheid-supporting entities.", alternatives: "Try local halal restaurants and independent burger joints." },
  "coca cola": { status: "boycott", brand: "Coca-Cola", parent: "The Coca-Cola Company", reason: "Operations and investments linked to apartheid-supporting regions.", alternatives: "Try local beverages, fresh juices, or ethical brands." },
  "nestle": { status: "boycott", brand: "Nestlé", parent: "Nestlé S.A.", reason: "Major operations and investments in apartheid-supporting regions.", alternatives: "Look for local and ethical food brands." },
  "puma": { status: "boycott", brand: "Puma", parent: "Puma SE", reason: "Official sponsor of apartheid-linked sports federation.", alternatives: "Consider ethical sportswear brands." },
  "hp": { status: "boycott", brand: "HP", parent: "HP Inc.", reason: "Provides technology used in apartheid checkpoints and surveillance.", alternatives: "Consider alternative tech brands like Lenovo or ASUS." },
  "sabra": { status: "boycott", brand: "Sabra", parent: "Strauss Group", reason: "Parent company has direct ties to apartheid military units.", alternatives: "Make homemade hummus or buy from local brands." },
  "ahava": { status: "boycott", brand: "AHAVA", parent: "AHAVA Dead Sea Laboratories", reason: "Products sourced from occupied territories.", alternatives: "Look for ethical skincare brands." },
  "soda stream": { status: "boycott", brand: "SodaStream", parent: "PepsiCo", reason: "Previously operated factory in occupied territories.", alternatives: "Use traditional carbonation methods or local brands." },
  "caterpillar": { status: "boycott", brand: "Caterpillar", parent: "Caterpillar Inc.", reason: "Equipment used for demolition of Palestinian homes.", alternatives: "Support companies not involved in demolitions." },
};

const statusConfig = {
  boycott: { icon: ShieldAlert, label: "⛔ Boycott", bgClass: "bg-destructive/10", textClass: "text-destructive", borderClass: "border-destructive/30" },
  safe: { icon: ShieldCheck, label: "✅ Not on Boycott List", bgClass: "bg-emerald-mid/10", textClass: "text-emerald-mid", borderClass: "border-emerald-mid/30" },
  unknown: { icon: Search, label: "❓ Not Found", bgClass: "bg-accent/20", textClass: "text-accent-foreground", borderClass: "border-accent/30" },
};

const BoycottScannerPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<BoycottResult | null>(null);

  const handleScan = () => {
    if (!query.trim()) return;
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      const key = query.toLowerCase().trim();
      const found = Object.entries(BOYCOTT_DATABASE).find(([k]) => key.includes(k) || k.includes(key));
      if (found) {
        setResult(found[1]);
      } else {
        setResult({
          status: "safe",
          brand: query.trim(),
          parent: "Unknown",
          reason: "This brand/product was not found on the BDS boycott list. Always verify with official BDS sources.",
        });
      }
      setScanning(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 px-4 pb-8 pt-12 islamic-pattern">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">Boycott Scanner</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">Support Palestine 🇵🇸 — Check products & brands</p>
      </div>

      <div className="px-4 -mt-4 pb-6">
        {/* Search Area */}
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="Enter brand or product name..."
              className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={scanning || !query.trim()}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-red-700 to-red-900 py-3 font-medium text-primary-foreground shadow-md transition-all active:scale-95 disabled:opacity-50"
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

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 rounded-2xl border ${statusConfig[result.status].borderClass} ${statusConfig[result.status].bgClass} p-5`}
          >
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = statusConfig[result.status].icon;
                return <Icon size={28} className={statusConfig[result.status].textClass} />;
              })()}
              <div>
                <p className={`text-lg font-bold ${statusConfig[result.status].textClass}`}>
                  {statusConfig[result.status].label}
                </p>
                <p className="font-medium text-foreground">{result.brand}</p>
                {result.parent !== "Unknown" && (
                  <p className="text-xs text-muted-foreground">Parent: {result.parent}</p>
                )}
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{result.reason}</p>
            {result.alternatives && (
              <div className="mt-3 rounded-lg bg-secondary/50 p-3">
                <p className="text-xs font-semibold text-foreground">💡 Alternatives</p>
                <p className="mt-1 text-xs text-muted-foreground">{result.alternatives}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Boycott List Preview */}
        <div className="mt-6 rounded-xl bg-card p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3">🇵🇸 Why Boycott?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The BDS (Boycott, Divestment, Sanctions) movement works to end international support for apartheid 
            and oppression of Palestinians. By choosing where to spend your money, you can make a difference.
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-card p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3">Common Brands on the List</h3>
          <div className="flex flex-wrap gap-2">
            {Object.values(BOYCOTT_DATABASE).filter(b => b.status === "boycott").map((b) => (
              <button
                key={b.brand}
                onClick={() => { setQuery(b.brand); }}
                className="rounded-full border border-destructive/20 bg-destructive/5 px-3 py-1 text-xs font-medium text-destructive transition-all hover:bg-destructive/10"
              >
                {b.brand}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoycottScannerPage;
