"use client";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { isAddress } from "viem";
import { CirclePause, CirclePlay, KeyRound, Search, ShieldCheck, Trash2, UserMinus, UserPlus, Users } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Label } from "@/components/ui/fields";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACCENT_COLORS, ConfirmDialog, Empty, Gate, PageHeader, Paper, short } from "@/components/pela";
import { CountUp, Reveal } from "@/components/motion";
import { ROLES, getRoles, read } from "@/lib/chain";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  { id: "viewer", label: "Viewer · pet owner" },
  { id: "editor", label: "Editor · vet or trainer" },
  { id: "admin", label: "Admin" },
];

export default function AdminPage() {
  return (
    <Gate need="admin">
      <PageHeader eyebrow="Admin desk" title="Keys, switches" accent="& people." lede="Everything here except the user directory is a transaction on the Pela contract." />
      <div className="grid gap-5 lg:grid-cols-12">
        <SystemPanel />
        <RoleDesk />
        <Directory />
      </div>
    </Gate>
  );
}

function SystemPanel() {
  const { write } = useWallet();
  const [stats, setStats] = useState(null);
  const load = useCallback(async () => {
    const [paused, pets, logs] = await Promise.all([read("paused"), read("petCount"), read("logCount")]);
    setStats({ paused, pets: Number(pets), logs: Number(logs) });
  }, []);
  useEffect(() => {
    load().catch(() => setStats(null));
  }, [load]);

  return (
    <>
      <Reveal className="grid gap-px overflow-hidden rounded-[22px] border border-border bg-border sm:grid-cols-2 lg:col-span-7">
        {[
          ["Passports", stats?.pets],
          ["Care stamps", stats?.logs],
        ].map(([k, v]) => (
          <div key={k} className="bg-card p-7">
            <p className="display text-[clamp(3rem,6vw,4.5rem)] tracking-[-0.05em]">{v === undefined ? "–" : <CountUp to={v} />}</p>
            <p className="mono-label mt-1 text-muted-foreground">{k}</p>
          </div>
        ))}
      </Reveal>

      <Reveal delay={0.06} className="lg:col-span-5">
        <div className={cn("flex h-full flex-col justify-between gap-6 rounded-[22px] p-7 transition-colors duration-500", stats?.paused ? "bg-destructive text-white" : "bg-moss text-secondary-foreground")}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mono-label opacity-70">System status</p>
              <AnimatePresence mode="wait">
                <motion.p key={String(stats?.paused)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="display mt-2 text-4xl">
                  {stats ? (stats.paused ? "Paused" : "Live") : "…"}
                </motion.p>
              </AnimatePresence>
            </div>
            <span className="relative mt-2 flex size-3">
              {!stats?.paused && <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#9ad1a8] opacity-60" />}
              <span className={cn("relative inline-flex size-3 rounded-full", stats?.paused ? "bg-white" : "bg-[#9ad1a8]")} />
            </span>
          </div>
          <p className="text-sm opacity-80">Pausing blocks every write: registrations, stamps and edits. Reading still works.</p>
          {stats &&
            (stats.paused ? (
              <Button variant="outline" className="w-fit border-white text-foreground" onClick={async () => (await write("unpause", [], "Pela is live again")) && load()}>
                <CirclePlay /> Unpause
              </Button>
            ) : (
              <ConfirmDialog
                trigger={
                  <Button variant="outline" className="w-fit">
                    <CirclePause /> Pause all writes
                  </Button>
                }
                title="Pause Pela?"
                description="Nobody can register pets or stamp passports until you unpause."
                confirmLabel="Pause now"
                onConfirm={async () => {
                  const ok = await write("pause", [], "Pela paused");
                  if (ok) load();
                  return Boolean(ok);
                }}
              />
            ))}
        </div>
      </Reveal>
    </>
  );
}

function RoleDesk() {
  const { write, refreshRoles } = useWallet();
  const [target, setTarget] = useState("");
  const [role, setRole] = useState("viewer");
  const [current, setCurrent] = useState(null);
  const valid = isAddress(target.trim());

  const lookup = useCallback(async () => setCurrent(valid ? await getRoles(target.trim()).catch(() => null) : null), [target, valid]);
  useEffect(() => {
    lookup();
  }, [lookup]);

  async function change(fn) {
    const label = ROLE_OPTIONS.find((r) => r.id === role).label.split(" · ")[0];
    if (await write(fn, [ROLES[role], target.trim()], fn === "grantRole" ? `${label} granted` : `${label} revoked`)) {
      lookup();
      refreshRoles();
    }
  }

  const held = current ? Object.entries(current).filter(([, has]) => has).map(([r]) => r) : [];

  return (
    <Reveal delay={0.1} className="lg:col-span-5">
      <Paper className="grid h-full content-start gap-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-accent text-primary-ink">
            <KeyRound className="size-5" />
          </span>
          <h2 className="display text-2xl">Role desk</h2>
        </div>
        <Field label="Wallet address" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0x…" spellCheck={false} className="font-mono" error={target && !valid ? "That isn't a valid wallet address" : null} />
        <div>
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger aria-label="Role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-h-7 flex-wrap items-center gap-2 text-sm" aria-live="polite">
          {current && <span className="text-muted-foreground">Currently holds:</span>}
          <AnimatePresence mode="popLayout">
            {current &&
              (held.length ? held : ["none"]).map((r) => (
                <motion.span key={r} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <Badge variant={r === "none" ? "muted" : "stamp"}>{r}</Badge>
                </motion.span>
              ))}
          </AnimatePresence>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!valid} onClick={() => change("grantRole")}>
            <UserPlus /> Grant
          </Button>
          <Button variant="outline" disabled={!valid} onClick={() => change("revokeRole")}>
            <UserMinus /> Revoke
          </Button>
        </div>
      </Paper>
    </Reveal>
  );
}

function Directory() {
  const { notify } = useWallet();
  const [page, setPage] = useState(null);
  const [query, setQuery] = useState("");

  const load = useCallback(() => api("/api/profiles").then(setPage).catch((e) => notify(e.message, "error")), [notify]);
  useEffect(() => {
    load();
  }, [load]);

  async function remove(address) {
    try {
      await api(`/api/profiles/${address}`, { method: "DELETE" });
      notify("Profile deleted", "success");
      load();
      return true;
    } catch (err) {
      notify(err.message, "error");
      return false;
    }
  }

  const q = query.trim().toLowerCase();
  const items = (page?.items ?? []).filter((p) => !q || p.displayName.toLowerCase().includes(q) || p.address.includes(q) || p.email.toLowerCase().includes(q));

  return (
    <Reveal delay={0.14} className="lg:col-span-7">
      <Paper className="h-full">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-accent text-primary-ink">
              <Users className="size-5" />
            </span>
            <div>
              <h2 className="display text-2xl">Directory</h2>
              {page && <p className="text-sm text-muted-foreground">{page.total} profile{page.total === 1 ? "" : "s"} · off-chain</p>}
            </div>
          </div>
          <label className="relative">
            <span className="sr-only">Search profiles</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="h-11 w-48 rounded-full border-[1.5px] border-border bg-background pr-4 pl-10 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
            />
          </label>
        </div>
        {page && items.length === 0 ? (
          <Empty icon={ShieldCheck} title={q ? "Nobody matches that" : "No profiles yet"} className="py-10" />
        ) : (
          <ul className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {items.map((p) => (
                <motion.li key={p.address} layout exit={{ opacity: 0, x: -20 }} className="flex flex-wrap items-center gap-4 py-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: ACCENT_COLORS[p.accent] }}>
                    {p.displayName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.displayName}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {short(p.address)}
                      {p.email && ` · ${p.email}`}
                    </p>
                  </div>
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label={`Delete ${p.displayName}'s profile`} className="text-destructive hover:bg-destructive/10">
                        <Trash2 />
                      </Button>
                    }
                    title={`Delete ${p.displayName}'s profile?`}
                    description="This removes their off-chain profile. Their wallet, roles and pets are untouched."
                    confirmLabel="Delete profile"
                    onConfirm={() => remove(p.address)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Paper>
    </Reveal>
  );
}
