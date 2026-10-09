"use client";
// Landing page sections. Layout families vary on purpose: split hero, marquee band, sticky story,
// asymmetric ticket grid, scattered polaroids, stat strip, closing panel.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, Check, FileSignature, KeyRound, PawPrint, ShieldCheck, Stethoscope, Wallet } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClickSpark, CircularSeal, CountUp, EASE_OUT, Magnet, Reveal, Tilt } from "@/components/motion";
import { ArrowDoodle, KINDS, PassportCard, PawTrail, Polaroid, Squiggle, Stamp } from "@/components/passport";
import { Art } from "@/components/pela";
import { cn } from "@/lib/utils";

const DEMO_PECHI = {
  name: "Pechi",
  breed: "Belgian Malinois",
  birthDate: 0n,
  createdAt: 1791331200n,
  active: true,
  owner: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
};

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(q.matches);
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  return desktop;
}

/** Primary CTA: signs in, or goes to the pack when already signed in. */
function PassportCta({ size = "lg", label = "Open your pet's passport" }) {
  const { signedIn, signIn, busy } = useWallet();
  const button = signedIn ? (
    <Button size={size} asChild>
      <Link href="/dashboard">
        Go to your pack <ArrowRight />
      </Link>
    </Button>
  ) : (
    <Button size={size} onClick={signIn} disabled={busy}>
      <Wallet />
      {busy ? "Check your wallet…" : label}
    </Button>
  );
  return (
    <Magnet>
      <ClickSpark>{button}</ClickSpark>
    </Magnet>
  );
}

/* ── 1. Hero ──────────────────────────────────────────────────────────── */
const HEADLINE = ["Every", "good", "dog", "deserves", "a"];

export function Hero() {
  const reduce = useReducedMotion();
  const word = (i) => ({
    initial: reduce ? false : { opacity: 0, y: "0.45em", rotate: 2 },
    animate: { opacity: 1, y: 0, rotate: 0 },
    transition: { duration: 0.6, delay: 0.06 * i, ease: EASE_OUT },
  });

  return (
    <section className="relative grid items-center gap-14 pb-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:pb-24">
      <div>
        <motion.p {...word(0)} className="mono-label mb-6 flex items-center gap-2 text-primary-ink">
          <span className="size-1.5 rounded-full bg-primary" /> Pet identity · Care records · On-chain
        </motion.p>
        <h1 className="display text-[clamp(3rem,7.4vw,6.4rem)] tracking-[-0.055em]">
          {HEADLINE.map((w, i) => (
            <motion.span key={w + i} {...word(i)} className="mr-[0.22em] inline-block">
              {w}
            </motion.span>
          ))}
          <motion.span {...word(HEADLINE.length)} className="relative inline-block whitespace-nowrap">
            <span className="serif-accent text-[1.1em] text-primary-ink">paper trail</span>
            <Squiggle className="absolute -bottom-[0.06em] left-0 text-primary" delay={0.75} />
          </motion.span>
          <motion.span {...word(HEADLINE.length + 1)} className="inline-block">
            .
          </motion.span>
        </h1>
        <motion.p {...word(7)} className="mt-7 max-w-[34rem] text-[1.15rem] leading-relaxed text-muted-foreground">
          Pela gives your pet a passport that can't be lost, forged or quietly edited. Your vet stamps it. You hold the key.
        </motion.p>
        <motion.div {...word(8)} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
          <PassportCta />
          <Button variant="link" asChild>
            <a href="#story">
              See how a record is born <ArrowDown />
            </a>
          </Button>
        </motion.div>
        <motion.div {...word(9)} className="mt-12 flex items-center gap-4">
          <div className="flex shrink-0 -space-x-3">
            {["pechi", "bella"].map((n, i) => (
              <Art
                key={n}
                name={n}
                alt=""
                className={cn("size-12 rounded-full border-[3px] border-background object-cover shadow-sm", i ? "rotate-6" : "-rotate-6")}
              />
            ))}
          </div>
          <p className="max-w-xs text-sm leading-snug text-muted-foreground">
            Founded by two dogs: <strong className="font-semibold text-foreground">Pechi</strong>, a Belgian Malinois, and{" "}
            <strong className="font-semibold text-foreground">Bella</strong>, a rescued stray.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 40, rotate: 3 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.9, delay: 0.25, ease: EASE_OUT }}
        className="relative mx-auto w-full max-w-[460px] lg:mr-0"
      >
        <div aria-hidden className="absolute -inset-8 -z-10 rounded-[40px] bg-[radial-gradient(closest-side,var(--accent),transparent)] opacity-80" />
        <Tilt>
          <PassportCard pet={DEMO_PECHI} id={1} image="pechi" ownerName="Pechi's human" className="-rotate-[1.5deg]" />
        </Tilt>
        <Stamp kind={2} date="07 OCT 2026" rotate={-11} delay={1.1} className="absolute -bottom-9 -left-6 sm:-left-12" />
        <Stamp kind={0} date="12 SEP 2026" rotate={9} size="sm" delay={1.4} className="absolute right-6 -bottom-12" />
        <CircularSeal text="Verified on-chain · Pela · Verified on-chain · Pela · " size={118} className="absolute -top-12 -right-1 origin-top-right scale-75 text-primary-ink sm:-top-20 sm:-right-14 sm:scale-100">
          <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_2px_0_0_var(--primary-shadow)]">
            <PawPrint className="size-6" />
          </span>
        </CircularSeal>
        <div className="pointer-events-none absolute -bottom-24 left-24 hidden items-end gap-1 text-foreground/70 sm:flex">
          <ArrowDoodle className="-scale-x-100 rotate-[200deg]" delay={1.6} />
          <span className="serif-accent pb-1 text-xl">stamped by the vet</span>
        </div>
      </motion.div>
    </section>
  );
}

