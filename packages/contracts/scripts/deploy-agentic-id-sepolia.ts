import { ethers } from "hardhat";

/**
 * Deploy APUAgenticID (ERC-7857) to Sepolia
 *
 * This script deploys the Agentic ID contract for tokenizing AI agents
 * as NFTs with encrypted metadata stored on 0G Storage.
 */
async function main() {
  console.log("\n🚀 Deploying APUAgenticID (ERC-7857) to Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // For MVP, deployer acts as oracle
  // In production, this would be a dedicated TEE oracle contract
  const oracleAddress = deployer.address;
  console.log("Oracle address (MVP):", oracleAddress);
  console.log("⚠️  Note: In production, deploy a dedicated TEE oracle contract\n");

  // Deploy APUAgenticID
  console.log("📦 Deploying APUAgenticID contract...");
  const APUAgenticID = await ethers.getContractFactory("APUAgenticID");
  const agenticID = await APUAgenticID.deploy(oracleAddress);

  await agenticID.waitForDeployment();
  const contractAddress = await agenticID.getAddress();

  console.log("\n✅ APUAgenticID deployed!");
  console.log("━".repeat(60));
  console.log("Contract address:", contractAddress);
  console.log("Network:", "Sepolia");
  console.log("Oracle:", oracleAddress);
  console.log("Deployer:", deployer.address);
  console.log("━".repeat(60));

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const totalSupply = await agenticID.totalSupply();
  const name = await agenticID.name();
  const symbol = await agenticID.symbol();

  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Total supply:", totalSupply.toString());

  // Example: Mint a test AI agent
  console.log("\n🤖 Minting test AI agent...");

  const testAgentData = {
    name: "TB Diagnostic Agent v1.0",
    specialty: "tuberculosis-diagnosis",
    modelVersion: "qwen2.5-omni-7b",
    dataHash: ethers.keccak256(ethers.toUtf8Bytes("test-encrypted-model-data")),
    storageURI: "0g://galileo/test-agent-metadata"
  };

  const mintTx = await agenticID.mintAgent(
    deployer.address,
    testAgentData.name,
    testAgentData.specialty,
    testAgentData.modelVersion,
    testAgentData.dataHash,
    testAgentData.storageURI
  );

  console.log("Minting transaction:", mintTx.hash);
  await mintTx.wait();
  console.log("✅ Agent minted successfully!");

  const newTotalSupply = await agenticID.totalSupply();
  console.log("New total supply:", newTotalSupply.toString());

  // Get agent metadata
  const tokenId = 0;
  const agentMetadata = await agenticID.agentMetadata(tokenId);
  const intelligentData = await agenticID.intelligentDataOf(tokenId);

  console.log("\n📊 Agent Metadata:");
  console.log("━".repeat(60));
  console.log("Token ID:", tokenId);
  console.log("Name:", agentMetadata.name);
  console.log("Specialty:", agentMetadata.specialty);
  console.log("Model Version:", agentMetadata.modelVersion);
  console.log("Active:", agentMetadata.active);
  console.log("Total Inferences:", agentMetadata.totalInferences.toString());
  console.log("\nIntelligent Data:");
  console.log("Description:", intelligentData[0].description);
  console.log("Data Hash:", intelligentData[0].dataHash);
  console.log("Storage URI:", intelligentData[0].storageURI);
  console.log("━".repeat(60));

  console.log("\n📝 Next Steps:");
  console.log("1. Verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${contractAddress} ${oracleAddress}`);
  console.log("\n2. Update .env with contract address:");
  console.log(`   APU_AGENTIC_ID_ADDRESS=${contractAddress}`);
  console.log("\n3. Integrate with MedicalDataRegistry");
  console.log("\n4. Update integration tests");

  console.log("\n🎉 Deployment complete!\n");

  return {
    contractAddress,
    oracleAddress,
    tokenId,
    txHash: mintTx.hash
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
