import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n=================================================");
  console.log("Deploying HealthDataAggregator (Production)");
  console.log("=================================================");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer);
  console.log();

  const healthDataAggregator = await deploy("HealthDataAggregator", {
    from: deployer,
    args: [], // Constructor has no args
    log: true,
    skipIfAlreadyDeployed: false,
  });

  console.log();
  console.log("✅ HealthDataAggregator deployed to:", healthDataAggregator.address);
  console.log();
  console.log("=================================================");
  console.log("NEXT STEPS:");
  console.log("=================================================");
  console.log("1. Verify on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${healthDataAggregator.address}`);
  console.log();
  console.log("2. Update frontend addresses:");
  console.log(`   app-hackathon/lib/addresses.ts`);
  console.log(`   Replace: healthDataAggregator: "${healthDataAggregator.address}"`);
  console.log();
  console.log("3. Authorize researcher (if needed):");
  console.log(`   npx hardhat authorizeResearcher --network sepolia --contract ${healthDataAggregator.address} --researcher <ADDRESS>`);
  console.log();
  console.log("4. Test submission:");
  console.log(`   Visit: https://yourdomain.com/health-aggregate`);
  console.log("=================================================");
  console.log();

  // Get contract instance
  const contract = await hre.ethers.getContractAt("HealthDataAggregator", healthDataAggregator.address);

  // Read initial state
  const owner = await contract.owner();
  const submissionCount = await contract.submissionCount();
  const maxHealthValue = await contract.MAX_HEALTH_VALUE();
  const currentEpochId = await contract.currentEpochId();

  console.log("📊 Contract State:");
  console.log("   Owner:", owner);
  console.log("   Submission Count:", submissionCount.toString());
  console.log("   MAX_HEALTH_VALUE:", maxHealthValue.toString());
  console.log("   Current Epoch ID:", currentEpochId.toString());
  console.log();

  if (hre.network.name === "sepolia") {
    console.log("🔗 Contract Links:");
    console.log(`   Etherscan: https://sepolia.etherscan.io/address/${healthDataAggregator.address}`);
    console.log(`   Tenderly: https://dashboard.tenderly.co/contract/sepolia/${healthDataAggregator.address}`);
    console.log();
  }

  return true;
};

export default func;
func.id = "deploy_health_data_aggregator"; // id required to prevent re-execution
func.tags = ["HealthDataAggregator", "production"];
