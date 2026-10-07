import { isAdmin } from "@/lib/chain";
import { fail, handle, ok, repo, sessionAddress } from "@/lib/server";

export const dynamic = "force-dynamic";

// Admin-only: list every off-chain profile (paginated).
export const GET = handle(async (req) => {
  const me = await sessionAddress();
  if (!me) return fail("Please sign in", 401);
  if (!(await isAdmin(me))) return fail("Admins only", 403);

  const params = new URL(req.url).searchParams;
  const limit = Number(params.get("limit")) || undefined;
  const offset = Number(params.get("offset")) || 0;
  return ok(repo().list({ limit, offset }));
});
