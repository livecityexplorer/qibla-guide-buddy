import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, ScanLine, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ScanResult = {
  status: "halal" | "haram" | "doubtful";
  product: string;
  details: string;
};

const MOCK_RESULTS: ScanResult[] = [
  { status: "halal", product: "Organic Honey", details: "Pure natural honey. No animal-derived additives. Halal certified." },
  { status: "haram", product: "Gummy Bears", details: "Contains pork-derived gelatin (E441). Not suitable for Muslim consumption." },
  { status: "doubtful", product: "Vanilla Extract", details: "May contain alcohol as a carrier. Check with manufacturer for halal certification." },
];

const statusConfig = {
  halal: { icon: CheckCircle, label: "Halal ✅", bgClass: "bg-emerald-mid/10", textClass: "text-emerald-mid", borderClass: "border-emerald-mid/30" },
  haram: { icon: XCircle, label: "Haram ❌", bgClass: "bg-destructive/10", textClass: "text-destructive", borderClass: "border-destructive/30" },
  doubtful: { icon: AlertTriangle, label: "Doubtful ⚠️", bgClass: "bg-accent/20", textClass: "text-accent-foreground", borderClass: "border-accent/30" },
};

const HalalScannerPage = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const simulateScan = () => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      setResult(MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)]);
      setScanning(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-8 pt-12 islamic-pattern">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">Halal Scanner</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">AI-powered product verification</p>
      </div>

      <div className="px-4 -mt-4 pb-6">
        {/* Scanner Area */}
        <div className="rounded-2xl bg-card p-6 shadow-sm text-center">
          <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted">
            {scanning ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              >
                <ScanLine size={48} className="text-primary" />
              </motion.div>
            ) : (
              <Camera size={48} className="text-muted-foreground" />
            )}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {scanning ? "Analyzing product..." : "Scan a product barcode or take a photo"}
          </p>
          <button
            onClick={simulateScan}
            disabled={scanning}
            className="mt-4 w-full rounded-xl gradient-emerald py-3 font-medium text-primary-foreground shadow-emerald transition-all active:scale-95 disabled:opacity-50"
          >
            {scanning ? "Scanning..." : "Scan Product"}
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
                <p className="font-medium text-foreground">{result.product}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{result.details}</p>
          </motion.div>
        )}

        <div className="mt-8 rounded-xl bg-card p-5 shadow-sm">
          <h3 className="font-semibold text-foreground">How it works</h3>
          <div className="mt-3 space-y-3">
            {[
              { step: "1", text: "Scan the product barcode or take a photo of ingredients" },
              { step: "2", text: "Our AI analyzes ingredients against Islamic dietary guidelines" },
              { step: "3", text: "Get instant halal/haram/doubtful verification" },
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
      </div>
    </div>
  );
};

export default HalalScannerPage;
