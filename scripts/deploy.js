const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log(
    "Balance:",
    hre.ethers.formatEther(
      await hre.ethers.provider.getBalance(deployer.address)
    ),
    "tRBTC"
  );

  const kRBTC = "0x5b35072cd6110606c8421e013304110fa04a32a3"; // Tropykus testnet

  const founderB = process.env.FOUNDER_B_ADDRESS;
  if (!founderB) {
    throw new Error("Set FOUNDER_B_ADDRESS in .env");
  }

  // Demo: cliff 5 min, vesting 10 min (para generar evidencia rápido)
  const cliffDuration = 5 * 60;
  const vestingDuration = 10 * 60;

  console.log("Founder B:", founderB);
  console.log(`Cliff: ${cliffDuration}s, Vesting: ${vestingDuration}s`);

  const VestingPact = await hre.ethers.getContractFactory("VestingPact");
  const pact = await VestingPact.deploy(
    founderB,
    cliffDuration,
    vestingDuration,
    kRBTC,
    {
      value: hre.ethers.parseEther("0.0005"),
      gasLimit: 3000000,
    }
  );
  await pact.waitForDeployment();

  const address = await pact.getAddress();
  console.log("\n========================================");
  console.log("VestingPact deployed to:", address);
  console.log(
    "Explorer:",
    `https://explorer.testnet.rootstock.io/address/${address}`
  );
  console.log("========================================");
  console.log("\nNext steps:");
  console.log("1. Update FOUNDER_B_ADDRESS if needed");
  console.log("2. Run: npx hardhat run scripts/demo.js --network rskTestnet");
  console.log(
    "3. Update frontend/src/config.js with the deployed address above"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
