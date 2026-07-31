import { ethers } from "hardhat";

async function main() {
  console.log("\n🔄 Closing Public Statistics Epoch");
  console.log("==========================================================\n");

  const contractAddress = "0x780c06f807E5fB8768A0cD6648A28D8A621F0470";
  const [signer] = await ethers.getSigners();

  console.log("Calling from address:", signer.address);
  console.log("Contract address:", contractAddress);

  // Get contract instance
  const contract = await ethers.getContractAt("HealthDataAggregator", contractAddress);

  // Check current state
  const submissionCount = await contract.submissionCount();
  const currentEpochId = await contract.currentEpochId();

  console.log("\n📊 Current State:");
  console.log("   Total submissions:", submissionCount.toString());
  console.log("   Current epoch ID:", currentEpochId.toString());

  // Close the current epoch (Phase 1 of two-phase reveal)
  console.log("\n🔒 Closing epoch (Phase 1: Request KMS decryption)...");
  const tx = await contract.closePublicStatsEpoch();

  console.log("   Transaction hash:", tx.hash);
  console.log("   Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed!");
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas used:", receipt.gasUsed.toString());

  // Parse events to get the epoch ID
  const epochClosedEvent = receipt.logs
    .map((log: any) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event: any) => event?.name === "PublicStatsEpochClosed");

  if (epochClosedEvent) {
    const epochId = epochClosedEvent.args.epochId;
    const submissionCount = epochClosedEvent.args.submissionCount;

    console.log("\n📈 Epoch Closed:");
    console.log("   Epoch ID:", epochId.toString());
    console.log("   Submissions in epoch:", submissionCount.toString());
    console.log("\n⏳ Next step: Wait for KMS decryption, then call finalizePublicStatsEpoch()");
    console.log("   with the epoch ID, cleartexts, and proof from the KMS.");
  }

  // Check updated state
  const newEpochId = await contract.currentEpochId();
  console.log("\n📊 Updated State:");
  console.log("   New current epoch ID:", newEpochId.toString());

  console.log("\n==========================================================");
  console.log("✅ Epoch closed successfully!");
  console.log("==========================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
