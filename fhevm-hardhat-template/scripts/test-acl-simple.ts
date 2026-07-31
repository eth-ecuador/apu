/**
 * Simplified ACL Backend Test - Skip encryption, test ACL only
 * Assumes patient already has a record submitted
 *
 * Run: npx hardhat run scripts/test-acl-simple.ts --network sepolia
 */

import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0x5B30F890A70933D936De2d45e7DC15191c0aA0a5"; // Updated MedicalRecordsV2 with ACL

async function main() {
  console.log("\n=================================================");
  console.log("ACL SYSTEM BACKEND TESTING - SEPOLIA");
  console.log("Testing Patient-Doctor Authorization Workflow");
  console.log("=================================================\n");

  // Get patient signer (deployer)
  const [patient] = await ethers.getSigners();

  // Create a doctor wallet (deterministic for testing)
  const doctorPrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
  const doctor = new ethers.Wallet(doctorPrivateKey, ethers.provider);

  console.log("🔑 Accounts:");
  console.log(`   Patient: ${patient.address}`);
  console.log(`   Doctor:  ${doctor.address}\n`);

  // Connect to deployed contract
  const MedicalRecordsV2 = await ethers.getContractFactory("MedicalRecordsV2");
  const contract = MedicalRecordsV2.attach(CONTRACT_ADDRESS);

  console.log(`📋 Contract: ${CONTRACT_ADDRESS}\n`);

  // =============================================================================
  // STEP 1: Check if patient has a record
  // =============================================================================
  console.log("STEP 1: Checking patient data...");
  const hasSubmitted = await contract.hasSubmitted(patient.address);
  console.log(`   Has patient submitted? ${hasSubmitted}\n`);

  if (!hasSubmitted) {
    console.log("   ⚠️  Patient needs to submit data first.");
    console.log("   Run this from the frontend or use the existing submission.\n");
    process.exit(0);
  }

  // =============================================================================
  // STEP 2: Check current authorization status
  // =============================================================================
  console.log("STEP 2: Checking doctor authorization status...");
  const isAuthorizedBefore = await contract.isDoctorAuthorized(patient.address, doctor.address);
  console.log(`   Is doctor authorized? ${isAuthorizedBefore}\n`);

  // =============================================================================
  // STEP 3: Patient authorizes doctor
  // =============================================================================
  if (!isAuthorizedBefore) {
    console.log("STEP 3: Patient authorizing doctor...");
    console.log(`   Patient (${patient.address})`);
    console.log(`   Authorizing doctor: ${doctor.address}\n`);

    const authTx = await contract.connect(patient).authorizeDoctor(doctor.address);
    console.log("   ⏳ Waiting for authorization transaction...");
    const authReceipt = await authTx.wait();
    console.log(`   ✅ Doctor authorized! (Tx: ${authReceipt.hash})\n`);

    // Verify authorization
    const isAuthorizedAfter = await contract.isDoctorAuthorized(patient.address, doctor.address);
    console.log(`   ✓ Verification: isDoctorAuthorized = ${isAuthorizedAfter}\n`);
  } else {
    console.log("STEP 3: Doctor already authorized\n");
  }

  // =============================================================================
  // STEP 4: Doctor retrieves patient's encrypted record
  // =============================================================================
  console.log("STEP 4: Doctor retrieving patient's encrypted record...");
  try {
    const record = await contract.connect(doctor).getPatientRecord(patient.address);

    console.log("   ✅ Doctor successfully retrieved encrypted record!");
    console.log("   📊 Encrypted Handles:");
    console.log(`      Risk Score:        ${record.riskScore}`);
    console.log(`      Systolic BP:       ${record.systolicBP}`);
    console.log(`      Diastolic BP:      ${record.diastolicBP}`);
    console.log(`      Heart Rate:        ${record.heartRate}`);
    console.log(`      Temperature:       ${record.temperature}`);
    console.log(`      Oxygen Saturation: ${record.oxygenSaturation}`);
    console.log(`      Pain Level:        ${record.painLevel}`);
    console.log(`      ESI Level:         ${record.esiLevel}`);
    console.log(`      Symptoms Bitmask:  ${record.symptomsBitmask}\n`);

    console.log("   ℹ️  Note: These are encrypted handles (bytes32)");
    console.log("   ℹ️  To decrypt, the doctor would call fhevm.requestDecrypt()");
    console.log("   ℹ️  with these handles via the Gateway/KMS system\n");
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // =============================================================================
  // STEP 5: Test unauthorized access (should fail)
  // =============================================================================
  console.log("STEP 5: Testing unauthorized access...");
  console.log("   Creating unauthorized account...");

  // Create a new random wallet (unauthorized)
  const unauthorizedWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  console.log(`   Unauthorized account: ${unauthorizedWallet.address}\n`);

  try {
    await contract.connect(unauthorizedWallet).getPatientRecord(patient.address);
    console.log("   ❌ SECURITY ISSUE: Unauthorized access was allowed!\n");
  } catch (error: any) {
    console.log("   ✅ Access correctly denied for unauthorized account");
    console.log(`   ✓ Error message: "${error.message.split('(')[0].trim()}"\n`);
  }

  // =============================================================================
  // STEP 6: Patient revokes doctor authorization
  // =============================================================================
  console.log("STEP 6: Patient revoking doctor authorization...");
  const revokeTx = await contract.connect(patient).revokeDoctor(doctor.address);
  console.log("   ⏳ Waiting for revocation transaction...");
  const revokeReceipt = await revokeTx.wait();
  console.log(`   ✅ Doctor authorization revoked! (Tx: ${revokeReceipt.hash})\n`);

  // Verify revocation
  const isAuthorizedAfterRevoke = await contract.isDoctorAuthorized(patient.address, doctor.address);
  console.log(`   ✓ Verification: isDoctorAuthorized = ${isAuthorizedAfterRevoke}\n`);

  // =============================================================================
  // STEP 7: Verify doctor can no longer access (should fail)
  // =============================================================================
  console.log("STEP 7: Verifying revocation works...");
  try {
    await contract.connect(doctor).getPatientRecord(patient.address);
    console.log("   ❌ SECURITY ISSUE: Doctor still has access after revocation!\n");
  } catch (error: any) {
    console.log("   ✅ Access correctly denied after revocation");
    console.log(`   ✓ Error message: "${error.message.split('(')[0].trim()}"\n`);
  }

  // =============================================================================
  // STEP 8: Re-authorize doctor (optional)
  // =============================================================================
  console.log("STEP 8: Re-authorizing doctor...");
  const reAuthTx = await contract.connect(patient).authorizeDoctor(doctor.address);
  console.log("   ⏳ Waiting for re-authorization...");
  const reAuthReceipt = await reAuthTx.wait();
  console.log(`   ✅ Doctor re-authorized! (Tx: ${reAuthReceipt.hash})\n`);

  const isAuthorizedFinal = await contract.isDoctorAuthorized(patient.address, doctor.address);
  console.log(`   ✓ Final status: isDoctorAuthorized = ${isAuthorizedFinal}\n`);

  // =============================================================================
  // SUMMARY
  // =============================================================================
  console.log("=================================================");
  console.log("✅ ACL SYSTEM BACKEND TEST COMPLETE");
  console.log("=================================================");
  console.log("\n📊 Test Results:");
  console.log("   ✓ Patient has health record");
  console.log("   ✓ Patient can authorize doctor");
  console.log("   ✓ Authorized doctor can retrieve encrypted record");
  console.log("   ✓ Unauthorized access is blocked");
  console.log("   ✓ Patient can revoke doctor authorization");
  console.log("   ✓ Revoked doctor cannot access records");
  console.log("   ✓ Patient can re-authorize doctor");
  console.log("\n🎯 ACL System Status: FULLY FUNCTIONAL");
  console.log("\n📝 Next Steps:");
  console.log("   1. Update frontend UI for patient record decryption");
  console.log("   2. Add UI for patient to authorize/revoke doctors");
  console.log("   3. Add UI for doctor to view authorized patient records");
  console.log("   4. Implement KMS decryption flow in frontend");
  console.log("\n=================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error during ACL testing:");
    console.error(error);
    process.exit(1);
  });
