const hits = new Map();
const MAX_KEYS = 10_000;

export function rateLimit(key, limit, windowMs = 60_000, now = Date.now()) {
  if (hits.size > MAX_KEYS) hits.clear();
  const entry = hits.get(key);
  if (!entry || entry.reset <= now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export const clientIp = (req) =>
  (process.env.TRUST_PROXY === "1" && req.headers.get("x-forwarded-for")?.split(",")[0].trim()) || "local";
