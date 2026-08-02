import { ethers } from "hardhat";

async function main() {
  console.log("=== Deploying to Sepolia (Zama FHE) ===\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy MedicalDataRegistry
  console.log("Deploying MedicalDataRegistry...");
  const MedicalDataRegistry = await ethers.getContractFactory("MedicalDataRegistry");
  const registry = await MedicalDataRegistry.deploy();
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log("✓ MedicalDataRegistry deployed to:", registryAddress);

  // Wait for confirmations
  console.log("\nWaiting for block confirmations...");
  await registry.deploymentTransaction()?.wait(6);

  console.log("\n=== Deployment Complete ===");
  console.log("MedicalDataRegistry:", registryAddress);
  console.log("\nVerify with:");
  console.log(`npx hardhat verify --network sepolia ${registryAddress}`);

  console.log("\nExplorer:");
  console.log(`https://sepolia.etherscan.io/address/${registryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
