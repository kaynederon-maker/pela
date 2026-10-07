import { test } from "node:test";
import assert from "node:assert/strict";
import { privateKeyToAccount } from "viem/accounts";
import { createSiweMessage } from "viem/siwe";
import { openRepo, validateProfile, normalizeAddress, publicProfile } from "../../src/lib/profiles.js";
import { signSession, verifySession, SESSION_TTL_S } from "../../src/lib/session.js";
import { verifySiweLogin } from "../../src/lib/auth.js";
import { rateLimit } from "../../src/lib/ratelimit.js";

// Well-known Hardhat test key #2 (public, never holds real funds).
const account = privateKeyToAccount("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");
const ADDR = account.address.toLowerCase();
const SECRET = "x".repeat(32);

test("profile CRUD round-trip", () => {
  const repo = openRepo(":memory:");
  assert.equal(repo.get(ADDR), undefined);

  const created = repo.upsert(ADDR, { displayName: "Kay", email: "kay@pela.dev", bio: "Pechi & Bella's human", accent: "fawn" });
  assert.equal(created.displayName, "Kay");
  assert.deepEqual(repo.get(ADDR), created);

  const updated = repo.upsert(ADDR, { ...created, displayName: "Kay D", accent: "sage" });
  assert.equal(updated.displayName, "Kay D");
  assert.equal(updated.accent, "sage");
  assert.equal(updated.createdAt, created.createdAt);

  const page = repo.list();
  assert.equal(page.total, 1);
  assert.equal(page.items[0].address, ADDR);

  assert.equal(repo.remove(ADDR), true);
  assert.equal(repo.remove(ADDR), false);
  assert.equal(repo.get(ADDR), undefined);
});

test("publicProfile hides email", () => {
  assert.equal("email" in publicProfile({ address: ADDR, displayName: "K", email: "a@b.co", bio: "", accent: "fawn" }), false);
});

test("validateProfile accepts good input and rejects bad", () => {
  const good = validateProfile({ displayName: "  Kay ", email: "", bio: "hi", accent: "blush" });
  assert.equal(good.ok, true);
  assert.equal(good.value.displayName, "Kay");

  const bad = validateProfile({ displayName: "", email: "nope", bio: "b".repeat(281), accent: "neon" });
  assert.equal(bad.ok, false);
  assert.deepEqual(Object.keys(bad.errors).sort(), ["accent", "bio", "displayName", "email"]);

  assert.equal(validateProfile(null).ok, false);
  assert.equal(validateProfile({ displayName: { $gt: "" } }).ok, false);
});

test("normalizeAddress", () => {
  assert.equal(normalizeAddress(account.address), ADDR);
  assert.equal(normalizeAddress("0x123"), null);
  assert.equal(normalizeAddress(undefined), null);
});

test("nonces are single-use and expire", () => {
  const repo = openRepo(":memory:");
  const t0 = 1_000_000;
  repo.createNonce("abc12345", t0);
  assert.equal(repo.consumeNonce("abc12345", t0 + 1000), true);
  assert.equal(repo.consumeNonce("abc12345", t0 + 2000), false);

  repo.createNonce("old12345", t0);
  assert.equal(repo.consumeNonce("old12345", t0 + 11 * 60 * 1000), false);
});

test("session tokens verify, reject tampering and expire", () => {
  const now = Date.now();
  const token = signSession(account.address, SECRET, now);
  assert.equal(verifySession(token, SECRET, now), ADDR);
  assert.equal(verifySession(token, "y".repeat(32), now), null);
  assert.equal(verifySession(token.replace(ADDR, "0x" + "0".repeat(40)), SECRET, now), null);
  assert.equal(verifySession(token, SECRET, now + (SESSION_TTL_S + 1) * 1000), null);
  assert.equal(verifySession("garbage", SECRET, now), null);
  assert.equal(verifySession(undefined, SECRET, now), null);
});

async function signedLogin(overrides = {}) {
  const message = createSiweMessage({
    domain: "localhost:3000",
    address: account.address,
    uri: "http://localhost:3000",
    version: "1",
    chainId: 31337,
    nonce: "nonce1234",
    issuedAt: new Date(),
    ...overrides,
  });
  return { message, signature: await account.signMessage({ message }) };
}

test("SIWE login: valid signature signs in once, replay fails", async () => {
  const used = new Set();
  const consumeNonce = (n) => (used.has(n) ? false : (used.add(n), true));
  const login = await signedLogin();
  const args = { ...login, domain: "localhost:3000", chainId: 31337, consumeNonce };
  assert.equal(await verifySiweLogin(args), ADDR);
  assert.equal(await verifySiweLogin(args), null);
});

test("SIWE login rejects wrong domain, chain, stale message and forged signature", async () => {
  const consumeNonce = () => true;
  const base = { domain: "localhost:3000", chainId: 31337, consumeNonce };
  const login = await signedLogin();

  assert.equal(await verifySiweLogin({ ...login, ...base, domain: "evil.example" }), null);
  assert.equal(await verifySiweLogin({ ...login, ...base, chainId: 1 }), null);

  const stale = await signedLogin({ issuedAt: new Date(Date.now() - 11 * 60 * 1000) });
  assert.equal(await verifySiweLogin({ ...stale, ...base }), null);

  const other = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
  const forged = await other.signMessage({ message: login.message });
  assert.equal(await verifySiweLogin({ message: login.message, signature: forged, ...base }), null);
  assert.equal(await verifySiweLogin({ message: 42, signature: "0x", ...base }), null);
});

test("rateLimit allows up to the limit per window", () => {
  const now = 5_000;
  for (let i = 0; i < 3; i++) assert.equal(rateLimit("t", 3, 1000, now), true);
  assert.equal(rateLimit("t", 3, 1000, now), false);
  assert.equal(rateLimit("t", 3, 1000, now + 1000), true);
});
