import { ethers } from "hardhat";

async function main() {
  console.log("💰 Checking 0G Mainnet Balance\n");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  const network = await ethers.provider.getNetwork();

  console.log("📍 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId.toString());
  console.log("👤 Address:", deployer.address);
  console.log("💵 Balance:", ethers.formatEther(balance), "0G");

  const balanceInWei = balance;
  const estimatedGasCost = ethers.parseEther("0.01"); // Estimate ~0.01 0G for deployment

  console.log("\n📊 Deployment Feasibility:");
  console.log("Estimated gas cost:", ethers.formatEther(estimatedGasCost), "0G");

  if (balanceInWei < estimatedGasCost) {
    console.log("❌ INSUFFICIENT FUNDS");
    console.log("⚠️  You need at least", ethers.formatEther(estimatedGasCost), "0G to deploy");
    console.log("\n💡 How to get 0G tokens:");
    console.log("1. Contact 0G Labs for accelerator participants");
    console.log("2. Check official 0G Labs channels for token distribution");
    console.log("3. Use official bridge (if available)");
    process.exit(1);
  } else {
    console.log("✅ SUFFICIENT FUNDS");
    console.log("You can proceed with deployment");
  }

  console.log("\n🔍 RPC Endpoint:", (await ethers.provider.getNetwork()).chainId === 16661n
    ? "https://evmrpc.0g.ai"
    : "Unknown");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error checking balance:", error.message);
    process.exit(1);
  });
