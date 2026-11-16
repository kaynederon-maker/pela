# Smart contract

The Pela contract, written in Solidity 0.8.28 on top of OpenZeppelin 5, built and tested with Hardhat 2.

It is live on Sepolia at [`0xdC62b97204066efFC834724D8261ef312839c08f`](https://sepolia.etherscan.io/address/0xdC62b97204066efFC834724D8261ef312839c08f).

## Files

| File | What it is |
|------|------------|
| [`contracts/Pela.sol`](contracts/Pela.sol) | The contract: roles, pets, care logs, pause switch |
| [`test/Pela.test.js`](test/Pela.test.js) | 14 tests covering every function and every role rule |
| [`scripts/deploy.js`](scripts/deploy.js) | Deploys the contract, seeds Pechi and Bella, and hands the address and ABI to the web app |
| [`deployments/sepolia.json`](deployments/sepolia.json) | Address, admin and transaction of the Sepolia deployment |
| `hardhat.config.js` | Compiler version, optimizer and networks (local and Sepolia) |
| `.env.example` | Settings needed only for a testnet deploy |

## What the contract stores

A `Pet` has an owner, name, breed, birthday, creation time and an `active` flag. A `CareLog` (a "stamp" in the app) has the pet it belongs to, the vet or trainer who wrote it, a care type, a note of up to 280 characters, timestamps and an `active` flag. Deleting either one sets `active` to false, so the history stays on-chain.

## Who can call what

| Function | Who | What it does |
|----------|-----|--------------|
| `registerPet` | Viewer (owner) | Creates a pet owned by the caller |
| `updatePet` | The pet's owner, or an admin | Changes name, breed and birthday |
| `deactivatePet` | The pet's owner, or an admin | Retires the pet; its stamps become read-only |
| `setEditor` | The pet's owner, or an admin | Lets a vet or trainer (Editor) stamp this pet, or takes that away |
| `addCareLog` | Editor assigned to the pet | Adds a stamp |
| `updateCareLog`, `deleteCareLog` | The stamp's author while still assigned, or an admin | Edits or withdraws a stamp |
| `grantRole`, `revokeRole` | Admin | Hands out or removes Admin, Editor and Viewer |
| `pause`, `unpause` | Admin | Stops or restarts every write |
| `getPet`, `getCareLog`, `getPetsByOwner`, `getPetLogIds` | Anyone | Reads |

The contract also refuses birthdays in the future, empty or overlong text, and removing the last admin.

Events: `PetRegistered`, `PetUpdated`, `PetDeactivated`, `EditorAssigned`, `CareLogAdded`, `CareLogUpdated`, `CareLogDeleted`.

## Commands

```bash
npm install
npm test                 # run the tests
npm run coverage         # test coverage report
npm run node             # local chain on 127.0.0.1:8545
npm run deploy:local     # deploy to the local chain (in a second terminal)
npm run deploy:sepolia   # deploy to Sepolia (needs .env)
```
