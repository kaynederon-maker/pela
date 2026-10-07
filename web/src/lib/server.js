// Server-only helpers for API routes.
import path from "node:path";
import { cookies } from "next/headers";
import { openRepo } from "./profiles.js";
import { SESSION_COOKIE, getSecret, verifySession } from "./session.js";

export const repo = () =>
  (globalThis.__pelaRepo ??= openRepo(process.env.DB_PATH || path.join(process.cwd(), "pela.db")));

export const ok = (data, status = 200) => Response.json({ success: true, data, error: null }, { status });
export const fail = (error, status, details) =>
  Response.json({ success: false, data: null, error, ...(details && { details }) }, { status });

export async function sessionAddress() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value, getSecret());
}

export const clientIp = (req) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";

/** Wraps a route handler so unexpected errors are logged server-side and never leak to clients. */
export const handle = (fn) => async (req, ctx) => {
  try {
    return await fn(req, ctx);
  } catch (err) {
    console.error(`[pela] ${req.method} ${new URL(req.url).pathname}`, err);
    return fail("Something went wrong on our side", 500);
  }
};
