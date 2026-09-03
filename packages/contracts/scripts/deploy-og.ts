import { ethers } from "hardhat";

async function main() {
  console.log("=== Deploying to 0G Mainnet ===\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "0G\n");

  // Optional: Deploy StorageAnchor contract for anchoring Merkle roots
  console.log("Note: 0G Storage SDK handles storage natively.");
  console.log("No additional contracts needed for 0G integration.");
  console.log("\nIf you want to anchor Merkle roots on-chain for verification,");
  console.log("create a StorageAnchor.sol contract.");

  console.log("\n=== 0G Setup Complete ===");
  console.log("\nConfiguration:");
  console.log("- 0G Storage: Use @0gfoundation/0g-storage-ts-sdk");
  console.log("- 0G Compute: Use @0gfoundation/0g-compute-ts-sdk");
  console.log("- Chain ID: 16661 (0G Mainnet)");
  console.log("- Explorer: https://chainscan.0g.ai");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
