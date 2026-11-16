"use client";
// The Pela guide. On someone's first visit the welcome window opens by itself; after that the
// "Guide" button in the nav brings it back. From the welcome you can start a tour of the page.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEEN_KEY, tourFor } from "./tours";
import { Tour } from "./tour";
import { Welcome } from "./welcome";

const FIRST_OPEN_DELAY_MS = 900; // let the page settle in before the welcome slides up
const HINT_MS = 6000; // how long the Guide button glows after the first welcome closes
const TOUR_START_DELAY_MS = 280; // the welcome's close animation, so the two don't overlap

const GuideContext = createContext(null);
export const useGuide = () => useContext(GuideContext);

const storage = {
  seen() {
    try {
      return localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      return true; // storage blocked: don't pop up on every page load
    }
  },
  markSeen() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
  },
};

export function GuideProvider({ children }) {
  const pathname = usePathname();
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [touring, setTouring] = useState(false);
  const [hint, setHint] = useState(false);
  const firstVisit = useRef(false);

  useEffect(() => {
    if (storage.seen()) return;
    firstVisit.current = true;
    const timer = setTimeout(() => setWelcomeOpen(true), FIRST_OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // A tour belongs to one page; leaving the page ends it.
  useEffect(() => setTouring(false), [pathname]);

  useEffect(() => {
    if (!hint) return;
    const timer = setTimeout(() => setHint(false), HINT_MS);
    return () => clearTimeout(timer);
  }, [hint]);

  const finishFirstVisit = () => {
    storage.markSeen();
    if (firstVisit.current) setHint(true);
    firstVisit.current = false;
  };

  const onWelcomeChange = (open) => {
    setWelcomeOpen(open);
    if (!open) finishFirstVisit();
  };

  const startTour = useCallback(() => {
    storage.markSeen();
    firstVisit.current = false;
    setWelcomeOpen(false);
    setTimeout(() => setTouring(true), TOUR_START_DELAY_MS);
  }, []);

  const endTour = useCallback(() => setTouring(false), []);
  const openGuide = useCallback(() => {
    setHint(false);
    setWelcomeOpen(true);
  }, []);

  const value = useMemo(() => ({ openGuide, startTour, hint }), [openGuide, startTour, hint]);

  return (
    <GuideContext.Provider value={value}>
      {children}
      <Welcome open={welcomeOpen} onOpenChange={onWelcomeChange} onStartTour={startTour} tourLabel={pathname === "/" ? "Show me around" : "Show me around this page"} />
      {touring && <Tour key={pathname} steps={tourFor(pathname)} onClose={endTour} />}
    </GuideContext.Provider>
  );
}

/** Nav button that reopens the guide. Glows for a few seconds after the first welcome closes. */
export function GuideButton() {
  const { openGuide, hint } = useGuide();
  return (
    <span className="relative">
      <Button variant="ghost" size="sm" className="gap-1.5 px-2.5 sm:px-3" onClick={openGuide} data-guide="guide" aria-label="Open the guide">
        <LifeBuoy />
        <span className="hidden md:inline">Guide</span>
      </Button>
      <AnimatePresence>
        {hint && (
          <>
            <motion.span
              aria-hidden
              className="pointer-events-none absolute -inset-1 rounded-[14px] border-2 border-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.95, 1.1, 1.2] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <motion.span
              role="status"
              className="absolute top-full right-0 mt-3 rounded-[12px] bg-foreground px-3 py-2 font-mono text-[11px] whitespace-nowrap text-background"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              The guide lives here whenever you need it
            </motion.span>
          </>
        )}
      </AnimatePresence>
    </span>
  );
}
