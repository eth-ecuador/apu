const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log("\n=== Wallet Info ===");
  console.log("Address:", signer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("===================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
