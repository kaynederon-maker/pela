import { createPublicClient, http, keccak256, toHex, zeroHash } from "viem";
import { hardhat, sepolia } from "viem/chains";
import pela from "./contract.json";

export const chain = pela.chainId === sepolia.id ? sepolia : hardhat;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || chain.rpcUrls.default.http[0];
export const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
export const pelaContract = { address: pela.address, abi: pela.abi };

export const ROLES = {
  admin: zeroHash,
  editor: keccak256(toHex("EDITOR_ROLE")),
  viewer: keccak256(toHex("VIEWER_ROLE")),
};

export const read = (functionName, args = []) =>
  publicClient.readContract({ ...pelaContract, functionName, args });

export async function getRoles(address) {
  const has = (role) => read("hasRole", [role, address]);
  const [admin, editor, viewer] = await Promise.all([has(ROLES.admin), has(ROLES.editor), has(ROLES.viewer)]);
  return { admin, editor, viewer };
}

export const isAdmin = (address) => read("hasRole", [ROLES.admin, address]);

export async function allPetIds() {
  const count = Number(await read("petCount"));
  return Array.from({ length: count }, (_, i) => BigInt(i + 1));
}

export async function assignedPetIds(editor) {
  const ids = await allPetIds();
  const flags = await Promise.all(ids.map((id) => read("isAssigned", [id, editor])));
  return ids.filter((_, i) => flags[i]);
}

export async function visiblePetIds(address, roles) {
  const [owned, assigned, all] = await Promise.all([
    read("getPetsByOwner", [address]),
    roles.editor ? assignedPetIds(address) : [],
    roles.admin ? allPetIds() : [],
  ]);
  const ids = [...new Set([...owned, ...assigned, ...all].map(Number))].sort((a, b) => a - b);
  return { ids, assigned: assigned.map(Number) };
}

export const loadPets = (ids) =>
  Promise.all(ids.map(async (id) => ({ ...(await read("getPet", [BigInt(id)])), id: Number(id) })));

export async function loadLogs(petId) {
  const ids = await read("getPetLogIds", [petId]);
  const logs = await Promise.all(ids.map(async (id) => ({ ...(await read("getCareLog", [id])), id: Number(id) })));
  return logs.filter((log) => log.active).reverse();
}
