"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { isAddress } from "viem";
import { ArrowLeft, BookOpen, KeyRound, Loader2, Pencil, Settings2, Stamp as StampIcon, Trash2, UserMinus, UserPlus } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Label } from "@/components/ui/fields";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog, Empty, Gate, Loading, Paper, fmtDate, petArt, short } from "@/components/pela";
import { KINDS, PassportCard, Stamp } from "@/components/passport";
import { EASE_OUT, Tilt } from "@/components/motion";
import { loadLogs, read } from "@/lib/chain";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const toDateInput = (secs) => (secs ? new Date(Number(secs) * 1000).toISOString().slice(0, 10) : "");
const dateToSecs = (value) => (value ? BigInt(Math.floor(new Date(value).getTime() / 1000)) : 0n);
const stampDate = (secs) => new Date(Number(secs) * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

async function displayNames(addresses) {
  const unique = [...new Set(addresses.map((a) => a.toLowerCase()))];
  const entries = await Promise.all(unique.map(async (a) => [a, await api(`/api/profiles/${a}`).then((p) => p.displayName).catch(() => short(a))]));
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
  const [tab, setTab] = useState("stamps");

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

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === "loading") return <Loading label="Opening the passport…" />;
  if (state.status === "missing") {
    return (
      <Empty title="No passport with that number" className="mx-auto max-w-lg">
        <Link href="/dashboard" className="font-semibold text-primary-ink underline underline-offset-4">
          Back to your pack
        </Link>
      </Empty>
    );
  }

  const { pet, logs, assigned, names } = state;
  const petId = BigInt(id);
  const me = address.toLowerCase();
  const isOwner = pet.owner.toLowerCase() === me;
  const canManage = pet.active && (isOwner || roles.admin);
  const canLog = pet.active && roles.editor && assigned;
  const lastStamp = logs[0];

  return (
    <>
      <Link href="/dashboard" className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" /> Your pack
      </Link>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,430px)_1fr] lg:gap-14">
        {/* Left page: the ID */}
        <aside className="lg:sticky lg:top-28">
          <Tilt amplitude={7}>
            <PassportCard pet={pet} id={Number(id)} image={petArt(pet)} ownerName={names[pet.owner.toLowerCase()]} />
          </Tilt>
          <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-[18px] border border-border bg-border text-center">
            {[
              ["Stamps", logs.length],
              ["Last visit", lastStamp ? fmtDate(lastStamp.timestamp) : "None yet"],
              ["You are", isOwner ? "Holder" : assigned ? "Visa" : "Admin"],
            ].map(([k, v]) => (
              <div key={k} className="bg-card px-2 py-4">
                <dt className="mono-label text-[9.5px] text-muted-foreground">{k}</dt>
                <dd className="mt-1 truncate font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>

        {/* Right page: stamps + settings */}
        <section className="min-w-0">
          <Tabs value={tab} onValueChange={setTab}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="stamps">
                  <BookOpen /> Stamp book
                </TabsTrigger>
                {canManage && (
                  <TabsTrigger value="settings">
                    <Settings2 /> Settings
                  </TabsTrigger>
                )}
              </TabsList>
              {canLog && tab === "stamps" && <StampDialog petId={petId} onDone={load} />}
            </div>

            <TabsContent value="stamps">
              <StampBook logs={logs} names={names} canEditOwn={canLog} isAdmin={roles.admin} me={me} onDone={load} petName={pet.name} />
            </TabsContent>
            {canManage && (
              <TabsContent value="settings">
                <Settings petId={petId} pet={pet} onDone={load} />
              </TabsContent>
            )}
          </Tabs>
        </section>
      </div>
    </>
  );
}

/* ── Stamp book ───────────────────────────────────────────────────────── */
function StampBook({ logs, names, canEditOwn, isAdmin, me, onDone, petName }) {
  const { write } = useWallet();
  const [filter, setFilter] = useState(-1);
  const kindsPresent = useMemo(() => [...new Set(logs.map((l) => Number(l.kind)))].sort(), [logs]);
  const shown = filter < 0 ? logs : logs.filter((l) => Number(l.kind) === filter);

  if (!logs.length) {
    return (
      <Empty icon={StampIcon} title="No stamps yet" className="mt-2">
        {petName}'s first vet or trainer visit will land here.
      </Empty>
    );
  }

  return (
    <div className="ruled rounded-[26px] border border-border bg-card p-5 sm:p-7">
      {kindsPresent.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2" role="radiogroup" aria-label="Filter stamps">
          {[-1, ...kindsPresent].map((k) => {
            const active = filter === k;
            const kind = KINDS[k];
            return (
              <button
                key={k}
                role="radio"
                aria-checked={active}
                onClick={() => setFilter(k)}
                className={cn(
                  "relative flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors",
                  active ? "border-foreground text-background" : "border-border bg-background text-foreground/75 hover:text-foreground",
                )}
              >
                {active && <motion.span layoutId="stamp-filter" className="absolute inset-0 rounded-full bg-foreground" transition={{ type: "spring", bounce: 0.2, duration: 0.45 }} />}
                <span className="relative flex items-center gap-1.5">
                  {kind && <kind.Icon className="size-3.5" />}
                  {kind ? kind.label : "All"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <ol className="grid gap-4">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((log, i) => {
            const author = names[log.editor.toLowerCase()] ?? short(log.editor);
            const mine = log.editor.toLowerCase() === me;
            const canEdit = isAdmin || (canEditOwn && mine);
            return (
              <motion.li
                key={log.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT, delay: Math.min(i, 6) * 0.04 } }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                className="grid grid-cols-[auto_1fr] items-center gap-5 rounded-[20px] bg-background/70 p-4 sm:gap-7 sm:p-5"
              >
                <Stamp kind={Number(log.kind)} date={stampDate(log.timestamp)} rotate={i % 2 ? 6 : -7} size="sm" delay={0.05} />
                <div className="min-w-0">
                  <p className="text-[1.05rem] leading-snug whitespace-pre-wrap">{log.note}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      by <strong className="font-semibold text-foreground">{author}</strong>
                    </span>
                    {log.updatedAt > 0n && <Badge variant="muted">edited</Badge>}
                  </p>
                  {canEdit && (
                    <div className="mt-3 flex gap-1">
                      <StampDialog log={log} onDone={onDone} />
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                            <Trash2 /> Withdraw
                          </Button>
                        }
                        title="Withdraw this stamp?"
                        description="It disappears from the stamp book. The withdrawal itself is recorded on-chain."
                        confirmLabel="Withdraw stamp"
                        onConfirm={async () => {
                          const ok = await write("deleteCareLog", [BigInt(log.id)], "Stamp withdrawn");
                          if (ok) onDone();
                          return Boolean(ok);
                        }}
                      />
                    </div>
                  )}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </div>
  );
}

/** Add (petId) or edit (log) a stamp, in a dialog with a live stamp preview. */
function StampDialog({ petId, log, onDone }) {
  const { write } = useWallet();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(log ? Number(log.kind) : 0);
  const [note, setNote] = useState(log?.note ?? "");
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    const ok = log
      ? await write("updateCareLog", [BigInt(log.id), kind, note.trim()], "Stamp updated")
      : await write("addCareLog", [petId, kind, note.trim()], "Stamped");
    setSending(false);
    if (ok) {
      if (!log) setNote("");
      setOpen(false);
      onDone();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !sending && setOpen(v)}>
      <DialogTrigger asChild>
        {log ? (
          <Button variant="ghost" size="sm">
            <Pencil /> Edit
          </Button>
        ) : (
          <Button>
            <StampIcon /> Stamp the passport
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <p className="mono-label text-primary-ink">{log ? "Correct a stamp" : "New stamp"}</p>
          <DialogTitle>{log ? "Edit this visit" : "What happened at this visit?"}</DialogTitle>
          <DialogDescription>Signed by your wallet and dated by the block it lands in.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-5">
          <div>
            <Label>Care type</Label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Care type">
              {KINDS.map((k, i) => (
                <button
                  type="button"
                  key={k.label}
                  role="radio"
                  aria-checked={kind === i}
                  onClick={() => setKind(i)}
                  className={cn(
                    "flex h-12 items-center justify-center gap-2 rounded-[14px] border-[1.5px] text-sm font-semibold transition-[border-color,background-color,transform] active:scale-[0.97]",
                    kind === i ? "border-foreground bg-accent" : "border-border bg-card hover:border-foreground/30",
                  )}
                >
                  <k.Icon className="size-4" style={{ color: k.ink }} /> {k.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid items-start gap-5 sm:grid-cols-[1fr_auto]">
            <div>
              <Field as="textarea" label="Note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} required placeholder="Rabies booster, next one due in 12 months" />
              <p className="mt-1.5 text-right font-mono text-[11px] text-muted-foreground">{note.length}/280</p>
            </div>
            <div className="hidden place-items-center pt-6 sm:grid" aria-hidden>
              <AnimatePresence mode="wait">
                <motion.div key={kind} initial={{ opacity: 0, scale: 1.3 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.25 }}>
                  <Stamp kind={kind} date="PREVIEW" rotate={-6} land={false} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending || !note.trim()}>
              {sending ? <Loader2 className="animate-spin" /> : <StampIcon />}
              {sending ? "Stamping…" : log ? "Save stamp" : "Stamp it"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Holder settings ──────────────────────────────────────────────────── */
function Settings({ petId, pet, onDone }) {
  const { write } = useWallet();
  const [form, setForm] = useState({ name: pet.name, breed: pet.breed, birth: toDateInput(pet.birthDate) });
  const [editor, setEditor] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const editorValid = isAddress(editor.trim());

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    if (await write("updatePet", [petId, form.name.trim(), form.breed.trim(), dateToSecs(form.birth)], "Passport details saved")) onDone();
    setSaving(false);
  }

  async function assign(assigned) {
    if (await write("setEditor", [petId, editor.trim(), assigned], assigned ? "Visa granted" : "Visa revoked")) {
      setEditor("");
      onDone();
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Paper as="form" onSubmit={save} className="grid content-start gap-4">
        <h3 className="display text-2xl">Passport details</h3>
        <Field label="Name" value={form.name} onChange={set("name")} required maxLength={64} />
        <Field label="Breed" value={form.breed} onChange={set("breed")} maxLength={64} />
        <Field label="Birthday" type="date" value={form.birth} onChange={set("birth")} />
        <Button type="submit" className="mt-1 w-fit" disabled={saving || !form.name.trim()}>
          {saving && <Loader2 className="animate-spin" />} Save details
        </Button>
      </Paper>

      <div className="grid content-start gap-5">
        <Paper className="grid gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-accent text-primary-ink">
              <KeyRound className="size-5" />
            </span>
            <div>
              <h3 className="display text-2xl">Vet & trainer visas</h3>
              <p className="text-sm text-muted-foreground">They must already hold the Editor role.</p>
            </div>
          </div>
          <Field label="Wallet address" value={editor} onChange={(e) => setEditor(e.target.value)} placeholder="0x…" error={editor && !editorValid ? "That isn't a valid wallet address" : null} spellCheck={false} className="font-mono" />
          <div className="flex flex-wrap gap-2">
            <Button disabled={!editorValid} onClick={() => assign(true)}>
              <UserPlus /> Grant visa
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={editorValid ? -1 : 0}>
                  <Button variant="outline" disabled={!editorValid} onClick={() => assign(false)}>
                    <UserMinus /> Revoke
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Their existing stamps stay, but they can't add or edit any more.</TooltipContent>
            </Tooltip>
          </div>
        </Paper>

        <Paper className="flex flex-wrap items-center justify-between gap-4 border-dashed">
          <div>
            <h3 className="font-semibold">Retire this passport</h3>
            <p className="text-sm text-muted-foreground">The record and its stamps stay on-chain, read-only.</p>
          </div>
          <ConfirmDialog
            trigger={<Button variant="destructive">Retire {pet.name}</Button>}
            title={`Retire ${pet.name}'s passport?`}
            description="Nobody will be able to edit it or add stamps afterwards. This can't be undone."
            confirmLabel="Retire passport"
            onConfirm={async () => {
              const ok = await write("deactivatePet", [petId], `${pet.name}'s passport is retired`);
              if (ok) onDone();
              return Boolean(ok);
            }}
          />
        </Paper>
      </div>
    </div>
  );
}