/* ── 2. Ribbon of recent care ─────────────────────────────────────────── */
const RIBBON = [
  ["Pechi", 2, "Recall drill, nailed it"],
  ["Bella", 0, "Rabies booster"],
  ["Pechi", 3, "Hips look great"],
  ["Bella", 4, "Nail trim, no drama"],
  ["Pechi", 1, "Raw + kibble, twice a day"],
  ["Bella", 2, "Sit, stay, (mostly) stay"],
];

export function Ribbon() {
  const items = [...RIBBON, ...RIBBON];
  return (
    <section aria-label="Recent care records" className="group relative left-1/2 w-[110vw] -translate-x-1/2 -rotate-[1.2deg] overflow-hidden bg-moss py-5 text-secondary-foreground">
      <div className="flex w-max animate-marquee gap-10 group-hover:[animation-play-state:paused]">
        {items.map(([dog, kind, note], i) => {
          const { Icon, label } = KINDS[kind];
          return (
            <p key={i} aria-hidden={i >= RIBBON.length} className="flex items-center gap-3 whitespace-nowrap">
              <Icon className="size-5 text-[#e9a27f]" />
              <span className="display text-xl tracking-[-0.03em]">{dog}</span>
              <span className="mono-label text-secondary-foreground/60">{label}</span>
              <span className="serif-accent text-xl text-secondary-foreground/85">{note}</span>
              <span className="ml-6 text-secondary-foreground/30">✦</span>
            </p>
          );
        })}
      </div>
    </section>
  );
}

/* ── 3. Sticky story: how a record is born ────────────────────────────── */
const CHAPTERS = [
  { n: "01", icon: FileSignature, title: "The owner issues a passport", text: "Register your pet once. Name, breed and birthday are written to the blockchain under your wallet. You're the holder." },
  { n: "02", icon: KeyRound, title: "You grant a vet a visa", text: "Add your vet's or trainer's wallet to the pet. Only the people you invite can write in this passport, and you can take the key back." },
  { n: "03", icon: Stethoscope, title: "Every visit gets a stamp", text: "Vaccinations, meals, training milestones: each one is a signed transaction with a date. Nothing can be backdated or quietly erased." },
];

