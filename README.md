# Pela

A pet passport that lives on the blockchain. It started with two dogs: Pechi, a Belgian Malinois, and Bella, a mixed-breed rescue.

Each pet and its care history are stored on-chain, so once a vet stamps a visit, nobody can quietly change it later. The people side (names, emails, bios) stays off-chain in SQLite, where it can be edited or deleted like any normal account.

## What you need

- Node.js 22.13 or newer. The profile store uses Node's built-in `node:sqlite`.
- MetaMask or another browser wallet.

## Running it locally

On Windows, one command installs everything, runs the tests, starts a chain, deploys, seeds Pechi and Bella, and opens the app:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1 -Start
```

On any OS you can do the same by hand in three terminals:

```bash
# 1. a local chain
cd contracts && npm install && npx hardhat node

# 2. deploy and seed (this also writes web/src/lib/pela.json)
cd contracts && npm run deploy:local

# 3. the web app
cd web && npm install
cp .env.example .env.local    # then set SESSION_SECRET (32+ random characters)
npm run dev
```

`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` prints a usable secret. The app runs at http://localhost:3000.

In MetaMask, add a network with RPC `http://127.0.0.1:8545`, chain ID `31337` and currency `ETH`, then import the private keys the Hardhat window prints. Account #0 is the admin, #1 is the vet (Editor) and #2 owns Pechi and Bella (Viewer). Every time you restart the chain, go to MetaMask → Settings → Advanced → Clear activity tab data, or it will try to reuse old nonces.

## Layout

```
Pela/
├─ setup.ps1                     install + test (add -Start to run everything)
├─ contracts/                    Hardhat 2 · OpenZeppelin 5 · Solidity 0.8.28
│  ├─ contracts/Pela.sol         roles · Pet CRUD · CareLog CRUD · pause
│  ├─ scripts/deploy.js          deploy, seed locally, export the ABI to web/src/lib/pela.json
│  └─ test/Pela.test.js          CRUD, roles and edge cases (14 tests, every line covered)
├─ web/                          Next.js 16 · React 19 · Tailwind 4 · Framer Motion · viem
│  ├─ src/app/                   pages: / · /dashboard · /pets/[id] · /profile · /admin
│  ├─ src/app/api/               sign-in (SIWE) and profile routes
│  ├─ src/lib/                   chain.js (viem), profiles.js (SQLite), auth.js, session.js, ratelimit.js
│  ├─ src/components/            WalletProvider (wallet, transactions, toasts), Nav, ui
│  └─ test/                      unit/ (node:test) · e2e/ (against a running app)
├─ assets/comfyui/               image workflow and prompts
└─ tools/make-installer.mjs      packs the project into one install-pela.ps1
```

## Design

The whole site is one material: kraft board. Headings are pressed into it, panels are pressed down into it, and buttons and cards sit up on top of it. Inside that, the app works like a passport. Each pet gets an ID page and a stamp book, and you flip between passports, and through the pages of a stamp book, the way you'd turn pages.

The tokens, type, motion and component rules are in [`design-system/pela/MASTER.md`](design-system/pela/MASTER.md). Components are shadcn/ui v4, restyled in `web/src/components/ui/`. Motion uses Framer Motion and Lenis, plus a few React Bits pieces adapted in `web/src/components/motion/`. All of it respects `prefers-reduced-motion`, and the "Pause motion" button turns it off by hand.

## Roles

| Role | On-chain role | Can do |
|------|---------------|--------|
| Admin | `DEFAULT_ADMIN_ROLE` | Grant and revoke roles, pause and unpause, edit or retire any pet, edit or delete any stamp, list and delete profiles |
| Editor (vet or trainer) | `EDITOR_ROLE` | Add stamps to pets they're assigned to, and edit or delete their own stamps while still assigned |
| Viewer (owner) | `VIEWER_ROLE` | Register pets, and while they hold the role, edit, retire and assign vets to their own pets |

The contract enforces all of this; the UI only hides buttons a wallet can't use. A few rules worth knowing:

