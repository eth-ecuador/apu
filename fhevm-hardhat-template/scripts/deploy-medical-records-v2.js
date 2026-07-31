const hre = require("hardhat");

async function main() {
  console.log("\n=================================================");
  console.log("Deploying MedicalRecordsV2 to Sepolia");
  console.log("Production-Grade Medical Records with Complete Vital Signs");
  console.log("=================================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  console.log("Deploying MedicalRecordsV2...");
  const MedicalRecordsV2 = await hre.ethers.getContractFactory("MedicalRecordsV2");
  const contract = await MedicalRecordsV2.deploy();

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("\n✅ MedicalRecordsV2 deployed to:", address);

  // Get initial state
  const owner = await contract.owner();
  const authorizedResearcher = await contract.authorizedResearcher();
  const currentEpochId = await contract.currentEpochId();
  const counts = await contract.getCurrentCounts();

  // Get constants
  const maxRiskScore = await contract.MAX_RISK_SCORE();
  const maxBP = await contract.MAX_BP();
  const maxHeartRate = await contract.MAX_HEART_RATE();
  const maxTemp = await contract.MAX_TEMP_C();
  const maxO2Sat = await contract.MAX_O2_SAT();
  const maxPain = await contract.MAX_PAIN();
  const sourcePatient = await contract.SOURCE_PATIENT();
  const sourceProvider = await contract.SOURCE_PROVIDER();

  console.log("\n📊 Contract State:");
  console.log("   Owner:", owner);
  console.log("   Authorized Researcher:", authorizedResearcher === "0x0000000000000000000000000000000000000000" ? "None" : authorizedResearcher);
  console.log("   Current Epoch ID:", currentEpochId.toString());
  console.log("   Patient Submissions:", counts[0].toString());
  console.log("   Provider Submissions:", counts[1].toString());
  console.log("   Total Submissions:", counts[2].toString());

  console.log("\n⚙️  Contract Constants:");
  console.log("   MAX_RISK_SCORE:", maxRiskScore.toString());
  console.log("   MAX_BP:", maxBP.toString(), "mmHg");
  console.log("   MAX_HEART_RATE:", maxHeartRate.toString(), "bpm");
  console.log("   MAX_TEMP_C:", maxTemp.toString(), "(Celsius * 10)");
  console.log("   MAX_O2_SAT:", maxO2Sat.toString(), "%");
  console.log("   MAX_PAIN:", maxPain.toString());
  console.log("   SOURCE_PATIENT:", sourcePatient.toString());
  console.log("   SOURCE_PROVIDER:", sourceProvider.toString());

  console.log("\n🏥 Features:");
  console.log("   ✓ Patient self-report (symptoms, pain, demographics)");
  console.log("   ✓ Clinical assessment (full vital signs + ESI triage)");
  console.log("   ✓ Batch clinical submission (up to 50 patients)");
  console.log("   ✓ Separate patient/provider aggregates");
  console.log("   ✓ Public stats epochs with KMS decryption");
  console.log("   ✓ SAMPLE framework + ESI triage compliance");

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
  console.log(`   medicalRecordsV2: "${address}"`);
  console.log("\n3. Authorize researcher (optional):");
  console.log(`   Call contract.authorizeResearcher(researcherAddress)`);
  console.log("\n4. Test patient self-report:");
  console.log(`   Call contract.submitPatientSelfReport(...)`);
  console.log("\n5. Test clinical assessment:");
  console.log(`   Call contract.submitClinicalAssessment(...)`);
  console.log("=================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
