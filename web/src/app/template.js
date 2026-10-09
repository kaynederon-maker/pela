"use client";
import { motion, useReducedMotion } from "framer-motion";

// Re-mounts on every navigation: each route rises in (320ms) like turning to a new page.
export default function Template({ children }) {
  const reduce = useReducedMotion();
  return (
    <motion.main
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.main>
  );
}
