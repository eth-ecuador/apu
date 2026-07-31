import { ethers, fhevm } from "hardhat";

async function main() {
  console.log("\n🧪 Batch Submitting Health Data (Owner/Provider Flow)");
  console.log("==========================================================\n");

  const contractAddress = "0x780c06f807E5fB8768A0cD6648A28D8A621F0470";
  const [owner] = await ethers.getSigners();

  console.log("Owner address:", owner.address);
  console.log("Contract address:", contractAddress);

  // Get contract instance
  const contract = await ethers.getContractAt("HealthDataAggregator", contractAddress);

  // Check initial state
  const initialCount = await contract.submissionCount();
  const currentEpoch = await contract.currentEpochId();
  console.log("\n📊 Initial State:");
  console.log("   Submission count:", initialCount.toString());
  console.log("   Current epoch:", currentEpoch.toString());

  // Initialize FHE CLI API
  console.log("\n🔐 Initializing FHE CLI API...");
  await fhevm.initializeCLIApi();
  console.log("✅ FHE CLI API initialized");

  // Simulated patient addresses (we'll use random addresses for testing)
  const patients = [
    "0x1234567890123456789012345678901234567891",
    "0x1234567890123456789012345678901234567892",
    "0x1234567890123456789012345678901234567893",
    "0x1234567890123456789012345678901234567894",
    "0x1234567890123456789012345678901234567895",
  ];

  // Test data: various risk scores to test aggregation
  const riskScores = [45, 67, 82, 55, 91];

  console.log(`\n📤 Batch submitting data for ${patients.length} patients...`);
  console.log(`   Risk scores: [${riskScores.join(", ")}]`);
  console.log(`   Average: ${(riskScores.reduce((a, b) => a + b, 0) / riskScores.length).toFixed(2)}`);

  // Encrypt all risk scores in a batch
  console.log("\n🔒 Encrypting batch data...");

  const encryptedInput = fhevm.createEncryptedInput(contractAddress, owner.address);

  for (let i = 0; i < riskScores.length; i++) {
    encryptedInput.add32(riskScores[i]);
    console.log(`   [${i + 1}] Patient ${i + 1}: Risk Score ${riskScores[i]}`);
  }

  const encrypted = await encryptedInput.encrypt();
  console.log("✅ Batch encrypted");
  console.log(`   Handles: ${encrypted.handles.length}`);
  console.log(`   Proof length: ${encrypted.inputProof.length} bytes`);

  // Submit batch
  console.log("\n📤 Submitting batch to contract...");
  const tx = await contract.submitHealthDataBatch(
    patients,
    encrypted.handles,
    encrypted.inputProof
  );

  console.log("   Transaction hash:", tx.hash);
  console.log("   Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed!");
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas used:", receipt.gasUsed.toString());

  // Check updated state
  const finalCount = await contract.submissionCount();
  console.log("\n📊 Final State:");
  console.log("   Submission count:", finalCount.toString());
  console.log(`   New submissions: ${Number(finalCount) - Number(initialCount)}`);

  // Check if patients are marked as submitted
  console.log("\n👥 Patient Submission Status:");
  for (let i = 0; i < patients.length; i++) {
    const hasSubmitted = await contract.hasPatientSubmitted(patients[i]);
    console.log(`   Patient ${i + 1}: ${hasSubmitted ? "✅ Submitted" : "❌ Not submitted"}`);
  }

  console.log("\n==========================================================");
  console.log("✅ Batch submission completed successfully!");
  console.log(`📊 Total patients in system: ${finalCount.toString()}`);
  console.log("==========================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
