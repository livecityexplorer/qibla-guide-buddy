import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Clock, Compass, BookOpen, MoreHorizontal, ScanLine, MapPin, Moon, Star, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/prayer", icon: Clock, label: "Prayer" },
  { path: "/qibla", icon: Compass, label: "Qibla" },
  { path: "/quran", icon: BookOpen, label: "Quran" },
  { path: "more", icon: MoreHorizontal, label: "More" },
];

const moreActions = [
  { label: "Halal Scanner", icon: ScanLine, path: "/scanner" },
  { label: "Boycott", icon: ShieldAlert, path: "/boycott" },
  { label: "Ramadan", icon: Star, path: "/ramadan" },
  { label: "Nearby", icon: MapPin, path: "/nearby" },
  { label: "Hadith", icon: Moon, path: "/hadith" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreActions.some(a => location.pathname.startsWith(a.path));

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />
        )}
      </AnimatePresence>

      {/* More Menu */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-16 left-3 right-3 z-50 rounded-2xl bg-card border border-border shadow-xl p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</p>
            <div className="grid grid-cols-3 gap-3">
              {moreActions.map((action) => {
                const Icon = action.icon;
                const active = location.pathname.startsWith(action.path);
                return (
                  <button
                    key={action.path}
                    onClick={() => { setShowMore(false); navigate(action.path); }}
                    className={`flex flex-col items-center gap-2 rounded-xl p-3 transition-all active:scale-95 ${
                      active ? "bg-primary/10" : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      active ? "gradient-emerald" : "bg-secondary"
                    }`}>
                      <Icon size={18} className={active ? "text-primary-foreground" : "text-foreground"} />
                    </div>
                    <span className={`text-[11px] font-medium ${active ? "text-primary" : "text-foreground"}`}>
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
          {tabs.map((tab) => {
            const isMore = tab.path === "more";
            const isActive = isMore ? isMoreActive : location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                onClick={() => {
                  if (isMore) {
                    setShowMore(!showMore);
                  } else {
                    setShowMore(false);
                    navigate(tab.path);
                  }
                }}
                className="relative flex flex-col items-center gap-0.5 px-2 py-2 transition-colors"
              >
                {isActive && !isMore && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-1 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full gradient-gold"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={20}
                  className={isActive || (isMore && showMore) ? "text-primary" : "text-muted-foreground"}
                />
                <span
                  className={`text-[10px] font-medium ${
                    isActive || (isMore && showMore) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
