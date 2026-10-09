"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Loader2, LogOut, PawPrint, Wallet } from "lucide-react";
import { useWallet } from "./WalletProvider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ClickSpark } from "@/components/motion";
import { short } from "@/components/pela";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Pack" },
  { href: "/profile", label: "Profile" },
];

export function Nav() {
  const pathname = usePathname();
  const { address, signedIn, roles, profile, busy, signIn, signOut } = useWallet();
  const links = roles.admin && signedIn ? [...LINKS, { href: "/admin", label: "Admin" }] : LINKS;
  const { scrollY } = useScroll();
  const [compact, setCompact] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setCompact(y > 40));

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <nav
        aria-label="Main"
        className={cn(
          "mx-auto flex h-16 max-w-[1200px] items-center gap-2 rounded-full border px-2.5 transition-[max-width,background-color,border-color,box-shadow] duration-500 ease-[var(--ease-out)] sm:gap-4",
          compact
            ? "max-w-[920px] border-border bg-card/85 shadow-[0_2px_0_0_rgb(28_33_30/0.05),0_16px_40px_-24px_rgb(28_33_30/0.35)] backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <Link href="/" className="group flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1" aria-label="Pela home">
          <span className="grid size-10 place-items-center rounded-full bg-foreground text-background transition-transform duration-300 group-hover:-rotate-12">
            <PawPrint className="size-[18px]" strokeWidth={2.4} />
          </span>
          <span className="display hidden text-[1.6rem] tracking-[-0.05em] sm:inline">pela</span>
        </Link>

        <div className="flex items-center gap-0.5 rounded-full p-1">
          {links.map(({ href, label }) => {
            const active = pathname.startsWith(href) || (href === "/dashboard" && pathname.startsWith("/pets"));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-10 items-center rounded-full px-3.5 text-[15px] font-semibold transition-colors sm:px-4",
                  active ? "text-background" : "text-foreground/75 hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span layoutId="nav-thumb" className="absolute inset-0 rounded-full bg-foreground" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
                )}
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {signedIn ? (
            <>
              <Link
                href="/profile"
                className="hidden h-10 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm font-semibold transition-colors hover:border-foreground/30 sm:flex"
              >
                <span className="size-2 rounded-full bg-primary shadow-[0_0_0_3px_var(--accent)]" />
                {profile?.displayName ?? <span className="font-mono text-[13px]">{short(address)}</span>}
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
                    <LogOut />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <ClickSpark>
              <Button size="pill" onClick={signIn} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Wallet />}
                <span className="hidden sm:inline">{busy ? "Check your wallet…" : "Connect wallet"}</span>
                <span className="sm:hidden">{busy ? "…" : "Connect"}</span>
              </Button>
            </ClickSpark>
          )}
        </div>
      </nav>
    </header>
  );
}
