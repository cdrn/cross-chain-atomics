import { getContractFactory } from "@nomicfoundation/hardhat-ethers/types";
import hre from "hardhat";

async function main() {
  console.log("Deploying AtomicSwap contract...");

  const AtomicSwap = await hre.ethers.getContractFactory("AtomicSwap");
  const atomicSwap = await AtomicSwap.deploy();
  await atomicSwap.waitForDeployment();

  const address = await atomicSwap.getAddress();
  console.log(`AtomicSwap deployed to: ${address}`);

  // Wait for a few block confirmations
  console.log("Waiting for confirmations...");
  await atomicSwap.deploymentTransaction()?.wait(5);

  console.log("Deployment confirmed!");
  console.log("--------------------");
  console.log("Contract address:", address);
  console.log("Transaction hash:", atomicSwap.deploymentTransaction()?.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
