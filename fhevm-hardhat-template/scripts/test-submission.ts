import { ethers, fhevm } from "hardhat";

async function main() {
  console.log("\n🧪 Testing HealthDataAggregator with encrypted submission");
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

  // Initialize FHE CLI API (pattern from ghostlend mainnet-s3 winner)
  console.log("\n🔐 Initializing FHE CLI API...");
  await fhevm.initializeCLIApi();
  console.log("✅ FHE CLI API initialized");

  // Encrypt health data (risk score: 75) - pattern from winners
  const riskScore = 75;
  console.log(`\n🔒 Encrypting risk score: ${riskScore}`);

  const encryptedInput = await fhevm
    .createEncryptedInput(contractAddress, signer.address)
    .add32(riskScore)
    .encrypt();

  console.log("✅ Data encrypted");
  console.log("   Handle:", encryptedInput.handles[0]);
  console.log("   Proof length:", encryptedInput.inputProof.length, "bytes");

  // Submit encrypted data
  console.log("\n📤 Submitting encrypted health data...");
  const tx = await contract.submitHealthData(
    encryptedInput.handles[0],
    encryptedInput.inputProof
  );

  console.log("   Transaction hash:", tx.hash);
  console.log("   Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed!");
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas used:", receipt.gasUsed.toString());

  // Check updated state
  const finalCount = await contract.submissionCount();
  console.log("\n📊 Final submission count:", finalCount.toString());

  const hasSubmitted = await contract.hasPatientSubmitted(signer.address);
  console.log("   Patient has submitted:", hasSubmitted);

  // Try to get error flag (will be encrypted handle)
  try {
    const errorHandle = await contract.getPatientError(signer.address);
    console.log("\n🏷️  Error flag handle:", errorHandle);
    console.log("   (Decrypt this in frontend to see if clamped)");
  } catch (e: any) {
    console.log("\n⚠️  Could not get error handle:", e.message);
  }

  // Check researcher status
  const authorizedResearcher = await contract.authorizedResearcher();
  console.log("\n👤 Authorized researcher:", authorizedResearcher);

  console.log("\n==========================================================");
  console.log("✅ Test submission completed successfully!");
  console.log("==========================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
