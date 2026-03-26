const hre = require("hardhat");

/**
 * Script de demo para generar evidencia on-chain (mínimo 2 tx).
 *
 * Prerequisitos:
 *   - Contrato ya deployado (copiar address abajo o en .env)
 *   - PRIVATE_KEY (founderA) y PRIVATE_KEY_B (founderB) en .env
 *   - Ambas wallets con tRBTC del faucet
 *
 * Uso:
 *   npx hardhat run scripts/demo.js --network rskTestnet
 */

const DEPLOYED_ADDRESS = process.env.VESTING_PACT_ADDRESS;

async function main() {
  if (!DEPLOYED_ADDRESS || DEPLOYED_ADDRESS === "0x_PLACEHOLDER_DEPLOY_ADDRESS") {
    throw new Error(
      "Set VESTING_PACT_ADDRESS in .env with the deployed contract address"
    );
  }

  const signers = await hre.ethers.getSigners();
  if (signers.length < 2) {
    throw new Error(
      "Need 2 signers. Set both PRIVATE_KEY and PRIVATE_KEY_B in .env, " +
        "and add both to hardhat.config.js accounts array"
    );
  }

  const [founderA, founderB] = signers;
  console.log("Founder A:", founderA.address);
  console.log("Founder B:", founderB.address);

  // Attach to deployed contract
  const VestingPact = await hre.ethers.getContractFactory("VestingPact");
  const pact = VestingPact.attach(DEPLOYED_ADDRESS);

  // Check pact state
  const isActive = await pact.isActive();
  console.log("\nPact active:", isActive);

  // ── TX 2: founderB joins the pact ──────────────────────────────────
  if (!isActive) {
    console.log("\n--- TX 2: founderB joinPact() ---");
    const joinTx = await pact.connect(founderB).joinPact({
      value: hre.ethers.parseEther("0.0005"),
      gasLimit: 3000000,
    });
    console.log("TX hash:", joinTx.hash);
    const receipt = await joinTx.wait();
    console.log("Confirmed in block:", receipt.blockNumber);
    console.log(
      "Explorer:",
      `https://explorer.testnet.rootstock.io/tx/${joinTx.hash}`
    );
  } else {
    console.log("Pact already active — skipping joinPact()");
  }

  // ── Wait for cliff (5 min demo) ───────────────────────────────────
  const cliffEnd = await pact.cliffEnd();
  const now = BigInt(Math.floor(Date.now() / 1000));
  const remaining = cliffEnd - now;

  if (remaining > 0n) {
    const mins = Number(remaining) / 60;
    console.log(`\nWaiting for cliff... ~${mins.toFixed(1)} minutes remaining`);
    console.log(
      "You can wait or re-run this script after the cliff passes."
    );
    console.log("Cliff ends at:", new Date(Number(cliffEnd) * 1000).toISOString());

    // If remaining is short enough (<= 6 min), wait automatically
    if (remaining <= 360n) {
      console.log("Waiting automatically...");
      await new Promise((resolve) =>
        setTimeout(resolve, Number(remaining + 30n) * 1000)
      );
    } else {
      console.log(
        "\nCliff too far away to wait. Re-run this script after cliff passes."
      );
      console.log("Evidence so far: Deploy TX + joinPact TX = 2 tx ✓");
      return;
    }
  }

  // ── TX 3 (bonus): founderA claims vested amount ────────────────────
  console.log("\n--- TX 3: founderA claim() ---");
  try {
    const claimTx = await pact.connect(founderA).claim({ gasLimit: 3000000 });
    console.log("TX hash:", claimTx.hash);
    const claimReceipt = await claimTx.wait();
    console.log("Confirmed in block:", claimReceipt.blockNumber);
    console.log(
      "Explorer:",
      `https://explorer.testnet.rootstock.io/tx/${claimTx.hash}`
    );
  } catch (err) {
    console.log("Claim failed (possibly nothing to claim yet):", err.reason || err.message);
  }

  console.log("\n========================================");
  console.log("Demo complete! On-chain evidence generated.");
  console.log("Contract:", DEPLOYED_ADDRESS);
  console.log(
    "Explorer:",
    `https://explorer.testnet.rootstock.io/address/${DEPLOYED_ADDRESS}`
  );
  console.log("========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
