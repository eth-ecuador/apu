import { ethers } from "hardhat";

async function main() {
  console.log("💰 Checking 0G Galileo TESTNET Balance\n");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  const network = await ethers.provider.getNetwork();

  console.log("📍 Network:", "0G Galileo Testnet");
  console.log("🔗 Chain ID:", network.chainId.toString());
  console.log("👤 Address:", deployer.address);
  console.log("💵 Balance:", ethers.formatEther(balance), "0G (testnet)");

  const balanceInWei = balance;
  const estimatedGasCost = ethers.parseEther("0.01"); // Estimate ~0.01 0G for deployment

  console.log("\n📊 Deployment Feasibility:");
  console.log("Estimated gas cost:", ethers.formatEther(estimatedGasCost), "0G");

  if (balanceInWei < estimatedGasCost) {
    console.log("❌ INSUFFICIENT FUNDS");
    console.log("⚠️  You need at least", ethers.formatEther(estimatedGasCost), "0G to deploy");
    console.log("\n💡 How to get testnet 0G tokens:");
    console.log("1. Visit 0G Galileo Faucet: https://faucet.0g.ai");
    console.log("2. Join 0G Discord: https://discord.gg/0glabs");
    console.log("3. Request tokens in #faucet channel");
    process.exit(1);
  } else {
    console.log("✅ SUFFICIENT FUNDS");
    console.log("You can proceed with testnet deployment");
  }

  console.log("\n🔍 Network Info:");
  console.log("   RPC Endpoint:", "https://evmrpc-testnet.0g.ai");
  console.log("   Explorer:", "https://scan-testnet.0g.ai");
  console.log("   Faucet:", "https://faucet.0g.ai");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error checking balance:", error.message);
    process.exit(1);
  });
