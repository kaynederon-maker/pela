"use client";
// Pela's signature objects: the passport ID page, ink stamps, hand-drawn doodles and taped polaroids.
import { Bath, Bone, Medal, PawPrint, Stethoscope, Syringe } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Art, fmtDate, short } from "@/components/pela";
import { EASE_OUT } from "@/components/motion";

/** Care kinds, indexed like the contract's CareKind enum. Ink colours are stamp-only semantics. */
export const KINDS = [
  { label: "Vaccination", Icon: Syringe, ink: "var(--ink-teal)", shape: "circle" },
  { label: "Meal", Icon: Bone, ink: "var(--ink-fawn)", shape: "rect" },
  { label: "Training", Icon: Medal, ink: "var(--primary)", shape: "oct" },
  { label: "Checkup", Icon: Stethoscope, ink: "var(--ink-sage)", shape: "circle" },
  { label: "Grooming", Icon: Bath, ink: "var(--ink-rose)", shape: "rect" },
  { label: "Other", Icon: PawPrint, ink: "var(--foreground)", shape: "oct" },
];

const pad = (n, len = 4) => String(n).padStart(len, "0");
const mrzText = (s) => (s || "").toUpperCase().replace(/[^A-Z0-9]+/g, "<");

/** Machine-readable zone, padded to a fixed width like a real passport. */
export function mrzLines({ id, name, breed, owner }) {
  const line1 = `P<PELA<${mrzText(name)}<<${mrzText(breed)}`.padEnd(44, "<").slice(0, 44);
  const line2 = `${pad(id, 6)}<<${mrzText(owner?.slice(2, 12))}<<CHAIN<SEPOLIA`.padEnd(44, "<").slice(0, 44);
  return [line1, line2];
}

/* ── Passport ID page ─────────────────────────────────────────────────── */
export function PassportCard({ pet, id, ownerName, image, className, children, compact = false }) {
  const [mrz1, mrz2] = mrzLines({ id, name: pet.name, breed: pet.breed, owner: pet.owner });
  return (
    <article
      className={cn(
        "relative isolate overflow-hidden rounded-[26px] border border-[#d6cbb5] bg-card text-left shadow-[0_2px_0_0_rgb(28_33_30/0.06),0_40px_70px_-36px_rgb(28_33_30/0.5)]",
        !pet.active && "grayscale-[0.7]",
        className,
      )}
    >
      <Guilloche />
      <header className="flex items-center justify-between bg-moss px-5 py-3 text-secondary-foreground">
        <span className="flex items-center gap-2 mono-label text-[10px] text-secondary-foreground/85">
          <PawPrint className="size-3.5 text-[#e9a27f]" aria-hidden />
          Pela · Pet passport
        </span>
        <span className="font-mono text-[11px] tracking-[0.12em] text-secondary-foreground/70">No. {pad(id)}</span>
      </header>

      <div className={cn("grid gap-5 p-5", compact ? "grid-cols-[96px_1fr]" : "grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:p-6")}>
        <div className="relative">
          <Art
            name={image}
            alt={`${pet.name}'s passport photo`}
            className={cn("w-full rounded-[16px] border border-foreground/10 object-cover", compact ? "aspect-square" : "aspect-[4/5]")}
          />
          {!pet.active && (
            <span className="absolute inset-x-2 top-1/2 -translate-y-1/2 -rotate-12 rounded-md border-2 border-destructive bg-card/80 py-1 text-center font-mono text-xs font-bold tracking-[0.2em] text-destructive">
              RETIRED
            </span>
          )}
        </div>
        <dl className="grid content-start gap-3 text-sm">
          <PassField label="Name" value={<span className="display text-[1.75rem] leading-none tracking-[-0.035em]">{pet.name}</span>} />
          <PassField label="Breed" value={pet.breed || "Unknown"} />
          {!compact && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <PassField label="Born" value={fmtDate(pet.birthDate)} />
                <PassField label="Issued" value={fmtDate(pet.createdAt)} />
              </div>
              <PassField label="Holder" value={ownerName ?? short(pet.owner)} />
            </>
          )}
        </dl>
      </div>

      {!compact && (
        <footer className="border-t border-dashed border-foreground/15 bg-[#f1e9da] px-5 py-3 font-mono text-[10.5px] leading-[1.6] tracking-[0.16em] text-foreground/70 sm:text-[11.5px]">
          <p className="truncate">{mrz1}</p>
          <p className="truncate">{mrz2}</p>
        </footer>
      )}
      {children}
    </article>
  );
}

function PassField({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="mono-label text-[9.5px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-foreground">{value}</dd>
    </div>
  );
}

/** Security-print guilloche: concentric rings behind the fields. */
function Guilloche() {
  return (
    <svg aria-hidden className="pointer-events-none absolute -right-24 -bottom-28 -z-10 size-[340px] text-ink-sage/[0.09]" viewBox="0 0 200 200">
      {Array.from({ length: 14 }, (_, i) => (
        <ellipse key={i} cx="100" cy="100" rx={30 + i * 5} ry={18 + i * 5} transform={`rotate(${i * 13} 100 100)`} fill="none" stroke="currentColor" strokeWidth="0.6" />
      ))}
    </svg>
  );
}

