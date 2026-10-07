// End-to-end API test. Needs: `npm run node` + `npm run deploy:local` (contracts/) and `npm run dev` (web/).
import { test } from "node:test";
import assert from "node:assert/strict";
import { privateKeyToAccount } from "viem/accounts";
import { createSiweMessage } from "viem/siwe";

const BASE = process.env.PELA_URL ?? "http://localhost:3000";
// Public Hardhat dev keys: #0 = admin, #2 = owner (seeded by deploy.js).
const admin = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
const owner = privateKeyToAccount("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");

async function call(path, { method = "GET", body, cookie } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body && { "Content-Type": "application/json" }), ...(cookie && { Cookie: cookie }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, json: await res.json(), res };
}

async function signIn(account) {
  const { json } = await call("/api/auth/nonce");
  const message = createSiweMessage({
    domain: new URL(BASE).host,
    address: account.address,
    uri: BASE,
    version: "1",
    chainId: 31337,
    nonce: json.data.nonce,
    issuedAt: new Date(),
  });
  const login = { message, signature: await account.signMessage({ message }) };
  const { status, res } = await call("/api/auth/verify", { method: "POST", body: login });
  assert.equal(status, 200);
  const cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  return { cookie, login };
}

test("wallet login, profile CRUD and role checks", async () => {
  const me = owner.address.toLowerCase();
  const path = `/api/profiles/${me}`;
  const profile = { displayName: "Pechi & Bella's human", email: "owner@pela.dev", bio: "Two dogs, one ledger.", accent: "sage" };

  // Unauthenticated writes are refused.
  assert.equal((await call(path, { method: "PUT", body: profile })).status, 401);

  const { cookie, login } = await signIn(owner);
  assert.equal((await call("/api/me", { cookie })).json.data.address, me);

  // Replaying the same signed message fails (nonce burned).
  assert.equal((await call("/api/auth/verify", { method: "POST", body: login })).status, 401);

  // Create, read, update.
  let r = await call(path, { method: "PUT", body: profile, cookie });
  assert.equal(r.status, 200);
  assert.equal(r.json.data.displayName, profile.displayName);

  assert.equal((await call(path, { cookie })).json.data.email, profile.email);
  assert.equal((await call(path)).json.data.email, undefined, "email hidden from the public");

  r = await call(path, { method: "PUT", body: { ...profile, bio: "Updated" }, cookie });
  assert.equal(r.json.data.bio, "Updated");

  // Validation errors come back per field.
  r = await call(path, { method: "PUT", body: { displayName: "", email: "bad" }, cookie });
  assert.equal(r.status, 400);
  assert.ok(r.json.details.displayName && r.json.details.email);

  // A non-admin can't touch someone else's profile or list users.
  assert.equal((await call(`/api/profiles/${admin.address}`, { method: "PUT", body: profile, cookie })).status, 403);
  assert.equal((await call("/api/profiles", { cookie })).status, 403);

  // Admin can list and delete any profile.
  const { cookie: adminCookie } = await signIn(admin);
  r = await call("/api/profiles", { cookie: adminCookie });
  assert.equal(r.status, 200);
  assert.ok(r.json.data.items.some((p) => p.address === me));
  assert.equal((await call(path, { method: "DELETE", cookie: adminCookie })).status, 200);
  assert.equal((await call(path)).status, 404);

  // Bad input.
  assert.equal((await call("/api/profiles/not-an-address")).status, 400);

  // Logout clears the session.
  await call("/api/auth/logout", { method: "POST", cookie });
});
