import { ethers } from "hardhat";

async function main() {
  console.log("\n📊 APU Health Data Aggregator - System Status");
  console.log("==========================================================\n");

  const contractAddress = "0x780c06f807E5fB8768A0cD6648A28D8A621F0470";
  const contract = await ethers.getContractAt("HealthDataAggregator", contractAddress);

  // Overall statistics
  const owner = await contract.owner();
  const researcher = await contract.authorizedResearcher();
  const submissionCount = await contract.submissionCount();
  const currentEpochId = await contract.currentEpochId();

  console.log("📋 Contract Information:");
  console.log(`   Address: ${contractAddress}`);
  console.log(`   Owner: ${owner}`);
  console.log(`   Authorized Researcher: ${researcher}`);
  console.log(`   Total Submissions: ${submissionCount.toString()}`);
  console.log(`   Current Epoch ID: ${currentEpochId.toString()}`);

  // Check all epochs
  console.log("\n📈 Epoch Status:");

  for (let i = 0; i <= Number(currentEpochId); i++) {
    try {
      const epoch = await contract.publicStatsEpochs(i);

      console.log(`\n   Epoch ${i}:`);
      console.log(`      Count Snapshot: ${epoch.countSnapshot.toString()}`);
      console.log(`      Status: ${epoch.status === 0n ? "Open" : epoch.status === 1n ? "Closed (Awaiting KMS)" : epoch.status === 2n ? "Finalized" : "Unknown"}`);

      if (epoch.status >= 1n) {
        const closedAt = Number(epoch.closedAt);
        const closedDate = new Date(closedAt * 1000);
        console.log(`      Closed At: ${closedDate.toISOString()}`);

        const now = Math.floor(Date.now() / 1000);
        const waitTime = now - closedAt;
        console.log(`      Wait Time: ${Math.floor(waitTime / 60)} minutes ${waitTime % 60} seconds`);
      }

      if (epoch.status === 2n) {
        console.log(`      ✅ Decrypted Sum: ${epoch.decryptedSum}`);
        console.log(`      ✅ Decrypted Average: ${epoch.decryptedAverage}`);
      } else if (epoch.status === 1n) {
        console.log(`      ⏳ Waiting for KMS decryption...`);
      }
    } catch (error: any) {
      console.log(`   Epoch ${i}: Not found or error - ${error.message}`);
    }
  }

  // Check aggregate status
  console.log("\n🔢 Current Epoch Aggregate:");
  try {
    const currentAggregate = await contract.currentAggregate();
    console.log(`   Encrypted aggregate stored on-chain`);
    console.log(`   (This will be revealed when current epoch is closed)`);
  } catch (error: any) {
    console.log(`   Error reading aggregate: ${error.message}`);
  }

  console.log("\n==========================================================");
  console.log("ℹ️  Note: Epochs in 'Closed' status are waiting for Zama KMS");
  console.log("   to decrypt the aggregates. This typically takes a few minutes");
  console.log("   on devnet. On Sepolia testnet, KMS may not be available.");
  console.log("==========================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
