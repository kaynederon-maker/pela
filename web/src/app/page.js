"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useWallet } from "@/components/WalletProvider";
import { Art, Button } from "@/components/ui";

const ROLES = [
  { emoji: "🏡", title: "Owners", text: "Register your pets on-chain, choose who can write to their record, and keep your profile in one place." },
  { emoji: "🩺", title: "Vets & trainers", text: "Log vaccinations, meals and training milestones for the pets you're trusted with." },
  { emoji: "🛡️", title: "Admins", text: "Grant roles, look after users and pause the system if something looks off." },
];

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const rise = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

export default function Home() {
  const { signedIn, signIn, busy } = useWallet();

  return (
    <div className="space-y-24">
      <section className="grid items-center gap-10 pt-6 md:grid-cols-[1.1fr_1fr]">
        <motion.div variants={stagger} initial="initial" animate="animate">
          <motion.p variants={rise} className="mb-4 inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-medium tracking-wide">
            Pet identity · Care log · On-chain
          </motion.p>
          <motion.h1 variants={rise} className="font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            Every paw,<br />
            <span className="italic text-accent">on the record.</span>
          </motion.h1>
          <motion.p variants={rise} className="mt-5 max-w-md text-lg text-muted">
            Pela gives every pet a permanent identity and a care history that you, your vet and your trainer can trust.
          </motion.p>
          <motion.div variants={rise} className="mt-8 flex gap-3">
            {signedIn ? (
              <Link href="/dashboard"><Button>Open dashboard →</Button></Link>
            ) : (
              <Button onClick={signIn} disabled={busy}>{busy ? "Check your wallet…" : "Connect wallet"}</Button>
            )}
            <a href="#meet"><Button variant="ghost">Meet Pechi & Bella</Button></a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, rotate: 2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-accent-soft blur-2xl" />
          <Art name="hero" alt="A Belgian Malinois and a mixed-breed dog sitting together" className="aspect-[4/3] w-full rounded-[2rem] shadow-xl" />
        </motion.div>
      </section>

      <motion.section variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-80px" }} className="grid gap-5 md:grid-cols-3">
        {ROLES.map((r) => (
          <motion.div key={r.title} variants={rise} whileHover={{ y: -4 }} className="card">
            <div className="mb-3 text-3xl">{r.emoji}</div>
            <h3 className="font-display text-xl">{r.title}</h3>
            <p className="mt-2 text-sm text-muted">{r.text}</p>
          </motion.div>
        ))}
      </motion.section>

      <section id="meet" className="scroll-mt-24">
        <h2 className="mb-8 text-center font-display text-4xl">Inspired by two good dogs</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { name: "pechi", title: "Pechi", text: "Belgian Malinois. Endless energy, perfect recall (most days), and a training log longer than your arm." },
            { name: "bella", title: "Bella", text: "Rescued stray, all heart. Small, brave, snack connoisseur, and never far from Pechi's side." },
          ].map((dog, i) => (
            <motion.article
              key={dog.name}
              initial={{ opacity: 0, x: i ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="card overflow-hidden p-0"
            >
              <Art name={dog.name} alt={`${dog.title}, portrait`} className="aspect-[16/10] w-full" />
              <div className="p-6">
                <h3 className="font-display text-2xl">{dog.title}</h3>
                <p className="mt-2 text-sm text-muted">{dog.text}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}
