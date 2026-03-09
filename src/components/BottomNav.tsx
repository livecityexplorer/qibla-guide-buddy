import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Clock, Compass, BookOpen, MoreHorizontal, ScanLine, MapPin, Moon, Star, ShieldAlert, User } from "lucide-react";
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
    { label: t("nav.halalScanner"), icon: ScanLine, path: "/scanner", desc: t("more.halalDesc") },
    { label: t("nav.boycott"), icon: ShieldAlert, path: "/boycott", desc: t("more.boycottDesc") },
    { label: t("nav.ramadan"), icon: Star, path: "/ramadan", desc: t("more.ramadanDesc") },
    { label: t("nav.nearby"), icon: MapPin, path: "/nearby", desc: t("more.nearbyDesc") },
    { label: t("nav.hadith"), icon: Moon, path: "/hadith", desc: t("more.hadithDesc") },
    { label: t("nav.profile"), icon: User, path: "/profile", desc: t("more.profileDesc") },
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
          <motion.div initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="fixed bottom-16 left-3 right-3 z-50 rounded-2xl glass-card-strong shadow-luxury p-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">{t("common.quickActions")}</p>
            <div className="grid grid-cols-3 gap-4">
              {moreActions.map((action) => {
                const Icon = action.icon;
                const active = location.pathname.startsWith(action.path);
                return (
                  <button key={action.path} onClick={() => { setShowMore(false); navigate(action.path); }} className={`flex flex-col items-center gap-2.5 rounded-2xl p-4 transition-all active:scale-95 border ${active ? "border-primary/30 bg-primary/10 glow-gold" : "border-primary/10 bg-secondary/30 hover:bg-primary/5 hover:border-primary/20"}`}>
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${active ? "gradient-gold glow-gold" : "bg-primary/10"}`}>
                      <Icon size={30} className={active ? "text-primary-foreground" : "text-primary"} />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}>{action.label}</span>
                      <span className="text-[11px] text-muted-foreground text-center leading-tight">{action.desc}</span>
                    </div>
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
