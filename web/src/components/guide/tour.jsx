"use client";
// The guided tour: the page dims, a lit window glides from one feature to the next, and a card
// next to it says what that feature does. ← → move between steps, Esc ends it.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotionConfig } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EASE_OUT } from "@/components/motion";
import { cn } from "@/lib/utils";
import { placeCard, spotlightRect } from "./placement";

const CARD_WIDTH = 340;
const PHONE = 640;

const find = (target) => document.querySelector(`[data-guide="${target}"]`);
const onScreen = (el) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};
const sameRect = (a, b) => a && b && ["top", "left", "width", "height"].every((k) => Math.abs(a[k] - b[k]) < 0.5);
const pad = (n) => String(n).padStart(2, "0");

const slide = {
  enter: (dir) => ({ opacity: 0, x: 18 * dir }),
  center: { opacity: 1, x: 0 },
  leave: (dir) => ({ opacity: 0, x: -18 * dir }),
};

export function Tour({ steps: allSteps, onClose }) {
  const reduce = useReducedMotionConfig();
  // Decided once, when the tour opens: only steps with something on screen to point at.
  const [steps] = useState(() => allSteps.filter((s) => onScreen(find(s.target))));
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [rect, setRect] = useState(null);
  const [view, setView] = useState(null);
  const [cardHeight, setCardHeight] = useState(220);
  const cardRef = useRef(null);
  const step = steps[index];
  const last = index === steps.length - 1;

  useEffect(() => {
    if (!steps.length) onClose();
  }, [steps, onClose]);

  const go = useCallback(
    (delta) => {
      if (delta > 0 && last) return onClose();
      setDir(delta);
      setIndex((i) => Math.min(Math.max(i + delta, 0), steps.length - 1));
    },
    [last, steps.length, onClose],
  );

  // Bring each step's feature into view.
  useEffect(() => {
    if (step) find(step.target)?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [step, reduce]);

  // Follow the feature every frame, since it moves while the page scrolls or animates.
  useEffect(() => {
    if (!step) return;
    let frame;
    const tick = () => {
      const size = { width: window.innerWidth, height: window.innerHeight };
      setView((v) => (v && v.width === size.width && v.height === size.height ? v : size));
      const el = find(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        const next = { top: r.top, left: r.left, width: r.width, height: r.height };
        setRect((prev) => (sameRect(prev, next) ? prev : next));
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [step]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardHeight(cardRef.current.offsetHeight);
  }, [index, view?.width]);

  // Capture phase, so the tour's arrow keys don't also flip passports on the pet page.
  useEffect(() => {
    const onKey = (e) => {
      const keys = { Escape: () => onClose(), ArrowRight: () => go(1), ArrowLeft: () => go(-1) };
      if (!keys[e.key]) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      keys[e.key]();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [go, onClose]);

  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, [index]);

  if (!step || !view) return null;

  const spot = rect ? spotlightRect(rect, view, 10) : null;
  const phone = view.width < PHONE;
  const card = { width: Math.min(CARD_WIDTH, view.width - 24), height: cardHeight };
  const pos = placeCard(spot, card, view);
  const spring = reduce ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 30 };

  return (
    <div className="fixed inset-0 z-[160]">
      {/* Swallows clicks so nothing underneath reacts while the tour is open. */}
      <div className="absolute inset-0" aria-hidden />

      {spot && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute rounded-[18px]"
          initial={{ opacity: 0, ...spot }}
          animate={{ opacity: 1, ...spot }}
          transition={spring}
          style={{ boxShadow: "0 0 0 200vmax rgb(31 20 11 / 0.6), 0 0 0 2px var(--kraft-light)" }}
        >
          {!reduce && (
            <motion.span
              className="absolute inset-0 rounded-[18px] border-2 border-[var(--kraft-light)]"
              animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.03, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      )}

      <motion.div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-step-title"
        aria-describedby="guide-step-body"
        tabIndex={-1}
        className={cn("raised absolute rounded-[22px] bg-card p-5 text-foreground outline-none", phone && "inset-x-3 bottom-3")}
        style={phone ? undefined : { width: card.width }}
        initial={phone ? { opacity: 0, y: 24 } : { opacity: 0, scale: 0.96, top: pos.top, left: pos.left }}
        animate={phone ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, top: pos.top, left: pos.left }}
        transition={spring}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] tracking-[0.08em] text-muted-foreground">
            {pad(index + 1)} / {pad(steps.length)}
          </span>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.span
              className="block h-full rounded-full bg-primary"
              animate={{ width: `${((index + 1) / steps.length) * 100}%` }}
              transition={{ duration: reduce ? 0 : 0.4, ease: EASE_OUT }}
            />
          </span>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="End the tour">
            <X />
          </Button>
        </div>

        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={index}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="leave"
            transition={{ duration: reduce ? 0 : 0.22, ease: EASE_OUT }}
            className="mt-3"
          >
            <h2 id="guide-step-title" className="font-display text-xl leading-tight font-bold">
              {step.title}
            </h2>
            <p id="guide-step-body" className="mt-2 text-[15px] leading-relaxed text-foreground/85">
              {step.body}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => go(-1)} disabled={index === 0}>
            <ArrowLeft /> Back
          </Button>
          {!phone && <span className="font-mono text-[11px] whitespace-nowrap text-muted-foreground">or use ← →</span>}
          <Button size="sm" onClick={() => go(1)}>
            {last ? (
              <>
                Done <Check />
              </>
            ) : (
              <>
                Next <ArrowRight />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
