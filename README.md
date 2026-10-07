# Pela 🐾

Decentralized pet identity & care log, inspired by Pechi (Belgian Malinois) and Bella (mixed breed).
Pets and their care history live **on-chain**. User profiles and preferences live **off-chain** (SQLite).

## Quick start (Windows)

```powershell
cd "C:\Users\USER\OneDrive\Documents\AI Individual Projects\Blockchain\Pela"
powershell -ExecutionPolicy Bypass -File .\setup.ps1 -Start
```

This installs everything, runs all tests, starts a local chain, deploys and seeds Pechi & Bella, starts the app and opens http://localhost:3000.

**MetaMask:** add a network with RPC `http://127.0.0.1:8545`, chain ID `31337`, symbol `ETH`. Then import private keys from the blockchain window:
`#0` Admin · `#1` Editor (vet) · `#2` Viewer (owner of Pechi & Bella).
After restarting the chain, use MetaMask → Settings → Advanced → **Clear activity tab data** so it resets nonces.

## Structure

```
Pela/
├─ setup.ps1                     install + test (+ -Start to run everything)
├─ contracts/                    Hardhat 2 · OpenZeppelin 5 · Solidity 0.8.28
│  ├─ contracts/Pela.sol         roles · Pet CRUD · CareLog CRUD · pause
│  ├─ scripts/deploy.js          deploy, seed locally, export ABI → web/src/lib/pela.json
│  └─ test/Pela.test.js          CRUD + RBAC (10 tests, 100% line coverage)
├─ web/                          Next.js 16 · React 19 · Tailwind 4 · Framer Motion · viem
│  ├─ src/app/                   pages: / · /dashboard · /pets/[id] · /profile · /admin
│  ├─ src/app/api/               auth (SIWE) + profile CRUD routes
│  ├─ src/lib/                   chain.js (viem), profiles.js (SQLite), auth.js, session.js
│  ├─ src/components/            WalletProvider (wallet + tx + toasts), Nav, ui
│  └─ test/                      unit/ (node:test) · e2e/ (live API)
├─ assets/comfyui/               workflow_api.json · generate.mjs · PROMPTS.md
└─ tools/make-installer.mjs      builds install-pela.ps1 (self-extracting copy of the project)
```

## Roles

| Role | On-chain role | Can do |
|------|---------------|--------|
| Admin | `DEFAULT_ADMIN_ROLE` | Grant/revoke roles, pause/unpause, edit/deactivate any pet, edit/delete any log, list/delete any profile |
| Editor (vet/trainer) | `EDITOR_ROLE` | Add logs to pets they're assigned to; edit/delete their own logs while still assigned |
| Viewer (owner) | `VIEWER_ROLE` | Register pets; edit, deactivate and assign vets to their own pets; manage their own profile |

The contract enforces every rule. The UI only hides buttons a wallet can't use.
On-chain data is public, so personal details (email, bio) stay in the off-chain DB.

## How auth works

1. The wallet connects (`eth_requestAccounts`) and switches to the right chain.
2. The server issues a one-time nonce (stored in SQLite, valid 10 min).
3. The user signs an EIP-4361 **Sign-In with Ethereum** message. It's free, with no gas.
4. `/api/auth/verify` checks the signature, domain, chain ID, message age and nonce (burned on use), then sets an HMAC-signed, `httpOnly`, `SameSite=Strict` session cookie.
5. Profile routes allow the session's own address, or an admin. Admin status is read live from the contract.

## API (off-chain)

All responses use `{ success, data, error }`.

| Method | Route | Who |
|--------|-------|-----|
| GET | `/api/auth/nonce` | anyone (rate-limited) |
| POST | `/api/auth/verify` `{ message, signature }` | anyone (rate-limited) |
| POST | `/api/auth/logout` | anyone |
| GET | `/api/me` | anyone → `{ address, profile }` |
| GET | `/api/profiles?limit&offset` | admin |
| GET | `/api/profiles/:address` | anyone (email only for self/admin) |
| PUT | `/api/profiles/:address` `{ displayName, email, bio, accent }` | self or admin (create/update) |
| DELETE | `/api/profiles/:address` | self or admin |

## Tests

```powershell
cd contracts; npm test; npm run coverage   # smart contract + RBAC
cd web; npm test                           # session, SIWE, validation, DB, rate limit
cd web; npm run test:e2e                   # live API: needs chain + deploy + `npm run dev`
```

## Images (ComfyUI)

With ComfyUI running locally: `node assets\comfyui\generate.mjs`. See `assets/comfyui/PROMPTS.md` for the prompts, node graph and tips.

## Export / reinstall anywhere

```powershell
node tools\make-installer.mjs                       # → install-pela.ps1 (one file, whole project)
powershell -ExecutionPolicy Bypass -File .\install-pela.ps1 -Target "D:\somewhere\Pela"
```

## Testnet (Sepolia)

Fill `contracts/.env` (`SEPOLIA_RPC_URL`, `DEPLOYER_PRIVATE_KEY`), run `npm run deploy:sepolia`, and set `NEXT_PUBLIC_RPC_URL` in `web/.env.local` to the same RPC. The frontend picks the chain from `pela.json`.
On a testnet, grant roles from the Admin page (the deployer is admin).

## Known limits

- The editor's "assigned pets" list scans every pet (fine for thousands). For more, index `EditorAssigned` events.
- The rate limiter is in-memory, per process. Use Redis if you run multiple instances.
- SQLite fits one server. For hosted deployments, swap `src/lib/profiles.js` to Postgres (same interface).
