"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MotionConfig } from "framer-motion";
import { toast } from "sonner";
import { BaseError, ContractFunctionRevertedError, createWalletClient, custom, getAddress } from "viem";
import { createSiweMessage } from "viem/siwe";
import { RPC_URL, chain, getRoles, pelaContract, publicClient } from "@/lib/chain";
import { api } from "@/lib/client-api";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const NO_ROLES = { admin: false, editor: false, viewer: false };

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

  const notify = useCallback((text, tone = "info") => {
    if (tone === "success") toast.success(text);
    else if (tone === "error") toast.error(text);
    else toast(text);
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
      notify("Welcome to Pela. Your passport is open.", "success");
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
      // One toast that follows the transaction from wallet prompt to block.
      const id = toast.loading("Confirm in your wallet…");
      try {
        const { request } = await publicClient.simulateContract({ ...pelaContract, functionName, args, account: address });
        const wallet = createWalletClient({ account: address, chain, transport: custom(window.ethereum) });
        const hash = await wallet.writeContract(request);
        toast.loading("Writing to the chain…", { id, description: `${hash.slice(0, 10)}…${hash.slice(-6)}` });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") throw new Error("Transaction reverted");
        toast.success(successText ?? "Done", { id, description: `Block ${receipt.blockNumber}` });
        return receipt;
      } catch (err) {
        toast.error(errorText(err), { id, description: undefined });
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
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </WalletContext.Provider>
    </MotionConfig>
  );
}
