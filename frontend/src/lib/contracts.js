import { ethers } from "ethers";

export const VESTING_PACT_ABI = [
  "constructor(address _founderB, uint256 _cliffDuration, uint256 _vestingDuration, address _kRBTC) payable",
  "function joinPact() payable",
  "function claim()",
  "function exitEarly()",
  "function dissolve()",
  "function getVestedAmount(address founder) view returns (uint256)",
  "function founderA() view returns (address)",
  "function founderB() view returns (address)",
  "function depositA() view returns (uint256)",
  "function depositB() view returns (uint256)",
  "function startTime() view returns (uint256)",
  "function cliffEnd() view returns (uint256)",
  "function vestingEnd() view returns (uint256)",
  "function claimedA() view returns (uint256)",
  "function claimedB() view returns (uint256)",
  "function kTokensA() view returns (uint256)",
  "function kTokensB() view returns (uint256)",
  "function isActive() view returns (bool)",
  "function exitedA() view returns (bool)",
  "function exitedB() view returns (bool)",
  "function dissolveApprovedA() view returns (bool)",
  "function dissolveApprovedB() view returns (bool)",
  "event PactCreated(address founderA, address founderB, uint256 cliffEnd, uint256 vestingEnd)",
  "event Claimed(address founder, uint256 amount)",
  "event EarlyExit(address departing, address remaining, uint256 forfeitedAmount)",
  "event Dissolved(address founderA, address founderB)",
];

export function getVestingPactContract(address, signerOrProvider) {
  return new ethers.Contract(address, VESTING_PACT_ABI, signerOrProvider);
}
