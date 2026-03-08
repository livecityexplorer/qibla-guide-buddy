import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Trash2, Clock, ScanLine, CheckCircle, XCircle, AlertTriangle, HelpCircle, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getHistory, clearHistory, removeFromHistory, type ScanHistoryItem } from "@/services/halalScannerService";
import { format } from "date-fns";

const statusIcons = { halal: CheckCircle, haram: XCircle, mushbooh: AlertTriangle, unknown: HelpCircle };
const statusColors: Record<string, string> = {
  halal: "bg-emerald-mid/20 text-emerald-mid",
  haram: "bg-destructive/20 text-destructive",
  mushbooh: "bg-accent/20 text-accent-foreground",
  unknown: "bg-muted text-muted-foreground",
};
const statusLabels: Record<string, string> = { halal: "Halal", haram: "Haram", mushbooh: "Doubtful", unknown: "Unknown" };

const HistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => { setHistory(getHistory()); }, []);

  const filtered = history.filter(item => {
    const matchesSearch = !search || item.product.name.toLowerCase().includes(search.toLowerCase()) || item.product.brand.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, ScanHistoryItem[]>>((acc, item) => {
    const date = format(new Date(item.scannedAt), "yyyy-MM-dd");
    const label = isToday(item.scannedAt) ? "Today" : isYesterday(item.scannedAt) ? "Yesterday" : format(new Date(item.scannedAt), "MMMM d, yyyy");
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});

  const handleClearAll = () => {
    clearHistory();
    setHistory([]);
    setShowConfirmClear(false);
  };

  const handleRemove = (barcode: string) => {
    removeFromHistory(barcode);
    setHistory(getHistory());
  };

  const handleExport = () => {
    const csv = "Product,Brand,Status,Barcode,Date\n" + history.map(h =>
      `"${h.product.name}","${h.product.brand}","${h.product.status}","${h.product.barcode}","${h.scannedAt}"`
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "halal-scan-history.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const stats = {
    total: history.length,
    halal: history.filter(h => h.product.status === "halal").length,
    haram: history.filter(h => h.product.status === "haram").length,
    mushbooh: history.filter(h => h.product.status === "mushbooh").length,
  };

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-6 pt-12 islamic-pattern">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/halal-scanner")} className="flex items-center gap-2 text-primary-foreground/80">
            <ArrowLeft size={20} /><span className="text-sm">Back</span>
          </button>
          <div className="flex gap-2">
            {history.length > 0 && (
              <>
                <button onClick={handleExport} className="p-2 rounded-full bg-primary-foreground/10">
                  <Download size={18} className="text-primary-foreground" />
                </button>
                <button onClick={() => setShowConfirmClear(true)} className="p-2 rounded-full bg-primary-foreground/10">
                  <Trash2 size={18} className="text-primary-foreground" />
                </button>
              </>
            )}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground">Scan History</h1>
      </div>

      <div className="px-4 -mt-3 pb-6 space-y-4">
        {/* Confirm Clear Dialog */}
        {showConfirmClear && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-destructive/10 border border-destructive/30 p-4">
            <p className="text-sm font-medium text-foreground">Clear all scan history?</p>
            <p className="text-xs text-muted-foreground mt-1">This action cannot be undone.</p>
            <div className="flex gap-2 mt-3">
              <button onClick={handleClearAll} className="flex-1 rounded-lg bg-destructive py-2 text-sm font-medium text-destructive-foreground">Clear All</button>
              <button onClick={() => setShowConfirmClear(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-foreground">Cancel</button>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        {history.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-xl bg-card p-3 text-center border border-border">
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div className="rounded-xl bg-emerald-mid/10 p-3 text-center border border-emerald-mid/20">
              <p className="text-lg font-bold text-emerald-mid">{stats.halal}</p>
              <p className="text-[10px] text-emerald-mid">Halal</p>
            </div>
            <div className="rounded-xl bg-destructive/10 p-3 text-center border border-destructive/20">
              <p className="text-lg font-bold text-destructive">{stats.haram}</p>
              <p className="text-[10px] text-destructive">Haram</p>
            </div>
            <div className="rounded-xl bg-accent/10 p-3 text-center border border-accent/20">
              <p className="text-lg font-bold text-accent-foreground">{stats.mushbooh}</p>
              <p className="text-[10px] text-accent-foreground">Doubtful</p>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        {history.length > 0 && (
          <>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" placeholder="Search history..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-input bg-card pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {["all", "halal", "haram", "mushbooh"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border ${statusFilter === s ? "gradient-emerald text-primary-foreground border-transparent" : "bg-card text-muted-foreground border-border"}`}>
                  {s === "all" ? "All" : statusLabels[s]}
                </button>
              ))}
            </div>
          </>
        )}

        {/* History List */}
        {history.length === 0 ? (
          <div className="text-center py-16">
            <Clock size={48} className="mx-auto text-muted-foreground/20" />
            <p className="mt-4 text-sm font-medium text-foreground">No scan history yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start scanning products to build your Halal knowledge!</p>
            <button onClick={() => navigate("/halal-scanner/scan")} className="mt-4 rounded-xl gradient-emerald px-6 py-2 text-sm font-medium text-primary-foreground">
              Scan Now
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{date}</p>
              <div className="space-y-2">
                {items.map((item) => {
                  const Icon = statusIcons[item.product.status];
                  return (
                    <motion.div key={item.product.barcode + item.scannedAt} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-3 rounded-xl bg-card p-3 border border-border">
                      <button onClick={() => navigate(`/halal-scanner/product/${item.product.barcode}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                        {item.product.image ? (
                          <img src={item.product.image} alt="" className="h-12 w-12 rounded-lg object-contain bg-muted shrink-0" />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <ScanLine size={16} className="text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(item.scannedAt), "h:mm a")}</p>
                        </div>
                      </button>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColors[item.product.status]}`}>
                        <Icon size={10} /> {statusLabels[item.product.status]}
                      </span>
                      <button onClick={() => handleRemove(item.product.barcode)} className="p-1 text-muted-foreground/50">
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function isToday(date: string) { return new Date(date).toDateString() === new Date().toDateString(); }
function isYesterday(date: string) { return new Date(date).toDateString() === new Date(Date.now() - 86400000).toDateString(); }

export default HistoryPage;
