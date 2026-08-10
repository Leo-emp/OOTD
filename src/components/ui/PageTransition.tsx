"use client";

import { motion } from "framer-motion";

// Page transition wrapper — smooth fade + slide on route changes
// Wrap each page's <main> content for consistent entry animation
// Uses spring physics for premium feel (not linear easing)
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function PageTransition({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 30,
        mass: 0.8,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
