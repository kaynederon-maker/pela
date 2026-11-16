"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Loader2, LogOut, Menu, PawPrint, Wallet } from "lucide-react";
import { useWallet } from "@/components/wallet/wallet-provider";
import { Button } from "@/components/ui/button";
import { GuideButton } from "@/components/guide";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ClickSpark } from "@/components/motion";
import { short } from "@/components/shared";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Pack" },
  { href: "/profile", label: "Profile" },
];

const CHAPTERS = [
  { href: "/#top", title: "A passport for every good dog" },
  { href: "/#story", title: "How a record is born" },
  { href: "/#roles", title: "Three keys, one record" },
  { href: "/#founders", title: "Pechi & Bella" },
  { href: "/#ledger", title: "The ledger so far" },
];

function Contents() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2.5 sm:px-3" data-guide="contents">
          <span className="hidden sm:inline">Contents</span>
          <Menu />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="mono-label text-primary-ink">Pela</p>
          <DialogTitle>Contents</DialogTitle>
          <DialogDescription className="sr-only">Jump to a part of the Pela story.</DialogDescription>
        </DialogHeader>
        <ol className="grid">
          {CHAPTERS.map((c, i) => (
            <li key={c.href} className="border-t border-dashed border-border first:border-t-0">
              <DialogClose asChild>
                <Link href={c.href} className="group flex items-baseline gap-4 py-3.5 text-[17px] font-semibold">
                  <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className="underline decoration-transparent decoration-dashed underline-offset-[6px] transition-colors group-hover:decoration-foreground/50">{c.title}</span>
                </Link>
              </DialogClose>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

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
            ? "max-w-[920px] border-border bg-card/85 shadow-[0_2px_0_0_rgb(31_20_11/0.05),0_16px_40px_-24px_rgb(31_20_11/0.35)] backdrop-blur-md"
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
                data-guide={`nav-${label.toLowerCase()}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-10 items-center px-3 text-[15px] font-semibold transition-colors sm:px-3.5",
                  active ? "text-foreground" : "text-foreground/75 hover:text-foreground",
                )}
              >
                <span className={cn("relative underline decoration-foreground/45 decoration-dashed decoration-1 underline-offset-[7px]", active && "no-underline")}>{label}</span>
                {active && (
                  <motion.span layoutId="nav-thumb" className="absolute inset-x-3 bottom-[7px] h-[2px] rounded-full bg-foreground sm:inset-x-3.5" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
                )}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
          <GuideButton />
          <Contents />
          {signedIn ? (
            <>
              <Link
                href="/profile"
                data-guide="account"
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
              <Button size="pill" onClick={signIn} disabled={busy} data-guide="connect" aria-label="Connect wallet" className="max-sm:size-11 max-sm:px-0">
                {busy ? <Loader2 className="animate-spin" /> : <Wallet />}
                <span className="hidden sm:inline">{busy ? "Check your wallet…" : "Connect wallet"}</span>
              </Button>
            </ClickSpark>
          )}
        </div>
      </nav>
    </header>
  );
}
