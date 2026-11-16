# Web app

The website people use, plus the small API behind it. Next.js 16, React 19, Tailwind 4, Framer Motion, and viem for talking to the contract.

## Folders

| Folder | What's in it |
|--------|--------------|
| `src/app/` | Pages and API routes (Next.js puts each route in its own folder) |
| `src/components/` | Everything that draws the interface |
| `src/lib/` | Code shared by the browser and the server |
| `src/lib/server/` | Code that only runs on the server |
| `public/images/` | Pet photos, logo and their SVG fallbacks |
| `test/unit/` | Fast tests for the server code and the guide |
| `test/e2e/` | Tests that call a running copy of the app |

## Pages

| Address | File | What it's for |
|---------|------|---------------|
| `/` | `src/app/page.js` | Landing page |
| `/dashboard` | `src/app/dashboard/page.js` | Your pack: every passport you hold or can stamp |
| `/pets/[id]` | `src/app/pets/[id]/page.js` | One passport: ID page, stamp book, settings |
| `/profile` | `src/app/profile/page.js` | Your off-chain name, email, bio and colour |
| `/admin` | `src/app/admin/page.js` | Pause switch, role desk, user directory |

## API

| Route | File | What it does |
|-------|------|--------------|
| `GET /api/auth/nonce` | `src/app/api/auth/nonce/route.js` | One-time code for signing in |
| `POST /api/auth/verify` | `src/app/api/auth/verify/route.js` | Checks the signed message and starts a session |
| `POST /api/auth/logout` | `src/app/api/auth/logout/route.js` | Ends the session |
| `GET /api/me` | `src/app/api/me/route.js` | Who's signed in, and their profile |
| `GET /api/profiles` | `src/app/api/profiles/route.js` | All profiles (admins only) |
| `GET`, `PUT`, `DELETE /api/profiles/:address` | `src/app/api/profiles/[address]/route.js` | Read, save or delete one profile |

## Components

| Folder | What it draws |
|--------|---------------|
| `guide/` | The welcome window and page tours |
| `landing/` | The sections of the landing page |
| `layout/` | Top navigation and footer |
| `motion/` | Animation helpers and the "Pause motion" button |
| `passport/` | Passport card, ink stamps and doodles |
| `shared/` | Page header, sign-in gate, empty and loading states, confirm dialog |
| `ui/` | Buttons, fields, dialogs, tabs and other basic controls |
| `wallet/` | Wallet connection, sign-in and sending transactions |

## Library

| File | What it does |
|------|--------------|
| `lib/chain.js` | Reads the contract (pets, stamps, roles) |
| `lib/contract.json` | Contract address and ABI, written by the deploy script |
| `lib/client-api.js` | Calls the API from the browser |
| `lib/utils.js` | Class-name helper |
| `lib/server/api.js` | Response format, session lookup, error handling |
| `lib/server/auth.js` | Checks Sign-In with Ethereum messages |
| `lib/server/session.js` | Signs and checks the session cookie |
| `lib/server/profiles.js` | SQLite storage for profiles and sign-in codes |
| `lib/server/ratelimit.js` | Limits how often each client can call the API |

## Commands

```bash
npm install
cp .env.example .env.local   # then set SESSION_SECRET
npm run dev                  # http://localhost:3000
npm test                     # unit tests
npm run test:e2e             # API tests against a running app
npm run build && npm start   # production build
```
