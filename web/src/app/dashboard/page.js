"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWallet } from "@/components/WalletProvider";
import { Art, Badge, Button, Card, Field, Gate, Loading, fmtDate, petArt, short } from "@/components/ui";
import { allPetIds, assignedPetIds, loadPets, read } from "@/lib/chain";

const dateToSecs = (value) => (value ? BigInt(Math.floor(new Date(value).getTime() / 1000)) : 0n);

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

  const load = useCallback(async () => {
    try {
      const [owned, assigned, all] = await Promise.all([
        read("getPetsByOwner", [address]),
        roles.editor ? assignedPetIds(address) : [],
        roles.admin ? allPetIds() : [],
      ]);
      const ids = [...new Set([...owned, ...assigned, ...all].map(Number))].sort((a, b) => a - b);
      setPets(await loadPets(ids));
    } catch {
      notify("Couldn't load pets from the chain.", "error");
      setPets([]);
    }
  }, [address, roles, notify]);

  useEffect(() => { load(); }, [load]);

  const roleList = Object.entries(roles).filter(([, has]) => has).map(([r]) => r);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Hello{profile ? `, ${profile.displayName}` : ""} 👋</p>
          <h1 className="font-display text-4xl">Your pack</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {roleList.length ? roleList.map((r) => <Badge key={r}>{r}</Badge>) : <Badge tone="muted">no role yet</Badge>}
        </div>
      </header>

      {!roleList.length && (
        <Card>
          <p className="text-sm">
            Your wallet <code className="rounded bg-line/60 px-1.5">{short(address)}</code> has no role yet. Ask an admin to make you an
            owner (viewer) or a vet/trainer (editor).
          </p>
        </Card>
      )}

      {roles.viewer && <RegisterPet onDone={load} />}

      {pets === null ? (
        <Loading />
      ) : pets.length === 0 ? (
        <p className="py-10 text-center text-muted">No pets here yet.</p>
      ) : (
        <motion.ul layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {pets.map((pet, i) => (
              <motion.li
                key={pet.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -4 }}
              >
                <Link href={`/pets/${pet.id}`} className={`card block overflow-hidden p-0 ${pet.active ? "" : "opacity-60 grayscale"}`}>
                  <Art name={petArt(pet)} alt="" className="aspect-[16/10] w-full" />
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-2xl">{pet.name}</h2>
                      {!pet.active && <Badge tone="muted">deactivated</Badge>}
                      {pet.owner.toLowerCase() === address.toLowerCase() && pet.active && <Badge>yours</Badge>}
                    </div>
                    <p className="text-sm text-muted">{pet.breed || "Breed unknown"} · born {fmtDate(pet.birthDate)}</p>
                  </div>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
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
    const ok = await write("registerPet", [form.name.trim(), form.breed.trim(), dateToSecs(form.birth)], `${form.name} is on-chain! 🎉`);
    setSending(false);
    if (ok) {
      setForm({ name: "", breed: "", birth: "" });
      setOpen(false);
      onDone();
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Register a pet</h2>
        <Button variant="ghost" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Close" : "+ New pet"}</Button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            onSubmit={submit}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid gap-4 pt-5 sm:grid-cols-3">
              <Field label="Name" value={form.name} onChange={set("name")} required maxLength={64} placeholder="Pechi" />
              <Field label="Breed" value={form.breed} onChange={set("breed")} maxLength={64} placeholder="Belgian Malinois" />
              <Field label="Birth date" type="date" value={form.birth} onChange={set("birth")} max={new Date().toISOString().slice(0, 10)} />
            </div>
            <Button type="submit" className="mt-4" disabled={sending || !form.name.trim()}>
              {sending ? "Writing to the chain…" : "Register"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </Card>
  );
}
