import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SplashScreen = ({ onFinished }: { onFinished: () => void }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinished, 600); // wait for exit animation
    }, 2200);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background: "radial-gradient(ellipse at center, hsl(160 70% 18%) 0%, hsl(220 20% 7%) 80%)",
          }}
        >
          {/* Decorative rings */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.08 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute w-[500px] h-[500px] rounded-full border border-gold/20"
          />
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.05 }}
            transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
            className="absolute w-[700px] h-[700px] rounded-full border border-gold/10"
          />

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          >
            <img
              src="/pwa-512x512.png"
              alt="Iman Guide"
              className="w-28 h-28 rounded-3xl shadow-2xl"
              style={{ boxShadow: "0 0 60px hsla(160, 60%, 40%, 0.4)" }}
            />
          </motion.div>

          {/* App name */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 text-3xl font-bold tracking-tight"
            style={{
              background: "linear-gradient(135deg, hsl(43 80% 55%), hsl(43 60% 70%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Iman Guide
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 0.6 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-2 text-sm text-muted-foreground font-light tracking-wide"
          >
            Your Islamic Lifestyle Companion
          </motion.p>

          {/* Loading indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-10 flex gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-accent"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
