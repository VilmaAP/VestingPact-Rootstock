# PLAN A — Smart Contract + Tropykus Integration

> **Sesión independiente. No depende de otras sesiones.**
> Lee `VestingPact_Proyecto.md` para la spec completa del proyecto.

---

## Tu Objetivo
Construir VestingPact.sol — protocolo de vesting entre 2 co-fundadores sobre RSK.
El RBTC depositado se envía a Tropykus (fork de Compound V2) para generar yield.
Al terminar: compilación limpia + todos los tests pasando.

---

## 1. Inicializar Hardhat

```bash
cd "d:\JUAN CARLITOS XD\proyectos cursor\hackathon vendimia\rootstock"
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv
npx hardhat init  # JavaScript project
```

`hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      evmVersion: "london",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    rskTestnet: {
      url: "https://public-node.testnet.rsk.co",
      chainId: 31,
      gasPrice: 60000000,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
```

`.env.example`:
```
PRIVATE_KEY=tu_private_key_aqui
```

---

## 2. Interface Tropykus — `contracts/interfaces/IKToken.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IKToken {
    function mint() external payable;
    function redeem(uint redeemTokens) external returns (uint);
    function redeemUnderlying(uint redeemAmount) external returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function balanceOfUnderlying(address owner) external returns (uint);
    function exchangeRateCurrent() external returns (uint);
    function exchangeRateStored() external view returns (uint);
}
```

**kRBTC testnet:** `0x5b35072cd6110606c8421e013304110fa04a32a3`

---

## 3. VestingPact.sol — `contracts/VestingPact.sol`

### State
```
founderA, founderB: address
depositA, depositB: uint256 (RBTC en wei)
startTime, cliffEnd, vestingEnd: uint256 (timestamps)
kTokensA, kTokensB: uint256 (receipt tokens de Tropykus)
claimedA, claimedB: uint256 (ya retirado)
dissolveApprovedA, dissolveApprovedB: bool
isActive: bool
kRBTC: IKToken
```

### Constructor — `constructor(address _founderB, uint256 _cliffDuration, uint256 _vestingDuration, address _kRBTC) payable`
- msg.sender = founderA, msg.value = depositA
- Guarda params, startTime = block.timestamp
- cliffEnd = startTime + _cliffDuration
- vestingEnd = startTime + _vestingDuration
- NO deposita en Tropykus todavía — espera que founderB se una

### joinPact() payable
- Solo founderB, msg.value = depositB
- Deposita todo en Tropykus: `kRBTC.mint{value: depositA + depositB}()`
- Guarda kTokens proporcionales a cada founder
- isActive = true → emit PactCreated

### getVestedAmount(address founder) view → uint256
```solidity
uint256 deposit = (founder == founderA) ? depositA : depositB;
if (block.timestamp < cliffEnd) return 0;
if (block.timestamp >= vestingEnd) return deposit;
return (deposit * (block.timestamp - cliffEnd)) / (vestingEnd - cliffEnd);
```

### claim()
- Requiere isActive, sender es founder, timestamp >= cliffEnd
- claimable = getVestedAmount(sender) - claimed[sender]
- Calcula kTokens proporcionales → kRBTC.redeem()
- Transfer RBTC al sender (yield incluido por exchange rate)
- Actualiza claimed → emit Claimed

### exitEarly()
- Antes del cliff: exiter recibe 0, todo al otro founder
- Después del cliff: exiter recibe su vested, unvested va al otro
- Redeem kTokens correspondientes de Tropykus
- emit EarlyExit

### dissolve()
- Multi-sig 2-of-2: cada founder llama dissolve()
- Primera llamada: guarda aprobación
- Segunda llamada: ejecuta — cada uno recibe vested + yield proporcional
- isActive = false → emit Dissolved

### Events
```solidity
event PactCreated(address founderA, address founderB, uint256 cliffEnd, uint256 vestingEnd);
event Claimed(address founder, uint256 amount);
event EarlyExit(address departing, address remaining, uint256 forfeitedAmount);
event Dissolved(address founderA, address founderB);
```

---

## 4. MockKRBTC — `contracts/mocks/MockKRBTC.sol`

Para tests locales en Hardhat (no para testnet). Simula kRBTC:
- mint() payable → acepta RBTC, trackea balance, retorna kTokens con exchange rate 1:1 inicialmente
- redeem() → devuelve RBTC con exchange rate (simular 5% yield)
- Implementa IKToken

---

## 5. Tests — `test/VestingPact.test.js`

Usar `ethers.provider.send("evm_increaseTime", [seconds])` + `evm_mine` para simular tiempo.

Tests obligatorios:
1. Deploy con founderA deposit
2. founderB joinPact → PactCreated emitido
3. getVestedAmount = 0 antes del cliff
4. getVestedAmount proporcional después del cliff
5. getVestedAmount = 100% después del vesting
6. claim() exitoso post-cliff
7. exitEarly() antes del cliff → exiter recibe 0
8. exitEarly() después del cliff → exiter recibe proporcional
9. dissolve() requiere ambas firmas
10. Integración con MockKRBTC

```bash
npx hardhat test
```

---

## 6. Script de Deploy — `scripts/deploy.js`

```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const kRBTC = "0x5b35072cd6110606c8421e013304110fa04a32a3"; // Tropykus testnet

  const founderB = "ADDRESS_FOUNDER_B"; // reemplazar
  const cliffDuration = 365 * 24 * 60 * 60; // 1 año
  const vestingDuration = 4 * 365 * 24 * 60 * 60; // 4 años

  // Para demo: usar tiempos cortos
  // const cliffDuration = 300; // 5 min
  // const vestingDuration = 600; // 10 min

  const VestingPact = await hre.ethers.getContractFactory("VestingPact");
  const pact = await VestingPact.deploy(founderB, cliffDuration, vestingDuration, kRBTC, {
    value: hre.ethers.parseEther("0.001"),
    gasLimit: 3000000,
  });
  await pact.waitForDeployment();
  console.log("VestingPact deployed to:", await pact.getAddress());
}

main().catch(console.error);
```

---

## Criterio de Éxito
- `npx hardhat compile` → 0 errors, 0 warnings
- `npx hardhat test` → todos pasan
- Lógica de vesting matemáticamente correcta
- Sin vulnerabilidades (reentrancy guards, overflow checks)
- ABI generado en `artifacts/contracts/VestingPact.sol/VestingPact.json`