/* ── Ink stamp ────────────────────────────────────────────────────────── */
const SHAPES = {
  circle: "rounded-full aspect-square px-3",
  rect: "rounded-[14px] px-4 py-2.5",
  oct: "aspect-square rounded-[30%] px-3",
};

/**
 * A care log rendered as a passport stamp. `land` animates it thudding onto the page
 * (scale down, settle rotation, blur to sharp); otherwise it just appears.
 */
export function Stamp({ kind = 0, date, caption, rotate = -6, size = "md", land = true, delay = 0, className }) {
  const { label, Icon, ink, shape } = KINDS[kind] ?? KINDS[5];
  const reduce = useReducedMotion();
  const dims = size === "sm" ? "min-w-[92px] text-[9px]" : "min-w-[118px] text-[10px]";
  return (
    <motion.div
      initial={land && !reduce ? { opacity: 0, scale: 1.45, rotate: rotate - 14, filter: "blur(3px)" } : false}
      whileInView={{ opacity: 0.94, scale: 1, rotate, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.42, delay, ease: [0.3, 1.4, 0.5, 1] }}
      style={{ color: ink, rotate }}
      className={cn("inline-grid place-items-center mix-blend-multiply", className)}
    >
      <div
        className={cn(
          "grid place-items-center gap-0.5 border-[2.5px] border-current text-center outline-[1.5px] outline-offset-[-6px] outline-current outline-dashed",
          SHAPES[shape],
          dims,
        )}
      >
        <Icon className={size === "sm" ? "size-4" : "size-5"} strokeWidth={2.25} aria-hidden />
        <span className="font-mono leading-tight font-bold tracking-[0.16em] uppercase">{label}</span>
        {date && <span className="font-mono leading-tight tracking-[0.1em] opacity-80">{date}</span>}
        {caption && <span className="max-w-[9rem] truncate font-mono leading-tight opacity-70">{caption}</span>}
      </div>
    </motion.div>
  );
}

/* ── Hand-drawn doodles (draw in once when visible) ───────────────────── */
function DrawPath({ d, delay = 0, duration = 0.9, ...props }) {
  const reduce = useReducedMotion();
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={reduce ? false : { pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true }}
      transition={{ duration, delay, ease: EASE_OUT }}
      {...props}
    />
  );
}

export function Squiggle({ className, delay = 0.5 }) {
  return (
    <svg aria-hidden viewBox="0 0 300 24" preserveAspectRatio="none" className={cn("h-[0.32em] w-full", className)}>
      <DrawPath d="M4 15 C 40 4, 70 22, 104 12 S 168 4, 200 13 S 262 21, 296 8" strokeWidth="5" delay={delay} />
    </svg>
  );
}

export function ArrowDoodle({ className, delay = 0.2 }) {
  return (
    <svg aria-hidden viewBox="0 0 120 90" className={cn("h-16 w-20", className)}>
      <DrawPath d="M8 10 C 30 60, 70 78, 108 62" strokeWidth="2.5" delay={delay} />
      <DrawPath d="M92 50 L 109 62 L 90 74" strokeWidth="2.5" delay={delay + 0.6} duration={0.35} />
    </svg>
  );
}

export function PawTrail({ className, count = 5 }) {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className={cn("flex items-end gap-5", className)}>
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          initial={reduce ? false : { opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 * i, duration: 0.3, ease: EASE_OUT }}
          style={{ rotate: i % 2 ? 18 : -8, translateY: i % 2 ? -10 : 0 }}
        >
          <PawPrint className="size-5" strokeWidth={2} />
        </motion.span>
      ))}
    </div>
  );
}

/* ── Taped polaroid ───────────────────────────────────────────────────── */
export function Polaroid({ image, alt, caption, rotate = -3, tape = "left", className, children }) {
  const reduce = useReducedMotion();
  return (
    <motion.figure
      style={{ rotate }}
      whileHover={reduce ? undefined : { rotate: 0, y: -6, transition: { type: "spring", stiffness: 260, damping: 20 } }}
      className={cn("relative bg-[#fffaf1] p-3 pb-4 shadow-[0_2px_0_rgb(28_33_30/0.06),0_30px_50px_-30px_rgb(28_33_30/0.55)]", className)}
    >
      <span
        aria-hidden
        className={cn(
          "absolute -top-3 h-7 w-24 bg-[#e9d9b8]/80 shadow-sm [clip-path:polygon(3%_0,97%_4%,100%_100%,0_96%)]",
          tape === "left" ? "left-6 -rotate-6" : "right-6 rotate-6",
        )}
      />
      <Art name={image} alt={alt} className="aspect-[4/3] w-full object-cover" />
      <figcaption className="mt-3 flex items-baseline justify-between gap-3 px-1">{caption}</figcaption>
      {children}
    </motion.figure>
  );
}
