import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n=================================================");
  console.log("Deploying MedicalDataRegistry (Production)");
  console.log("=================================================");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer);
  console.log();

  const medicalRegistry = await deploy("MedicalDataRegistry", {
    from: deployer,
    args: [], // Constructor has no args
    log: true,
    skipIfAlreadyDeployed: false,
  });

  console.log();
  console.log("✅ MedicalDataRegistry deployed to:", medicalRegistry.address);
  console.log();
  console.log("=================================================");
  console.log("NEXT STEPS:");
  console.log("=================================================");
  console.log("1. Update .env with:");
  console.log(`   MEDICAL_REGISTRY_ADDRESS=${medicalRegistry.address}`);
  console.log();
  console.log("2. Verify on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${medicalRegistry.address}`);
  console.log();
  console.log("3. Authorize doctor (if needed):");
  console.log(`   npx hardhat authorizeDoctor --network sepolia --contract ${medicalRegistry.address} --doctor <ADDRESS>`);
  console.log();
  console.log("=================================================");
  console.log();

  // Get contract instance
  const contract = await hre.ethers.getContractAt("MedicalDataRegistry", medicalRegistry.address);

  // Read initial state
  const owner = await contract.owner();
  const totalPatients = await contract.totalPatients();
  const totalDiagnoses = await contract.totalDiagnoses();

  console.log("📊 Contract State:");
  console.log("   Owner:", owner);
  console.log("   Total Patients:", totalPatients.toString());
  console.log("   Total Diagnoses:", totalDiagnoses.toString());
  console.log();

  if (hre.network.name === "sepolia") {
    console.log("🔗 Contract Links:");
    console.log(`   Etherscan: https://sepolia.etherscan.io/address/${medicalRegistry.address}`);
    console.log();
  }

  return true;
};

export default func;
func.id = "deploy_medical_data_registry";
func.tags = ["MedicalDataRegistry", "production"];
