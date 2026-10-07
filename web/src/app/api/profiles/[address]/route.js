import { isAdmin } from "@/lib/chain";
import { normalizeAddress, publicProfile, validateProfile } from "@/lib/profiles";
import { rateLimit } from "@/lib/ratelimit";
import { fail, handle, ok, repo, sessionAddress } from "@/lib/server";

export const dynamic = "force-dynamic";

const canManage = async (me, address) => Boolean(me) && (me === address || (await isAdmin(me)));

async function target(params) {
  return normalizeAddress((await params).address);
}

// Read: public fields for everyone, full record (incl. email) for the owner or an admin.
export const GET = handle(async (_req, { params }) => {
  const address = await target(params);
  if (!address) return fail("Invalid wallet address", 400);
  const profile = repo().get(address);
  if (!profile) return fail("Profile not found", 404);
  return ok((await canManage(await sessionAddress(), address)) ? profile : publicProfile(profile));
});

// Create or update.
export const PUT = handle(async (req, { params }) => {
  const address = await target(params);
  if (!address) return fail("Invalid wallet address", 400);
  const me = await sessionAddress();
  if (!me) return fail("Please sign in", 401);
  if (!(await canManage(me, address))) return fail("You can only edit your own profile", 403);
  if (!rateLimit(`profile:${me}`, 30)) return fail("Too many requests, slow down a little", 429);

  const result = validateProfile(await req.json().catch(() => null));
  if (!result.ok) return fail("Please fix the highlighted fields", 400, result.errors);
  return ok(repo().upsert(address, result.value));
});

export const DELETE = handle(async (_req, { params }) => {
  const address = await target(params);
  if (!address) return fail("Invalid wallet address", 400);
  const me = await sessionAddress();
  if (!me) return fail("Please sign in", 401);
  if (!(await canManage(me, address))) return fail("You can only delete your own profile", 403);
  if (!repo().remove(address)) return fail("Profile not found", 404);
  return ok({ deleted: true });
});
