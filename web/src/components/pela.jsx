"use client";
// App-level building blocks shared by every page.
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, LockKeyhole, PawPrint, ShieldAlert, Wallet } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const ACCENT_COLORS = { fawn: "#c2441f", sage: "#3e6b4f", blush: "#b4534a" };

export const short = (addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "");

export const fmtDate = (secs) =>
  secs ? new Date(Number(secs) * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Unknown";

export const petArt = (pet) => (/malinois/i.test(pet?.breed ?? "") ? "pechi" : "bella");

/** Uses the ComfyUI render (/images/<name>.png) when present, otherwise the bundled SVG placeholder. */
export function Art({ name, alt, className }) {
  const [src, setSrc] = useState(`/images/${name}.png`);
  const fallback = () => setSrc(`/images/${name}.svg`);
  // The PNG can 404 before React hydrates (onError is then missed), so also check on mount.
  const checkBroken = (img) => img?.complete && img.naturalWidth === 0 && img.src.endsWith(".png") && fallback();
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={checkBroken} src={src} alt={alt} className={cn("object-cover", className)} onError={fallback} decoding="async" />;
}

/** Raised paper surface. */
export function Paper({ className, as: Comp = "section", ...props }) {
  return <Comp className={cn("rounded-[22px] border border-border bg-card p-6 shadow-[0_2px_0_0_rgb(28_33_30/0.05)] sm:p-7", className)} {...props} />;
}

/** Page title block: mono eyebrow, display heading (accent word in serif italic), optional lede + actions. */
export function PageHeader({ eyebrow, title, accent, lede, actions, className }) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-6 pb-8", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="mono-label mb-3 text-primary-ink">{eyebrow}</p>}
        <h1 className="display text-[clamp(2.4rem,5.5vw,4rem)] text-balance">
          {title} {accent && <span className="serif-accent text-[1.08em] text-primary-ink">{accent}</span>}
        </h1>
        {lede && <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-muted-foreground">{lede}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

export function Loading({ label = "Reading the chain…", className }) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("flex items-center justify-center gap-3 py-20 text-muted-foreground", className)} role="status">
      <span className="flex gap-1.5 text-primary">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={reduce ? undefined : { y: [0, -7, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
          >
            <PawPrint className="size-4" />
          </motion.span>
        ))}
      </span>
      <span className="mono-label">{label}</span>
    </div>
  );
}

/** Empty state with a small illustration slot. */
export function Empty({ icon: Icon = PawPrint, title, children, className }) {
  return (
    <div className={cn("grid place-items-center rounded-[22px] border-2 border-dashed border-border px-6 py-14 text-center", className)}>
      <span className="mb-4 grid size-14 place-items-center rounded-full bg-accent text-primary-ink">
        <Icon className="size-6" />
      </span>
      <p className="display text-2xl">{title}</p>
      {children && <div className="mt-2 max-w-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

/** shadcn Dialog used as a confirm step for destructive or irreversible actions. */
export function ConfirmDialog({ trigger, title, description, confirmLabel = "Confirm", onConfirm }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    const ok = await onConfirm();
    setBusy(false);
    if (ok !== false) setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-2 grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </span>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            Keep it
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Renders children only for a signed-in wallet (optionally with a role). */
export function Gate({ need, children }) {
  const { signedIn, signIn, busy, roles } = useWallet();
  if (!signedIn) {
    return (
      <div className="mx-auto grid max-w-4xl items-center gap-10 py-10 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mono-label mb-4 text-primary-ink">Border control</p>
          <h1 className="display text-[clamp(2.6rem,6vw,4.25rem)]">
            Show your <span className="serif-accent text-primary-ink">papers</span>, please.
          </h1>
          <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-muted-foreground">
            Pela uses your wallet as your login. You sign a short message to prove it's you. It costs no gas and moves no money.
          </p>
          <Button size="lg" className="mt-8" onClick={signIn} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Wallet />}
            {busy ? "Check your wallet…" : "Connect & sign in"}
          </Button>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <Art name="hero" alt="Pechi and Bella waiting at the gate" className="aspect-[4/5] w-full rounded-[26px] border border-border shadow-[0_40px_60px_-34px_rgb(28_33_30/0.55)]" />
          <span className="absolute -bottom-5 -left-5 grid size-20 -rotate-12 place-items-center rounded-full border-[2.5px] border-primary bg-card/90 text-primary-ink outline-[1.5px] outline-offset-[-7px] outline-primary outline-dashed">
            <LockKeyhole className="size-7" />
          </span>
        </div>
      </div>
    );
  }
  if (need && !roles[need]) {
    return (
      <Empty icon={ShieldAlert} title="Not for this wallet" className="mx-auto mt-10 max-w-lg">
        This page needs the <strong className="font-semibold text-foreground">{need}</strong> role. Ask an admin to grant it.
      </Empty>
    );
  }
  return children;
}
