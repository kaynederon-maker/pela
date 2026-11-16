import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/server/session";
import { handle, ok } from "@/lib/server/api";

export const POST = handle(async () => {
  (await cookies()).delete(SESSION_COOKIE);
  return ok({ signedOut: true });
});