export function Story() {
  const ref = useRef(null);
  const desktop = useIsDesktop();
  const reduce = useReducedMotion();
  const live = desktop && !reduce;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => setStep(p < 0.3 ? 0 : p < 0.64 ? 1 : 2));
  const rail = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const shown = live ? step : 2;

  return (
    <section id="story" ref={ref} className={cn("relative scroll-mt-24", live && "h-[290vh]")}>
      <div className={cn("grid items-center gap-12 py-20 lg:grid-cols-2", live && "sticky top-0 h-screen py-0")}>
        <div>
          <p className="mono-label mb-4 text-primary-ink">How a record is born</p>
          <h2 className="display max-w-lg text-[clamp(2.3rem,4.6vw,3.8rem)]">
            Three steps, <span className="serif-accent text-primary-ink">zero</span> paperwork.
          </h2>
          <ol className="relative mt-10 grid gap-7 pl-8">
            <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-[2px] rounded bg-border" />
            {live && <motion.span aria-hidden style={{ scaleY: rail }} className="absolute top-2 bottom-2 left-[7px] w-[2px] origin-top rounded bg-primary" />}
            {CHAPTERS.map((c, i) => {
              const active = !live || i <= step;
              return (
                <li key={c.n} className={cn("relative transition-[opacity,transform] duration-500 ease-[var(--ease-out)]", active ? "opacity-100" : "translate-x-1 opacity-35")}>
                  <span
                    className={cn(
                      "absolute top-1.5 -left-8 grid size-4 place-items-center rounded-full border-2 bg-background transition-colors duration-300",
                      active ? "border-primary" : "border-border",
                    )}
                  >
                    {active && <span className="size-1.5 rounded-full bg-primary" />}
                  </span>
                  <p className="font-mono text-xs tracking-[0.14em] text-muted-foreground">{c.n}</p>
                  <h3 className="mt-1 flex items-center gap-2 text-[1.35rem] font-semibold tracking-[-0.02em]">
                    <c.icon className="size-5 text-primary-ink" /> {c.title}
                  </h3>
                  <p className="mt-1.5 max-w-md leading-relaxed text-muted-foreground">{c.text}</p>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="relative mx-auto w-full max-w-[440px]">
          <motion.div
            initial={false}
            animate={{ clipPath: shown >= 0 ? "inset(0% 0% 0% 0% round 26px)" : "inset(0% 0% 100% 0% round 26px)" }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
          >
            <PassportCard pet={{ ...DEMO_PECHI, name: "Bella", breed: "Mixed breed (rescued stray)" }} id={2} image="bella" ownerName="Bella's human" />
          </motion.div>
          <AnimatePresence>
            {shown >= 1 && (
              <motion.div
                key="visa"
                initial={{ opacity: 0, x: 40, rotate: 8 }}
                animate={{ opacity: 1, x: 0, rotate: 4 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: "spring", stiffness: 180, damping: 18 }}
                className="absolute -top-8 -right-3 w-52 rounded-[16px] border border-border bg-card p-4 shadow-[0_20px_40px_-20px_rgb(28_33_30/0.45)] sm:-right-10"
              >
                <p className="mono-label text-[9.5px] text-ink-teal">Visa · Editor</p>
                <p className="mt-1 font-semibold">Dr. Rina, DVM</p>
                <p className="font-mono text-[11px] text-muted-foreground">0x7099…79C8</p>
                <p className="mt-2 text-xs text-muted-foreground">May stamp this passport.</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {shown >= 2 && (
              <motion.div key="stamps" className="absolute -bottom-10 -left-4 flex items-end gap-1 sm:-left-10">
                <Stamp kind={0} date="RABIES · 12 SEP" rotate={-10} land />
                <Stamp kind={1} date="DAILY" rotate={7} size="sm" land delay={0.15} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ── 4. Role tickets ──────────────────────────────────────────────────── */
const ROLES = [
  {
    role: "Viewer",
    who: "Pet owners",
    span: "lg:col-span-7",
    tone: "bg-card",
    can: ["Issue a passport for each pet", "Choose which vets and trainers may write", "Retire a passport without erasing its history"],
  },
  { role: "Editor", who: "Vets & trainers", span: "lg:col-span-5", tone: "bg-accent", can: ["Stamp care for pets they're invited to", "Fix or withdraw their own stamps"] },
  {
    role: "Admin",
    who: "The Pela desk",
    span: "lg:col-span-12",
    tone: "bg-moss text-secondary-foreground",
    can: ["Hand out and take back roles", "Pause every write if something looks wrong", "Look after user profiles"],
  },
];

export function Roles() {
  return (
    <section className="pt-24 pb-10 sm:pt-32 sm:pb-12">
      <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <h2 className="display max-w-xl text-[clamp(2.3rem,4.6vw,3.8rem)]">
          Three keys, <span className="serif-accent text-primary-ink">one</span> record.
        </h2>
        <p className="max-w-sm text-muted-foreground">Roles live in the smart contract, so the rules hold even if this website disappears.</p>
      </Reveal>
      <div className="grid gap-5 lg:grid-cols-12">
        {ROLES.map((r, i) => (
          <Reveal key={r.role} delay={i * 0.08} className={cn(r.span)}>
            <article
              className={cn(
                "group relative h-full overflow-hidden rounded-[22px] p-7 transition-transform duration-300 ease-[var(--ease-out)] hover:-translate-y-1 sm:p-9",
                "border border-border shadow-[0_2px_0_0_rgb(28_33_30/0.06)]",
                r.tone,
              )}
            >
              {/* ticket notches */}
              <span aria-hidden className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full bg-background" />
              <span aria-hidden className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full bg-background" />
              <div className={cn("flex h-full gap-8", r.role === "Admin" ? "flex-col md:flex-row md:items-center md:justify-between" : "flex-col")}>
                <div>
                  <Badge variant="stamp" className={r.role === "Admin" ? "text-[#e9a27f]" : undefined}>
                    {r.role}
                  </Badge>
                  <h3 className="display mt-5 text-[2.1rem] tracking-[-0.04em]">{r.who}</h3>
                </div>
                <ul className={cn("grid gap-3", r.role === "Admin" && "md:grid-cols-3 md:gap-6")}>
                  {r.can.map((c) => (
                    <li key={c} className="flex gap-3 text-[15.5px] leading-snug">
                      <Check className={cn("mt-0.5 size-[18px] shrink-0", r.role === "Admin" ? "text-[#e9a27f]" : "text-primary-ink")} strokeWidth={2.5} />
                      <span className={r.role === "Admin" ? "text-secondary-foreground/85" : "text-foreground/85"}>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── 5. Founders ──────────────────────────────────────────────────────── */
export function Founders() {
  return (
    <section id="founders" className="relative py-16 sm:py-24">
      <Reveal className="text-center">
        <p className="mono-label mb-4 text-primary-ink">The founders</p>
        <h2 className="display mx-auto max-w-2xl text-[clamp(2.3rem,4.6vw,3.8rem)]">
          Inspired by two <span className="serif-accent text-primary-ink">very</span> good dogs.
        </h2>
      </Reveal>
      <div className="mt-16 grid items-start gap-14 md:grid-cols-[1fr_auto_1fr] md:gap-6">
        <Reveal y={30}>
          <Polaroid
            image="pechi"
            alt="Pechi, a fawn Belgian Malinois with a dark, greying muzzle"
            rotate={-4}
            caption={
              <>
                <span className="serif-accent text-[1.7rem]">Pechi</span>
                <span className="mono-label text-muted-foreground">Belgian Malinois</span>
              </>
            }
          />
          <p className="mt-6 max-w-sm text-muted-foreground md:ml-6">Endless energy, ears that never fold, and a training log longer than your arm.</p>
        </Reveal>
        <PawTrail className="mx-auto self-center text-primary/60 md:flex-col md:gap-6" count={4} />
        <Reveal y={30} delay={0.12} className="md:mt-20">
          <Polaroid
            image="bella"
            alt="Bella, a small tan and white rescued stray with a white blaze and big ears"
            rotate={3.5}
            tape="right"
            caption={
              <>
                <span className="serif-accent text-[1.7rem]">Bella</span>
                <span className="mono-label text-muted-foreground">Rescued stray</span>
              </>
            }
          />
          <p className="mt-6 max-w-sm text-muted-foreground md:ml-6">Small, brave, snack connoisseur, and never far from Pechi's side.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 6. Live ledger ───────────────────────────────────────────────────── */
export function Ledger({ stats }) {
  const items = [
    { label: "Passports issued", value: stats?.pets },
    { label: "Care stamps", value: stats?.logs },
    { label: "Records edited in secret", value: 0, note: "Edits and withdrawals are transactions too." },
  ];
  return (
    <section className="py-16">
      <Reveal className="grid gap-px overflow-hidden rounded-[22px] border border-border bg-border sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="bg-card p-7 sm:p-9">
            <p className="display text-[clamp(3rem,6vw,4.75rem)] tracking-[-0.05em]">
              {it.value === undefined ? <span className="text-muted-foreground/40">–</span> : <CountUp to={it.value} />}
            </p>
            <p className="mono-label mt-2 text-muted-foreground">{it.label}</p>
            {it.note && <p className="mt-2 text-sm text-muted-foreground">{it.note}</p>}
          </div>
        ))}
      </Reveal>
      <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="size-4 text-ink-sage" /> Read live from the Pela contract.
      </p>
    </section>
  );
}

/* ── 7. Closing CTA ───────────────────────────────────────────────────── */
export function ClosingCta() {
  return (
    <Reveal as="section" className="relative mt-10 overflow-hidden rounded-[32px] bg-moss px-7 py-16 text-secondary-foreground sm:px-14 sm:py-20">
      <div aria-hidden className="absolute -top-24 -right-24 size-80 rounded-full border-[40px] border-secondary-foreground/[0.04]" />
      <div className="relative grid items-center gap-10 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="display max-w-xl text-[clamp(2.4rem,5vw,4.2rem)]">
            Give your dog a <span className="serif-accent text-[#f0b08e]">passport.</span>
          </h2>
          <p className="mt-4 max-w-md text-secondary-foreground/75">It takes one signature to sign in and one transaction to register. Your vet does the rest.</p>
        </div>
        <PassportCta label="Start with one pet" />
      </div>
    </Reveal>
  );
}
