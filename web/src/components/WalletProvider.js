"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { BaseError, ContractFunctionRevertedError, createWalletClient, custom, getAddress } from "viem";
import { createSiweMessage } from "viem/siwe";
import { RPC_URL, chain, getRoles, pelaContract, publicClient } from "@/lib/chain";
import { api } from "@/lib/client-api";

const NO_ROLES = { admin: false, editor: false, viewer: false };
const TOAST_MS = 4500;

const FRIENDLY_ERRORS = {
  AccessControlUnauthorizedAccount: "Your wallet doesn't have the role for that.",
  NotPetOwnerOrAdmin: "Only the pet's owner or an admin can do that.",
  NotAssignedEditor: "You're not assigned to this pet yet.",
  NotLogAuthorOrAdmin: "Only the log's author (still assigned) or an admin can change it.",
  NotAnEditor: "That address isn't a registered vet/trainer.",
  PetInactive: "This pet has been deactivated.",
  PetNotFound: "Pet not found.",
  LogNotFound: "Care log not found.",
  InvalidLength: "Text is empty or too long.",
  EnforcedPause: "Pela is paused by an admin right now.",
};

export function errorText(err) {
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    const name = revert?.data?.errorName;
    if (name) return FRIENDLY_ERRORS[name] ?? name;
    return err.shortMessage;
  }
  if (err?.code === 4001) return "Request cancelled in your wallet.";
  return err?.message ?? "Something went wrong";
}

async function ensureChain(eth) {
  const chainId = `0x${chain.id.toString(16)}`;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  } catch (err) {
    if (err.code !== 4902) throw err;
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [{ chainId, chainName: chain.name, nativeCurrency: chain.nativeCurrency, rpcUrls: [RPC_URL] }],
    });
  }
}

const WalletContext = createContext(null);
export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null); // connected account (checksummed)
  const [session, setSession] = useState(null); // signed-in account (lowercase), from the server cookie
  const [roles, setRoles] = useState(NO_ROLES);
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((text, tone = "info") => {
    const id = crypto.randomUUID();
    setToasts((all) => [...all, { id, text, tone }]);
    setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), TOAST_MS);
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const me = await api("/api/me");
      setSession(me.address);
      setProfile(me.profile);
    } catch {
      setSession(null);
    }
  }, []);

  const refreshRoles = useCallback(async () => {
    if (!address) return setRoles(NO_ROLES);
    try {
      setRoles(await getRoles(address));
    } catch {
      notify("Can't reach the blockchain node. Is `npm run node` running?", "error");
    }
  }, [address, notify]);

  useEffect(() => { loadMe(); }, [loadMe]);
  useEffect(() => { refreshRoles(); }, [refreshRoles]);
  useEffect(() => { document.documentElement.dataset.accent = profile?.accent ?? "fawn"; }, [profile]);

  // Restore an already-authorised account silently and follow account switches.
  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    const onAccounts = (accounts) => setAddress(accounts[0] ? getAddress(accounts[0]) : null);
    eth.request({ method: "eth_accounts" }).then(onAccounts).catch(() => {});
    eth.on?.("accountsChanged", onAccounts);
    return () => eth.removeListener?.("accountsChanged", onAccounts);
  }, []);

  const signIn = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return notify("Install MetaMask to sign in.", "error");
    setBusy(true);
    try {
      const [first] = await eth.request({ method: "eth_requestAccounts" });
      const account = getAddress(first);
      await ensureChain(eth);
      setAddress(account);

      const { nonce } = await api("/api/auth/nonce");
      const message = createSiweMessage({
        domain: window.location.host,
        address: account,
        statement: "Sign in to Pela. This doesn't cost gas.",
        uri: window.location.origin,
        version: "1",
        chainId: chain.id,
        nonce,
        issuedAt: new Date(),
      });
      const wallet = createWalletClient({ account, chain, transport: custom(eth) });
      const signature = await wallet.signMessage({ account, message });
      await api("/api/auth/verify", { method: "POST", body: { message, signature } });
      await loadMe();
      notify("Welcome to Pela 🐾", "success");
    } catch (err) {
      notify(errorText(err), "error");
    } finally {
      setBusy(false);
    }
  }, [loadMe, notify]);

  const signOut = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setSession(null);
    setProfile(null);
  }, []);

  /** Simulate (to surface revert reasons), send, wait. Returns the receipt or null. */
  const write = useCallback(
    async (functionName, args, successText) => {
      if (!address || !window.ethereum) {
        notify("Connect your wallet first.", "error");
        return null;
      }
      try {
        const { request } = await publicClient.simulateContract({ ...pelaContract, functionName, args, account: address });
        const wallet = createWalletClient({ account: address, chain, transport: custom(window.ethereum) });
        const hash = await wallet.writeContract(request);
        notify("Transaction sent. Waiting for the block…");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") throw new Error("Transaction reverted");
        if (successText) notify(successText, "success");
        return receipt;
      } catch (err) {
        notify(errorText(err), "error");
        return null;
      }
    },
    [address, notify],
  );

  const signedIn = Boolean(session && address && session === address.toLowerCase());

  const value = useMemo(
    () => ({ address, signedIn, roles, profile, setProfile, busy, signIn, signOut, write, notify, refreshRoles }),
    [address, signedIn, roles, profile, busy, signIn, signOut, write, notify, refreshRoles],
  );

  return (
    <MotionConfig reducedMotion="user">
      <WalletContext.Provider value={value}>
        {children}
        <Toasts toasts={toasts} />
      </WalletContext.Provider>
    </MotionConfig>
  );
}

const TONES = {
  info: "bg-ink text-cream",
  success: "bg-accent text-white",
  error: "bg-red-600 text-white",
};

function Toasts({ toasts }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.45 }}
            className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm shadow-lg ${TONES[t.tone]}`}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
