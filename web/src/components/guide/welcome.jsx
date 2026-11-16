"use client";
// The welcome window: what Pela is, the four ideas behind it, then "what brings you here?"
// with a short path for each answer and a button that starts the tour of the current page.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotionConfig } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Compass, KeyRound, Link2, Lock, PawPrint, ShieldCheck, Sparkles, Stethoscope, Wallet } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Stamp } from "@/components/passport";
import { EASE_OUT } from "@/components/motion";
import { cn } from "@/lib/utils";
import { CONCEPTS, GOALS, GOAL_KEY } from "./tours";

const ICONS = { wallet: Wallet, chain: Link2, lock: Lock, key: KeyRound, paw: PawPrint, stethoscope: Stethoscope, shield: ShieldCheck, compass: Compass };
const SLIDES = ["What Pela is", "Four things to know", "Your path"];

const turn = {
  enter: (dir) => ({ opacity: 0, x: 40 * dir }),
  center: { opacity: 1, x: 0 },
  leave: (dir) => ({ opacity: 0, x: -40 * dir }),
};
const rise = (i) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { delay: 0.12 + i * 0.07, duration: 0.4, ease: EASE_OUT } },
});

export function Welcome({ open, onOpenChange, onStartTour, tourLabel }) {
  const reduce = useReducedMotionConfig();
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const contentRef = useRef(null);
  const goTo = (n) => {
    setDir(n > slide ? 1 : -1);
    setSlide(n);
  };

  // Every time the window opens, start from the beginning.
  useEffect(() => {
    if (open) {
      setSlide(0);
      setDir(1);
    }
  }, [open]);

  const last = slide === SLIDES.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        className="gap-0 overflow-x-hidden sm:max-w-2xl"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          contentRef.current?.focus();
        }}
      >
        <div className="flex items-center gap-2 pr-10">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <PawPrint className="size-4" strokeWidth={2.4} />
          </span>
          <span className="mono-label text-primary-ink">Pela guide · {SLIDES[slide]}</span>
        </div>

        <div className="relative mt-5 min-h-[400px] sm:min-h-[360px]">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={slide}
              custom={dir}
              variants={turn}
              initial="enter"
              animate="center"
              exit="leave"
              transition={{ duration: reduce ? 0 : 0.32, ease: EASE_OUT }}
            >
              {slide === 0 && <Intro />}
              {slide === 1 && <Concepts />}
              {slide === 2 && <Paths onStartTour={onStartTour} onDone={() => onOpenChange(false)} tourLabel={tourLabel} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-dashed border-border pt-5">
          <div className="flex items-center gap-2" role="tablist" aria-label="Guide pages">
            {SLIDES.map((label, i) => (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={i === slide}
                aria-label={`${i + 1}. ${label}`}
                onClick={() => goTo(i)}
                className="grid h-6 place-items-center px-0.5"
              >
                <motion.span
                  className="block h-2 rounded-full bg-foreground"
                  animate={{ width: i === slide ? 26 : 8, opacity: i === slide ? 1 : 0.3 }}
                  transition={{ duration: reduce ? 0 : 0.3, ease: EASE_OUT }}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {slide > 0 && (
              <Button variant="ghost" size="sm" onClick={() => goTo(slide - 1)}>
                <ArrowLeft /> Back
              </Button>
            )}
            {!last && (
              <Button size="sm" onClick={() => goTo(slide + 1)}>
                Next <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── 1. What Pela is ─────────────────────────────────────────────────── */
function Intro() {
  return (
    <div className="grid items-center gap-7 sm:grid-cols-[1fr_220px]">
      <div>
        <DialogTitle className="text-[2rem] sm:text-[2.3rem]">A passport for every good dog</DialogTitle>
        <DialogDescription asChild>
          <div className="mt-4 grid gap-3 text-[15.5px] leading-relaxed text-foreground/85">
            <motion.p {...rise(0)}>
              Pela keeps your pet&apos;s identity and care history on the blockchain. Every vaccination, checkup or training session becomes an ink stamp,
              signed by the vet or trainer who did it.
            </motion.p>
            <motion.p {...rise(1)}>
              Because it&apos;s on the blockchain, the record can be checked anywhere and nobody can quietly edit it later. It started with two dogs,
              Pechi and Bella, and works for any pet.
            </motion.p>
          </div>
        </DialogDescription>
        <motion.ul {...rise(2)} className="mt-5 flex flex-wrap gap-2">
          {["No password", "Free to look around", "You choose who stamps"].map((t) => (
            <li key={t} className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-[13px] font-semibold">
              <Check className="size-3.5 text-primary-ink" strokeWidth={3} /> {t}
            </li>
          ))}
        </motion.ul>
      </div>
      <MiniPassport />
    </div>
  );
}

/** A small passport page that collects three stamps while you read. */
function MiniPassport() {
  return (
    <div aria-hidden className="raised relative mx-auto hidden h-[290px] w-[210px] overflow-hidden rounded-[18px] bg-background sm:block">
      <div className="flex items-center justify-between bg-secondary px-3 py-2 font-mono text-[10px] tracking-[0.12em] text-secondary-foreground">
        <span>PELA · PASSPORT</span>
        <span>No. 0001</span>
      </div>
      <div className="ruled absolute inset-x-0 top-8 bottom-0" />
      <Stamp kind={0} date="12 MAR 2026" rotate={-9} size="sm" delay={0.35} className="absolute top-11 left-2" />
      <Stamp kind={2} date="02 APR 2026" rotate={7} size="sm" delay={0.75} className="absolute top-[104px] right-1" />
      <Stamp kind={3} date="19 MAY 2026" rotate={-4} size="sm" delay={1.15} className="absolute bottom-2 left-4" />
    </div>
  );
}

/* ── 2. Four things to know ──────────────────────────────────────────── */
function Concepts() {
  return (
    <div>
      <DialogTitle>Four things to know</DialogTitle>
      <DialogDescription className="mt-1.5">That&apos;s all the background you need. Everything else on the site builds on these.</DialogDescription>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {CONCEPTS.map((c, i) => {
          const Icon = ICONS[c.icon];
          return (
            <motion.li key={c.title} {...rise(i)} className="flex gap-3 rounded-[18px] bg-background p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Icon className="size-[18px]" />
              </span>
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/80">{c.body}</p>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── 3. What brings you here? ────────────────────────────────────────── */
function readGoal() {
  try {
    return localStorage.getItem(GOAL_KEY);
  } catch {
    return null;
  }
}

function Paths({ onStartTour, onDone, tourLabel }) {
  const { signedIn, roles } = useWallet();
  const [goalId, setGoalId] = useState(readGoal);
  const goal = GOALS.find((g) => g.id === goalId);
  const isDone = (key) => (key === "signedIn" ? signedIn : Boolean(key && signedIn && roles[key]));

  const pick = (id) => {
    setGoalId(id);
    try {
      localStorage.setItem(GOAL_KEY, id);
    } catch {} // remembering the answer is a nicety, not a requirement
  };

  return (
    <div>
      <DialogTitle>What brings you here?</DialogTitle>
      <DialogDescription className="mt-1.5">Pick one and you&apos;ll get the steps that matter to you.</DialogDescription>

      <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="grid content-start gap-2" role="radiogroup" aria-label="What brings you here?">
          {GOALS.map((g, i) => {
            const Icon = ICONS[g.icon];
            const active = g.id === goalId;
            return (
              <motion.button
                {...rise(i)}
                key={g.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => pick(g.id)}
                className={cn(
                  "relative flex items-center gap-3 rounded-[16px] px-3.5 py-3 text-left transition-colors",
                  active ? "text-foreground" : "text-foreground/80 hover:bg-foreground/[0.05]",
                )}
              >
                {active && <motion.span layoutId="guide-goal" className="raised absolute inset-0 rounded-[16px] bg-background" transition={{ type: "spring", bounce: 0.15, duration: 0.45 }} />}
                <Icon className="relative size-5 shrink-0" />
                <span className="relative">
                  <span className="block font-semibold">{g.label}</span>
                  <span className="block text-[13px] leading-snug text-muted-foreground">{g.blurb}</span>
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="rounded-[18px] bg-background/70 p-4 sm:p-5">
          <AnimatePresence mode="wait" initial={false}>
            {goal ? (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: EASE_OUT }}>
                <p className="mono-label text-primary-ink">Your path</p>
                <ol className="mt-3 grid gap-3">
                  {goal.steps.map((s, i) => {
                    const done = isDone(s.done);
                    return (
                      <motion.li key={s.text} {...rise(i)} className="flex gap-3 text-[14.5px] leading-snug">
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-full font-mono text-[12px] font-semibold",
                            done ? "bg-primary text-primary-foreground" : "border-[1.5px] border-foreground/40",
                          )}
                        >
                          {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                        </span>
                        <span className={done ? "text-muted-foreground line-through decoration-foreground/30" : undefined}>{s.text}</span>
                      </motion.li>
                    );
                  })}
                </ol>
              </motion.div>
            ) : (
              <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid h-full min-h-40 place-items-center text-center text-sm text-muted-foreground">
                <span>
                  <Sparkles className="mx-auto mb-2 size-5" />
                  Choose an option to see your steps.
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button onClick={onStartTour}>
          <Compass /> {tourLabel}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          I&apos;ll explore on my own
        </Button>
      </div>
    </div>
  );
}
