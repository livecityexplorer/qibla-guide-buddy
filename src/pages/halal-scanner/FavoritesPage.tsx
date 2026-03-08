import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, ScanLine, Edit3, Trash2, CheckCircle, XCircle, AlertTriangle, HelpCircle, FolderPlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getFavorites, removeFromFavorites, updateFavoriteNote, type FavoriteItem } from "@/services/halalScannerService";

const statusIcons = { halal: CheckCircle, haram: XCircle, mushbooh: AlertTriangle, unknown: HelpCircle };
const statusColors: Record<string, string> = {
  halal: "bg-emerald-mid/20 text-emerald-mid",
  haram: "bg-destructive/20 text-destructive",
  mushbooh: "bg-accent/20 text-accent-foreground",
  unknown: "bg-muted text-muted-foreground",
};
const statusLabels: Record<string, string> = { halal: "Halal", haram: "Haram", mushbooh: "Doubtful", unknown: "Unknown" };

const FavoritesPage = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [tab, setTab] = useState<"all" | "collections" | "notes">("all");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => { setFavorites(getFavorites()); }, []);

  const handleRemove = (barcode: string) => {
    removeFromFavorites(barcode);
    setFavorites(getFavorites());
  };

  const handleSaveNote = (barcode: string) => {
    updateFavoriteNote(barcode, noteText);
    setFavorites(getFavorites());
    setEditingNote(null);
    setNoteText("");
  };

  const displayedFavorites = tab === "notes"
    ? favorites.filter(f => f.note)
    : favorites;

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-6 pt-12 islamic-pattern">
        <button onClick={() => navigate("/halal-scanner")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} /><span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">My Favorites</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">{favorites.length} saved products</p>
      </div>

      <div className="px-4 -mt-3 pb-6 space-y-4">
        {/* Tabs */}
        <div className="flex rounded-xl bg-card border border-border overflow-hidden">
          {(["all", "collections", "notes"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize ${tab === t ? "gradient-emerald text-primary-foreground" : "text-muted-foreground"}`}>
              {t === "all" ? "All Favorites" : t}
            </button>
          ))}
        </div>

        {tab === "collections" && (
          <div className="text-center py-8">
            <FolderPlus size={40} className="mx-auto text-muted-foreground/20" />
            <p className="mt-3 text-sm text-muted-foreground">Collections coming soon</p>
            <p className="text-xs text-muted-foreground">Organize favorites into custom folders</p>
          </div>
        )}

        {(tab === "all" || tab === "notes") && (
          <>
            {displayedFavorites.length === 0 ? (
              <div className="text-center py-16">
                <Heart size={48} className="mx-auto text-muted-foreground/20" />
                <p className="mt-4 text-sm font-medium text-foreground">
                  {tab === "notes" ? "No favorites with notes" : "No favorites yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {tab === "notes" ? "Add notes to your favorite products" : "Save products you want to remember"}
                </p>
                {tab === "all" && (
                  <button onClick={() => navigate("/halal-scanner/search")} className="mt-4 rounded-xl gradient-emerald px-6 py-2 text-sm font-medium text-primary-foreground">
                    Search Products
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {displayedFavorites.map((item) => {
                  const Icon = statusIcons[item.product.status];
                  return (
                    <motion.div key={item.product.barcode} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="rounded-xl bg-card border border-border overflow-hidden">
                      <button onClick={() => navigate(`/halal-scanner/product/${item.product.barcode}`)} className="w-full text-left">
                        {item.product.image ? (
                          <img src={item.product.image} alt="" className="h-28 w-full object-contain bg-muted" />
                        ) : (
                          <div className="h-28 w-full bg-muted flex items-center justify-center">
                            <ScanLine size={24} className="text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-xs font-medium text-foreground truncate">{item.product.name}</p>
                          <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[item.product.status]}`}>
                            <Icon size={10} /> {statusLabels[item.product.status]}
                          </span>
                          {item.note && <p className="mt-1 text-[10px] text-muted-foreground truncate">📝 {item.note}</p>}
                        </div>
                      </button>
                      <div className="flex border-t border-border">
                        <button
                          onClick={() => { setEditingNote(item.product.barcode); setNoteText(item.note || ""); }}
                          className="flex-1 py-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1"
                        >
                          <Edit3 size={12} /> Note
                        </button>
                        <button
                          onClick={() => handleRemove(item.product.barcode)}
                          className="flex-1 py-2 text-center text-xs text-destructive/70 flex items-center justify-center gap-1 border-l border-border"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Note Editor Modal */}
        {editingNote && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="w-full max-w-lg rounded-2xl bg-card p-5 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Add Note</h3>
                <button onClick={() => setEditingNote(null)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g., Bought at Walmart, good alternative..."
                className="w-full rounded-xl border border-input bg-background p-3 text-sm h-24 resize-none focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <button
                onClick={() => handleSaveNote(editingNote)}
                className="mt-3 w-full rounded-xl gradient-emerald py-2.5 text-sm font-medium text-primary-foreground"
              >
                Save Note
              </button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
