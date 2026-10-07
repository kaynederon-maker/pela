"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useWallet } from "./WalletProvider";
import { Art, Button, short } from "./ui";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
];

export function Nav() {
  const pathname = usePathname();
  const { address, signedIn, roles, profile, busy, signIn, signOut } = useWallet();
  const links = roles.admin && signedIn ? [...LINKS, { href: "/admin", label: "Admin" }] : LINKS;

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/75 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3 sm:gap-6">
        <Link href="/" className="group flex items-center gap-2">
          <motion.span whileHover={{ rotate: -8, scale: 1.06 }} className="block">
            <Art name="logo" alt="" className="h-9 w-9 rounded-xl" />
          </motion.span>
          <span className="hidden font-display text-2xl font-semibold tracking-tight sm:inline">Pela</span>
        </Link>

        <div className="flex gap-1">
          {links.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} className="relative rounded-full px-3 py-1.5 text-sm" aria-current={active ? "page" : undefined}>
                {active && (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-accent-soft" transition={{ type: "spring", bounce: 0.25, duration: 0.5 }} />
                )}
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="ml-auto">
          {signedIn ? (
            <button onClick={signOut} className="rounded-full border border-line bg-white/70 px-3.5 py-1.5 text-sm transition hover:border-accent" title="Sign out">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-accent align-middle" />
              {profile?.displayName ?? short(address)}
            </button>
          ) : (
            <Button onClick={signIn} disabled={busy}>
              {busy ? "Check your wallet…" : "Connect wallet"}
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
