// Off-chain store: user profiles + SIWE nonces, on Node's built-in SQLite.
import { DatabaseSync } from "node:sqlite";
import { isAddress } from "viem";

export const ACCENTS = ["fawn", "sage", "blush"];
const NONCE_TTL_MS = 10 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PAGE = 100;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  address      TEXT PRIMARY KEY,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 40),
  email        TEXT NOT NULL DEFAULT '',
  bio          TEXT NOT NULL DEFAULT '' CHECK (length(bio) <= 280),
  accent       TEXT NOT NULL DEFAULT 'fawn' CHECK (accent IN ('fawn', 'sage', 'blush')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS nonces (
  nonce      TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);`;

export function normalizeAddress(value) {
  return typeof value === "string" && isAddress(value, { strict: false }) ? value.toLowerCase() : null;
}

/** Returns { ok: true, value } or { ok: false, errors: { field: message } }. */
export function validateProfile(input) {
  const str = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : null);
  const displayName = str(input?.displayName);
  const email = str(input?.email);
  const bio = str(input?.bio);
  const accent = input?.accent ?? "fawn";

  const errors = {};
  if (!displayName || displayName.length > 40) errors.displayName = "Use 1–40 characters";
  if (email === null || email.length > 254 || (email && !EMAIL_RE.test(email))) errors.email = "Enter a valid email";
  if (bio === null || bio.length > 280) errors.bio = "Keep it under 280 characters";
  if (!ACCENTS.includes(accent)) errors.accent = `Pick one of: ${ACCENTS.join(", ")}`;

  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, value: { displayName, email, bio, accent } };
}

export function publicProfile({ address, displayName, bio, accent }) {
  return { address, displayName, bio, accent };
}

const toProfile = (row) =>
  row && {
    address: row.address,
    displayName: row.display_name,
    email: row.email,
    bio: row.bio,
    accent: row.accent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

export function openRepo(path) {
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  const q = {
    get: db.prepare("SELECT * FROM profiles WHERE address = ?"),
    list: db.prepare("SELECT * FROM profiles ORDER BY created_at DESC LIMIT ? OFFSET ?"),
    count: db.prepare("SELECT count(*) AS n FROM profiles"),
    upsert: db.prepare(`
      INSERT INTO profiles (address, display_name, email, bio, accent) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(address) DO UPDATE SET
        display_name = excluded.display_name, email = excluded.email, bio = excluded.bio,
        accent = excluded.accent, updated_at = datetime('now')
      RETURNING *`),
    remove: db.prepare("DELETE FROM profiles WHERE address = ?"),
    addNonce: db.prepare("INSERT INTO nonces (nonce, created_at) VALUES (?, ?)"),
    pruneNonces: db.prepare("DELETE FROM nonces WHERE created_at <= ?"),
    takeNonce: db.prepare("DELETE FROM nonces WHERE nonce = ? AND created_at > ? RETURNING nonce"),
  };

  return {
    get: (address) => toProfile(q.get.get(address)),
    list: ({ limit = MAX_PAGE, offset = 0 } = {}) => ({
      items: q.list.all(Math.min(Math.max(limit, 1), MAX_PAGE), Math.max(offset, 0)).map(toProfile),
      total: q.count.get().n,
    }),
    upsert: (address, p) => toProfile(q.upsert.get(address, p.displayName, p.email, p.bio, p.accent)),
    remove: (address) => q.remove.run(address).changes > 0,
    createNonce: (nonce, now = Date.now()) => {
      q.pruneNonces.run(now - NONCE_TTL_MS);
      q.addNonce.run(nonce, now);
    },
    /** One-shot: true only the first time a fresh nonce is presented. */
    consumeNonce: (nonce, now = Date.now()) => Boolean(q.takeNonce.get(nonce, now - NONCE_TTL_MS)),
    close: () => db.close(),
  };
}
