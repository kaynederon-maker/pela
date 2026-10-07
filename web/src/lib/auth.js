// Sign-In with Ethereum (EIP-4361) verification.
import { verifyMessage } from "viem";
import { parseSiweMessage, validateSiweMessage } from "viem/siwe";

export const MAX_MESSAGE_AGE_MS = 10 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 2000;

/**
 * Returns the lowercased signer address, or null on any failure.
 * `consumeNonce(nonce)` must return true exactly once per issued nonce (replay protection).
 */
export async function verifySiweLogin({ message, signature, domain, chainId, consumeNonce, now = new Date() }) {
  if (typeof message !== "string" || typeof signature !== "string") return null;
  if (message.length > MAX_MESSAGE_LENGTH) return null;

  let fields;
  try {
    fields = parseSiweMessage(message);
  } catch {
    return null;
  }
  if (!fields.address || !fields.nonce || fields.chainId !== chainId) return null;
  if (!fields.issuedAt || now - fields.issuedAt > MAX_MESSAGE_AGE_MS) return null;
  if (!validateSiweMessage({ message: fields, domain, time: now })) return null;

  let valid = false;
  try {
    valid = await verifyMessage({ address: fields.address, message, signature });
  } catch {
    return null;
  }
  // Burn the nonce only after the signature checks out.
  if (!valid || !consumeNonce(fields.nonce)) return null;
  return fields.address.toLowerCase();
}
