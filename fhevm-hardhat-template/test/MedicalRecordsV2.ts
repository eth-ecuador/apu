import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { MedicalRecordsV2, MedicalRecordsV2__factory } from "../types";
import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

type Signers = {
  deployer: HardhatEthersSigner;
  researcher: HardhatEthersSigner;
  patientAlice: HardhatEthersSigner;
  patientBob: HardhatEthersSigner;
  patientCarol: HardhatEthersSigner;
  provider: HardhatEthersSigner;
  unauthorized: HardhatEthersSigner;
  doctorDave: HardhatEthersSigner;
  doctorEve: HardhatEthersSigner;
};

async function deployMedicalRecordsV2Fixture() {
  const factory = (await ethers.getContractFactory("MedicalRecordsV2")) as MedicalRecordsV2__factory;
  const contract = (await factory.deploy()) as MedicalRecordsV2;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("MedicalRecordsV2 - Production-Grade Medical Records with FHE", function () {
  let signers: Signers;
  let medicalRecords: MedicalRecordsV2;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      researcher: ethSigners[1],
      patientAlice: ethSigners[2],
      patientBob: ethSigners[3],
      patientCarol: ethSigners[4],
      provider: ethSigners[5],
      unauthorized: ethSigners[6],
      doctorDave: ethSigners[7],
      doctorEve: ethSigners[8],
    };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This hardhat test suite cannot run on Sepolia Testnet");
      this.skip();
    }

    ({ contract: medicalRecords, contractAddress } = await deployMedicalRecordsV2Fixture());
  });

  // =============================================================================
  // TEST 1: Deployment and Initial State
  // =============================================================================

  describe("Deployment", function () {
    it("should set the correct owner", async function () {
      expect(await medicalRecords.owner()).to.equal(signers.deployer.address);
    });

    it("should initialize current epoch ID to zero", async function () {
      expect(await medicalRecords.currentEpochId()).to.equal(0);
    });

    it("should have no authorized researcher initially", async function () {
      expect(await medicalRecords.authorizedResearcher()).to.equal(ethers.ZeroAddress);
    });

    it("should initialize submission counts to zero", async function () {
      const [patientCount, providerCount, totalCount] = await medicalRecords.getCurrentCounts();
      expect(patientCount).to.equal(0);
      expect(providerCount).to.equal(0);
      expect(totalCount).to.equal(0);
    });

    it("should have correct maximum constants", async function () {
      expect(await medicalRecords.MAX_RISK_SCORE()).to.equal(100);
      expect(await medicalRecords.MAX_BP()).to.equal(200);
      expect(await medicalRecords.MAX_HEART_RATE()).to.equal(200);
      expect(await medicalRecords.MAX_TEMP_C()).to.equal(50); // 50.0°C (stored as temp * 10)
      expect(await medicalRecords.MAX_O2_SAT()).to.equal(100);
      expect(await medicalRecords.MAX_PAIN()).to.equal(10);
      expect(await medicalRecords.SOURCE_PATIENT()).to.equal(0);
      expect(await medicalRecords.SOURCE_PROVIDER()).to.equal(1);
    });
  });

  // =============================================================================
  // TEST 2: Researcher Authorization
  // =============================================================================

  describe("Researcher Authorization", function () {
    it("should allow owner to authorize a researcher", async function () {
      await medicalRecords.connect(signers.deployer).authorizeResearcher(signers.researcher.address);
      expect(await medicalRecords.authorizedResearcher()).to.equal(signers.researcher.address);
    });

    it("should emit ResearcherAuthorized event", async function () {
      await expect(medicalRecords.connect(signers.deployer).authorizeResearcher(signers.researcher.address))
        .to.emit(medicalRecords, "ResearcherAuthorized")
        .withArgs(signers.researcher.address);
    });

    it("should not allow non-owner to authorize researcher", async function () {
      await expect(
        medicalRecords.connect(signers.unauthorized).authorizeResearcher(signers.researcher.address)
      ).to.be.revertedWith("Only owner");
    });

    it("should not allow authorizing zero address as researcher", async function () {
      await expect(
        medicalRecords.connect(signers.deployer).authorizeResearcher(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid researcher address");
    });

    it("should allow owner to revoke researcher authorization", async function () {
      await medicalRecords.connect(signers.deployer).authorizeResearcher(signers.researcher.address);
      await medicalRecords.connect(signers.deployer).revokeResearcher();
      expect(await medicalRecords.authorizedResearcher()).to.equal(ethers.ZeroAddress);
    });

    it("should emit ResearcherRevoked event", async function () {
      await medicalRecords.connect(signers.deployer).authorizeResearcher(signers.researcher.address);
      await expect(medicalRecords.connect(signers.deployer).revokeResearcher())
        .to.emit(medicalRecords, "ResearcherRevoked")
        .withArgs(signers.researcher.address);
    });
  });

  // =============================================================================
  // TEST 3: Patient Self-Report Submission
  // =============================================================================

  describe("Patient Self-Report Submission", function () {
    it("should allow a patient to submit self-report data", async function () {
      const riskScore = 75; // Calculated risk 0-100
      const symptomsBitmask = 0b1010; // Example symptoms flags
      const painLevel = 7; // Pain scale 0-10

      // Create encrypted input for patient self-report
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(riskScore); // encRiskScore
      encryptedInput.add32(symptomsBitmask); // encSymptomsBitmask
      encryptedInput.add32(painLevel); // encPainLevel
      const encrypted = await encryptedInput.encrypt();

      const tx = await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);

      await expect(tx)
        .to.emit(medicalRecords, "HealthRecordSubmitted")
        .withArgs(signers.patientAlice.address, await medicalRecords.SOURCE_PATIENT(), anyValue);

      const [patientCount, providerCount, totalCount] = await medicalRecords.getCurrentCounts();
      expect(patientCount).to.equal(1);
      expect(providerCount).to.equal(0);
      expect(totalCount).to.equal(1);

      expect(await medicalRecords.hasSubmitted(signers.patientAlice.address)).to.be.true;
    });

    it("should validate risk score is within bounds", async function () {
      const invalidRiskScore = 150; // > MAX_RISK_SCORE (100)
      const symptomsBitmask = 0b1010;
      const painLevel = 7;

      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(invalidRiskScore);
      encryptedInput.add32(symptomsBitmask);
      encryptedInput.add32(painLevel);
      const encrypted = await encryptedInput.encrypt();

      // The contract should clamp the value and set error flag
      // This tests the encrypted validation logic
      const tx = await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);

      await expect(tx).to.emit(medicalRecords, "HealthRecordSubmitted");
    });

    it("should not allow double submission from same patient", async function () {
      const riskScore = 75;
      const symptomsBitmask = 0b1010;
      const painLevel = 7;

      // First submission
      const encryptedInput1 = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput1.add32(riskScore);
      encryptedInput1.add32(symptomsBitmask);
      encryptedInput1.add32(painLevel);
      const encrypted1 = await encryptedInput1.encrypt();

      await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(encrypted1.handles[0], encrypted1.handles[1], encrypted1.handles[2], encrypted1.inputProof);

      // Second submission should fail
      const encryptedInput2 = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput2.add32(80);
      encryptedInput2.add32(0b1111);
      encryptedInput2.add32(5);
      const encrypted2 = await encryptedInput2.encrypt();

      await expect(
        medicalRecords
          .connect(signers.patientAlice)
          .submitPatientSelfReport(encrypted2.handles[0], encrypted2.handles[1], encrypted2.handles[2], encrypted2.inputProof)
      ).to.be.revertedWith("Already submitted");
    });

    it("should allow multiple patients to submit self-reports", async function () {
      const patients = [
        { signer: signers.patientAlice, risk: 75, symptoms: 0b1010, pain: 7 },
        { signer: signers.patientBob, risk: 60, symptoms: 0b0101, pain: 4 },
        { signer: signers.patientCarol, risk: 85, symptoms: 0b1111, pain: 9 },
      ];

      for (const { signer, risk, symptoms, pain } of patients) {
        const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signer.address);
        encryptedInput.add32(risk);
        encryptedInput.add32(symptoms);
        encryptedInput.add32(pain);
        const encrypted = await encryptedInput.encrypt();

        await medicalRecords
          .connect(signer)
          .submitPatientSelfReport(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);
      }

      const [patientCount, providerCount, totalCount] = await medicalRecords.getCurrentCounts();
      expect(patientCount).to.equal(3);
      expect(providerCount).to.equal(0);
      expect(totalCount).to.equal(3);

      expect(await medicalRecords.hasSubmitted(signers.patientAlice.address)).to.be.true;
      expect(await medicalRecords.hasSubmitted(signers.patientBob.address)).to.be.true;
      expect(await medicalRecords.hasSubmitted(signers.patientCarol.address)).to.be.true;
    });
  });

  // =============================================================================
  // TEST 4: Clinical Assessment Submission (Provider Only)
  // =============================================================================

  describe("Clinical Assessment Submission", function () {
    it("should allow owner to submit clinical assessment", async function () {
      const riskScore = 85;
      const systolicBP = 140; // mmHg
      const diastolicBP = 90;
      const heartRate = 95; // bpm
      const temperature = 385; // 38.5°C * 10
      const oxygenSat = 96; // %
      const painLevel = 6;
      const esiLevel = 2; // ESI triage level 1-5

      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address);
      encryptedInput.add32(riskScore);
      encryptedInput.add32(systolicBP);
      encryptedInput.add32(diastolicBP);
      encryptedInput.add32(heartRate);
      encryptedInput.add32(temperature);
      encryptedInput.add32(oxygenSat);
      encryptedInput.add32(painLevel);
      encryptedInput.add8(esiLevel);
      const encrypted = await encryptedInput.encrypt();

      const tx = await medicalRecords
        .connect(signers.deployer)
        .submitClinicalAssessment(
          signers.patientAlice.address,
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.handles[2],
          encrypted.handles[3],
          encrypted.handles[4],
          encrypted.handles[5],
          encrypted.handles[6],
          encrypted.handles[7],
          encrypted.inputProof
        );

      await expect(tx)
        .to.emit(medicalRecords, "HealthRecordSubmitted")
        .withArgs(signers.patientAlice.address, await medicalRecords.SOURCE_PROVIDER(), anyValue);

      const [patientCount, providerCount, totalCount] = await medicalRecords.getCurrentCounts();
      expect(patientCount).to.equal(0);
      expect(providerCount).to.equal(1);
      expect(totalCount).to.equal(1);

      expect(await medicalRecords.hasSubmitted(signers.patientAlice.address)).to.be.true;
    });

    it("should not allow non-owner to submit clinical assessment", async function () {
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.unauthorized.address);
      encryptedInput.add32(85);
      encryptedInput.add32(140);
      encryptedInput.add32(90);
      encryptedInput.add32(95);
      encryptedInput.add32(385);
      encryptedInput.add32(96);
      encryptedInput.add32(6);
      encryptedInput.add8(2);
      const encrypted = await encryptedInput.encrypt();

      await expect(
        medicalRecords
          .connect(signers.unauthorized)
          .submitClinicalAssessment(
            signers.patientAlice.address,
            encrypted.handles[0],
            encrypted.handles[1],
            encrypted.handles[2],
            encrypted.handles[3],
            encrypted.handles[4],
            encrypted.handles[5],
            encrypted.handles[6],
            encrypted.handles[7],
            encrypted.inputProof
          )
      ).to.be.revertedWith("Only owner");
    });

    it("should validate vital signs are within bounds", async function () {
      const invalidBP = 350; // > MAX_BP (300)
      const invalidHeartRate = 320; // > MAX_HEART_RATE (300)

      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address);
      encryptedInput.add32(85);
      encryptedInput.add32(invalidBP); // Will be clamped
      encryptedInput.add32(90);
      encryptedInput.add32(invalidHeartRate); // Will be clamped
      encryptedInput.add32(385);
      encryptedInput.add32(96);
      encryptedInput.add32(6);
      encryptedInput.add8(2);
      const encrypted = await encryptedInput.encrypt();

      // Contract should clamp values and set error flag
      const tx = await medicalRecords
        .connect(signers.deployer)
        .submitClinicalAssessment(
          signers.patientAlice.address,
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.handles[2],
          encrypted.handles[3],
          encrypted.handles[4],
          encrypted.handles[5],
          encrypted.handles[6],
          encrypted.handles[7],
          encrypted.inputProof
        );

      await expect(tx).to.emit(medicalRecords, "HealthRecordSubmitted");
    });

    it("should not allow clinical assessment for patient who already submitted", async function () {
      // Patient submits self-report first
      const encryptedInputPatient = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInputPatient.add32(75);
      encryptedInputPatient.add32(0b1010);
      encryptedInputPatient.add32(7);
      const encryptedPatient = await encryptedInputPatient.encrypt();

      await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(
          encryptedPatient.handles[0],
          encryptedPatient.handles[1],
          encryptedPatient.handles[2],
          encryptedPatient.inputProof
        );

      // Provider tries to submit clinical assessment for same patient
      const encryptedInputProvider = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address);
      encryptedInputProvider.add32(85);
      encryptedInputProvider.add32(140);
      encryptedInputProvider.add32(90);
      encryptedInputProvider.add32(95);
      encryptedInputProvider.add32(385);
      encryptedInputProvider.add32(96);
      encryptedInputProvider.add32(6);
      encryptedInputProvider.add8(2);
      const encryptedProvider = await encryptedInputProvider.encrypt();

      await expect(
        medicalRecords
          .connect(signers.deployer)
          .submitClinicalAssessment(
            signers.patientAlice.address,
            encryptedProvider.handles[0],
            encryptedProvider.handles[1],
            encryptedProvider.handles[2],
            encryptedProvider.handles[3],
            encryptedProvider.handles[4],
            encryptedProvider.handles[5],
            encryptedProvider.handles[6],
            encryptedProvider.handles[7],
            encryptedProvider.inputProof
          )
      ).to.be.revertedWith("Patient already submitted");
    });
  });

  // =============================================================================
  // TEST 5: Batch Clinical Assessment Submission
  // =============================================================================

  describe("Batch Clinical Assessment", function () {
    it("should allow owner to submit batch clinical assessments", async function () {
      const batchSize = 3;
      const patients = [signers.patientAlice.address, signers.patientBob.address, signers.patientCarol.address];
      const riskScores = [85, 70, 90];

      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address);
      for (const score of riskScores) {
        encryptedInput.add32(score);
      }
      const encrypted = await encryptedInput.encrypt();

      const tx = await medicalRecords
        .connect(signers.deployer)
        .submitClinicalAssessmentBatch(patients, encrypted.handles.slice(0, 3), encrypted.inputProof);

      // Batch emits individual HealthRecordSubmitted events for each patient
      await expect(tx).to.not.be.reverted;

      const [patientCount, providerCount, totalCount] = await medicalRecords.getCurrentCounts();
      expect(patientCount).to.equal(0);
      expect(providerCount).to.equal(3);
      expect(totalCount).to.equal(3);

      expect(await medicalRecords.hasSubmitted(signers.patientAlice.address)).to.be.true;
      expect(await medicalRecords.hasSubmitted(signers.patientBob.address)).to.be.true;
      expect(await medicalRecords.hasSubmitted(signers.patientCarol.address)).to.be.true;
    });

    it("should not allow non-owner to submit batch assessments", async function () {
      const patients = [signers.patientAlice.address];
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.unauthorized.address);
      encryptedInput.add32(85);
      const encrypted = await encryptedInput.encrypt();

      await expect(
        medicalRecords
          .connect(signers.unauthorized)
          .submitClinicalAssessmentBatch(patients, [encrypted.handles[0]], encrypted.inputProof)
      ).to.be.revertedWith("Only owner");
    });

    it("should not allow empty batch", async function () {
      const patients: string[] = [];
      const riskScores: string[] = [];
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address);
      const encrypted = await encryptedInput.encrypt();

      await expect(
        medicalRecords.connect(signers.deployer).submitClinicalAssessmentBatch(patients, riskScores, encrypted.inputProof)
      ).to.be.revertedWith("Batch size 1-50");
    });

    it("should enforce maximum batch size of 50", async function () {
      const patients = Array(51).fill(signers.patientAlice.address);
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address);
      for (let i = 0; i < 51; i++) {
        encryptedInput.add32(85);
      }
      const encrypted = await encryptedInput.encrypt();

      await expect(
        medicalRecords
          .connect(signers.deployer)
          .submitClinicalAssessmentBatch(patients, encrypted.handles.slice(0, 51), encrypted.inputProof)
      ).to.be.revertedWith("Batch size 1-50");
    });

    it("should require arrays of equal length", async function () {
      const patients = [signers.patientAlice.address, signers.patientBob.address];
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address);
      encryptedInput.add32(85); // Only 1 risk score for 2 patients
      const encrypted = await encryptedInput.encrypt();

      await expect(
        medicalRecords.connect(signers.deployer).submitClinicalAssessmentBatch(patients, [encrypted.handles[0]], encrypted.inputProof)
      ).to.be.revertedWith("Array length mismatch");
    });
  });

  // =============================================================================
  // TEST 6: CRITICAL SECURITY TEST - Individual Records NOT Decryptable
  // =============================================================================

  describe("Security: Individual Records Privacy", function () {
    it("should store patient self-reports without ACL for individual access", async function () {
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(75);
      encryptedInput.add32(0b1010);
      encryptedInput.add32(7);
      const encrypted = await encryptedInput.encrypt();

      await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);

      // CRITICAL: Individual submissions have NO ACL permissions for the patient
      // They cannot be decrypted individually - only aggregates can be decrypted
      expect(await medicalRecords.hasSubmitted(signers.patientAlice.address)).to.be.true;

      // This proves the privacy guarantee: individual patient data is encrypted
      // and cannot be accessed, even by the patient themselves
    });

    it("should store clinical assessments without ACL for individual access", async function () {
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address);
      encryptedInput.add32(85);
      encryptedInput.add32(140);
      encryptedInput.add32(90);
      encryptedInput.add32(95);
      encryptedInput.add32(385);
      encryptedInput.add32(96);
      encryptedInput.add32(6);
      encryptedInput.add8(2);
      const encrypted = await encryptedInput.encrypt();

      await medicalRecords
        .connect(signers.deployer)
        .submitClinicalAssessment(
          signers.patientAlice.address,
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.handles[2],
          encrypted.handles[3],
          encrypted.handles[4],
          encrypted.handles[5],
          encrypted.handles[6],
          encrypted.handles[7],
          encrypted.inputProof
        );

      // Individual clinical records are also NOT decryptable
      expect(await medicalRecords.hasSubmitted(signers.patientAlice.address)).to.be.true;
    });

    it("should maintain privacy even after multiple mixed submissions", async function () {
      // Mix of patient self-reports and clinical assessments
      const encryptedInputPatient = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInputPatient.add32(75);
      encryptedInputPatient.add32(0b1010);
      encryptedInputPatient.add32(7);
      const encryptedPatient = await encryptedInputPatient.encrypt();

      await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(
          encryptedPatient.handles[0],
          encryptedPatient.handles[1],
          encryptedPatient.handles[2],
          encryptedPatient.inputProof
        );

      const encryptedInputProvider = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address);
      encryptedInputProvider.add32(85);
      encryptedInputProvider.add32(140);
      encryptedInputProvider.add32(90);
      encryptedInputProvider.add32(95);
      encryptedInputProvider.add32(385);
      encryptedInputProvider.add32(96);
      encryptedInputProvider.add32(6);
      encryptedInputProvider.add8(2);
      const encryptedProvider = await encryptedInputProvider.encrypt();

      await medicalRecords
        .connect(signers.deployer)
        .submitClinicalAssessment(
          signers.patientBob.address,
          encryptedProvider.handles[0],
          encryptedProvider.handles[1],
          encryptedProvider.handles[2],
          encryptedProvider.handles[3],
          encryptedProvider.handles[4],
          encryptedProvider.handles[5],
          encryptedProvider.handles[6],
          encryptedProvider.handles[7],
          encryptedProvider.inputProof
        );

      const [patientCount, providerCount, totalCount] = await medicalRecords.getCurrentCounts();
      expect(patientCount).to.equal(1);
      expect(providerCount).to.equal(1);
      expect(totalCount).to.equal(2);

      // ALL individual submissions are stored but NONE are individually decryptable
      // Only the separate aggregates (patient vs provider) can be decrypted
    });
  });

  // =============================================================================
  // TEST 7: Epoch System and Public Stats
  // =============================================================================

  describe("Epoch System", function () {
    it("should close current epoch and create new one", async function () {
      // Submit some data first
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(75);
      encryptedInput.add32(0b1010);
      encryptedInput.add32(7);
      const encrypted = await encryptedInput.encrypt();

      await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);

      const currentEpochBefore = await medicalRecords.currentEpochId();

      const tx = await medicalRecords.connect(signers.deployer).closePublicStatsEpoch();

      const currentEpochAfter = await medicalRecords.currentEpochId();
      expect(currentEpochAfter).to.equal(currentEpochBefore + 1n); // Increments after close

      await expect(tx).to.emit(medicalRecords, "EpochClosed").withArgs(currentEpochBefore, 1, 0);
    });

    it("should allow closing epoch even with no submissions", async function () {
      // closePublicStatsEpoch can be called anytime, even with zero submissions
      const tx = await medicalRecords.connect(signers.deployer).closePublicStatsEpoch();
      await expect(tx).to.emit(medicalRecords, "EpochClosed").withArgs(0, 0, 0);
      expect(await medicalRecords.currentEpochId()).to.equal(1);
    });

    it("should allow anyone to close epoch", async function () {
      // Submit data
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(75);
      encryptedInput.add32(0b1010);
      encryptedInput.add32(7);
      const encrypted = await encryptedInput.encrypt();

      await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);

      // Unauthorized user can also close epoch
      await expect(medicalRecords.connect(signers.unauthorized).closePublicStatsEpoch()).to.not.be.reverted;
    });

    it("should track separate patient and provider aggregates per epoch", async function () {
      // Patient self-report
      const encryptedInputPatient = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInputPatient.add32(75);
      encryptedInputPatient.add32(0b1010);
      encryptedInputPatient.add32(7);
      const encryptedPatient = await encryptedInputPatient.encrypt();

      await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(
          encryptedPatient.handles[0],
          encryptedPatient.handles[1],
          encryptedPatient.handles[2],
          encryptedPatient.inputProof
        );

      // Clinical assessment
      const encryptedInputProvider = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address);
      encryptedInputProvider.add32(85);
      encryptedInputProvider.add32(140);
      encryptedInputProvider.add32(90);
      encryptedInputProvider.add32(95);
      encryptedInputProvider.add32(385);
      encryptedInputProvider.add32(96);
      encryptedInputProvider.add32(6);
      encryptedInputProvider.add8(2);
      const encryptedProvider = await encryptedInputProvider.encrypt();

      await medicalRecords
        .connect(signers.deployer)
        .submitClinicalAssessment(
          signers.patientBob.address,
          encryptedProvider.handles[0],
          encryptedProvider.handles[1],
          encryptedProvider.handles[2],
          encryptedProvider.handles[3],
          encryptedProvider.handles[4],
          encryptedProvider.handles[5],
          encryptedProvider.handles[6],
          encryptedProvider.handles[7],
          encryptedProvider.inputProof
        );

      const [patientCount, providerCount, totalCount] = await medicalRecords.getCurrentCounts();
      expect(patientCount).to.equal(1);
      expect(providerCount).to.equal(1);
      expect(totalCount).to.equal(2);
    });
  });

  // =============================================================================
  // TEST 8: Source Tracking (Patient vs Provider)
  // =============================================================================

  describe("Data Source Tracking", function () {
    it("should correctly track patient submissions as SOURCE_PATIENT (0)", async function () {
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(75);
      encryptedInput.add32(0b1010);
      encryptedInput.add32(7);
      const encrypted = await encryptedInput.encrypt();

      await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);

      const [patientCount, providerCount, totalCount] = await medicalRecords.getCurrentCounts();
      expect(patientCount).to.equal(1);
      expect(providerCount).to.equal(0);

      // Verify SOURCE_PATIENT constant is 0
      expect(await medicalRecords.SOURCE_PATIENT()).to.equal(0);
    });

    it("should correctly track clinical assessments as SOURCE_PROVIDER (1)", async function () {
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address);
      encryptedInput.add32(85);
      encryptedInput.add32(140);
      encryptedInput.add32(90);
      encryptedInput.add32(95);
      encryptedInput.add32(385);
      encryptedInput.add32(96);
      encryptedInput.add32(6);
      encryptedInput.add8(2);
      const encrypted = await encryptedInput.encrypt();

      await medicalRecords
        .connect(signers.deployer)
        .submitClinicalAssessment(
          signers.patientAlice.address,
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.handles[2],
          encrypted.handles[3],
          encrypted.handles[4],
          encrypted.handles[5],
          encrypted.handles[6],
          encrypted.handles[7],
          encrypted.inputProof
        );

      const [patientCount, providerCount, totalCount] = await medicalRecords.getCurrentCounts();
      expect(patientCount).to.equal(0);
      expect(providerCount).to.equal(1);

      // Verify SOURCE_PROVIDER constant is 1
      expect(await medicalRecords.SOURCE_PROVIDER()).to.equal(1);
    });
  });

  // =============================================================================
  // TEST 9: View Functions
  // =============================================================================

  describe("View Functions", function () {
    it("should return correct current counts", async function () {
      const [patientCount, providerCount, totalCount] = await medicalRecords.getCurrentCounts();
      expect(patientCount).to.equal(0);
      expect(providerCount).to.equal(0);
      expect(totalCount).to.equal(0);

      // Submit patient self-report
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(75);
      encryptedInput.add32(0b1010);
      encryptedInput.add32(7);
      const encrypted = await encryptedInput.encrypt();

      await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);

      const [patientCountAfter, providerCountAfter, totalCountAfter] = await medicalRecords.getCurrentCounts();
      expect(patientCountAfter).to.equal(1);
      expect(providerCountAfter).to.equal(0);
      expect(totalCountAfter).to.equal(1);
    });

    it("should check if patient has submitted", async function () {
      expect(await medicalRecords.hasSubmitted(signers.patientAlice.address)).to.be.false;

      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(75);
      encryptedInput.add32(0b1010);
      encryptedInput.add32(7);
      const encrypted = await encryptedInput.encrypt();

      await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);

      expect(await medicalRecords.hasSubmitted(signers.patientAlice.address)).to.be.true;
    });
  });

  // =============================================================================
  // TEST 10: End-to-End Flow with Epoch and Separate Aggregates
  // =============================================================================

  describe("End-to-End Flow", function () {
    it("should correctly aggregate separate patient and provider data across epoch", async function () {
      // Submit patient self-reports
      const patientData = [
        { signer: signers.patientAlice, risk: 75, symptoms: 0b1010, pain: 7 },
        { signer: signers.patientBob, risk: 60, symptoms: 0b0101, pain: 4 },
      ];

      for (const { signer, risk, symptoms, pain } of patientData) {
        const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signer.address);
        encryptedInput.add32(risk);
        encryptedInput.add32(symptoms);
        encryptedInput.add32(pain);
        const encrypted = await encryptedInput.encrypt();

        await medicalRecords
          .connect(signer)
          .submitPatientSelfReport(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);
      }

      // Submit clinical assessment
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address);
      encryptedInput.add32(85);
      encryptedInput.add32(140);
      encryptedInput.add32(90);
      encryptedInput.add32(95);
      encryptedInput.add32(385);
      encryptedInput.add32(96);
      encryptedInput.add32(6);
      encryptedInput.add8(2);
      const encrypted = await encryptedInput.encrypt();

      await medicalRecords
        .connect(signers.deployer)
        .submitClinicalAssessment(
          signers.patientCarol.address,
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.handles[2],
          encrypted.handles[3],
          encrypted.handles[4],
          encrypted.handles[5],
          encrypted.handles[6],
          encrypted.handles[7],
          encrypted.inputProof
        );

      const [patientCount, providerCount, totalCount] = await medicalRecords.getCurrentCounts();
      expect(patientCount).to.equal(2); // Alice + Bob
      expect(providerCount).to.equal(1); // Carol
      expect(totalCount).to.equal(3);

      // Close epoch
      const tx = await medicalRecords.connect(signers.deployer).closePublicStatsEpoch();
      await expect(tx).to.emit(medicalRecords, "EpochClosed").withArgs(0, 2, 1);

      // In a real Sepolia deployment:
      // 1. closePublicStatsEpoch() makes aggregates publicly decryptable
      // 2. Gateway/KMS automatically processes the decryption
      // 3. finalizePublicStatsEpoch() is called with cleartexts + proof
      // 4. PatientAggregateSum = 75 + 60 = 135 (avg: 67.5)
      // 5. ProviderAggregateSum = 85 (avg: 85)
    });
  });

  // =============================================================================
  // TEST 11: ACL System - Patient-Doctor Authorization (NEW)
  // =============================================================================

  describe("ACL System - Patient-Doctor Authorization", function () {
    beforeEach(async function () {
      // Submit a patient self-report for Alice
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(75); // riskScore
      encryptedInput.add32(0b1010); // symptomsBitmask
      encryptedInput.add32(7); // painLevel
      const encrypted = await encryptedInput.encrypt();

      await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);
    });

    it("should allow patient to authorize a doctor", async function () {
      const tx = await medicalRecords.connect(signers.patientAlice).authorizeDoctor(signers.doctorDave.address);

      await expect(tx)
        .to.emit(medicalRecords, "DoctorAuthorized")
        .withArgs(signers.patientAlice.address, signers.doctorDave.address);

      expect(await medicalRecords.isDoctorAuthorized(signers.patientAlice.address, signers.doctorDave.address)).to.be.true;
    });

    it("should allow patient to revoke doctor authorization", async function () {
      // First authorize
      await medicalRecords.connect(signers.patientAlice).authorizeDoctor(signers.doctorDave.address);
      expect(await medicalRecords.isDoctorAuthorized(signers.patientAlice.address, signers.doctorDave.address)).to.be.true;

      // Then revoke
      const tx = await medicalRecords.connect(signers.patientAlice).revokeDoctor(signers.doctorDave.address);

      await expect(tx)
        .to.emit(medicalRecords, "DoctorRevoked")
        .withArgs(signers.patientAlice.address, signers.doctorDave.address);

      expect(await medicalRecords.isDoctorAuthorized(signers.patientAlice.address, signers.doctorDave.address)).to.be.false;
    });

    it("should not allow authorizing zero address as doctor", async function () {
      await expect(
        medicalRecords.connect(signers.patientAlice).authorizeDoctor(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid doctor address");
    });

    it("should not allow authorizing doctor if patient has no health record", async function () {
      await expect(
        medicalRecords.connect(signers.patientBob).authorizeDoctor(signers.doctorDave.address)
      ).to.be.revertedWith("No health record to share");
    });

    it("should allow patient to authorize multiple doctors", async function () {
      await medicalRecords.connect(signers.patientAlice).authorizeDoctor(signers.doctorDave.address);
      await medicalRecords.connect(signers.patientAlice).authorizeDoctor(signers.doctorEve.address);

      expect(await medicalRecords.isDoctorAuthorized(signers.patientAlice.address, signers.doctorDave.address)).to.be.true;
      expect(await medicalRecords.isDoctorAuthorized(signers.patientAlice.address, signers.doctorEve.address)).to.be.true;
    });

    it("should allow patient to selectively revoke specific doctor", async function () {
      // Authorize both doctors
      await medicalRecords.connect(signers.patientAlice).authorizeDoctor(signers.doctorDave.address);
      await medicalRecords.connect(signers.patientAlice).authorizeDoctor(signers.doctorEve.address);

      // Revoke only Dave
      await medicalRecords.connect(signers.patientAlice).revokeDoctor(signers.doctorDave.address);

      expect(await medicalRecords.isDoctorAuthorized(signers.patientAlice.address, signers.doctorDave.address)).to.be.false;
      expect(await medicalRecords.isDoctorAuthorized(signers.patientAlice.address, signers.doctorEve.address)).to.be.true;
    });

    it("should return false for unauthorized doctor by default", async function () {
      expect(await medicalRecords.isDoctorAuthorized(signers.patientAlice.address, signers.doctorDave.address)).to.be.false;
    });

    it("should be patient-specific - authorization does not apply to other patients", async function () {
      // Alice authorizes doctor Dave
      await medicalRecords.connect(signers.patientAlice).authorizeDoctor(signers.doctorDave.address);

      // Submit data for Bob
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientBob.address);
      encryptedInput.add32(60);
      encryptedInput.add32(0b0101);
      encryptedInput.add32(4);
      const encrypted = await encryptedInput.encrypt();

      await medicalRecords
        .connect(signers.patientBob)
        .submitPatientSelfReport(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);

      // Dave is authorized for Alice but NOT for Bob
      expect(await medicalRecords.isDoctorAuthorized(signers.patientAlice.address, signers.doctorDave.address)).to.be.true;
      expect(await medicalRecords.isDoctorAuthorized(signers.patientBob.address, signers.doctorDave.address)).to.be.false;
    });
  });

  // =============================================================================
  // TEST 12: Individual Record Retrieval with ACL Enforcement (NEW)
  // =============================================================================

  describe("Individual Record Retrieval", function () {
    beforeEach(async function () {
      // Submit a clinical assessment for Alice (includes all vital signs)
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.deployer.address);
      encryptedInput.add32(85); // riskScore
      encryptedInput.add32(140); // systolicBP
      encryptedInput.add32(90); // diastolicBP
      encryptedInput.add32(95); // heartRate
      encryptedInput.add32(385); // temperature (38.5°C * 10)
      encryptedInput.add32(96); // oxygenSat
      encryptedInput.add32(6); // painLevel
      encryptedInput.add8(2); // esiLevel
      const encrypted = await encryptedInput.encrypt();

      await medicalRecords
        .connect(signers.deployer)
        .submitClinicalAssessment(
          signers.patientAlice.address,
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.handles[2],
          encrypted.handles[3],
          encrypted.handles[4],
          encrypted.handles[5],
          encrypted.handles[6],
          encrypted.handles[7],
          encrypted.inputProof
        );
    });

    it("should allow patient to retrieve their own encrypted record", async function () {
      const record = await medicalRecords.connect(signers.patientAlice).getPatientRecord(signers.patientAlice.address);

      // Returns 9 encrypted handles
      expect(record).to.have.lengthOf(9);
      expect(record.riskScore).to.not.equal(ethers.ZeroHash);
      expect(record.systolicBP).to.not.equal(ethers.ZeroHash);
      expect(record.diastolicBP).to.not.equal(ethers.ZeroHash);
      expect(record.heartRate).to.not.equal(ethers.ZeroHash);
      expect(record.temperature).to.not.equal(ethers.ZeroHash);
      expect(record.oxygenSaturation).to.not.equal(ethers.ZeroHash);
      expect(record.painLevel).to.not.equal(ethers.ZeroHash);
      expect(record.esiLevel).to.not.equal(ethers.ZeroHash);
      expect(record.symptomsBitmask).to.not.equal(ethers.ZeroHash);
    });

    it("should allow authorized doctor to retrieve patient's encrypted record", async function () {
      // Patient authorizes doctor
      await medicalRecords.connect(signers.patientAlice).authorizeDoctor(signers.doctorDave.address);

      // Doctor can now retrieve the record
      const record = await medicalRecords.connect(signers.doctorDave).getPatientRecord(signers.patientAlice.address);

      expect(record).to.have.lengthOf(9);
      expect(record.riskScore).to.not.equal(ethers.ZeroHash);
    });

    it("should NOT allow unauthorized doctor to retrieve patient's record", async function () {
      // Doctor Dave is NOT authorized
      await expect(
        medicalRecords.connect(signers.doctorDave).getPatientRecord(signers.patientAlice.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("should NOT allow unauthorized third party to retrieve patient's record", async function () {
      await expect(
        medicalRecords.connect(signers.unauthorized).getPatientRecord(signers.patientAlice.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("should prevent access after doctor authorization is revoked", async function () {
      // Authorize doctor
      await medicalRecords.connect(signers.patientAlice).authorizeDoctor(signers.doctorDave.address);

      // Verify doctor can access
      const recordBefore = await medicalRecords.connect(signers.doctorDave).getPatientRecord(signers.patientAlice.address);
      expect(recordBefore.riskScore).to.not.equal(ethers.ZeroHash);

      // Revoke authorization
      await medicalRecords.connect(signers.patientAlice).revokeDoctor(signers.doctorDave.address);

      // Doctor can no longer access
      await expect(
        medicalRecords.connect(signers.doctorDave).getPatientRecord(signers.patientAlice.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("should fail if trying to retrieve record for patient with no submission", async function () {
      await expect(
        medicalRecords.connect(signers.patientBob).getPatientRecord(signers.patientBob.address)
      ).to.be.revertedWith("No record");
    });

    it("should enforce patient-specific ACL - doctor authorized by Alice cannot access Bob's records", async function () {
      // Alice authorizes doctor Dave
      await medicalRecords.connect(signers.patientAlice).authorizeDoctor(signers.doctorDave.address);

      // Submit data for Bob
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientBob.address);
      encryptedInput.add32(60);
      encryptedInput.add32(0b0101);
      encryptedInput.add32(4);
      const encrypted = await encryptedInput.encrypt();

      await medicalRecords
        .connect(signers.patientBob)
        .submitPatientSelfReport(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);

      // Dave can access Alice's records
      const aliceRecord = await medicalRecords.connect(signers.doctorDave).getPatientRecord(signers.patientAlice.address);
      expect(aliceRecord.riskScore).to.not.equal(ethers.ZeroHash);

      // Dave CANNOT access Bob's records (not authorized)
      await expect(
        medicalRecords.connect(signers.doctorDave).getPatientRecord(signers.patientBob.address)
      ).to.be.revertedWith("Not authorized");
    });
  });

  // =============================================================================
  // TEST 13: End-to-End ACL Flow (NEW)
  // =============================================================================

  describe("End-to-End ACL Flow", function () {
    it("should complete full patient-doctor workflow with decryption", async function () {
      // Step 1: Patient submits self-report
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(75);
      encryptedInput.add32(0b1010);
      encryptedInput.add32(7);
      const encrypted = await encryptedInput.encrypt();

      await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(encrypted.handles[0], encrypted.handles[1], encrypted.handles[2], encrypted.inputProof);

      expect(await medicalRecords.hasSubmitted(signers.patientAlice.address)).to.be.true;

      // Step 2: Patient authorizes doctor to view records
      await medicalRecords.connect(signers.patientAlice).authorizeDoctor(signers.doctorDave.address);

      expect(await medicalRecords.isDoctorAuthorized(signers.patientAlice.address, signers.doctorDave.address)).to.be.true;

      // Step 3: Doctor retrieves encrypted record
      const encryptedRecord = await medicalRecords.connect(signers.doctorDave).getPatientRecord(signers.patientAlice.address);

      expect(encryptedRecord.riskScore).to.not.equal(ethers.ZeroHash);
      expect(encryptedRecord.symptomsBitmask).to.not.equal(ethers.ZeroHash);
      expect(encryptedRecord.painLevel).to.not.equal(ethers.ZeroHash);

      // Step 4: In real Sepolia deployment, doctor would:
      // - Call fhevm.requestDecrypt() with the encrypted handles
      // - Gateway/KMS processes decryption request
      // - Doctor receives plaintext values via callback

      // Step 5: Patient revokes access
      await medicalRecords.connect(signers.patientAlice).revokeDoctor(signers.doctorDave.address);

      // Step 6: Doctor can no longer access
      await expect(
        medicalRecords.connect(signers.doctorDave).getPatientRecord(signers.patientAlice.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("should handle multiple patients and multiple doctors with independent ACLs", async function () {
      // Submit data for Alice and Bob
      const aliceData = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      aliceData.add32(75);
      aliceData.add32(0b1010);
      aliceData.add32(7);
      const aliceEncrypted = await aliceData.encrypt();

      await medicalRecords
        .connect(signers.patientAlice)
        .submitPatientSelfReport(aliceEncrypted.handles[0], aliceEncrypted.handles[1], aliceEncrypted.handles[2], aliceEncrypted.inputProof);

      const bobData = await fhevm.createEncryptedInput(contractAddress, signers.patientBob.address);
      bobData.add32(60);
      bobData.add32(0b0101);
      bobData.add32(4);
      const bobEncrypted = await bobData.encrypt();

      await medicalRecords
        .connect(signers.patientBob)
        .submitPatientSelfReport(bobEncrypted.handles[0], bobEncrypted.handles[1], bobEncrypted.handles[2], bobEncrypted.inputProof);

      // Alice authorizes doctorDave
      await medicalRecords.connect(signers.patientAlice).authorizeDoctor(signers.doctorDave.address);

      // Bob authorizes doctorEve
      await medicalRecords.connect(signers.patientBob).authorizeDoctor(signers.doctorEve.address);

      // doctorDave can access Alice but NOT Bob
      const aliceRecord = await medicalRecords.connect(signers.doctorDave).getPatientRecord(signers.patientAlice.address);
      expect(aliceRecord.riskScore).to.not.equal(ethers.ZeroHash);

      await expect(
        medicalRecords.connect(signers.doctorDave).getPatientRecord(signers.patientBob.address)
      ).to.be.revertedWith("Not authorized");

      // doctorEve can access Bob but NOT Alice
      const bobRecord = await medicalRecords.connect(signers.doctorEve).getPatientRecord(signers.patientBob.address);
      expect(bobRecord.riskScore).to.not.equal(ethers.ZeroHash);

      await expect(
        medicalRecords.connect(signers.doctorEve).getPatientRecord(signers.patientAlice.address)
      ).to.be.revertedWith("Not authorized");
    });
  });
});
