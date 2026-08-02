import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.MEDICAL_REGISTRY_ADDRESS;

  if (!contractAddress) {
    throw new Error("MEDICAL_REGISTRY_ADDRESS not set in environment");
  }

  const doctorAddresses = [
    // Add doctor addresses here
    "0x0000000000000000000000000000000000000001",
  ];

  console.log("Authorizing doctors on MedicalDataRegistry...");
  console.log("Contract:", contractAddress);
  console.log("");

  const MedicalDataRegistry = await ethers.getContractFactory("MedicalDataRegistry");
  const registry = MedicalDataRegistry.attach(contractAddress);

  for (const doctorAddress of doctorAddresses) {
    console.log(`Authorizing doctor: ${doctorAddress}`);

    const tx = await registry.authorizeDoctor(doctorAddress, {
      gasLimit: 100_000
    });

    await tx.wait();
    console.log(`✅ Authorized! TX: ${tx.hash}`);
    console.log("");
  }

  console.log("All doctors authorized successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
