"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "./WalletProvider";

export const ACCENT_COLORS = { fawn: "#c8873a", sage: "#6f8f6a", blush: "#d07b72" };

export const short =(addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "");

export const fmtDate = (secs) =>
  secs ? new Date(Number(secs) * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

const VARIANTS = {
  primary: "bg-accent text-white shadow-sm hover:brightness-105",
  ghost: "border border-line bg-white/70 hover:border-accent",
  danger: "border border-red-200 bg-white/70 text-red-700 hover:bg-red-50",
};

export function Button({ variant = "primary", className = "", ...props }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

/** Two-step confirm without a blocking browser dialog. */
export function ConfirmButton({ children, onConfirm, ...props }) {
  const [armed, setArmed] = useState(false);
  return (
    <Button
      variant="danger"
      onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}
      onBlur={() => setArmed(false)}
      {...props}
    >
      {armed ? "Tap again to confirm" : children}
    </Button>
  );
}

export function Field({ label, error, as = "input", className = "", ...props }) {
  const Tag = as;
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      <Tag className="input" aria-invalid={Boolean(error)} {...props} />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Badge({ children, tone = "accent" }) {
  const tones = { accent: "bg-accent-soft text-ink", muted: "bg-line/60 text-muted" };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Card({ className = "", delay = 0, ...props }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`card ${className}`}
      {...props}
    />
  );
}

/** Uses the ComfyUI render (/images/<name>.png) when present, otherwise the bundled SVG placeholder. */
export function Art({ name, alt, className = "" }) {
  const [src, setSrc] = useState(`/images/${name}.png`);
  const fallback = () => setSrc(`/images/${name}.svg`);
  // The PNG can 404 before React hydrates (onError is then missed), so also check on mount.
  const checkBroken = (img) => img?.complete && img.naturalWidth === 0 && img.src.endsWith(".png") && fallback();
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={checkBroken} src={src} alt={alt} className={`object-cover ${className}`} onError={fallback} />;
}

export const petArt = (pet) => (/malinois/i.test(pet?.breed ?? "") ? "pechi" : "bella");

export function Loading({ label = "Fetching from the chain…" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.9 }} className="text-2xl">🐾</motion.span>
      {label}
    </div>
  );
}

/** Renders children only for a signed-in wallet (optionally with a role). */
export function Gate({ need, children }) {
  const { signedIn, signIn, busy, roles } = useWallet();
  if (!signedIn) {
    return (
      <Card className="mx-auto mt-10 max-w-md text-center">
        <Art name="hero" alt="" className="mx-auto mb-5 h-40 w-full rounded-2xl" />
        <h1 className="font-display text-2xl">Sign in with your wallet</h1>
        <p className="mt-2 text-sm text-muted">Pela uses your wallet address as your login. Signing is free, with no gas.</p>
        <Button className="mt-5" onClick={signIn} disabled={busy}>{busy ? "Check your wallet…" : "Connect & sign in"}</Button>
      </Card>
    );
  }
  if (need && !roles[need]) {
    return (
      <Card className="mx-auto mt-10 max-w-md text-center">
        <h1 className="font-display text-2xl">Not for this wallet</h1>
        <p className="mt-2 text-sm text-muted">This area needs the {need} role.</p>
      </Card>
    );
  }
  return children;
}
