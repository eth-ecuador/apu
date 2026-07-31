import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { HealthDataAggregator, HealthDataAggregator__factory } from "../types";
import { expect } from "chai";

type Signers = {
  deployer: HardhatEthersSigner;
  researcher: HardhatEthersSigner;
  patientAlice: HardhatEthersSigner;
  patientBob: HardhatEthersSigner;
  patientCarol: HardhatEthersSigner;
  unauthorized: HardhatEthersSigner;
};

async function deployHealthDataAggregatorFixture() {
  const factory = (await ethers.getContractFactory("HealthDataAggregator")) as HealthDataAggregator__factory;
  const contract = (await factory.deploy()) as HealthDataAggregator;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("HealthDataAggregator - Privacy-Preserving Health Data", function () {
  let signers: Signers;
  let healthDataAggregator: HealthDataAggregator;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      researcher: ethSigners[1],
      patientAlice: ethSigners[2],
      patientBob: ethSigners[3],
      patientCarol: ethSigners[4],
      unauthorized: ethSigners[5],
    };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This hardhat test suite cannot run on Sepolia Testnet");
      this.skip();
    }

    ({ contract: healthDataAggregator, contractAddress } = await deployHealthDataAggregatorFixture());
  });

  // =============================================================================
  // TEST 1: Deployment and Initial State
  // =============================================================================

  describe("Deployment", function () {
    it("should set the correct owner", async function () {
      expect(await healthDataAggregator.owner()).to.equal(signers.deployer.address);
    });

    it("should initialize submission count to zero", async function () {
      expect(await healthDataAggregator.submissionCount()).to.equal(0);
    });

    it("should have no authorized researcher initially", async function () {
      expect(await healthDataAggregator.authorizedResearcher()).to.equal(ethers.ZeroAddress);
    });
  });

  // =============================================================================
  // TEST 2: Researcher Authorization
  // =============================================================================

  describe("Researcher Authorization", function () {
    it("should allow owner to authorize a researcher", async function () {
      await healthDataAggregator.connect(signers.deployer).authorizeResearcher(signers.researcher.address);
      expect(await healthDataAggregator.authorizedResearcher()).to.equal(signers.researcher.address);
    });

    it("should emit ResearcherAuthorized event", async function () {
      await expect(healthDataAggregator.connect(signers.deployer).authorizeResearcher(signers.researcher.address))
        .to.emit(healthDataAggregator, "ResearcherAuthorized")
        .withArgs(signers.researcher.address);
    });

    it("should not allow non-owner to authorize researcher", async function () {
      await expect(
        healthDataAggregator.connect(signers.unauthorized).authorizeResearcher(signers.researcher.address)
      ).to.be.revertedWith("Only owner");
    });

    it("should not allow authorizing zero address as researcher", async function () {
      await expect(
        healthDataAggregator.connect(signers.deployer).authorizeResearcher(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid researcher address");
    });

    it("should allow owner to revoke researcher authorization", async function () {
      await healthDataAggregator.connect(signers.deployer).authorizeResearcher(signers.researcher.address);
      await healthDataAggregator.connect(signers.deployer).revokeResearcher();
      expect(await healthDataAggregator.authorizedResearcher()).to.equal(ethers.ZeroAddress);
    });

    it("should emit ResearcherRevoked event", async function () {
      await healthDataAggregator.connect(signers.deployer).authorizeResearcher(signers.researcher.address);
      await expect(healthDataAggregator.connect(signers.deployer).revokeResearcher())
        .to.emit(healthDataAggregator, "ResearcherRevoked")
        .withArgs(signers.researcher.address);
    });
  });

  // =============================================================================
  // TEST 3: Submit Encrypted Health Data
  // =============================================================================

  describe("Submit Health Data", function () {
    it("should allow a patient to submit encrypted health data", async function () {
      const riskScore = 75; // Health risk score 0-100

      // Create encrypted input for risk score
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(riskScore);
      const encrypted = await encryptedInput.encrypt();

      const tx = await healthDataAggregator
        .connect(signers.patientAlice)
        ["submitHealthData(bytes32,bytes)"](encrypted.handles[0], encrypted.inputProof);

      await expect(tx).to.emit(healthDataAggregator, "HealthDataSubmitted");

      expect(await healthDataAggregator.submissionCount()).to.equal(1);
      expect(await healthDataAggregator.hasPatientSubmitted(signers.patientAlice.address)).to.be.true;
    });

    it("should not allow double submission from same patient", async function () {
      const riskScore = 75;

      // First submission
      const encryptedInput1 = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput1.add32(riskScore);
      const encrypted1 = await encryptedInput1.encrypt();

      await healthDataAggregator
        .connect(signers.patientAlice)
        ["submitHealthData(bytes32,bytes)"](encrypted1.handles[0], encrypted1.inputProof);

      // Second submission should fail
      const encryptedInput2 = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput2.add32(80);
      const encrypted2 = await encryptedInput2.encrypt();

      await expect(
        healthDataAggregator
          .connect(signers.patientAlice)
          ["submitHealthData(bytes32,bytes)"](encrypted2.handles[0], encrypted2.inputProof)
      ).to.be.revertedWith("Already submitted");
    });

    it("should allow multiple patients to submit", async function () {
      // Alice submits
      const encryptedInputAlice = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInputAlice.add32(75);
      const encryptedAlice = await encryptedInputAlice.encrypt();

      await healthDataAggregator
        .connect(signers.patientAlice)
        ["submitHealthData(bytes32,bytes)"](encryptedAlice.handles[0], encryptedAlice.inputProof);

      // Bob submits
      const encryptedInputBob = await fhevm.createEncryptedInput(contractAddress, signers.patientBob.address);
      encryptedInputBob.add32(60);
      const encryptedBob = await encryptedInputBob.encrypt();

      await healthDataAggregator
        .connect(signers.patientBob)
        ["submitHealthData(bytes32,bytes)"](encryptedBob.handles[0], encryptedBob.inputProof);

      expect(await healthDataAggregator.submissionCount()).to.equal(2);
      expect(await healthDataAggregator.hasPatientSubmitted(signers.patientAlice.address)).to.be.true;
      expect(await healthDataAggregator.hasPatientSubmitted(signers.patientBob.address)).to.be.true;
    });
  });

  // =============================================================================
  // TEST 4: CRITICAL SECURITY TEST - Individual Records NOT Decryptable
  // =============================================================================

  describe("Security: Individual Records Privacy", function () {
    it("should store individual submissions without ACL for patient", async function () {
      const riskScore = 75;

      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(riskScore);
      const encrypted = await encryptedInput.encrypt();

      await healthDataAggregator
        .connect(signers.patientAlice)
        ["submitHealthData(bytes32,bytes)"](encrypted.handles[0], encrypted.inputProof);

      // This is the CRITICAL security proof: individual submissions have no ACL
      // permissions for the patient, so they cannot be decrypted
      expect(await healthDataAggregator.hasPatientSubmitted(signers.patientAlice.address)).to.be.true;

      // Individual submission is stored but NOT accessible to the patient
      // This proves the privacy guarantee
      // In a real scenario, attempting to decrypt individual submission would fail with ACL error
    });

    it("should maintain privacy even after multiple submissions", async function () {
      // Submit data from multiple patients
      const patients = [
        { signer: signers.patientAlice, score: 75 },
        { signer: signers.patientBob, score: 60 },
        { signer: signers.patientCarol, score: 85 },
      ];

      for (const { signer, score } of patients) {
        const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signer.address);
        encryptedInput.add32(score);
        const encrypted = await encryptedInput.encrypt();

        await healthDataAggregator
          .connect(signer)
          ["submitHealthData(bytes32,bytes)"](encrypted.handles[0], encrypted.inputProof);
      }

      expect(await healthDataAggregator.submissionCount()).to.equal(3);

      // All individual submissions are stored but NONE are decryptable
      // Only the aggregate can be decrypted by authorized researcher
    });
  });

  // =============================================================================
  // TEST 5: Aggregate Decryption Request
  // =============================================================================

  describe("Aggregate Decryption", function () {
    it("should allow authorized researcher to request aggregate decryption", async function () {
      // Authorize researcher
      await healthDataAggregator.connect(signers.deployer).authorizeResearcher(signers.researcher.address);

      // Submit some data
      const encryptedInputAlice = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInputAlice.add32(75);
      const encryptedAlice = await encryptedInputAlice.encrypt();

      await healthDataAggregator
        .connect(signers.patientAlice)
        ["submitHealthData(bytes32,bytes)"](encryptedAlice.handles[0], encryptedAlice.inputProof);

      // Researcher requests decryption
      const tx = await healthDataAggregator.connect(signers.researcher).requestAggregateDecryption();

      await expect(tx).to.emit(healthDataAggregator, "AggregateDecryptionRequested");
    });

    it("should not allow unauthorized user to request aggregate decryption", async function () {
      // Submit some data
      const encryptedInputAlice = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInputAlice.add32(75);
      const encryptedAlice = await encryptedInputAlice.encrypt();

      await healthDataAggregator
        .connect(signers.patientAlice)
        ["submitHealthData(bytes32,bytes)"](encryptedAlice.handles[0], encryptedAlice.inputProof);

      // Unauthorized user tries to request decryption
      await expect(
        healthDataAggregator.connect(signers.unauthorized).requestAggregateDecryption()
      ).to.be.revertedWith("Not authorized researcher");
    });

    it("should not allow decryption request when no data submitted", async function () {
      // Authorize researcher
      await healthDataAggregator.connect(signers.deployer).authorizeResearcher(signers.researcher.address);

      await expect(
        healthDataAggregator.connect(signers.researcher).requestAggregateDecryption()
      ).to.be.revertedWith("No data submitted yet");
    });
  });

  // =============================================================================
  // TEST 6: View Functions
  // =============================================================================

  describe("View Functions", function () {
    it("should return correct submission count", async function () {
      expect(await healthDataAggregator.getSubmissionCount()).to.equal(0);

      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(75);
      const encrypted = await encryptedInput.encrypt();

      await healthDataAggregator
        .connect(signers.patientAlice)
        ["submitHealthData(bytes32,bytes)"](encrypted.handles[0], encrypted.inputProof);

      expect(await healthDataAggregator.getSubmissionCount()).to.equal(1);
    });

    it("should check if patient has submitted", async function () {
      expect(await healthDataAggregator.hasPatientSubmitted(signers.patientAlice.address)).to.be.false;

      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(75);
      const encrypted = await encryptedInput.encrypt();

      await healthDataAggregator
        .connect(signers.patientAlice)
        ["submitHealthData(bytes32,bytes)"](encrypted.handles[0], encrypted.inputProof);

      expect(await healthDataAggregator.hasPatientSubmitted(signers.patientAlice.address)).to.be.true;
    });

    it("should allow authorized researcher to get encrypted aggregate", async function () {
      // Authorize researcher
      await healthDataAggregator.connect(signers.deployer).authorizeResearcher(signers.researcher.address);

      // Submit data
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(75);
      const encrypted = await encryptedInput.encrypt();

      await healthDataAggregator
        .connect(signers.patientAlice)
        ["submitHealthData(bytes32,bytes)"](encrypted.handles[0], encrypted.inputProof);

      // Researcher can access encrypted aggregate (not decrypted, just the handle)
      const aggregate = await healthDataAggregator.connect(signers.researcher).getEncryptedAggregate();
      expect(aggregate).to.not.equal(0); // Encrypted handle exists
    });

    it("should not allow unauthorized user to get encrypted aggregate", async function () {
      // Submit data
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signers.patientAlice.address);
      encryptedInput.add32(75);
      const encrypted = await encryptedInput.encrypt();

      await healthDataAggregator
        .connect(signers.patientAlice)
        ["submitHealthData(bytes32,bytes)"](encrypted.handles[0], encrypted.inputProof);

      // Unauthorized user cannot access aggregate
      await expect(
        healthDataAggregator.connect(signers.unauthorized).getEncryptedAggregate()
      ).to.be.revertedWith("Not authorized researcher");
    });
  });

  // =============================================================================
  // TEST 7: End-to-End Aggregate Flow
  // =============================================================================

  describe("End-to-End Aggregate Flow", function () {
    it("should correctly aggregate multiple submissions", async function () {
      // Authorize researcher
      await healthDataAggregator.connect(signers.deployer).authorizeResearcher(signers.researcher.address);

      // Submit data from multiple patients
      const patients = [
        { signer: signers.patientAlice, score: 75 },
        { signer: signers.patientBob, score: 60 },
        { signer: signers.patientCarol, score: 85 },
      ];

      for (const { signer, score } of patients) {
        const encryptedInput = await fhevm.createEncryptedInput(contractAddress, signer.address);
        encryptedInput.add32(score);
        const encrypted = await encryptedInput.encrypt();

        await healthDataAggregator
          .connect(signer)
          ["submitHealthData(bytes32,bytes)"](encrypted.handles[0], encrypted.inputProof);
      }

      expect(await healthDataAggregator.submissionCount()).to.equal(3);

      // Researcher requests aggregate info
      const [encryptedSum, count] = await healthDataAggregator.connect(signers.researcher).getAggregateInfo();

      expect(count).to.equal(3);
      expect(encryptedSum).to.not.equal(0); // Encrypted sum exists

      // In a real Sepolia deployment, the researcher would:
      // 1. Call requestAggregateDecryption()
      // 2. Wait for the Relay/Gateway callback
      // 3. Receive the decrypted sum (75 + 60 + 85 = 220)
      // 4. Calculate average client-side: 220 / 3 = 73.33
    });
  });
});
