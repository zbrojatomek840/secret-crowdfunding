import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying SecretCrowdfunding contract...");

  // 获取合约工厂
  const SecretCrowdfunding = await ethers.getContractFactory("SecretCrowdfunding");
  
  // 部署合约
  const contract = await SecretCrowdfunding.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  
  console.log("✅ SecretCrowdfunding deployed to:", address);
  console.log("\n📋 Next steps:");
  console.log("1. Verify contract on Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${address}`);
  console.log("\n2. Update frontend .env.local:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

