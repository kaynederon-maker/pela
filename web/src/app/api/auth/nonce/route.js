import { generateSiweNonce } from "viem/siwe";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp, fail, handle, ok, repo } from "@/lib/server";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  if (!rateLimit(`nonce:${clientIp(req)}`, 20)) return fail("Too many requests, slow down a little", 429);
  const nonce = generateSiweNonce();
  repo().createNonce(nonce);
  return ok({ nonce });
});
