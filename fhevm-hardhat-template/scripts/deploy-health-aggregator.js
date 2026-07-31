const hre = require("hardhat");

async function main() {
  console.log("\n=================================================");
  console.log("Deploying HealthDataAggregator to Sepolia");
  console.log("=================================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  console.log("Deploying HealthDataAggregator...");
  const HealthDataAggregator = await hre.ethers.getContractFactory("HealthDataAggregator");
  const contract = await HealthDataAggregator.deploy();

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("\n✅ HealthDataAggregator deployed to:", address);

  // Get initial state
  const owner = await contract.owner();
  const submissionCount = await contract.submissionCount();
  const maxHealthValue = await contract.MAX_HEALTH_VALUE();
  const currentEpochId = await contract.currentEpochId();

  console.log("\n📊 Contract State:");
  console.log("   Owner:", owner);
  console.log("   Submission Count:", submissionCount.toString());
  console.log("   MAX_HEALTH_VALUE:", maxHealthValue.toString());
  console.log("   Current Epoch ID:", currentEpochId.toString());

  console.log("\n🔗 Links:");
  console.log("   Etherscan:", `https://sepolia.etherscan.io/address/${address}`);
  console.log("   Contract Address:", address);

  console.log("\n=================================================");
  console.log("NEXT STEPS:");
  console.log("=================================================");
  console.log("1. Verify on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${address}`);
  console.log("\n2. Update frontend:");
  console.log(`   app-hackathon/lib/addresses.ts`);
  console.log(`   healthDataAggregator: "${address}"`);
  console.log("\n3. Authorize researcher (optional):");
  console.log(`   npx hardhat healthdata:authorize --network sepolia --contract ${address} --researcher <ADDRESS>`);
  console.log("=================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
