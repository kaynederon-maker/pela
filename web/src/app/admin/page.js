"use client";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { isAddress } from "viem";
import { useWallet } from "@/components/WalletProvider";
import { ACCENT_COLORS, Badge, Button, Card, ConfirmButton, Field, Gate, short } from "@/components/ui";
import { ROLES, getRoles, read } from "@/lib/chain";
import { api } from "@/lib/client-api";

const ROLE_OPTIONS = [
  { id: "viewer", label: "Viewer (pet owner)" },
  { id: "editor", label: "Editor (vet / trainer)" },
  { id: "admin", label: "Admin" },
];

export default function AdminPage() {
  return (
    <Gate need="admin">
      <div className="space-y-8">
        <h1 className="font-display text-4xl">Admin</h1>
        <div className="grid gap-6 lg:grid-cols-2">
          <RoleManager />
          <SystemSettings />
        </div>
        <Users />
      </div>
    </Gate>
  );
}

function RoleManager() {
  const { write, refreshRoles } = useWallet();
  const [target, setTarget] = useState("");
  const [role, setRole] = useState("viewer");
  const [current, setCurrent] = useState(null);
  const valid = isAddress(target.trim());

  const lookup = useCallback(async () => setCurrent(valid ? await getRoles(target.trim()).catch(() => null) : null), [target, valid]);
  useEffect(() => { lookup(); }, [lookup]);

  async function change(fn) {
    const label = ROLE_OPTIONS.find((r) => r.id === role).label;
    if (await write(fn, [ROLES[role], target.trim()], fn === "grantRole" ? `Granted ${label}` : `Revoked ${label}`)) {
      lookup();
      refreshRoles();
    }
  }

  return (
    <Card>
      <h2 className="mb-4 font-display text-2xl">Roles</h2>
      <div className="space-y-4">
        <Field label="Wallet address" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0x…" error={target && !valid ? "Not a valid address" : null} />
        <label className="block">
          <span className="label">Role</span>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </label>
        <AnimatePresence>
          {current && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap gap-2 text-sm">
              Current:
              {Object.entries(current).some(([, has]) => has)
                ? Object.entries(current).filter(([, has]) => has).map(([r]) => <Badge key={r}>{r}</Badge>)
                : <Badge tone="muted">none</Badge>}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex gap-2">
          <Button disabled={!valid} onClick={() => change("grantRole")}>Grant</Button>
          <Button variant="ghost" disabled={!valid} onClick={() => change("revokeRole")}>Revoke</Button>
        </div>
      </div>
    </Card>
  );
}

function SystemSettings() {
  const { write } = useWallet();
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    const [paused, pets, logs] = await Promise.all([read("paused"), read("petCount"), read("logCount")]);
    setStats({ paused, pets: Number(pets), logs: Number(logs) });
  }, []);
  useEffect(() => { load().catch(() => setStats(null)); }, [load]);

  return (
    <Card>
      <h2 className="mb-4 font-display text-2xl">System</h2>
      {stats && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["Pets", stats.pets], ["Care logs", stats.logs], ["Status", stats.paused ? "Paused" : "Live"]].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-accent-soft p-3">
                <div className="font-display text-2xl">{v}</div>
                <div className="text-xs text-muted">{k}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted">Pausing blocks every write on-chain (registrations, logs, edits). Reads keep working.</p>
          {stats.paused ? (
            <Button onClick={async () => (await write("unpause", [], "Pela is live again")) && load()}>Unpause</Button>
          ) : (
            <ConfirmButton onConfirm={async () => (await write("pause", [], "Pela paused")) && load()}>Pause all writes</ConfirmButton>
          )}
        </div>
      )}
    </Card>
  );
}

function Users() {
  const { notify } = useWallet();
  const [page, setPage] = useState(null);

  const load = useCallback(() => api("/api/profiles").then(setPage).catch((e) => notify(e.message, "error")), [notify]);
  useEffect(() => { load(); }, [load]);

  async function remove(address) {
    try {
      await api(`/api/profiles/${address}`, { method: "DELETE" });
      notify("Profile deleted", "success");
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl">Users</h2>
        {page && <span className="text-sm text-muted">{page.total} profile{page.total === 1 ? "" : "s"}</span>}
      </div>
      {page?.items.length === 0 && <p className="text-sm text-muted">No profiles yet.</p>}
      <ul className="divide-y divide-line">
        <AnimatePresence initial={false}>
          {page?.items.map((p) => (
            <motion.li key={p.address} layout exit={{ opacity: 0, height: 0 }} className="flex flex-wrap items-center gap-3 py-3">
              <span className="h-3 w-3 rounded-full" style={{ background: ACCENT_COLORS[p.accent] }} />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{p.displayName}</div>
                <div className="truncate text-xs text-muted">{short(p.address)} {p.email && `· ${p.email}`}</div>
              </div>
              <ConfirmButton onConfirm={() => remove(p.address)}>Delete</ConfirmButton>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Card>
  );
}
