import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Heart, Copy, CheckCircle, XCircle, AlertTriangle, HelpCircle, ChevronDown, ChevronUp, ExternalLink, Mail, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { searchByBarcode, addToHistory, isFavorite, addToFavorites, removeFromFavorites, getSettings, type ProductResult } from "@/services/halalScannerService";
import { findIngredient, type HalalStatus } from "@/data/ingredientDatabase";

const statusConfig = {
  halal: { icon: CheckCircle, label: "HALAL ✅", bg: "bg-emerald-mid/10", text: "text-emerald-mid", border: "border-emerald-mid/30" },
  haram: { icon: XCircle, label: "HARAM ❌", bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30" },
  mushbooh: { icon: AlertTriangle, label: "MUSHBOOH ⚠️", bg: "bg-accent/20", text: "text-accent-foreground", border: "border-accent/30" },
  unknown: { icon: HelpCircle, label: "UNKNOWN ❓", bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
};

const ingStatusDot: Record<HalalStatus, string> = {
  halal: "bg-emerald-mid",
  haram: "bg-destructive",
  mushbooh: "bg-accent",
  unknown: "bg-muted-foreground",
};

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["ingredients"]));
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const settings = getSettings();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    searchByBarcode(id).then(p => {
      if (p) {
        setProduct(p);
        setFav(isFavorite(p.barcode));
        addToHistory({ product: p, scannedAt: new Date().toISOString() });
      }
      setLoading(false);
    });
  }, [id]);

  const toggleSection = (s: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const toggleFav = () => {
    if (!product) return;
    if (fav) { removeFromFavorites(product.barcode); } else { addToFavorites({ product, savedAt: new Date().toISOString() }); }
    setFav(!fav);
  };

  const copyBarcode = () => {
    if (!product) return;
    navigator.clipboard.writeText(product.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareProduct = () => {
    if (!product) return;
    const text = `${product.name} (${product.brand})\nStatus: ${statusConfig[product.status].label}\n${product.summary}\n\nChecked with My Halal Hub Scanner`;
    if (navigator.share) {
      navigator.share({ title: product.name, text });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <HelpCircle size={48} className="text-muted-foreground/30" />
        <p className="mt-4 text-lg font-medium text-foreground">Product Not Found</p>
        <p className="text-sm text-muted-foreground mt-1">This barcode is not in the Open Food Facts database.</p>
        <button onClick={() => navigate("/halal-scanner/search")} className="mt-4 rounded-xl gradient-emerald px-6 py-2 text-sm font-medium text-primary-foreground">
          Search by Name
        </button>
      </div>
    );
  }

  const StatusIcon = statusConfig[product.status].icon;
  const selectedIng = selectedIngredient ? findIngredient(selectedIngredient) : null;

  // Gather scholarly info from analysis
  const haramIngredients = product.analysis.filter(a => a.status === "haram" && a.info);
  const mushboohIngredients = product.analysis.filter(a => a.status === "mushbooh" && a.info);
  const allQuranicRefs = [...haramIngredients, ...mushboohIngredients].flatMap(a => a.info?.quranicReferences || []);
  const allHadithRefs = [...haramIngredients, ...mushboohIngredients].flatMap(a => a.info?.hadithReferences || []);
  const allAlternatives = [...haramIngredients, ...mushboohIngredients].flatMap(a => a.info?.halalAlternatives || []);
  const uniqueAlternatives = [...new Set(allAlternatives)];

  const emailTemplate = `Subject: Inquiry about ${product.name} Halal Status

Dear ${product.brand} Customer Service,

Assalamu Alaikum. I am a Muslim consumer considering your product "${product.name}" (Barcode: ${product.barcode}).

Could you please confirm:
1. The source of ingredients - are they plant-based, synthetic, or animal-derived?
2. If animal-derived, which animal and is it slaughtered according to Islamic rites?
3. Do you have Halal certification for this product?

Thank you for your assistance.

JazakAllah Khair`;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-emerald px-4 pb-6 pt-12 islamic-pattern">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80">
            <ArrowLeft size={20} /><span className="text-sm">Back</span>
          </button>
          <div className="flex gap-2">
            <button onClick={shareProduct} className="p-2 rounded-full bg-primary-foreground/10">
              <Share2 size={18} className="text-primary-foreground" />
            </button>
            <button onClick={toggleFav} className="p-2 rounded-full bg-primary-foreground/10">
              <Heart size={18} className={fav ? "fill-red-400 text-red-400" : "text-primary-foreground"} />
            </button>
          </div>
        </div>
        <h1 className="text-xl font-bold text-primary-foreground">Product Details</h1>
      </div>

      <div className="px-4 -mt-3 pb-6 space-y-4">
        {/* Product Info Card */}
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex gap-4">
            {product.image ? (
              <img src={product.image} alt={product.name} className="h-24 w-24 rounded-xl object-contain bg-muted shrink-0" />
            ) : (
              <div className="h-24 w-24 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <HelpCircle size={32} className="text-muted-foreground/30" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{product.name}</h2>
                {product.productType === "cosmetic" && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-semibold shrink-0">💄 Cosmetic</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{product.brand}</p>
              <button onClick={copyBarcode} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Copy size={10} /> {copied ? "Copied!" : product.barcode}
              </button>
              <div className="flex flex-wrap gap-1 mt-2">
                {product.source === "openbeautyfacts" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground">Open Beauty Facts</span>
                )}
                {product.categories.slice(0, 3).map(c => (
                  <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl border-2 ${statusConfig[product.status].border} ${statusConfig[product.status].bg} p-5`}
        >
          <div className="flex items-center gap-3">
            <StatusIcon size={36} className={statusConfig[product.status].text} />
            <div>
              <p className={`text-2xl font-bold ${statusConfig[product.status].text}`}>
                {statusConfig[product.status].label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Confidence: {product.confidence === "analysis-based" ? "📊 Analysis-based" : product.confidence === "high" ? "🔬 High" : "📋 Low"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-foreground leading-relaxed">{product.summary}</p>
        </motion.div>

        {/* Accordion Sections */}
        {[
          {
            id: "ingredients",
            title: "🔬 Ingredient Analysis",
            content: (
              <div className="space-y-2">
                {product.analysis.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No ingredients data available for this product.</p>
                ) : (
                  product.analysis.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedIngredient(selectedIngredient === a.ingredient ? null : a.ingredient)}
                      className="w-full flex items-center gap-3 rounded-lg bg-muted/50 p-3 text-left active:scale-[0.98] transition-transform"
                    >
                      <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${ingStatusDot[a.status]}`} />
                      <span className="flex-1 text-sm text-foreground">{a.ingredient}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        a.status === "halal" ? "bg-emerald-mid/20 text-emerald-mid" :
                        a.status === "haram" ? "bg-destructive/20 text-destructive" :
                        a.status === "mushbooh" ? "bg-accent/20 text-accent-foreground" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {a.status.toUpperCase()}
                      </span>
                    </button>
                  ))
                )}
                {/* Ingredient Detail Popup */}
                {selectedIng && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card border border-border p-4 space-y-3">
                    <h4 className="font-bold text-foreground">{selectedIng.name} {selectedIng.eNumbers.length > 0 && `(${selectedIng.eNumbers.join(", ")})`}</h4>
                    <div><p className="text-xs font-semibold text-muted-foreground">What is it?</p><p className="text-sm text-foreground">{selectedIng.description}</p></div>
                    <div><p className="text-xs font-semibold text-muted-foreground">Source</p><p className="text-sm text-foreground">{selectedIng.source}</p></div>
                    <div><p className="text-xs font-semibold text-muted-foreground">Islamic Ruling</p><p className="text-sm text-foreground">{selectedIng.islamicRuling}</p></div>
                    {selectedIng.whyProblematic && <div><p className="text-xs font-semibold text-muted-foreground">Why Problematic</p><p className="text-sm text-foreground">{selectedIng.whyProblematic}</p></div>}
                    {selectedIng.halalAlternatives.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Halal Alternatives</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedIng.halalAlternatives.map(a => (
                            <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-emerald-mid/10 text-emerald-mid">{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <button onClick={() => navigate("/halal-scanner/ingredients")} className="text-xs font-medium text-primary flex items-center gap-1">
                      View in Ingredient Database <ExternalLink size={10} />
                    </button>
                  </motion.div>
                )}
              </div>
            ),
          },
          ...(settings.showScholarlyRefs && (allQuranicRefs.length > 0 || allHadithRefs.length > 0) ? [{
            id: "islamic",
            title: "📚 Islamic Rulings",
            content: (
              <div className="space-y-4">
                {allQuranicRefs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Quranic References</h4>
                    {[...new Map(allQuranicRefs.map(r => [r.verse, r])).values()].map((ref, i) => (
                      <div key={i} className="mb-3 rounded-lg bg-muted/50 p-3">
                        {settings.showArabic && <p className="font-arabic text-lg text-foreground mb-1">{ref.arabic}</p>}
                        <p className="text-sm text-foreground italic">"{ref.translation}"</p>
                        <p className="text-xs text-muted-foreground mt-1">— {ref.verse}</p>
                      </div>
                    ))}
                  </div>
                )}
                {allHadithRefs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Hadith References</h4>
                    {[...new Map(allHadithRefs.map(r => [r.text, r])).values()].map((ref, i) => (
                      <div key={i} className="mb-3 rounded-lg bg-muted/50 p-3">
                        <p className="text-sm text-foreground italic">"{ref.text}"</p>
                        <p className="text-xs text-muted-foreground mt-1">— {ref.source}</p>
                      </div>
                    ))}
                  </div>
                )}
                {/* Scholarly opinions from problematic ingredients */}
                {haramIngredients.concat(mushboohIngredients).filter(a => a.info).slice(0, 2).map((a, i) => (
                  <div key={i}>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Scholarly Opinions on {a.info.name}</h4>
                    {Object.entries(a.info.scholarlyOpinions as Record<string, string>).map(([school, opinion]) => (
                      <div key={school} className="flex gap-2 mb-2">
                        <span className="text-xs font-semibold text-primary capitalize shrink-0 w-16">{school}</span>
                        <p className="text-xs text-muted-foreground">{opinion}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ),
          }] : []),
          {
            id: "scientific",
            title: "🔬 Scientific Context",
            content: (
              <div className="space-y-3">
                {haramIngredients.concat(mushboohIngredients).filter(a => a.info).map((a, i) => (
                  <div key={i}>
                    <h4 className="text-sm font-semibold text-foreground">{a.info.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{a.info.scientificDescription}</p>
                  </div>
                ))}
                {haramIngredients.length === 0 && mushboohIngredients.length === 0 && (
                  <p className="text-sm text-muted-foreground">No concerning ingredients found that require scientific context.</p>
                )}
              </div>
            ),
          },
          {
            id: "why",
            title: "💡 Why This Matters",
            content: (
              <div className="space-y-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm font-medium text-foreground">🤲 Spiritual Significance</p>
                  <p className="text-xs text-muted-foreground mt-1">Consuming Halal is an act of worship. Your body is an amanah (trust) from Allah. Duas are more readily accepted when consuming Halal.</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm font-medium text-foreground">🤝 Community Responsibility</p>
                  <p className="text-xs text-muted-foreground mt-1">Supporting the Halal industry encourages manufacturers to provide more Halal options for the community.</p>
                </div>
              </div>
            ),
          },
          ...(uniqueAlternatives.length > 0 ? [{
            id: "alternatives",
            title: "🔄 Halal Alternatives",
            content: (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Look for products containing these Halal alternatives:</p>
                <div className="flex flex-wrap gap-2">
                  {uniqueAlternatives.map(a => (
                    <span key={a} className="text-xs px-3 py-1.5 rounded-full bg-emerald-mid/10 text-emerald-mid border border-emerald-mid/20">{a}</span>
                  ))}
                </div>
                <div className="mt-3 rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-semibold text-foreground">What to look for on labels:</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>✅ Halal certification logos (IFANCA, HFA, MUI, JAKIM)</li>
                    <li>✅ "Suitable for vegetarians" — helpful but not conclusive</li>
                    <li>✅ "Plant-based" ingredients clearly stated</li>
                  </ul>
                </div>
              </div>
            ),
          }] : []),
          {
            id: "verify",
            title: "📞 Verification Steps",
            content: (
              <div className="space-y-3">
                <div className="space-y-2">
                  {["Check package for Halal certification logo", "Look for certification number", "Visit certifying body's website to verify", "Contact manufacturer if still unsure"].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full gradient-emerald text-[10px] font-bold text-primary-foreground shrink-0">{i + 1}</span>
                      <p className="text-sm text-muted-foreground">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Mail size={12} /> Email Template
                    </p>
                    <button
                      onClick={() => navigator.clipboard.writeText(emailTemplate)}
                      className="text-[10px] text-primary font-medium"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap leading-relaxed">{emailTemplate}</pre>
                </div>
              </div>
            ),
          },
        ].map(section => (
          <div key={section.id} className="rounded-2xl bg-card border border-border overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4"
            >
              <span className="text-sm font-semibold text-foreground">{section.title}</span>
              {openSections.has(section.id) ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>
            {openSections.has(section.id) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pb-4">
                {section.content}
              </motion.div>
            )}
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button onClick={shareProduct} className="flex-1 rounded-xl gradient-emerald py-3 text-sm font-medium text-primary-foreground">
            Share Analysis
          </button>
          <button
            onClick={() => navigate("/halal-scanner/search")}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground"
          >
            Find Alternatives
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
