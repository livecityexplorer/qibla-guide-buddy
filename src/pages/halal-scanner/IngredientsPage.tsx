import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, BookOpen, CheckCircle, XCircle, AlertTriangle, HelpCircle, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ingredientDatabase, INGREDIENT_CATEGORIES, E_NUMBER_GUIDE, type IngredientInfo, type HalalStatus } from "@/data/ingredientDatabase";
import { getSettings } from "@/services/halalScannerService";

const statusIcons = { halal: CheckCircle, haram: XCircle, mushbooh: AlertTriangle, unknown: HelpCircle };
const statusColors: Record<string, string> = {
  halal: "bg-emerald-mid/20 text-emerald-mid border-emerald-mid/30",
  haram: "bg-destructive/20 text-destructive border-destructive/30",
  mushbooh: "bg-accent/20 text-accent-foreground border-accent/30",
  unknown: "bg-muted text-muted-foreground border-border",
};

const IngredientsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Ingredients");
  const [selected, setSelected] = useState<IngredientInfo | null>(null);
  const [showENumbers, setShowENumbers] = useState(false);
  const settings = getSettings();

  const filtered = useMemo(() => {
    let items = ingredientDatabase;
    if (category !== "All Ingredients") {
      if (category === "E-Numbers") {
        items = items.filter(i => i.eNumbers.length > 0);
      } else {
        items = items.filter(i => i.category === category);
      }
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.eNumbers.some(e => e.toLowerCase().includes(q)) ||
        i.otherNames.some(n => n.toLowerCase().includes(q))
      );
    }
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [search, category]);

  const eFiltered = useMemo(() => {
    if (!search) return E_NUMBER_GUIDE;
    const q = search.toLowerCase();
    return E_NUMBER_GUIDE.filter(e => e.number.toLowerCase().includes(q) || e.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="min-h-screen">
      <div className="gradient-emerald px-4 pb-6 pt-12 islamic-pattern">
        <button onClick={() => navigate("/halal-scanner")} className="mb-4 flex items-center gap-2 text-primary-foreground/80">
          <ArrowLeft size={20} /><span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground flex items-center gap-2">
          <BookOpen size={24} /> Ingredient Database
        </h1>
        <p className="mt-1 text-sm text-primary-foreground/70">{ingredientDatabase.length} ingredients indexed</p>
      </div>

      <div className="px-4 -mt-3 pb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" placeholder="Search ingredient or E-number..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-input bg-card pl-9 pr-10 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={16} className="text-muted-foreground" /></button>}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {INGREDIENT_CATEGORIES.map(c => (
            <button key={c} onClick={() => { setCategory(c); setShowENumbers(c === "E-Numbers"); }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border ${category === c ? "gradient-emerald text-primary-foreground border-transparent" : "bg-card text-muted-foreground border-border"}`}>
              {c}
            </button>
          ))}
        </div>

        {/* E-Number Quick Reference */}
        {showENumbers && (
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">E-Number Quick Reference</h3>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {eFiltered.map(e => {
                const Icon = statusIcons[e.status];
                return (
                  <div key={e.number} className="flex items-center gap-2 text-xs">
                    <Icon size={12} className={e.status === "halal" ? "text-emerald-mid" : e.status === "haram" ? "text-destructive" : "text-accent"} />
                    <span className="font-mono font-medium text-foreground w-12">{e.number}</span>
                    <span className="flex-1 text-muted-foreground truncate">{e.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${statusColors[e.status]}`}>{e.status.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ingredient List */}
        <div className="space-y-2">
          {filtered.map(ingredient => {
            const Icon = statusIcons[ingredient.status];
            return (
              <button
                key={ingredient.id}
                onClick={() => setSelected(selected?.id === ingredient.id ? null : ingredient)}
                className="w-full rounded-xl bg-card border border-border p-3 text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={ingredient.status === "halal" ? "text-emerald-mid" : ingredient.status === "haram" ? "text-destructive" : ingredient.status === "mushbooh" ? "text-accent" : "text-muted-foreground"} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{ingredient.name}</span>
                      {ingredient.eNumbers.map(e => (
                        <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{e}</span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{ingredient.description}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[ingredient.status]}`}>
                    {ingredient.status.toUpperCase()}
                  </span>
                </div>

                {/* Expanded Detail */}
                {selected?.id === ingredient.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 pt-3 border-t border-border space-y-3">
                    <Section title="What is it?" content={ingredient.description} />
                    <Section title="Source" content={ingredient.source} />
                    <Section title="Islamic Ruling" content={ingredient.islamicRuling} />
                    {ingredient.whyProblematic && <Section title="Why Problematic" content={ingredient.whyProblematic} />}

                    {settings.showScholarlyRefs && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Scholarly Opinions</p>
                        {Object.entries(ingredient.scholarlyOpinions).map(([school, opinion]) => (
                          <div key={school} className="flex gap-2 mb-1">
                            <span className="text-[10px] font-bold text-primary capitalize w-12 shrink-0">{school}</span>
                            <p className="text-[10px] text-muted-foreground">{opinion}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {settings.showArabic && ingredient.quranicReferences.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Quranic References</p>
                        {ingredient.quranicReferences.map((ref, i) => (
                          <div key={i} className="rounded-lg bg-muted/50 p-2 mb-1">
                            <p className="font-arabic text-sm text-foreground">{ref.arabic}</p>
                            <p className="text-[10px] text-muted-foreground italic mt-1">"{ref.translation}" — {ref.verse}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {ingredient.halalAlternatives.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Halal Alternatives</p>
                        <div className="flex flex-wrap gap-1">
                          {ingredient.halalAlternatives.map(a => (
                            <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-mid/10 text-emerald-mid">{a}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {ingredient.commonProducts.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Common Products</p>
                        <p className="text-[10px] text-muted-foreground">{ingredient.commonProducts.join(", ")}</p>
                      </div>
                    )}

                    {ingredient.howToIdentify.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">How to Identify on Labels</p>
                        <div className="flex flex-wrap gap-1">
                          {ingredient.howToIdentify.map(h => (
                            <span key={h} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-foreground font-mono">{h}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Search size={40} className="mx-auto text-muted-foreground/20" />
            <p className="mt-3 text-sm text-muted-foreground">No ingredients found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Section = ({ title, content }: { title: string; content: string }) => (
  <div>
    <p className="text-xs font-semibold text-muted-foreground">{title}</p>
    <p className="text-xs text-foreground mt-0.5">{content}</p>
  </div>
);

export default IngredientsPage;
