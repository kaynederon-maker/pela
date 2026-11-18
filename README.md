# Pela

A pet passport that lives on the blockchain. It started with two dogs: Pechi, a Belgian Malinois, and Bella, a mixed-breed rescue.

Each pet and its care history are stored by a Solidity smart contract, so once a vet stamps a visit, nobody can quietly change it later. The people side (names, emails, bios) stays off-chain in SQLite, where it can be edited or deleted like any normal account.

![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?logo=solidity)
![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5-4E5EE4?logo=openzeppelin)
![Hardhat](https://img.shields.io/badge/Hardhat-2-FFF100)
![Network](https://img.shields.io/badge/network-Sepolia-6B4C34)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)

## The smart contract

All the rules live in one contract: [`smart-contract/contracts/Pela.sol`](smart-contract/contracts/Pela.sol).

It's deployed on Sepolia at [`0xdC62b97204066efFC834724D8261ef312839c08f`](https://sepolia.etherscan.io/address/0xdC62b97204066efFC834724D8261ef312839c08f).

| Role | On-chain role | Can do |
|------|---------------|--------|
| Admin | `DEFAULT_ADMIN_ROLE` | Grant and revoke roles, pause and unpause, edit or retire any pet, edit or delete any stamp |
| Editor (vet or trainer) | `EDITOR_ROLE` | Stamp pets they're assigned to; edit or delete their own stamps while still assigned |
| Viewer (owner) | `VIEWER_ROLE` | Register pets, and while they hold the role, edit, retire and assign vets to their own pets |

Two records are stored: `Pet` and `CareLog` (shown as a stamp in the app). Both can be created, read, updated and deleted, and deleting only marks them inactive so the history stays. A retired passport is read-only for everyone, the last admin can't leave, and birthdays can't be in the future. The full function list is in [`smart-contract/README.md`](smart-contract/README.md).

The contract enforces everything; the website only hides buttons a wallet can't use.

## What's in this repository

| Folder or file | What it is |
|----------------|------------|
| [`smart-contract/`](smart-contract/) | The Solidity contract, its tests and the deploy script (Hardhat) |
| [`web-app/`](web-app/) | The website and its API: wallet sign-in, profiles, pages for owners, vets and admins (Next.js) |
| [`docs/`](docs/) | The design system: colours, type, motion and component rules |
| [`tools/`](tools/) | Helpers: the installer packer and the image-generation scripts |
| `setup.ps1` | One command on Windows to install, test and start everything |

Each folder has its own README listing what every file does.

```
pela/
├─ smart-contract/
│  ├─ contracts/Pela.sol        the contract
│  ├─ test/Pela.test.js         contract tests
│  ├─ scripts/deploy.js         deploy and seed
│  └─ deployments/sepolia.json  where it's deployed
├─ web-app/
│  ├─ src/app/                  pages and API routes
│  ├─ src/components/           interface, grouped by feature
│  ├─ src/lib/                  contract access (shared)
│  ├─ src/lib/server/           sign-in, sessions, database (server only)
│  ├─ public/images/            pet photos and logo
│  └─ test/                     unit and API tests
├─ docs/design-system.md
├─ tools/
└─ setup.ps1
```

## Running it locally

You need Node.js 22.13 or newer and MetaMask (or another browser wallet).

On Windows, one command installs everything, runs the tests, starts a local chain, deploys, seeds Pechi and Bella, and opens the app:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1 -Start
```

On any OS you can do it by hand in three terminals:

```bash
# 1. a local chain
cd smart-contract && npm install && npx hardhat node

# 2. deploy and seed (this also writes web-app/src/lib/contract.json)
cd smart-contract && npm run deploy:local

# 3. the website
cd web-app && npm install
cp .env.example .env.local    # then set SESSION_SECRET (32+ random characters)
npm run dev
```

`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` prints a usable secret. The site runs at http://localhost:3000, and a short guide opens on your first visit.

In MetaMask, add a network with RPC `http://127.0.0.1:8545`, chain ID `31337` and currency `ETH`, then import the private keys the Hardhat window prints. Account #0 is the admin, #1 is the vet (Editor) and #2 owns Pechi and Bella (Viewer). After restarting the chain, go to MetaMask → Settings → Advanced → Clear activity tab data, or it will try to reuse old nonces.

To use the Sepolia contract instead of a local one, skip steps 1 and 2: `web-app/src/lib/contract.json` already points at Sepolia in this repository.

## How sign-in works

1. The wallet connects and switches to the right chain.
2. The server hands out a one-time code, stored in SQLite and valid for 10 minutes.
3. You sign a "Sign-In with Ethereum" (EIP-4361) message. Signing is free; no gas.
4. The server checks the signature, domain, chain, message age and code (each code works once), then sets a signed, `httpOnly`, `SameSite=Strict` session cookie. In production the domain comes from `APP_DOMAIN` instead of the request.
5. Profile routes allow your own address or an admin. Admin status is read live from the contract.

If the wallet switches network later, the site says so and asks to switch back before the next transaction.

## Tests

```bash
cd smart-contract && npm test && npm run coverage   # contract, roles, edge cases
cd web-app && npm test                              # sessions, sign-in, validation, database, rate limits, guide
cd web-app && npm run test:e2e                      # live API; needs the chain, a deploy and npm run dev
```

## Settings

Each part reads its settings from an env file you create by copying the example next to it. Never commit the real files.

`web-app/.env.local` (copy of `web-app/.env.example`; `setup.ps1` makes one for you):

| Setting | What it's for |
|---------|---------------|
| `SESSION_SECRET` | Required. 32+ random characters; signs the session cookie |
| `NEXT_PUBLIC_RPC_URL` | Optional. Leave empty to use the public RPC of the chain in `src/lib/contract.json` (127.0.0.1:8545 for a local deploy, a public Sepolia node for Sepolia) |
| `DB_PATH` | Optional. Where the SQLite file for profiles lives; defaults to `./pela.db` |
| `APP_DOMAIN` | Production only. The exact host people sign in on, such as `pela.example.com`; sign-in messages for any other domain are rejected |
| `TRUST_PROXY` | Set to `1` only behind a reverse proxy you control that sets `X-Forwarded-For`, so rate limits go per client IP |

`smart-contract/.env` (copy of `smart-contract/.env.example`; only needed to deploy to Sepolia):

| Setting | What it's for |
|---------|---------------|
| `DEPLOYER_PRIVATE_KEY` | The wallet that deploys the contract and becomes its admin. Use a throwaway, testnet-only key |
| `SEPOLIA_RPC_URL` | Optional. Defaults to the free public node `https://ethereum-sepolia-rpc.publicnode.com` |
| `ETHERSCAN_API_KEY` | Optional. Lets `npx hardhat verify` publish the contract source on Etherscan |

## Deploying

The contract: fill in `smart-contract/.env` from `.env.example` with a throwaway, testnet-only key funded from a faucet, then run `npm run deploy:sepolia`. The script writes the address and ABI to `web-app/src/lib/contract.json` and records the deployment in `smart-contract/deployments/sepolia.json`; commit both. The deployer becomes the admin.

The website: the profile store is a SQLite file, so it needs a long-running Node server with a persistent disk, such as a VPS, Fly.io, Railway or a Docker container with a volume. Serverless hosts like Vercel throw the file away between requests; to use one, swap `web-app/src/lib/server/profiles.js` for a Postgres version with the same functions. Set these in production (all listed in `web-app/.env.example`):

- `SESSION_SECRET`: 32+ random characters.
- `NEXT_PUBLIC_RPC_URL`: the same RPC the contract was deployed to.
- `APP_DOMAIN`: the exact host people sign in on.
- `TRUST_PROXY=1`: only behind a reverse proxy you control, so rate limits go per IP.
- `DB_PATH`: where the SQLite file lives on the persistent disk.

## Known limits

- An editor's "assigned pets" list checks every pet. That's fine for a few thousand; beyond that, index the `EditorAssigned` events.
- The rate limiter counts in memory, per process. More than one server instance needs Redis.
- Sessions are signed cookies that last 7 days. Signing out deletes the cookie, but a copied cookie stays valid until it expires.
