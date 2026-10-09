"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Lock, Trash2 } from "lucide-react";
import { useWallet } from "@/components/WalletProvider";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/fields";
import { ACCENT_COLORS, ConfirmDialog, Gate, PageHeader, Paper, short } from "@/components/pela";
import { CircularSeal } from "@/components/motion";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const ACCENTS = [
  { id: "fawn", label: "Persimmon", hint: "Pela's default" },
  { id: "sage", label: "Moss", hint: "Park walks" },
  { id: "blush", label: "Rosehip", hint: "Bella's nose" },
];

export default function ProfilePage() {
  return (
    <Gate>
      <ProfileForm />
    </Gate>
  );
}

function ProfileForm() {
  const { address, profile, setProfile, notify } = useWallet();
  const blank = { displayName: "", email: "", bio: "", accent: "fawn" };
  const [form, setForm] = useState(profile ? { displayName: profile.displayName, email: profile.email, bio: profile.bio, accent: profile.accent } : blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const url = `/api/profiles/${address.toLowerCase()}`;

  // Live-preview the accent across the app; restore the saved one when leaving unsaved.
  useEffect(() => {
    document.documentElement.dataset.accent = form.accent;
  }, [form.accent]);
  useEffect(() => () => void (document.documentElement.dataset.accent = profile?.accent ?? "fawn"), [profile]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      setProfile(await api(url, { method: "PUT", body: form }));
      notify(profile ? "Profile updated" : "Profile created", "success");
    } catch (err) {
      setErrors(err.details ?? {});
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api(url, { method: "DELETE" });
      setProfile(null);
      setForm(blank);
      notify("Profile deleted", "success");
      return true;
    } catch (err) {
      notify(err.message, "error");
      return false;
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Off-chain · private"
        title="The human"
        accent="behind the leash."
        lede="Your name, email and colour live in Pela's database, not on the blockchain, so you can change or delete them any time."
      />

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <Paper as="form" onSubmit={save} className="grid gap-5">
          <Field label="Display name" value={form.displayName} onChange={set("displayName")} maxLength={40} required error={errors.displayName} placeholder="Dr. Rina, DVM" />
          <Field
            label={
              <>
                Email <Lock className="size-3" />
              </>
            }
            type="email"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
            placeholder="you@example.com"
            hint="Only you and admins can see this."
          />
          <Field as="textarea" rows={3} label="Bio" value={form.bio} onChange={set("bio")} maxLength={280} error={errors.bio} placeholder="Malinois parent, weekend agility enthusiast." />

          <fieldset>
            <legend className="mono-label mb-2 text-muted-foreground">Accent colour</legend>
            <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Accent colour">
              {ACCENTS.map((a) => {
                const active = form.accent === a.id;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    key={a.id}
                    onClick={() => setForm({ ...form, accent: a.id })}
                    className={cn(
                      "group relative overflow-hidden rounded-[18px] border-[1.5px] p-3 text-left transition-[border-color,transform] active:scale-[0.98]",
                      active ? "border-foreground" : "border-border hover:border-foreground/30",
                    )}
                  >
                    <span className="relative mb-3 block h-14 overflow-hidden rounded-[12px]" style={{ background: ACCENT_COLORS[a.id] }}>
                      <AnimatePresence>
                        {active && (
                          <motion.span
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-white/90 text-foreground"
                          >
                            <Check className="size-3.5" strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="block text-sm font-semibold">{a.label}</span>
                    <span className="block text-xs text-muted-foreground">{a.hint}</span>
                  </button>
                );
              })}
            </div>
            {errors.accent && <p className="mt-1.5 text-[13px] text-destructive">{errors.accent}</p>}
          </fieldset>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border pt-5">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {saving ? "Saving…" : profile ? "Save changes" : "Create profile"}
            </Button>
            {profile && (
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10">
                    <Trash2 /> Delete profile
                  </Button>
                }
                title="Delete your profile?"
                description="Your name, email and bio are removed from Pela's database. Your pets and their stamps stay on-chain."
                confirmLabel="Delete profile"
                onConfirm={remove}
              />
            )}
          </div>
        </Paper>

        {/* Live preview */}
        <aside className="lg:sticky lg:top-28">
          <p className="mono-label mb-3 text-muted-foreground">Preview: what vets see</p>
          <motion.div layout className="relative overflow-hidden rounded-[26px] border border-border bg-card p-6 shadow-[0_30px_60px_-34px_rgb(28_33_30/0.5)]">
            <div className="flex items-center gap-4">
              <motion.span
                layout
                className="grid size-16 shrink-0 place-items-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-[0_2px_0_0_var(--primary-shadow)] transition-colors duration-500"
              >
                {(form.displayName || "?").trim().charAt(0).toUpperCase()}
              </motion.span>
              <div className="min-w-0">
                <p className="display truncate text-2xl">{form.displayName || "Your name"}</p>
                <p className="font-mono text-xs text-muted-foreground">{short(address)}</p>
              </div>
            </div>
            <p className={cn("mt-5 min-h-12 pr-12 pb-10 leading-relaxed", form.bio ? "text-foreground/85" : "text-muted-foreground/60 italic")}>
              {form.bio || "A line about you and your animals."}
            </p>
            <CircularSeal text="Pela holder · Pela holder · Pela holder · " size={96} duration={30} className="absolute -right-7 -bottom-7 text-primary-ink opacity-60" />
          </motion.div>
        </aside>
      </div>
    </>
  );
}
