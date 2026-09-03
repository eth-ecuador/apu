/**
 * Standalone deployment - NO Hardhat, NO z

ksync-web3
 * Just ethers.js + compiled contract
 */
import { ethers } from "ethers";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
// ESM equivalents
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load .env from root
dotenv.config({ path: join(__dirname, "../../.env") });
async function main() {
    console.log("=== Deploying MedicalDataRegistry to Sepolia ===\n");
    // Setup provider and wallet
    const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("Deployer address:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH\n");
    if (parseFloat(ethers.formatEther(balance)) < 0.01) {
        throw new Error("Insufficient balance for deployment (need at least 0.01 ETH)");
    }
    // Load compiled contract
    const artifactPath = join(__dirname, "./artifacts/contracts/MedicalDataRegistry.sol/MedicalDataRegistry.json");
    let artifact;
    try {
        artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    }
    catch (error) {
        console.error("\n❌ Contract not compiled.");
        console.error("Run: npx hardhat compile\n");
        throw error;
    }
    const abi = artifact.abi;
    const bytecode = artifact.bytecode;
    // Deploy contract
    console.log("Deploying MedicalDataRegistry...");
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy();
    console.log("Deploy TX:", contract.deploymentTransaction()?.hash);
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log("✓ MedicalDataRegistry deployed to:", address);
    // Wait for confirmations
    console.log("\nWaiting for 6 block confirmations...");
    const deployTx = contract.deploymentTransaction();
    if (deployTx) {
        await deployTx.wait(6);
        console.log("✓ Confirmed");
    }
    console.log("\n📊 Contract deployed successfully!");
    console.log("\n=== Deployment Complete ===");
    console.log("MedicalDataRegistry:", address);
    console.log("\nUpdate .env with:");
    console.log(`MEDICAL_REGISTRY_ADDRESS=${address}`);
    console.log("\nExplorer:");
    console.log(`https://sepolia.etherscan.io/address/${address}`);
    console.log("\nVerify with:");
    console.log(`npx hardhat verify --network sepolia ${address}`);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error("\nDeployment failed:", error.message);
    process.exit(1);
});
