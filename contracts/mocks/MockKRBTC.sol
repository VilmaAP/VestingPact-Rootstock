// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IKToken.sol";

/**
 * @title MockKRBTC
 * @notice Mock Tropykus kRBTC for local Hardhat testing.
 *         Simulates mint/redeem with a configurable exchange rate to test yield.
 */
contract MockKRBTC is IKToken {
    mapping(address => uint256) private _balances;
    uint256 private _exchangeRate; // scaled by 1e18

    constructor() {
        _exchangeRate = 1e18; // 1:1 initially
    }

    /// @notice Simulate yield by increasing the exchange rate
    function setExchangeRate(uint256 newRate) external {
        _exchangeRate = newRate;
    }

    // ── IKToken implementation ──────────────────────────────────────────

    function mint() external payable override {
        require(msg.value > 0, "Must send RBTC");
        // kTokens = RBTC * 1e18 / exchangeRate
        uint256 kTokens = (msg.value * 1e18) / _exchangeRate;
        _balances[msg.sender] += kTokens;
    }

    function redeem(uint redeemTokens) external override returns (uint) {
        require(_balances[msg.sender] >= redeemTokens, "Insufficient kTokens");
        _balances[msg.sender] -= redeemTokens;

        // RBTC = kTokens * exchangeRate / 1e18
        uint256 rbtcAmount = (redeemTokens * _exchangeRate) / 1e18;
        (bool success, ) = payable(msg.sender).call{value: rbtcAmount}("");
        require(success, "Transfer failed");
        return 0; // Compound convention: 0 = success
    }

    function redeemUnderlying(uint redeemAmount) external override returns (uint) {
        uint256 kTokens = (redeemAmount * 1e18) / _exchangeRate;
        require(_balances[msg.sender] >= kTokens, "Insufficient kTokens");
        _balances[msg.sender] -= kTokens;

        (bool success, ) = payable(msg.sender).call{value: redeemAmount}("");
        require(success, "Transfer failed");
        return 0;
    }

    function balanceOf(address owner) external view override returns (uint) {
        return _balances[owner];
    }

    function balanceOfUnderlying(address owner) external view override returns (uint) {
        return (_balances[owner] * _exchangeRate) / 1e18;
    }

    function exchangeRateCurrent() external view override returns (uint) {
        return _exchangeRate;
    }

    function exchangeRateStored() external view override returns (uint) {
        return _exchangeRate;
    }

    receive() external payable {}
}
