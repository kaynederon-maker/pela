import Link from "next/link";
import { PawPrint } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative mt-10 overflow-hidden bg-moss text-secondary-foreground">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 pt-16 pb-8 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="display text-3xl tracking-[-0.04em]">
            Made for Pechi & Bella, <span className="serif-accent text-[#e9a27f]">and yours.</span>
          </p>
          <p className="mt-3 max-w-sm text-secondary-foreground/70">
            Pet identities and care records live on Ethereum. Profiles stay off-chain and private.
          </p>
        </div>
        <nav aria-label="Footer" className="grid content-start gap-2.5 text-secondary-foreground/80">
          <p className="mono-label mb-1 text-secondary-foreground/50">Explore</p>
          <Link className="w-fit hover:text-secondary-foreground hover:underline" href="/">Home</Link>
          <Link className="w-fit hover:text-secondary-foreground hover:underline" href="/dashboard">Your pack</Link>
          <Link className="w-fit hover:text-secondary-foreground hover:underline" href="/profile">Profile</Link>
        </nav>
        <div className="grid content-start gap-2.5 text-secondary-foreground/80">
          <p className="mono-label mb-1 text-secondary-foreground/50">On-chain</p>
          <p>Network: Ethereum · Sepolia ready</p>
          <p>Contract roles: Admin, Editor, Viewer</p>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none mx-auto flex max-w-[1200px] items-end justify-between px-5 select-none sm:px-8">
        <span className="display translate-y-[18%] text-[clamp(7rem,26vw,22rem)] leading-[0.8] tracking-[-0.07em] text-secondary-foreground/[0.07]">
          pela
        </span>
        <PawPrint className="mb-8 size-10 text-[#e9a27f]/60" />
      </div>
    </footer>
  );
}
