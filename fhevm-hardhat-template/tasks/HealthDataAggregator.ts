import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("healthdata:authorize", "Authorize a researcher")
  .addParam("contract", "The HealthDataAggregator contract address")
  .addParam("researcher", "The researcher address to authorize")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, researcher } = taskArguments;
    const contract = await ethers.getContractAt("HealthDataAggregator", contractAddress);

    const tx = await contract.authorizeResearcher(researcher);
    await tx.wait();

    console.log(`✅ Researcher ${researcher} authorized`);
    console.log(`   Transaction: ${tx.hash}`);
  });

task("healthdata:status", "Get contract status")
  .addParam("contract", "The HealthDataAggregator contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress } = taskArguments;
    const contract = await ethers.getContractAt("HealthDataAggregator", contractAddress);

    const [owner, researcher, count, epochId, maxValue] = await Promise.all([
      contract.owner(),
      contract.authorizedResearcher(),
      contract.submissionCount(),
      contract.currentEpochId(),
      contract.MAX_HEALTH_VALUE(),
    ]);

    console.log("\n📊 HealthDataAggregator Status");
    console.log("================================");
    console.log(`Contract: ${contractAddress}`);
    console.log(`Owner: ${owner}`);
    console.log(`Authorized Researcher: ${researcher}`);
    console.log(`Submission Count: ${count}`);
    console.log(`Current Epoch: ${epochId}`);
    console.log(`MAX_HEALTH_VALUE: ${maxValue}`);
    console.log("================================\n");
  });

task("healthdata:close-epoch", "Close public statistics epoch")
  .addParam("contract", "The HealthDataAggregator contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress } = taskArguments;
    const contract = await ethers.getContractAt("HealthDataAggregator", contractAddress);

    const tx = await contract.closePublicStatsEpoch();
    const receipt = await tx.wait();

    // Find epoch ID from events
    const event = receipt.logs
      .map((log: any) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e?.name === "PublicStatsEpochClosed");

    const epochId = event?.args?.epochId;

    console.log(`✅ Public stats epoch closed`);
    console.log(`   Epoch ID: ${epochId}`);
    console.log(`   Transaction: ${tx.hash}`);
  });

task("healthdata:stats", "Get public statistics for an epoch")
  .addParam("contract", "The HealthDataAggregator contract address")
  .addParam("epoch", "The epoch ID to query")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { contract: contractAddress, epoch } = taskArguments;
    const contract = await ethers.getContractAt("HealthDataAggregator", contractAddress);

    try {
      const [sum, average, count, closedAt] = await contract.getPublicStats(epoch);

      console.log(`\n📈 Public Statistics (Epoch ${epoch})`);
      console.log("================================");
      console.log(`Sum: ${sum}`);
      console.log(`Average: ${average}`);
      console.log(`Count: ${count}`);
      console.log(`Closed At: ${new Date(Number(closedAt) * 1000).toISOString()}`);
      console.log("================================\n");
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      console.log(`   Epoch ${epoch} may not be finalized yet`);
    }
  });
