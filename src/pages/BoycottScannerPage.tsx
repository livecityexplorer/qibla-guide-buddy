import { motion } from "framer-motion";
import { ArrowLeft, ScanBarcode, BookOpen, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { boycottDirectory } from "@/data/boycottDirectory";

const options = [
  {
    title: "Scan Product",
    description: "Use your camera to scan a barcode and instantly check if the product is on the boycott list",
    icon: ScanBarcode,
    path: "/boycott/scan",
    gradient: "from-red-600 to-red-800",
  },
  {
    title: "Browse Directory",
    description: "Explore the full boycott directory — filter by category, risk level, and find alternatives",
    icon: BookOpen,
    path: "/boycott/directory",
    gradient: "from-orange-600 to-red-700",
  },
  {
    title: "Search Product",
    description: "Search by product name or enter a barcode to look up any product across global databases",
    icon: Search,
    path: "/boycott/search",
    gradient: "from-rose-600 to-pink-800",
  },
];

const BoycottScannerPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 px-4 pb-10 pt-12">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-white/80">
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Boycott Scanner</h1>
        <p className="mt-1 text-sm text-white/70">Support Palestine 🇵🇸 — Check products & brands</p>
        <p className="mt-0.5 text-xs text-white/50">{boycottDirectory.length} brands tracked</p>
      </div>

      <div className="px-4 -mt-6 pb-24 space-y-4">
        {options.map((opt, i) => (
          <motion.button
            key={opt.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(opt.path)}
            className="w-full rounded-2xl bg-card border border-border p-5 shadow-sm text-left transition-all active:scale-[0.98]"
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${opt.gradient} shadow-lg`}>
                <opt.icon size={26} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-foreground">{opt.title}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{opt.description}</p>
              </div>
            </div>
          </motion.button>
        ))}

        {/* Info */}
        <div className="rounded-xl bg-card p-5 shadow-sm border border-border">
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
