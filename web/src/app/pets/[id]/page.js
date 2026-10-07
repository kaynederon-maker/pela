"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { isAddress } from "viem";
import { useWallet } from "@/components/WalletProvider";
import { Art, Badge, Button, Card, ConfirmButton, Field, Gate, Loading, fmtDate, petArt, short } from "@/components/ui";
import { CARE_KINDS, loadLogs, read } from "@/lib/chain";
import { api } from "@/lib/client-api";

const toDateInput = (secs) => (secs ? new Date(Number(secs) * 1000).toISOString().slice(0, 10) : "");
const dateToSecs = (value) => (value ? BigInt(Math.floor(new Date(value).getTime() / 1000)) : 0n);

async function displayNames(addresses) {
  const unique = [...new Set(addresses.map((a) => a.toLowerCase()))];
  const entries = await Promise.all(
    unique.map(async (a) => [a, await api(`/api/profiles/${a}`).then((p) => p.displayName).catch(() => short(a))]),
  );
  return Object.fromEntries(entries);
}

export default function PetPage() {
  return (
    <Gate>
      <Pet />
    </Gate>
  );
}

function Pet() {
  const { id } = useParams();
  const { address, roles } = useWallet();
  const [state, setState] = useState({ status: "loading" });

  const load = useCallback(async () => {
    if (!/^\d+$/.test(id)) return setState({ status: "missing" });
    const petId = BigInt(id);
    try {
      const [pet, logs, assigned] = await Promise.all([read("getPet", [petId]), loadLogs(petId), read("isAssigned", [petId, address])]);
      const names = await displayNames([pet.owner, ...logs.map((l) => l.editor)]);
      setState({ status: "ready", pet, logs, assigned, names });
    } catch {
      setState({ status: "missing" });
    }
  }, [id, address]);

  useEffect(() => { load(); }, [load]);

  if (state.status === "loading") return <Loading />;
  if (state.status === "missing") {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h1 className="font-display text-2xl">No pet with that ID</h1>
        <Link href="/dashboard" className="mt-3 inline-block text-sm text-accent underline">Back to dashboard</Link>
      </Card>
    );
  }

  const { pet, logs, assigned, names } = state;
  const petId = BigInt(id);
  const me = address.toLowerCase();
  const isOwner = pet.owner.toLowerCase() === me;
  const canManage = pet.active && (isOwner || roles.admin);
  const canLog = pet.active && roles.editor && assigned;

  return (
    <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
      <aside className="space-y-5">
        <Card className="overflow-hidden p-0">
          <Art name={petArt(pet)} alt={`${pet.name}`} className="aspect-square w-full" />
          <div className="space-y-1 p-6">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl">{pet.name}</h1>
              {!pet.active && <Badge tone="muted">deactivated</Badge>}
            </div>
            <p className="text-sm text-muted">{pet.breed || "Breed unknown"}</p>
            <dl className="grid grid-cols-2 gap-3 pt-4 text-sm">
              <div><dt className="label">Born</dt><dd>{fmtDate(pet.birthDate)}</dd></div>
              <div><dt className="label">Registered</dt><dd>{fmtDate(pet.createdAt)}</dd></div>
              <div className="col-span-2"><dt className="label">Owner</dt><dd>{names[pet.owner.toLowerCase()]} {isOwner && <Badge>you</Badge>}</dd></div>
              <div className="col-span-2"><dt className="label">Pela ID</dt><dd className="font-mono">#{id}</dd></div>
            </dl>
          </div>
        </Card>
        {canManage && <ManagePet petId={petId} pet={pet} onDone={load} />}
      </aside>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl">Care log</h2>
          <span className="text-sm text-muted">{logs.length} entr{logs.length === 1 ? "y" : "ies"}</span>
        </div>
        {canLog && <LogForm petId={petId} onDone={load} />}
        {logs.length === 0 ? (
          <p className="py-10 text-center text-muted">No care logged yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l-2 border-dashed border-line pl-6">
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <LogItem
                  key={log.id}
                  log={log}
                  author={names[log.editor.toLowerCase()] ?? short(log.editor)}
                  canEdit={roles.admin || (canLog && log.editor.toLowerCase() === me)}
                  onDone={load}
                />
              ))}
            </AnimatePresence>
          </ol>
        )}
      </section>
    </div>
  );
}

