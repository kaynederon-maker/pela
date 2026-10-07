"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@/components/WalletProvider";
import { ACCENT_COLORS, Button, Card, ConfirmButton, Field, Gate } from "@/components/ui";
import { api } from "@/lib/client-api";

const ACCENTS = [
  { id: "fawn", label: "Fawn", hint: "Pechi's coat" },
  { id: "sage", label: "Sage", hint: "Park walks" },
  { id: "blush", label: "Blush", hint: "Bella's nose" },
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
  const [form, setForm] = useState({
    displayName: profile?.displayName ?? "",
    email: profile?.email ?? "",
    bio: profile?.bio ?? "",
    accent: profile?.accent ?? "fawn",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const url = `/api/profiles/${address.toLowerCase()}`;

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      setProfile(await api(url, { method: "PUT", body: form }));
      notify(profile ? "Profile updated" : "Profile created 🎉", "success");
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
      setForm({ displayName: "", email: "", bio: "", accent: "fawn" });
      notify("Profile deleted", "success");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-4xl">Your profile</h1>
        <p className="mt-1 text-sm text-muted">
          Stored off-chain, so it's private and easy to change. Your email is only visible to you and admins.
        </p>
      </header>

      <Card>
        <form onSubmit={save} className="space-y-4">
          <Field label="Display name" value={form.displayName} onChange={set("displayName")} maxLength={40} required error={errors.displayName} placeholder="Dr. Rina, DVM" />
          <Field label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} placeholder="you@example.com" />
          <Field as="textarea" rows={3} label="Bio" value={form.bio} onChange={set("bio")} maxLength={280} error={errors.bio} placeholder="Malinois mom, weekend agility enthusiast." />

          <fieldset>
            <legend className="label">Accent colour</legend>
            <div className="grid grid-cols-3 gap-3">
              {ACCENTS.map((a) => (
                <label key={a.id} className={`relative cursor-pointer rounded-2xl border p-3 transition ${form.accent === a.id ? "border-ink" : "border-line bg-white/60"}`}>
                  <input type="radio" name="accent" value={a.id} checked={form.accent === a.id} onChange={set("accent")} className="sr-only" />
                  <motion.span layout className="mb-2 block h-8 rounded-xl" style={{ background: ACCENT_COLORS[a.id] }} />
                  <span className="block text-sm font-medium">{a.label}</span>
                  <span className="block text-xs text-muted">{a.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : profile ? "Save changes" : "Create profile"}</Button>
            {profile && <ConfirmButton type="button" onConfirm={remove}>Delete profile</ConfirmButton>}
          </div>
        </form>
      </Card>

      <p className="text-center font-mono text-xs text-muted">{address}</p>
    </div>
  );
}
