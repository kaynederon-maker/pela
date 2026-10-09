"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, KeyRound, Loader2, Plus, ShieldCheck, UserRound } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/fields";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Empty, Gate, PageHeader, petArt, short } from "@/components/pela";
import { PassportCard } from "@/components/passport";
import { EASE_OUT, Tilt } from "@/components/motion";
import { allPetIds, assignedPetIds, loadPets, read } from "@/lib/chain";

const dateToSecs = (value) => (value ? BigInt(Math.floor(new Date(value).getTime() / 1000)) : 0n);

const ROLE_INFO = {
  viewer: { label: "Viewer", icon: UserRound, tip: "You can issue passports for your own pets." },
  editor: { label: "Editor", icon: KeyRound, tip: "You can stamp passports you've been given a visa for." },
  admin: { label: "Admin", icon: ShieldCheck, tip: "You can manage roles and pause the system." },
};

export default function DashboardPage() {
  return (
    <Gate>
      <Dashboard />
    </Gate>
  );
}

function Dashboard() {
  const { address, roles, profile, notify } = useWallet();
  const [pets, setPets] = useState(null);
  const [assigned, setAssigned] = useState(new Set());

  const load = useCallback(async () => {
    try {
      const [owned, visas, all] = await Promise.all([
        read("getPetsByOwner", [address]),
        roles.editor ? assignedPetIds(address) : [],
        roles.admin ? allPetIds() : [],
      ]);
      setAssigned(new Set(visas.map(Number)));
      const ids = [...new Set([...owned, ...visas, ...all].map(Number))].sort((a, b) => a - b);
      setPets(await loadPets(ids));
    } catch {
      notify("Couldn't read your pets from the chain.", "error");
      setPets([]);
    }
  }, [address, roles, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const roleList = Object.keys(ROLE_INFO).filter((r) => roles[r]);
  const me = address.toLowerCase();
  const relation = (pet) => (pet.owner.toLowerCase() === me ? "Holder" : assigned.has(pet.id) ? "Visa" : "Admin view");

  return (
    <>
      <PageHeader
        eyebrow={`Wallet ${short(address)}`}
        title={profile ? `Hi ${profile.displayName}, here's your` : "Here's your"}
        accent="pack."
        lede="Every passport you hold, plus the ones you've been trusted to stamp."
        actions={
          <>
            <div className="flex flex-wrap gap-2">
              {roleList.map((r) => {
                const { label, icon: Icon, tip } = ROLE_INFO[r];
                return (
                  <Tooltip key={r}>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Badge variant="stamp">
                          <Icon /> {label}
                        </Badge>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{tip}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            {roles.viewer && <RegisterPet onDone={load} />}
          </>
        }
      />

      {!roleList.length && (
        <Empty icon={KeyRound} title="No visa on this wallet yet" className="mb-10">
          Ask an admin to make you an owner (Viewer) or a vet/trainer (Editor). Your address is{" "}
          <code className="rounded bg-muted px-1.5 font-mono text-[13px] text-foreground">{short(address)}</code>.
        </Empty>
      )}

      {pets === null ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[220px] animate-pulse rounded-[26px] border border-border bg-card" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      ) : pets.length === 0 ? (
        roleList.length > 0 && (
          <Empty title="No passports here yet">
            {roles.viewer ? "Issue the first one with “New passport”." : "Owners will invite you to their pets' passports."}
          </Empty>
        )
      ) : (
        <motion.ul layout className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {pets.map((pet, i) => (
              <motion.li
                key={pet.id}
                layout
                initial={{ opacity: 0, y: 24, rotate: i % 2 ? 1.5 : -1.5 }}
                animate={{ opacity: 1, y: 0, rotate: 0, transition: { delay: i * 0.07, duration: 0.55, ease: EASE_OUT } }}
                exit={{ opacity: 0, scale: 0.96 }}
              >
                <Link href={`/pets/${pet.id}`} className="group block rounded-[26px] focus-visible:outline-offset-4" aria-label={`Open ${pet.name}'s passport`}>
                  <Tilt amplitude={6}>
                    <PassportCard pet={pet} id={pet.id} image={petArt(pet)} compact className="transition-shadow duration-300 group-hover:shadow-[0_2px_0_0_rgb(28_33_30/0.06),0_40px_60px_-30px_rgb(28_33_30/0.55)]" />
                  </Tilt>
                  <div className="mt-3 flex items-center justify-between px-1">
                    <Badge variant={relation(pet) === "Holder" ? "soft" : "outline"}>{pet.active ? relation(pet) : "Retired"}</Badge>
                    <span className="flex items-center gap-1 text-sm font-semibold text-primary-ink transition-transform duration-300 group-hover:translate-x-0.5">
                      Open passport <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </>
  );
}

function RegisterPet({ onDone }) {
  const { write } = useWallet();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", breed: "", birth: "" });
  const [sending, setSending] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    const ok = await write("registerPet", [form.name.trim(), form.breed.trim(), dateToSecs(form.birth)], `${form.name.trim()}'s passport is issued`);
    setSending(false);
    if (ok) {
      setForm({ name: "", breed: "", birth: "" });
      setOpen(false);
      onDone();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !sending && setOpen(v)}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> New passport
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <p className="mono-label text-primary-ink">Issue a passport</p>
          <DialogTitle>Who's joining the pack?</DialogTitle>
          <DialogDescription>This is written to the blockchain under your wallet. You can edit it later.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Name" value={form.name} onChange={set("name")} required maxLength={64} placeholder="Pechi" autoFocus />
          <Field label="Breed" value={form.breed} onChange={set("breed")} maxLength={64} placeholder="Belgian Malinois" hint="Optional. Up to 64 characters." />
          <Field label="Birthday" type="date" value={form.birth} onChange={set("birth")} max={new Date().toISOString().slice(0, 10)} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending || !form.name.trim()}>
              {sending && <Loader2 className="animate-spin" />}
              {sending ? "Issuing…" : "Issue passport"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
