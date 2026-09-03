import { ethers } from "hardhat";
import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🧪 Deploying to 0G Galileo TESTNET (Chain ID: 16602)");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("📍 Deploying with address:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "0G (testnet)");

  if (balance === 0n) {
    console.log("\n❌ Deployer account has no testnet 0G tokens!");
    console.log("\n💡 Get testnet tokens from:");
    console.log("   - 0G Galileo Faucet: https://faucet.0g.ai");
    console.log("   - 0G Discord: https://discord.gg/0glabs");
    throw new Error("Insufficient balance");
  }

  // Deploy MedicalDataRegistry
  console.log("\n📄 Deploying MedicalDataRegistry...");
  const MedicalDataRegistry = await ethers.getContractFactory("MedicalDataRegistry");
  const registry = await MedicalDataRegistry.deploy();

  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  console.log("✅ MedicalDataRegistry deployed to:", registryAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const owner = await registry.owner();
  const totalPatients = await registry.totalPatients();
  const totalDiagnoses = await registry.totalDiagnoses();

  console.log("   Owner:", owner);
  console.log("   Total Patients:", totalPatients.toString());
  console.log("   Total Diagnoses:", totalDiagnoses.toString());

  // Save deployment info
  const deployment = {
    network: "0G Galileo Testnet",
    chainId: 16602,
    contract: "MedicalDataRegistry",
    address: registryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    explorer: `https://scan-testnet.0g.ai/address/${registryAddress}`,
    transactionHash: registry.deploymentTransaction()?.hash,
    verification: {
      owner: owner,
      totalPatients: totalPatients.toString(),
      totalDiagnoses: totalDiagnoses.toString()
    }
  };

  console.log("\n📊 Deployment Summary:");
  console.log(JSON.stringify(deployment, null, 2));

  // Save to file
  const deploymentsDir = path.join(__dirname, "../deployments/ogGalileo");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "MedicalDataRegistry.json");
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n💾 Deployment info saved to:", deploymentFile);

  console.log("\n⏳ Waiting 10 seconds before verification...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Verify contract on explorer
  try {
    console.log("🔍 Verifying contract on 0G Testnet Explorer...");
    await hre.run("verify:verify", {
      address: registryAddress,
      constructorArguments: []
    });
    console.log("✅ Contract verified successfully!");
  } catch (error: any) {
    console.log("⚠️  Verification may have failed - check manually");
    console.log("Manual verification:");
    console.log(`npx hardhat verify --network ogGalileo ${registryAddress}`);
  }

  console.log("\n✅ Testnet deployment complete!");
  console.log("\n📋 Next steps:");
  console.log("1. View on explorer:", deployment.explorer);
  console.log("2. Test contract functions");
  console.log("3. Update frontend to testnet");
  console.log("4. Run end-to-end tests");
  console.log("5. If all works, proceed to mainnet deployment");

  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
