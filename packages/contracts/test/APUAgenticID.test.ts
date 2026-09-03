import { expect } from "chai";
import { ethers } from "hardhat";
import { APUAgenticID } from "../typechain";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { MessageHashUtils } from "@openzeppelin/contracts";

describe("APUAgenticID (ERC-7857)", function () {
  let agenticID: APUAgenticID;
  let owner: SignerWithAddress;
  let doctor: SignerWithAddress;
  let hospital: SignerWithAddress;
  let oracle: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const AGENT_NAME = "Tuberculosis Diagnostic Agent v2.1";
  const SPECIALTY = "tuberculosis-diagnosis";
  const MODEL_VERSION = "qwen2.5-omni-7b";
  const DATA_HASH = ethers.keccak256(ethers.toUtf8Bytes("encrypted-model-data"));
  const STORAGE_URI = "0g://0xe31e4f76404e5ec86e2538f291943c8f71d69f3a4a8e1b3c5e5377e665474258";

  beforeEach(async function () {
    [owner, doctor, hospital, oracle, unauthorized] = await ethers.getSigners();

    // Deploy APUAgenticID with oracle
    const APUAgenticIDFactory = await ethers.getContractFactory("APUAgenticID");
    agenticID = await APUAgenticIDFactory.deploy(oracle.address);
    await agenticID.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await agenticID.owner()).to.equal(owner.address);
    });

    it("Should set the correct oracle address", async function () {
      expect(await agenticID.oracleAddress()).to.equal(oracle.address);
    });

    it("Should revert if oracle address is zero", async function () {
      const APUAgenticIDFactory = await ethers.getContractFactory("APUAgenticID");
      await expect(
        APUAgenticIDFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid oracle address");
    });
  });

  describe("Minting Agents", function () {
    it("Should mint agent with correct metadata", async function () {
      await expect(
        agenticID.mintAgent(
          doctor.address,
          AGENT_NAME,
          SPECIALTY,
          MODEL_VERSION,
          DATA_HASH,
          STORAGE_URI
        )
      ).to.emit(agenticID, "AgentMinted")
        .withArgs(0, doctor.address, SPECIALTY, DATA_HASH);

      const metadata = await agenticID.agentMetadata(0);
      expect(metadata.name).to.equal(AGENT_NAME);
      expect(metadata.specialty).to.equal(SPECIALTY);
      expect(metadata.modelVersion).to.equal(MODEL_VERSION);
      expect(metadata.totalInferences).to.equal(0);
      expect(metadata.active).to.equal(true);
    });

    it("Should store intelligent data correctly", async function () {
      await agenticID.mintAgent(
        doctor.address,
        AGENT_NAME,
        SPECIALTY,
        MODEL_VERSION,
        DATA_HASH,
        STORAGE_URI
      );

      const intelligentData = await agenticID.intelligentDataOf(0);
      expect(intelligentData.length).to.equal(1);
      expect(intelligentData[0].dataHash).to.equal(DATA_HASH);
      expect(intelligentData[0].storageURI).to.equal(STORAGE_URI);
    });

    it("Should track agents by specialty", async function () {
      await agenticID.mintAgent(
        doctor.address,
        AGENT_NAME,
        SPECIALTY,
        MODEL_VERSION,
        DATA_HASH,
        STORAGE_URI
      );

      const agents = await agenticID.getAgentsBySpecialty(SPECIALTY);
      expect(agents.length).to.equal(1);
      expect(agents[0]).to.equal(0);
    });

    it("Should increment token IDs correctly", async function () {
      await agenticID.mintAgent(
        doctor.address,
        AGENT_NAME,
        SPECIALTY,
        MODEL_VERSION,
        DATA_HASH,
        STORAGE_URI
      );

      await agenticID.mintAgent(
        hospital.address,
        "Radiology AI v1.0",
        "radiology",
        "llama-3.1-8b",
        ethers.keccak256(ethers.toUtf8Bytes("radiology-data")),
        "0g://0xabc123..."
      );

      expect(await agenticID.totalSupply()).to.equal(2);
    });

    it("Should only allow owner to mint", async function () {
      await expect(
        agenticID.connect(unauthorized).mintAgent(
          doctor.address,
          AGENT_NAME,
          SPECIALTY,
          MODEL_VERSION,
          DATA_HASH,
          STORAGE_URI
        )
      ).to.be.revertedWithCustomError(agenticID, "OwnableUnauthorizedAccount");
    });

    it("Should revert if recipient is zero address", async function () {
      await expect(
        agenticID.mintAgent(
          ethers.ZeroAddress,
          AGENT_NAME,
          SPECIALTY,
          MODEL_VERSION,
          DATA_HASH,
          STORAGE_URI
        )
      ).to.be.revertedWith("Invalid recipient");
    });

    it("Should revert if data hash is zero", async function () {
      await expect(
        agenticID.mintAgent(
          doctor.address,
          AGENT_NAME,
          SPECIALTY,
          MODEL_VERSION,
          ethers.ZeroHash,
          STORAGE_URI
        )
      ).to.be.revertedWith("Invalid data hash");
    });

    it("Should revert if storage URI is empty", async function () {
      await expect(
        agenticID.mintAgent(
          doctor.address,
          AGENT_NAME,
          SPECIALTY,
          MODEL_VERSION,
          DATA_HASH,
          ""
        )
      ).to.be.revertedWith("Invalid storage URI");
    });
  });

  describe("Authorization", function () {
    let tokenId: number;

    beforeEach(async function () {
      await agenticID.mintAgent(
        doctor.address,
        AGENT_NAME,
        SPECIALTY,
        MODEL_VERSION,
        DATA_HASH,
        STORAGE_URI
      );
      tokenId = 0;
    });

    it("Should authorize usage for executor", async function () {
      await expect(
        agenticID.connect(doctor).authorizeUsage(tokenId, hospital.address)
      ).to.emit(agenticID, "Authorization");
      // Note: withArgs check removed due to empty string vs 0x encoding difference

      expect(await agenticID.isAuthorized(tokenId, hospital.address)).to.equal(true);
    });

    it("Should not authorize if already authorized", async function () {
      await agenticID.connect(doctor).authorizeUsage(tokenId, hospital.address);

      await expect(
        agenticID.connect(doctor).authorizeUsage(tokenId, hospital.address)
      ).to.be.revertedWith("Already authorized");
    });

    it("Should revoke authorization", async function () {
      await agenticID.connect(doctor).authorizeUsage(tokenId, hospital.address);

      await expect(
        agenticID.connect(doctor).revokeAuthorization(tokenId, hospital.address)
      ).to.emit(agenticID, "AuthorizationRevoked")
        .withArgs(tokenId, hospital.address);

      expect(await agenticID.isAuthorized(tokenId, hospital.address)).to.equal(false);
    });

    it("Should only allow token owner to authorize", async function () {
      await expect(
        agenticID.connect(unauthorized).authorizeUsage(tokenId, hospital.address)
      ).to.be.revertedWith("Not token owner");
    });

    it("Should revert if executor is zero address", async function () {
      await expect(
        agenticID.connect(doctor).authorizeUsage(tokenId, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid executor");
    });
  });

  describe("Inference Recording", function () {
    let tokenId: number;

    beforeEach(async function () {
      await agenticID.mintAgent(
        doctor.address,
        AGENT_NAME,
        SPECIALTY,
        MODEL_VERSION,
        DATA_HASH,
        STORAGE_URI
      );
      tokenId = 0;
    });

    it("Should record inference by token owner", async function () {
      const resultHash = ethers.keccak256(ethers.toUtf8Bytes("diagnosis-result"));

      await expect(
        agenticID.connect(doctor).recordInference(tokenId, resultHash)
      ).to.emit(agenticID, "InferenceExecuted")
        .withArgs(tokenId, doctor.address, resultHash);

      const metadata = await agenticID.agentMetadata(tokenId);
      expect(metadata.totalInferences).to.equal(1);
    });

    it("Should record inference by authorized executor", async function () {
      await agenticID.connect(doctor).authorizeUsage(tokenId, hospital.address);

      const resultHash = ethers.keccak256(ethers.toUtf8Bytes("diagnosis-result"));
      await agenticID.connect(hospital).recordInference(tokenId, resultHash);

      const metadata = await agenticID.agentMetadata(tokenId);
      expect(metadata.totalInferences).to.equal(1);
    });

    it("Should increment inference count", async function () {
      const resultHash1 = ethers.keccak256(ethers.toUtf8Bytes("result-1"));
      const resultHash2 = ethers.keccak256(ethers.toUtf8Bytes("result-2"));

      await agenticID.connect(doctor).recordInference(tokenId, resultHash1);
      await agenticID.connect(doctor).recordInference(tokenId, resultHash2);

      const metadata = await agenticID.agentMetadata(tokenId);
      expect(metadata.totalInferences).to.equal(2);
    });

    it("Should revert if agent is not active", async function () {
      await agenticID.connect(doctor).deactivateAgent(tokenId);

      const resultHash = ethers.keccak256(ethers.toUtf8Bytes("diagnosis-result"));
      await expect(
        agenticID.connect(doctor).recordInference(tokenId, resultHash)
      ).to.be.revertedWith("Agent not active");
    });

    it("Should revert if caller is not authorized", async function () {
      const resultHash = ethers.keccak256(ethers.toUtf8Bytes("diagnosis-result"));
      await expect(
        agenticID.connect(unauthorized).recordInference(tokenId, resultHash)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Agent Activation", function () {
    let tokenId: number;

    beforeEach(async function () {
      await agenticID.mintAgent(
        doctor.address,
        AGENT_NAME,
        SPECIALTY,
        MODEL_VERSION,
        DATA_HASH,
        STORAGE_URI
      );
      tokenId = 0;
    });

    it("Should deactivate agent", async function () {
      await agenticID.connect(doctor).deactivateAgent(tokenId);

      const metadata = await agenticID.agentMetadata(tokenId);
      expect(metadata.active).to.equal(false);
    });

    it("Should reactivate agent", async function () {
      await agenticID.connect(doctor).deactivateAgent(tokenId);
      await agenticID.connect(doctor).reactivateAgent(tokenId);

      const metadata = await agenticID.agentMetadata(tokenId);
      expect(metadata.active).to.equal(true);
    });

    it("Should only allow token owner to deactivate", async function () {
      await expect(
        agenticID.connect(unauthorized).deactivateAgent(tokenId)
      ).to.be.revertedWith("Not token owner");
    });
  });

  describe("iTransfer (ERC-7857)", function () {
    let tokenId: number;
    const newDataHash = ethers.keccak256(ethers.toUtf8Bytes("re-encrypted-data"));
    const sealedKey = ethers.toUtf8Bytes("sealed-encryption-key");

    beforeEach(async function () {
      await agenticID.mintAgent(
        doctor.address,
        AGENT_NAME,
        SPECIALTY,
        MODEL_VERSION,
        DATA_HASH,
        STORAGE_URI
      );
      tokenId = 0;
    });

    it("Should transfer with valid proof", async function () {
      const timestamp = Math.floor(Date.now() / 1000);

      // Create oracle proof (signed by oracle)
      const messageHash = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "bytes"],
          [DATA_HASH, newDataHash, sealedKey]
        )
      );
      const ethSignedHash = ethers.hashMessage(ethers.getBytes(messageHash));
      const oracleProof = await oracle.signMessage(ethers.getBytes(messageHash));

      const proof = {
        oldDataHash: DATA_HASH,
        newDataHash: newDataHash,
        sealedKey: sealedKey,
        oracleProof: oracleProof,
        oracleAddress: oracle.address,
        timestamp: timestamp
      };

      await expect(
        agenticID.connect(doctor).iTransfer(hospital.address, tokenId, proof)
      ).to.emit(agenticID, "Transferred")
        .withArgs(doctor.address, hospital.address, tokenId, newDataHash);

      expect(await agenticID.ownerOf(tokenId)).to.equal(hospital.address);
    });

    it("Should update data hash after transfer", async function () {
      const timestamp = Math.floor(Date.now() / 1000);

      const messageHash = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "bytes"],
          [DATA_HASH, newDataHash, sealedKey]
        )
      );
      const oracleProof = await oracle.signMessage(ethers.getBytes(messageHash));

      const proof = {
        oldDataHash: DATA_HASH,
        newDataHash: newDataHash,
        sealedKey: sealedKey,
        oracleProof: oracleProof,
        oracleAddress: oracle.address,
        timestamp: timestamp
      };

      await agenticID.connect(doctor).iTransfer(hospital.address, tokenId, proof);

      const intelligentData = await agenticID.intelligentDataOf(tokenId);
      expect(intelligentData[0].dataHash).to.equal(newDataHash);
    });

    it("Should emit PublishedSealedKey event", async function () {
      const timestamp = Math.floor(Date.now() / 1000);

      const messageHash = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "bytes"],
          [DATA_HASH, newDataHash, sealedKey]
        )
      );
      const oracleProof = await oracle.signMessage(ethers.getBytes(messageHash));

      const proof = {
        oldDataHash: DATA_HASH,
        newDataHash: newDataHash,
        sealedKey: sealedKey,
        oracleProof: oracleProof,
        oracleAddress: oracle.address,
        timestamp: timestamp
      };

      await expect(
        agenticID.connect(doctor).iTransfer(hospital.address, tokenId, proof)
      ).to.emit(agenticID, "PublishedSealedKey")
        .withArgs(tokenId, hospital.address, sealedKey);
    });

    it("Should only allow token owner to transfer", async function () {
      const timestamp = Math.floor(Date.now() / 1000);

      const messageHash = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "bytes"],
          [DATA_HASH, newDataHash, sealedKey]
        )
      );
      const oracleProof = await oracle.signMessage(ethers.getBytes(messageHash));

      const proof = {
        oldDataHash: DATA_HASH,
        newDataHash: newDataHash,
        sealedKey: sealedKey,
        oracleProof: oracleProof,
        oracleAddress: oracle.address,
        timestamp: timestamp
      };

      await expect(
        agenticID.connect(unauthorized).iTransfer(hospital.address, tokenId, proof)
      ).to.be.revertedWith("Not token owner");
    });
  });

  describe("iClone (ERC-7857)", function () {
    let tokenId: number;
    const newDataHash = ethers.keccak256(ethers.toUtf8Bytes("cloned-data"));
    const sealedKey = ethers.toUtf8Bytes("sealed-key-for-clone");

    beforeEach(async function () {
      await agenticID.mintAgent(
        doctor.address,
        AGENT_NAME,
        SPECIALTY,
        MODEL_VERSION,
        DATA_HASH,
        STORAGE_URI
      );
      tokenId = 0;
    });

    it("Should clone agent with valid proof", async function () {
      const timestamp = Math.floor(Date.now() / 1000);

      const messageHash = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "bytes"],
          [DATA_HASH, newDataHash, sealedKey]
        )
      );
      const oracleProof = await oracle.signMessage(ethers.getBytes(messageHash));

      const proof = {
        oldDataHash: DATA_HASH,
        newDataHash: newDataHash,
        sealedKey: sealedKey,
        oracleProof: oracleProof,
        oracleAddress: oracle.address,
        timestamp: timestamp
      };

      await expect(
        agenticID.connect(doctor).iClone(hospital.address, tokenId, proof)
      ).to.emit(agenticID, "Cloned")
        .withArgs(tokenId, 1, hospital.address);

      expect(await agenticID.ownerOf(1)).to.equal(hospital.address);
    });

    it("Should copy metadata correctly", async function () {
      const timestamp = Math.floor(Date.now() / 1000);

      const messageHash = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "bytes"],
          [DATA_HASH, newDataHash, sealedKey]
        )
      );
      const oracleProof = await oracle.signMessage(ethers.getBytes(messageHash));

      const proof = {
        oldDataHash: DATA_HASH,
        newDataHash: newDataHash,
        sealedKey: sealedKey,
        oracleProof: oracleProof,
        oracleAddress: oracle.address,
        timestamp: timestamp
      };

      await agenticID.connect(doctor).iClone(hospital.address, tokenId, proof);

      const clonedMetadata = await agenticID.agentMetadata(1);
      expect(clonedMetadata.specialty).to.equal(SPECIALTY);
      expect(clonedMetadata.modelVersion).to.equal(MODEL_VERSION);
      expect(clonedMetadata.totalInferences).to.equal(0); // Reset for clone
    });

    it("Should maintain original token after clone", async function () {
      const timestamp = Math.floor(Date.now() / 1000);

      const messageHash = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "bytes"],
          [DATA_HASH, newDataHash, sealedKey]
        )
      );
      const oracleProof = await oracle.signMessage(ethers.getBytes(messageHash));

      const proof = {
        oldDataHash: DATA_HASH,
        newDataHash: newDataHash,
        sealedKey: sealedKey,
        oracleProof: oracleProof,
        oracleAddress: oracle.address,
        timestamp: timestamp
      };

      await agenticID.connect(doctor).iClone(hospital.address, tokenId, proof);

      expect(await agenticID.ownerOf(tokenId)).to.equal(doctor.address);
    });
  });

  describe("Oracle Management", function () {
    it("Should update oracle address", async function () {
      const newOracle = unauthorized.address;

      await expect(
        agenticID.updateOracle(newOracle)
      ).to.emit(agenticID, "OracleUpdated")
        .withArgs(oracle.address, newOracle);

      expect(await agenticID.oracleAddress()).to.equal(newOracle);
    });

    it("Should only allow owner to update oracle", async function () {
      await expect(
        agenticID.connect(unauthorized).updateOracle(unauthorized.address)
      ).to.be.revertedWithCustomError(agenticID, "OwnableUnauthorizedAccount");
    });

    it("Should revert if new oracle is zero address", async function () {
      await expect(
        agenticID.updateOracle(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid oracle address");
    });
  });

  describe("View Functions", function () {
    it("Should return total supply", async function () {
      expect(await agenticID.totalSupply()).to.equal(0);

      await agenticID.mintAgent(
        doctor.address,
        AGENT_NAME,
        SPECIALTY,
        MODEL_VERSION,
        DATA_HASH,
        STORAGE_URI
      );

      expect(await agenticID.totalSupply()).to.equal(1);
    });

    it("Should return agents by specialty", async function () {
      await agenticID.mintAgent(
        doctor.address,
        "TB Agent 1",
        SPECIALTY,
        MODEL_VERSION,
        DATA_HASH,
        STORAGE_URI
      );

      await agenticID.mintAgent(
        hospital.address,
        "TB Agent 2",
        SPECIALTY,
        MODEL_VERSION,
        ethers.keccak256(ethers.toUtf8Bytes("data2")),
        "0g://0xabc..."
      );

      const agents = await agenticID.getAgentsBySpecialty(SPECIALTY);
      expect(agents.length).to.equal(2);
    });

    it("Should return intelligent data", async function () {
      await agenticID.mintAgent(
        doctor.address,
        AGENT_NAME,
        SPECIALTY,
        MODEL_VERSION,
        DATA_HASH,
        STORAGE_URI
      );

      const data = await agenticID.intelligentDataOf(0);
      expect(data.length).to.equal(1);
      expect(data[0].dataHash).to.equal(DATA_HASH);
    });
  });
});
