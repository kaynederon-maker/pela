import { cookies } from "next/headers";
import { verifySiweLogin } from "@/lib/auth";
import { chain } from "@/lib/chain";
import { rateLimit } from "@/lib/ratelimit";
import { SESSION_COOKIE, SESSION_TTL_S, getSecret, signSession } from "@/lib/session";
import { clientIp, fail, handle, ok, repo } from "@/lib/server";

export const POST = handle(async (req) => {
  if (!rateLimit(`verify:${clientIp(req)}`, 10)) return fail("Too many requests, slow down a little", 429);
  const body = await req.json().catch(() => null);

  const address = await verifySiweLogin({
    message: body?.message,
    signature: body?.signature,
    domain: req.headers.get("host"),
    chainId: chain.id,
    consumeNonce: (nonce) => repo().consumeNonce(nonce),
  });
  if (!address) return fail("Sign-in failed. Please try again.", 401);

  (await cookies()).set(SESSION_COOKIE, signSession(address, getSecret()), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_S,
  });
  return ok({ address });
});