function LogItem({ log, author, canEdit, onDone }) {
  const { write } = useWallet();
  const [editing, setEditing] = useState(false);
  const kind = CARE_KINDS[log.kind];

  return (
    <motion.li layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} className="relative">
      <span className="absolute -left-[2.1rem] top-4 grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-sm ring-4 ring-cream">{kind.emoji}</span>
      <div className="card p-5">
        {editing ? (
          <LogForm initial={log} onDone={() => { setEditing(false); onDone(); }} onCancel={() => setEditing(false)} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge>{kind.label}</Badge>
              <span className="text-xs text-muted">
                {fmtDate(log.timestamp)} · by {author}
                {log.updatedAt > 0n && " · edited"}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap">{log.note}</p>
            {canEdit && (
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
                <ConfirmButton onConfirm={async () => (await write("deleteCareLog", [BigInt(log.id)], "Log removed")) && onDone()}>Delete</ConfirmButton>
              </div>
            )}
          </>
        )}
      </div>
    </motion.li>
  );
}

/** Add (petId) or edit (initial) a care log. */
function LogForm({ petId, initial, onDone, onCancel }) {
  const { write } = useWallet();
  const [kind, setKind] = useState(initial ? Number(initial.kind) : 0);
  const [note, setNote] = useState(initial?.note ?? "");
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    const ok = initial
      ? await write("updateCareLog", [BigInt(initial.id), kind, note.trim()], "Log updated")
      : await write("addCareLog", [petId, kind, note.trim()], "Logged! 🐾");
    setSending(false);
    if (ok) {
      if (!initial) setNote("");
      onDone();
    }
  }

  const form = (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Care type">
        {CARE_KINDS.map((k, i) => (
          <button
            type="button"
            key={k.label}
            role="radio"
            aria-checked={kind === i}
            onClick={() => setKind(i)}
            className={`rounded-full border px-3 py-1 text-sm transition ${kind === i ? "border-accent bg-accent-soft" : "border-line bg-white/70"}`}
          >
            {k.emoji} {k.label}
          </button>
        ))}
      </div>
      <Field as="textarea" label="Note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} required placeholder="Rabies booster, next due in 12 months" />
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={sending || !note.trim()}>{sending ? "Writing…" : initial ? "Save" : "Add to log"}</Button>
        {onCancel && <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>}
        <span className="ml-auto text-xs text-muted">{note.length}/280</span>
      </div>
    </form>
  );

  return initial ? form : <Card><h3 className="mb-4 font-display text-xl">New entry</h3>{form}</Card>;
}

function ManagePet({ petId, pet, onDone }) {
  const { write } = useWallet();
  const [form, setForm] = useState({ name: pet.name, breed: pet.breed, birth: toDateInput(pet.birthDate) });
  const [editor, setEditor] = useState("");
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const editorValid = isAddress(editor.trim());

  async function save(e) {
    e.preventDefault();
    if (await write("updatePet", [petId, form.name.trim(), form.breed.trim(), dateToSecs(form.birth)], "Saved")) onDone();
  }

  async function assign(assigned) {
    if (await write("setEditor", [petId, editor.trim(), assigned], assigned ? "Vet/trainer assigned" : "Access removed")) {
      setEditor("");
      onDone();
    }
  }

  return (
    <Card className="space-y-6">
      <form onSubmit={save} className="space-y-3">
        <h3 className="font-display text-xl">Edit details</h3>
        <Field label="Name" value={form.name} onChange={set("name")} required maxLength={64} />
        <Field label="Breed" value={form.breed} onChange={set("breed")} maxLength={64} />
        <Field label="Birth date" type="date" value={form.birth} onChange={set("birth")} />
        <Button type="submit" disabled={!form.name.trim()}>Save</Button>
      </form>

      <div className="space-y-3 border-t border-line pt-5">
        <h3 className="font-display text-xl">Vet / trainer access</h3>
        <Field label="Wallet address" value={editor} onChange={(e) => setEditor(e.target.value)} placeholder="0x…" error={editor && !editorValid ? "Not a valid address" : null} />
        <div className="flex gap-2">
          <Button disabled={!editorValid} onClick={() => assign(true)}>Assign</Button>
          <Button variant="ghost" disabled={!editorValid} onClick={() => assign(false)}>Remove</Button>
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <ConfirmButton onConfirm={async () => (await write("deactivatePet", [petId], `${pet.name} deactivated`)) && onDone()}>
          Deactivate {pet.name}
        </ConfirmButton>
        <p className="mt-2 text-xs text-muted">The record and its history stay on-chain, read-only.</p>
      </div>
    </Card>
  );
}
