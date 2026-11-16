"use client";
import { motion, useReducedMotionConfig } from "framer-motion";

export default function Template({ children }) {
  const reduce = useReducedMotionConfig();
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
