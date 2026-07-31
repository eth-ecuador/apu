import { ethers, fhevm } from "hardhat";

async function main() {
  console.log("\n🧪 Submitting Multiple Health Data Entries");
  console.log("==========================================================\n");

  const contractAddress = "0x780c06f807E5fB8768A0cD6648A28D8A621F0470";
  const [signer] = await ethers.getSigners();

  console.log("Testing from address:", signer.address);
  console.log("Contract address:", contractAddress);

  // Get contract instance
  const contract = await ethers.getContractAt("HealthDataAggregator", contractAddress);

  // Check initial state
  const initialCount = await contract.submissionCount();
  console.log("\n📊 Initial submission count:", initialCount.toString());

  // Initialize FHE CLI API
  console.log("\n🔐 Initializing FHE CLI API...");
  await fhevm.initializeCLIApi();
  console.log("✅ FHE CLI API initialized");

  // Test data: various risk scores to test aggregation
  const riskScores = [45, 67, 82, 55, 91, 38, 73, 60];

  console.log(`\n📤 Submitting ${riskScores.length} health data entries...`);
  console.log(`   Risk scores: [${riskScores.join(", ")}]`);
  console.log(`   Average: ${riskScores.reduce((a, b) => a + b, 0) / riskScores.length}`);

  const txHashes = [];

  for (let i = 0; i < riskScores.length; i++) {
    const riskScore = riskScores[i];
    console.log(`\n[${i + 1}/${riskScores.length}] Risk Score: ${riskScore}`);

    // Encrypt data
    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signer.address)
      .add32(riskScore)
      .encrypt();

    console.log(`   ✅ Encrypted`);

    try {
      // Submit encrypted data
      const tx = await contract.submitHealthData(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      console.log(`   📤 TX: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`   ✅ Confirmed in block ${receipt.blockNumber} (gas: ${receipt.gasUsed.toString()})`);

      txHashes.push(tx.hash);
    } catch (error: any) {
      console.log(`   ⚠️  Error: ${error.message}`);
      if (error.message.includes("Already submitted")) {
        console.log(`   ℹ️  Patient already submitted in this epoch`);
        break;
      }
    }
  }

  // Check final state
  const finalCount = await contract.submissionCount();
  console.log("\n📊 Final submission count:", finalCount.toString());
  console.log(`   New submissions: ${Number(finalCount) - Number(initialCount)}`);

  console.log("\n📝 Transaction Hashes:");
  txHashes.forEach((hash, i) => {
    console.log(`   ${i + 1}. ${hash}`);
  });

  console.log("\n==========================================================");
  console.log("✅ Multiple submissions completed!");
  console.log("==========================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
