// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IKToken.sol";

/**
 * @title VestingPact
 * @notice Co-founder vesting protocol on RSK with Tropykus yield integration.
 *         Two founders lock RBTC; funds earn yield via Tropykus (Compound V2 fork)
 *         while vesting linearly after a cliff period.
 */
contract VestingPact {
    // ── State ───────────────────────────────────────────────────────────
    address public founderA;
    address public founderB;

    uint256 public depositA;
    uint256 public depositB;

    uint256 public startTime;
    uint256 public cliffEnd;
    uint256 public vestingEnd;

    uint256 public kTokensA;
    uint256 public kTokensB;

    uint256 public claimedA;
    uint256 public claimedB;

    bool public dissolveApprovedA;
    bool public dissolveApprovedB;

    bool public exitedA;
    bool public exitedB;

    bool public isActive;

    IKToken public kRBTC;

    // ── Events ──────────────────────────────────────────────────────────
    event PactCreated(address founderA, address founderB, uint256 cliffEnd, uint256 vestingEnd);
    event Claimed(address founder, uint256 amount);
    event EarlyExit(address departing, address remaining, uint256 forfeitedAmount);
    event Dissolved(address founderA, address founderB);

    // ── Modifiers ───────────────────────────────────────────────────────
    modifier onlyFounders() {
        require(msg.sender == founderA || msg.sender == founderB, "Not a founder");
        _;
    }

    // ── Constructor ─────────────────────────────────────────────────────
    constructor(
        address _founderB,
        uint256 _cliffDuration,
        uint256 _vestingDuration,
        address _kRBTC
    ) payable {
        require(_founderB != address(0), "Invalid founderB");
        require(_founderB != msg.sender, "Founders must differ");
        require(msg.value > 0, "Must deposit RBTC");
        require(_cliffDuration < _vestingDuration, "Cliff must be < vesting");

        founderA = msg.sender;
        founderB = _founderB;
        depositA = msg.value;

        startTime = block.timestamp;
        cliffEnd = block.timestamp + _cliffDuration;
        vestingEnd = block.timestamp + _vestingDuration;

        kRBTC = IKToken(_kRBTC);
    }

    // ── Join ────────────────────────────────────────────────────────────
    function joinPact() external payable {
        require(msg.sender == founderB, "Only founderB");
        require(!isActive, "Already active");
        require(msg.value > 0, "Must deposit RBTC");

        depositB = msg.value;

        // Deposit all RBTC into Tropykus
        uint256 totalDeposit = depositA + depositB;
        uint256 kBalanceBefore = kRBTC.balanceOf(address(this));
        kRBTC.mint{value: totalDeposit}();
        uint256 kBalanceAfter = kRBTC.balanceOf(address(this));
        uint256 totalKTokens = kBalanceAfter - kBalanceBefore;

        // Proportional kToken allocation
        kTokensA = (totalKTokens * depositA) / totalDeposit;
        kTokensB = totalKTokens - kTokensA; // remainder to B to avoid dust

        isActive = true;

        emit PactCreated(founderA, founderB, cliffEnd, vestingEnd);
    }

    // ── Vested Amount ───────────────────────────────────────────────────
    function getVestedAmount(address founder) public view returns (uint256) {
        require(founder == founderA || founder == founderB, "Not a founder");

        uint256 deposit = (founder == founderA) ? depositA : depositB;

        // If founder already exited, their vested amount is frozen at exit time
        bool exited = (founder == founderA) ? exitedA : exitedB;
        if (exited) return deposit; // claimedX was set to vestedAmount at exit

        if (block.timestamp < cliffEnd) return 0;
        if (block.timestamp >= vestingEnd) return deposit;

        return (deposit * (block.timestamp - cliffEnd)) / (vestingEnd - cliffEnd);
    }

    // ── Claim ───────────────────────────────────────────────────────────
    function claim() external onlyFounders {
        require(isActive, "Pact not active");
        require(block.timestamp >= cliffEnd, "Cliff not reached");

        bool isA = (msg.sender == founderA);
        require(isA ? !exitedA : !exitedB, "Already exited");

        uint256 vested = getVestedAmount(msg.sender);
        uint256 claimed = isA ? claimedA : claimedB;
        uint256 claimable = vested - claimed;
        require(claimable > 0, "Nothing to claim");

        uint256 myKTokens = isA ? kTokensA : kTokensB;
        uint256 myDeposit = isA ? depositA : depositB;

        // Proportional kTokens to redeem (includes yield via exchange rate)
        uint256 kTokensToRedeem = (myKTokens * claimable) / myDeposit;

        // Update state before external call (reentrancy protection)
        if (isA) {
            claimedA += claimable;
            kTokensA -= kTokensToRedeem;
        } else {
            claimedB += claimable;
            kTokensB -= kTokensToRedeem;
        }

        uint256 balanceBefore = address(this).balance;
        kRBTC.redeem(kTokensToRedeem);
        uint256 redeemed = address(this).balance - balanceBefore;

        (bool success, ) = payable(msg.sender).call{value: redeemed}("");
        require(success, "Transfer failed");

        emit Claimed(msg.sender, redeemed);
    }

    // ── Early Exit ──────────────────────────────────────────────────────
    function exitEarly() external onlyFounders {
        require(isActive, "Pact not active");

        bool isA = (msg.sender == founderA);
        require(isA ? !exitedA : !exitedB, "Already exited");

        uint256 exiterDeposit = isA ? depositA : depositB;
        uint256 exiterClaimed = isA ? claimedA : claimedB;
        uint256 exiterKTokens = isA ? kTokensA : kTokensB;

        uint256 exiterVested = getVestedAmount(msg.sender);
        uint256 exiterClaimable = exiterVested - exiterClaimed;

        // kTokens for the exiter's vested-unclaimed portion
        uint256 kTokensForExiter = 0;
        uint256 remainingDeposit = exiterDeposit - exiterClaimed;
        if (exiterClaimable > 0 && remainingDeposit > 0) {
            kTokensForExiter = (exiterKTokens * exiterClaimable) / remainingDeposit;
        }

        // kTokens forfeited (unvested) → bonus for the other founder
        uint256 kTokensForfeited = exiterKTokens - kTokensForExiter;
        uint256 forfeitedAmount = exiterDeposit - exiterVested;

        // Update state before external calls
        if (isA) {
            exitedA = true;
            claimedA = exiterVested;
            kTokensA = 0;
            kTokensB += kTokensForfeited;
        } else {
            exitedB = true;
            claimedB = exiterVested;
            kTokensB = 0;
            kTokensA += kTokensForfeited;
        }

        // If both founders have exited, deactivate the pact
        if (exitedA && exitedB) {
            isActive = false;
        }

        // Redeem only the exiter's vested portion
        if (kTokensForExiter > 0) {
            uint256 balBefore = address(this).balance;
            kRBTC.redeem(kTokensForExiter);
            uint256 redeemed = address(this).balance - balBefore;

            (bool success, ) = payable(msg.sender).call{value: redeemed}("");
            require(success, "Transfer failed");
        }

        emit EarlyExit(msg.sender, isA ? founderB : founderA, forfeitedAmount);
    }

    // ── Dissolve (2-of-2 multisig) ─────────────────────────────────────
    function dissolve() external onlyFounders {
        require(isActive, "Pact not active");

        if (msg.sender == founderA) {
            dissolveApprovedA = true;
        } else {
            dissolveApprovedB = true;
        }

        // Execute only when both have approved
        if (dissolveApprovedA && dissolveApprovedB) {
            isActive = false;

            // Redeem all kTokens
            uint256 totalKTokens = kTokensA + kTokensB;
            uint256 balBefore = address(this).balance;
            if (totalKTokens > 0) {
                kRBTC.redeem(totalKTokens);
            }
            uint256 totalRedeemed = address(this).balance - balBefore;

            // Distribute proportionally to vested amounts
            uint256 vestedA = getVestedAmount(founderA) - claimedA;
            uint256 vestedB = getVestedAmount(founderB) - claimedB;
            uint256 totalVested = vestedA + vestedB;

            uint256 shareA;
            uint256 shareB;

            if (totalVested > 0) {
                shareA = (totalRedeemed * vestedA) / totalVested;
                shareB = totalRedeemed - shareA;
            } else {
                // Edge case: both at 0 (before cliff) → return proportional to deposit
                shareA = (totalRedeemed * depositA) / (depositA + depositB);
                shareB = totalRedeemed - shareA;
            }

            kTokensA = 0;
            kTokensB = 0;

            if (shareA > 0) {
                (bool successA, ) = payable(founderA).call{value: shareA}("");
                require(successA, "Transfer A failed");
            }
            if (shareB > 0) {
                (bool successB, ) = payable(founderB).call{value: shareB}("");
                require(successB, "Transfer B failed");
            }

            emit Dissolved(founderA, founderB);
        }
    }

    // ── Receive RBTC from Tropykus redeems ──────────────────────────────
    receive() external payable {}
}
