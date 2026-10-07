import { handle, ok, repo, sessionAddress } from "@/lib/server";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const address = await sessionAddress();
  return ok({ address, profile: address ? repo().get(address) : null });
});
