// Stateless session cookie: "<address>.<expiry>.<hmac>".
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "pela_session";
export const SESSION_TTL_S = 7 * 24 * 60 * 60;

export function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to 32+ characters (see web/.env.example)");
  }
  return secret;
}

const mac = (body, secret) => createHmac("sha256", secret).update(body).digest("base64url");

export function signSession(address, secret, now = Date.now()) {
  const body = `${address.toLowerCase()}.${Math.floor(now / 1000) + SESSION_TTL_S}`;
  return `${body}.${mac(body, secret)}`;
}

/** Returns the lowercased address, or null if the token is missing, forged or expired. */
export function verifySession(token, secret, now = Date.now()) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [address, exp, sig] = parts;
  const given = Buffer.from(sig);
  const expected = Buffer.from(mac(`${address}.${exp}`, secret));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  if (!(Number(exp) * 1000 > now)) return null;
  return address;
}
