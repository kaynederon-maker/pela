const fs = require("fs");
const path = require("path");
const { ethers, network, artifacts } = require("hardhat");

const LOCAL_CHAIN_ID = 31337n;
const Kind = { Vaccination: 0, Meal: 1, Training: 2 };

const send = async (txPromise) => (await txPromise).wait();

async function main() {
  const signers = await ethers.getSigners();
  const admin = signers[0];
  const { chainId } = await ethers.provider.getNetwork();
  const local = chainId === LOCAL_CHAIN_ID;
  // Locally: #1 = vet (Editor), #2 = owner (Viewer). On a testnet there's one deployer wallet, so it plays every role.
  const vet = local ? signers[1] : admin;
  const owner = local ? signers[2] : admin;

  const balance = await ethers.provider.getBalance(admin.address);
  console.log(`Deployer ${admin.address} on ${network.name} (chainId ${chainId}), balance ${ethers.formatEther(balance)} ETH`);
  if (balance === 0n) throw new Error("Deployer has no ETH. Fund it from a faucet first.");

  const pela = await ethers.deployContract("Pela", [admin.address]);
  await pela.waitForDeployment();
  const address = await pela.getAddress();
  const deployTx = pela.deploymentTransaction();
  console.log(`Pela deployed to ${address}`);

  await send(pela.grantRole(await pela.EDITOR_ROLE(), vet.address));
  await send(pela.grantRole(await pela.VIEWER_ROLE(), owner.address));

  const asOwner = pela.connect(owner);
  await send(asOwner.registerPet("Pechi", "Belgian Malinois", 0));
  await send(asOwner.registerPet("Bella", "Mixed breed (rescued stray)", 0));
  await send(asOwner.setEditor(1, vet.address, true));
  await send(asOwner.setEditor(2, vet.address, true));

  const asVet = pela.connect(vet);
  await send(asVet.addCareLog(1, Kind.Training, "Nailed the recall drill. Very proud boy."));
  await send(asVet.addCareLog(2, Kind.Vaccination, "Rabies booster given."));
  console.log(`Seeded Pechi & Bella. admin=${admin.address} vet=${vet.address} owner=${owner.address}`);

  const { abi } = await artifacts.readArtifact("Pela");

  // Hand the frontend what it needs.
  const webOut = path.join(__dirname, "..", "..", "web", "src", "lib", "pela.json");
  fs.mkdirSync(path.dirname(webOut), { recursive: true });
  fs.writeFileSync(webOut, JSON.stringify({ address, chainId: Number(chainId), abi }, null, 2));
  console.log(`ABI + address written to ${webOut}`);

  // Keep a record of public deployments (committed to git).
  if (!local) {
    const record = path.join(__dirname, "..", "deployments", `${network.name}.json`);
    fs.mkdirSync(path.dirname(record), { recursive: true });
    fs.writeFileSync(
      record,
      JSON.stringify(
        { network: network.name, chainId: Number(chainId), address, admin: admin.address, txHash: deployTx?.hash, deployedAt: new Date().toISOString() },
        null,
        2,
      ),
    );
    console.log(`Deployment recorded in ${record}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
