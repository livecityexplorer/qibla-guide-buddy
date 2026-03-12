import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Clock, Compass, BookOpen, MoreHorizontal, ScanLine, MapPin, Moon, Star, ShieldAlert, User, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showMore, setShowMore] = useState(false);

  const tabs = [
    { path: "/", icon: Home, label: t("nav.home") },
    { path: "/prayer", icon: Clock, label: t("nav.prayer") },
    { path: "/qibla", icon: Compass, label: t("nav.qibla") },
    { path: "/quran", icon: BookOpen, label: t("nav.quran") },
    { path: "more", icon: MoreHorizontal, label: t("nav.more") },
  ];

  const moreActions = [
    { label: t("nav.halalScanner"), icon: ScanLine, path: "/scanner", desc: t("more.halalDesc"), gradient: "from-emerald-800/80 to-green-600/60" },
    { label: t("nav.boycott"), icon: ShieldAlert, path: "/boycott", desc: t("more.boycottDesc"), gradient: "from-rose-800/80 to-pink-600/60" },
    { label: t("nav.ramadan"), icon: Star, path: "/ramadan", desc: t("more.ramadanDesc"), gradient: "from-amber-800/80 to-yellow-600/60" },
    { label: t("nav.nearby"), icon: MapPin, path: "/nearby", desc: t("more.nearbyDesc"), gradient: "from-slate-700/80 to-slate-500/60" },
    { label: t("nav.hadith"), icon: Moon, path: "/hadith", desc: t("more.hadithDesc"), gradient: "from-purple-800/80 to-violet-500/60" },
    { label: t("nav.profile"), icon: User, path: "/profile", desc: t("more.profileDesc"), gradient: "from-teal-800/80 to-cyan-500/60" },
  ];

  const isMoreActive = moreActions.some(a => location.pathname.startsWith(a.path));

  return (
    <>
      <AnimatePresence>
        {showMore && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-background/60 backdrop-blur-md" onClick={() => setShowMore(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMore && (
          <motion.div initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="fixed bottom-16 left-3 right-3 z-50 rounded-2xl glass-card-strong shadow-luxury p-5 max-h-[70vh] overflow-y-auto">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">{t("common.quickActions")}</p>
            <div className="flex flex-col gap-3">
              {moreActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button key={action.path} onClick={() => { setShowMore(false); navigate(action.path); }} className={`group relative flex items-center gap-4 rounded-2xl bg-gradient-to-r ${action.gradient} border border-white/10 p-4 transition-all hover:scale-[1.01] active:scale-[0.98] overflow-hidden`}>
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                      <Icon size={28} className="text-white/90" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-base font-bold text-white">{action.label}</h4>
                      <p className="text-xs text-white/60 leading-snug mt-0.5">{action.desc}</p>
                    </div>
                    <ChevronRight size={20} className="text-white/40 shrink-0" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 glass-card-strong">
        <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
          {tabs.map((tab) => {
            const isMore = tab.path === "more";
            const isActive = isMore ? isMoreActive : location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <button key={tab.path} onClick={() => { if (isMore) { setShowMore(!showMore); } else { setShowMore(false); navigate(tab.path); } }} className="relative flex flex-col items-center gap-1 px-3 py-2.5 transition-colors min-w-[60px]">
                {isActive && !isMore && (
                  <motion.div layoutId="activeTab" className="absolute -top-1 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full gradient-gold" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <Icon size={26} className={isActive || (isMore && showMore) ? "text-primary" : "text-muted-foreground"} />
                <span className={`text-[11px] font-semibold ${isActive || (isMore && showMore) ? "text-primary" : "text-muted-foreground"}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
