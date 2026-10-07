require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const {
  SEPOLIA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com",
  DEPLOYER_PRIVATE_KEY,
  ETHERSCAN_API_KEY,
} = process.env;

module.exports = {
  solidity: { version: "0.8.28", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    localhost: { url: "http://127.0.0.1:8545" },
    ...(DEPLOYER_PRIVATE_KEY && { sepolia: { url: SEPOLIA_RPC_URL, chainId: 11155111, accounts: [DEPLOYER_PRIVATE_KEY] } }),
  },
  // Optional: `npx hardhat verify --network sepolia <address> <admin>` publishes the source on Etherscan.
  etherscan: { apiKey: ETHERSCAN_API_KEY ?? "" },
  sourcify: { enabled: true },
};
