"use client";
import { useEffect, useState } from "react";
import { read } from "@/lib/chain";
import { ClosingCta, Founders, Hero, Ledger, Ribbon, Roles, Story } from "@/components/landing/sections";

export default function Home() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([read("petCount"), read("logCount")])
      .then(([pets, logs]) => setStats({ pets: Number(pets), logs: Number(logs) }))
      .catch(() => setStats(null)); // chain offline: the ledger shows dashes
  }, []);

  return (
    <>
      <Hero />
      <Ribbon />
      <Story />
      <Roles />
      <Founders />
      <Ledger stats={stats} />
      <ClosingCta />
    </>
  );
}
