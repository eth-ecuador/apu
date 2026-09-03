import { ethers } from "hardhat";
import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying to 0G Mainnet (Chain ID: 16661)");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("📍 Deploying with address:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "0G");

  if (balance === 0n) {
    throw new Error("❌ Deployer account has no 0G tokens!");
  }

  // Deploy MedicalDataRegistry
  console.log("\n📄 Deploying MedicalDataRegistry...");
  const MedicalDataRegistry = await ethers.getContractFactory("MedicalDataRegistry");
  const registry = await MedicalDataRegistry.deploy();

  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  console.log("✅ MedicalDataRegistry deployed to:", registryAddress);

  // Save deployment info
  const deployment = {
    network: "0G Mainnet",
    chainId: 16661,
    contract: "MedicalDataRegistry",
    address: registryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    explorer: `https://scan.0g.ai/address/${registryAddress}`,
    transactionHash: registry.deploymentTransaction()?.hash
  };

  console.log("\n📊 Deployment Summary:");
  console.log(JSON.stringify(deployment, null, 2));

  // Save to file
  const deploymentsDir = path.join(__dirname, "../deployments/ogMainnet");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "MedicalDataRegistry.json");
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n💾 Deployment info saved to:", deploymentFile);

  console.log("\n⏳ Waiting 30 seconds before verification...");
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Verify contract
  try {
    console.log("🔍 Verifying contract on 0G Explorer...");
    await hre.run("verify:verify", {
      address: registryAddress,
      constructorArguments: []
    });
    console.log("✅ Contract verified successfully!");
  } catch (error: any) {
    console.log("⚠️  Verification failed - you can verify manually later");
    console.log("Error:", error.message);
    console.log("\nManual verification command:");
    console.log(`npx hardhat verify --network ogMainnet ${registryAddress}`);
  }

  console.log("\n✅ Deployment complete!");
  console.log("\n📋 Next steps:");
  console.log("1. Verify contract on 0G Explorer:", deployment.explorer);
  console.log("2. Update frontend with contract address:", registryAddress);
  console.log("3. Update backend configuration");
  console.log("4. Run end-to-end tests");
  console.log("5. Create demo video for Wave 3 submission");

  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