- A retired passport is read-only for everyone, admins included.
- The last admin can't revoke or renounce their own role, so the contract can't end up with nobody in charge.
- Birthdays can't be in the future.

On-chain data is public, which is why emails and bios live in the off-chain database.

## How sign-in works

1. The wallet connects (`eth_requestAccounts`) and switches to the right chain.
2. The server hands out a one-time nonce, stored in SQLite and valid for 10 minutes.
3. The user signs an EIP-4361 "Sign-In with Ethereum" message. Signing is free; no gas.
4. `/api/auth/verify` checks the signature, domain, chain ID, message age and nonce (burned after one use), then sets an HMAC-signed, `httpOnly`, `SameSite=Strict` session cookie. In production the domain comes from `APP_DOMAIN` instead of the request's Host header.
5. Profile routes let through the session's own address or an admin. Admin status is read live from the contract.

If the wallet changes network later, the app says so, and asks to switch back before the next transaction.

## Off-chain API

Every response looks like `{ success, data, error }`.

| Method | Route | Who |
|--------|-------|-----|
| GET | `/api/auth/nonce` | anyone (rate-limited) |
| POST | `/api/auth/verify` `{ message, signature }` | anyone (rate-limited) |
| POST | `/api/auth/logout` | anyone |
| GET | `/api/me` | anyone → `{ address, profile }` |
| GET | `/api/profiles?limit&offset` | admin |
| GET | `/api/profiles/:address` | anyone (email only for yourself or an admin) |
| PUT | `/api/profiles/:address` `{ displayName, email, bio, accent }` | yourself or an admin (create or update) |
| DELETE | `/api/profiles/:address` | yourself or an admin |

## Tests

```bash
cd contracts && npm test && npm run coverage   # contract, roles, edge cases
cd web && npm test                             # sessions, SIWE, validation, DB, rate limiting
cd web && npm run test:e2e                     # live API; needs the chain, a deploy and npm run dev
```

Point the e2e suite at another port with `PELA_URL=http://localhost:3123`.

## Images

The pet photos were redrawn in ComfyUI. With ComfyUI running locally, `node assets/comfyui/generate.mjs` regenerates them; `assets/comfyui/PROMPTS.md` has the prompts and node graph.

## Moving the project

```powershell
node tools\make-installer.mjs                              # writes install-pela.ps1
powershell -ExecutionPolicy Bypass -File .\install-pela.ps1 -Target "D:\somewhere\Pela"
```

Without `-Target` it unpacks into a `Pela` folder in the current directory.

## Deploying

### Contract (Sepolia)

Fill in `contracts/.env` from `contracts/.env.example` (a throwaway, testnet-only `DEPLOYER_PRIVATE_KEY`, funded from a faucet), then run `npm run deploy:sepolia`. The script writes the address and ABI to `web/src/lib/pela.json` and keeps a record in `contracts/deployments/sepolia.json`; commit both. The deployer becomes the admin, so grant the other roles from the Admin page.

### Web app

The profile store is a SQLite file, so the app needs a long-running Node server with a persistent disk: a VPS, Fly.io, Railway, or a Docker container with a volume. Serverless hosts like Vercel throw the file away between requests. To run there, swap `src/lib/profiles.js` for a Postgres version with the same functions.

Production environment variables (all listed in `web/.env.example`):

- `SESSION_SECRET`: 32+ random characters.
- `NEXT_PUBLIC_RPC_URL`: the same RPC the contract was deployed to.
- `APP_DOMAIN`: the exact host people sign in on.
- `TRUST_PROXY=1`: only behind a reverse proxy you control, so rate limits go per IP.
- `DB_PATH`: where the SQLite file lives on the persistent disk.

## Known limits

- An editor's "assigned pets" list checks every pet. That's fine for a few thousand; beyond that, index `EditorAssigned` events.
- The rate limiter keeps its counts in memory, per process. Run more than one instance and it needs Redis.
- Sessions are signed cookies that last 7 days. Signing out deletes the cookie, but a copied token stays valid until it expires.
