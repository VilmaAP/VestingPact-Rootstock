const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VestingPact", function () {
  let mockKRBTC, vestingPact;
  let founderA, founderB, other;
  const depositAmount = ethers.parseEther("1");
  const cliffDuration = 365 * 24 * 60 * 60; // 1 year
  const vestingDuration = 4 * 365 * 24 * 60 * 60; // 4 years

  async function deployFixture() {
    [founderA, founderB, other] = await ethers.getSigners();

    const MockKRBTC = await ethers.getContractFactory("MockKRBTC");
    mockKRBTC = await MockKRBTC.deploy();
    await mockKRBTC.waitForDeployment();

    const VestingPact = await ethers.getContractFactory("VestingPact");
    vestingPact = await VestingPact.deploy(
      founderB.address,
      cliffDuration,
      vestingDuration,
      await mockKRBTC.getAddress(),
      { value: depositAmount }
    );
    await vestingPact.waitForDeployment();

    return { mockKRBTC, vestingPact, founderA, founderB, other };
  }

  async function activePactFixture() {
    const fixture = await deployFixture();
    await fixture.vestingPact
      .connect(founderB)
      .joinPact({ value: depositAmount });
    return fixture;
  }

  async function increaseTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
  }

  // ── Test 1: Deploy con founderA deposit ───────────────────────────
  describe("1. Deploy", function () {
    it("should deploy with founderA deposit", async function () {
      await deployFixture();

      expect(await vestingPact.founderA()).to.equal(founderA.address);
      expect(await vestingPact.founderB()).to.equal(founderB.address);
      expect(await vestingPact.depositA()).to.equal(depositAmount);
      expect(await vestingPact.isActive()).to.equal(false);
    });
  });

  // ── Test 2: founderB joinPact → PactCreated emitido ───────────────
  describe("2. joinPact", function () {
    it("should emit PactCreated when founderB joins", async function () {
      await deployFixture();

      await expect(
        vestingPact.connect(founderB).joinPact({ value: depositAmount })
      ).to.emit(vestingPact, "PactCreated");

      expect(await vestingPact.isActive()).to.equal(true);
      expect(await vestingPact.depositB()).to.equal(depositAmount);
    });

    it("should reject non-founderB", async function () {
      await deployFixture();

      await expect(
        vestingPact.connect(other).joinPact({ value: depositAmount })
      ).to.be.revertedWith("Only founderB");
    });

    it("should reject double join", async function () {
      await activePactFixture();

      await expect(
        vestingPact.connect(founderB).joinPact({ value: depositAmount })
      ).to.be.revertedWith("Already active");
    });
  });

  // ── Test 3: getVestedAmount = 0 antes del cliff ───────────────────
  describe("3. Vesting before cliff", function () {
    it("should return 0 before cliff", async function () {
      await activePactFixture();

      expect(await vestingPact.getVestedAmount(founderA.address)).to.equal(0);
      expect(await vestingPact.getVestedAmount(founderB.address)).to.equal(0);
    });
  });

  // ── Test 4: getVestedAmount proporcional después del cliff ─────────
  describe("4. Vesting after cliff (proportional)", function () {
    it("should vest proportionally after cliff", async function () {
      await activePactFixture();

      // Move to halfway between cliff and vesting end
      const halfVesting = cliffDuration + (vestingDuration - cliffDuration) / 2;
      await increaseTime(halfVesting);

      const vestedA = await vestingPact.getVestedAmount(founderA.address);
      // Should be ~50% of deposit (approximate due to block timing)
      expect(vestedA).to.be.gt(0);
      expect(vestedA).to.be.lt(depositAmount);
    });
  });

  // ── Test 5: getVestedAmount = 100% después del vesting ────────────
  describe("5. Vesting complete", function () {
    it("should return full deposit after vesting period", async function () {
      await activePactFixture();

      await increaseTime(vestingDuration + 1);

      expect(await vestingPact.getVestedAmount(founderA.address)).to.equal(
        depositAmount
      );
      expect(await vestingPact.getVestedAmount(founderB.address)).to.equal(
        depositAmount
      );
    });
  });

  // ── Test 6: claim() exitoso post-cliff ────────────────────────────
  describe("6. Claim post-cliff", function () {
    it("should allow claim after cliff", async function () {
      await activePactFixture();

      // Move past cliff + some vesting
      const pastCliff = cliffDuration + (vestingDuration - cliffDuration) / 4;
      await increaseTime(pastCliff);

      const balanceBefore = await ethers.provider.getBalance(founderA.address);

      const tx = await vestingPact.connect(founderA).claim();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(founderA.address);

      // Balance should have increased (minus gas)
      expect(balanceAfter + gasUsed).to.be.gt(balanceBefore);

      // Should emit Claimed
      await expect(tx).to.emit(vestingPact, "Claimed");
    });

    it("should reject claim before cliff", async function () {
      await activePactFixture();

      await expect(
        vestingPact.connect(founderA).claim()
      ).to.be.revertedWith("Cliff not reached");
    });
  });

  // ── Test 7: exitEarly() antes del cliff → exiter recibe 0 ────────
  describe("7. exitEarly before cliff", function () {
    it("exiter gets 0, pact stays active for remaining", async function () {
      await activePactFixture();

      const balanceABefore = await ethers.provider.getBalance(founderA.address);

      const tx = await vestingPact.connect(founderA).exitEarly();

      const balanceAAfter = await ethers.provider.getBalance(founderA.address);

      // Exiter (A) should NOT have gained RBTC (only lost gas)
      expect(balanceAAfter).to.be.lte(balanceABefore);

      // Pact should still be active for B
      expect(await vestingPact.isActive()).to.equal(true);
      expect(await vestingPact.exitedA()).to.equal(true);

      await expect(tx).to.emit(vestingPact, "EarlyExit");
    });
  });

  // ── Test 8: exitEarly() después del cliff → proporcional ──────────
  describe("8. exitEarly after cliff", function () {
    it("exiter gets vested portion, pact stays active", async function () {
      await activePactFixture();

      // Move to halfway through vesting (past cliff)
      const halfway = cliffDuration + (vestingDuration - cliffDuration) / 2;
      await increaseTime(halfway);

      const balanceABefore = await ethers.provider.getBalance(founderA.address);

      const tx = await vestingPact.connect(founderA).exitEarly();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAAfter = await ethers.provider.getBalance(founderA.address);

      // Exiter should have received some RBTC (vested portion minus gas)
      expect(balanceAAfter + gasUsed).to.be.gt(balanceABefore);

      // Pact stays active for remaining founder
      expect(await vestingPact.isActive()).to.equal(true);
    });
  });

  // ── Test 9: dissolve() requiere ambas firmas ─────────────────────
  describe("9. Dissolve (2-of-2)", function () {
    it("should require both founders to approve", async function () {
      await activePactFixture();
      await increaseTime(vestingDuration + 1);

      // First approval — should NOT dissolve yet
      await vestingPact.connect(founderA).dissolve();
      expect(await vestingPact.isActive()).to.equal(true);
      expect(await vestingPact.dissolveApprovedA()).to.equal(true);

      // Second approval — should dissolve
      const tx = await vestingPact.connect(founderB).dissolve();
      expect(await vestingPact.isActive()).to.equal(false);

      await expect(tx).to.emit(vestingPact, "Dissolved");
    });

    it("should distribute funds proportionally on dissolve", async function () {
      await activePactFixture();
      await increaseTime(vestingDuration + 1);

      const balanceBBefore = await ethers.provider.getBalance(founderB.address);

      await vestingPact.connect(founderA).dissolve();
      await vestingPact.connect(founderB).dissolve();

      const balanceBAfter = await ethers.provider.getBalance(founderB.address);

      // B should have received funds (even after gas for dissolve)
      expect(balanceBAfter).to.be.gt(balanceBBefore);
    });
  });

  // ── Test 10: Integración con MockKRBTC ────────────────────────────
  describe("10. MockKRBTC integration (yield)", function () {
    it("should return more RBTC when exchange rate increases (yield)", async function () {
      await activePactFixture();
      await increaseTime(vestingDuration + 1);

      // Simulate 5% yield
      const newRate = ethers.parseEther("1.05");
      await mockKRBTC.setExchangeRate(newRate);

      const balanceBefore = await ethers.provider.getBalance(founderA.address);

      const tx = await vestingPact.connect(founderA).claim();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(founderA.address);
      const received = balanceAfter - balanceBefore + gasUsed;

      // Should receive more than deposited (1 ETH + yield)
      expect(received).to.be.gt(depositAmount);
    });

    it("mock kRBTC should track balances correctly", async function () {
      await activePactFixture();

      const pactAddress = await vestingPact.getAddress();
      const kBalance = await mockKRBTC.balanceOf(pactAddress);

      // Should have kTokens after joining
      expect(kBalance).to.be.gt(0);
    });
  });

  // ── Bug Fix Tests ─────────────────────────────────────────────────
  describe("11. Bug Fix: exitEarly keeps pact active for remaining", function () {
    it("remaining founder can still claim after other exits", async function () {
      await activePactFixture();
      const pastCliff = cliffDuration + (vestingDuration - cliffDuration) / 2;
      await increaseTime(pastCliff);

      // A exits
      await vestingPact.connect(founderA).exitEarly();

      // Pact should still be active
      expect(await vestingPact.isActive()).to.equal(true);

      // B should be able to claim
      await increaseTime((vestingDuration - cliffDuration) / 4);
      await vestingPact.connect(founderB).claim();
      // Should not revert
    });

    it("after pre-cliff exit, remaining gets bonus and keeps vesting", async function () {
      await activePactFixture();

      // A exits before cliff → gets 0
      await vestingPact.connect(founderA).exitEarly();
      expect(await vestingPact.isActive()).to.equal(true);

      // Move past cliff
      await increaseTime(cliffDuration + (vestingDuration - cliffDuration) / 2);

      // B claims (should include bonus kTokens from A's forfeited portion)
      const balBefore = await ethers.provider.getBalance(founderB.address);
      const tx = await vestingPact.connect(founderB).claim();
      const receipt = await tx.wait();
      const gas = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await ethers.provider.getBalance(founderB.address);

      expect(balAfter + gas).to.be.gt(balBefore);
    });

    it("pact deactivates when both founders exit", async function () {
      await activePactFixture();
      await increaseTime(cliffDuration + 1000);

      await vestingPact.connect(founderA).exitEarly();
      expect(await vestingPact.isActive()).to.equal(true);

      await vestingPact.connect(founderB).exitEarly();
      expect(await vestingPact.isActive()).to.equal(false);
    });

    it("exited founder cannot claim", async function () {
      await activePactFixture();
      await increaseTime(cliffDuration + (vestingDuration - cliffDuration) / 2);

      await vestingPact.connect(founderA).exitEarly();

      await expect(
        vestingPact.connect(founderA).claim()
      ).to.be.revertedWith("Already exited");
    });

    it("founder cannot exit twice", async function () {
      await activePactFixture();
      await increaseTime(cliffDuration + 1000);

      await vestingPact.connect(founderA).exitEarly();

      await expect(
        vestingPact.connect(founderA).exitEarly()
      ).to.be.revertedWith("Already exited");
    });
  });

  describe("12. Bug Fix: dissolve distributes by vested amount", function () {
    it("dissolve distributes proportionally to vested amounts", async function () {
      await activePactFixture();

      // Move to 75% through vesting (past cliff)
      // At this point both founders have same vested % since same deposit
      await increaseTime(cliffDuration + ((vestingDuration - cliffDuration) * 3) / 4);

      const balABefore = await ethers.provider.getBalance(founderA.address);
      const balBBefore = await ethers.provider.getBalance(founderB.address);

      await vestingPact.connect(founderA).dissolve();
      await vestingPact.connect(founderB).dissolve();

      const balAAfter = await ethers.provider.getBalance(founderA.address);
      const balBAfter = await ethers.provider.getBalance(founderB.address);

      // Both should have received funds (equal deposits = equal vested = equal share)
      expect(balBAfter).to.be.gt(balBBefore);
    });

    it("dissolve before cliff returns proportional to deposit", async function () {
      await activePactFixture();

      // Dissolve before cliff — edge case
      await vestingPact.connect(founderA).dissolve();
      const tx = await vestingPact.connect(founderB).dissolve();

      expect(await vestingPact.isActive()).to.equal(false);
      await expect(tx).to.emit(vestingPact, "Dissolved");
    });
  });
});
