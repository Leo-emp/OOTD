"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Onboarding splash — plays once on the user's first visit to the app
// Staggered logo reveal with brand gradient, then fades away
// Uses sessionStorage so it only shows once per browser session
export function OnboardingSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if user hasn't seen it this session
    try {
      const seen = sessionStorage.getItem("ootd-splash-seen");
      if (!seen) {
        setShow(true);
        sessionStorage.setItem("ootd-splash-seen", "1");
        // Auto-dismiss after 2.5 seconds
        const timer = setTimeout(() => setShow(false), 2500);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-dark"
        >
          {/* Background gradient orbs */}
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-[100px]"
            style={{ background: "radial-gradient(circle, #FF6B9D, transparent 70%)" }}
            initial={{ scale: 0, x: -100, y: -100 }}
            animate={{ scale: 1, x: -100, y: -100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full opacity-15 blur-[80px]"
            style={{ background: "radial-gradient(circle, #C084FC, transparent 70%)" }}
            initial={{ scale: 0, x: 100, y: 100 }}
            animate={{ scale: 1, x: 100, y: 100 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          />

          {/* Logo text — staggered character reveal */}
          <div className="relative flex flex-col items-center gap-3">
            <div className="flex overflow-hidden">
              {"OOTD".split("").map((char, i) => (
                <motion.span
                  key={i}
                  className="font-heading text-6xl font-bold gradient-text"
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.3 + i * 0.1,
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </div>

            {/* "AI" badge — slides in after logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.9, type: "spring", stiffness: 300, damping: 25 }}
              className="gradient-bg rounded-full px-4 py-1"
            >
              <span className="text-sm font-semibold text-white tracking-wider">AI</span>
            </motion.div>

            {/* Tagline — fades in last */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="text-sm text-neutral-400 tracking-wide"
            >
              Your AI-Powered Style Bestie
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
