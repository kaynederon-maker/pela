import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import { handle, ok } from "@/lib/server";

export const POST = handle(async () => {
  (await cookies()).delete(SESSION_COOKIE);
  return ok({ signedOut: true });
});
