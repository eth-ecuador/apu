import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: {
        bytecodeHash: "none"
      },
      optimizer: {
        enabled: true,
        runs: 800
      },
      viaIR: true,
      evmVersion: "cancun"
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      chainId: 11155111,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    },
    ogGalileo: {
      url: process.env.OG_GALILEO_RPC_URL || "https://evmrpc-testnet.0g.ai",
      chainId: 16602,
      accounts: process.env.OG_DEPLOYER_PRIVATE_KEY ? [process.env.OG_DEPLOYER_PRIVATE_KEY] : []
    },
    ogMainnet: {
      url: process.env.OG_RPC_URL || "https://evmrpc.0g.ai",
      chainId: 16661,
      accounts: process.env.OG_DEPLOYER_PRIVATE_KEY ? [process.env.OG_DEPLOYER_PRIVATE_KEY] : []
    }
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v6"
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD"
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || ""
    }
  }
};

export default config;
