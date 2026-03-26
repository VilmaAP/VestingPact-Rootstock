# FIX B — Frontend Fixes

> **Sesión independiente. Corregir los bugs encontrados en la auditoría del frontend.**
> Después de cada fix, correr `npm run build` en `frontend/` y verificar 0 errors.

---

## Contexto
El frontend tiene 4 bugs. Los más críticos son el provider de xo-connect mal inicializado y el deploy de contratos roto.

Archivos a modificar:
- `frontend/src/lib/provider.js`
- `frontend/src/lib/contracts.js`
- `frontend/src/pages/CreatePact.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/config.js`

---

## Bug 1 — CRÍTICO: `provider.js` no usa XOConnectProvider correctamente

### Problema
Línea 6: `new ethers.providers.Web3Provider(window.XOConnect, "any")` — pasa el objeto `window.XOConnect` directo como EIP-1193 provider. Según el SDK de xo-connect, hay que instanciar `new XOConnectProvider({rpcs, defaultChainId, debug})` primero.

### Fix — Reescribir `provider.js`:

```javascript
import { ethers } from "ethers";
import { XOConnectProvider } from "xo-connect";

export function createProvider() {
  // xo-connect (dentro de Beexo wallet WebView)
  if (window.XOConnect) {
    const xoProvider = new XOConnectProvider({
      rpcs: {
        "0x1e": "https://public-node.rsk.co",
        "0x1f": "https://public-node.testnet.rsk.co",
      },
      defaultChainId: "0x1f",
      debug: true,
    });
    return new ethers.providers.Web3Provider(xoProvider, "any");
  }

  // MetaMask fallback
  if (window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum, "any");
  }

  // Read-only
  return new ethers.providers.JsonRpcProvider(
    "https://public-node.testnet.rsk.co"
  );
}

export function getProviderType() {
  if (window.XOConnect) return "beexo";
  if (window.ethereum) return "metamask";
  return "readonly";
}
```

---

## Bug 2 — CRÍTICO: `CreatePact.jsx` no puede deployar contratos

### Problema
Líneas 39-56: usa `ContractFactory` con bytecode `"0x"` (placeholder) y luego intenta un fallback con `sendTransaction` + `encodeDeploy` sin bytecode. Ninguno funciona.

### Fix — Usar bytecode real del contrato compilado

**Paso 1:** Copiar el bytecode del artefacto compilado. Después de `npx hardhat compile`, el bytecode está en:
`artifacts/contracts/VestingPact.sol/VestingPact.json` → campo `"bytecode"`

**Paso 2:** Crear archivo `frontend/src/lib/bytecode.js`:
```javascript
// Copiar el bytecode de artifacts/contracts/VestingPact.sol/VestingPact.json
// Este archivo se genera ejecutando: node scripts/export-bytecode.js
export const VESTING_PACT_BYTECODE = "0x...";  // pegar el bytecode real aquí
```

**Paso 3:** Crear script helper `scripts/export-bytecode.js`:
```javascript
const fs = require("fs");
const path = require("path");

const artifact = require("../artifacts/contracts/VestingPact.sol/VestingPact.json");
const output = `// Auto-generated — do not edit manually\nexport const VESTING_PACT_BYTECODE = "${artifact.bytecode}";\n`;
fs.writeFileSync(
  path.join(__dirname, "../frontend/src/lib/bytecode.js"),
  output
);
console.log("Bytecode exported to frontend/src/lib/bytecode.js");
```

Ejecutar con: `node scripts/export-bytecode.js`

**Paso 4:** Reescribir el deploy en `CreatePact.jsx`:

```javascript
import { ethers } from "ethers";
import { VESTING_PACT_ABI } from "../lib/contracts";
import { VESTING_PACT_BYTECODE } from "../lib/bytecode";
import { TROPYKUS } from "../config";

// ... dentro de handleCreate:
const handleCreate = async () => {
  setError("");
  setLoading(true);
  try {
    const factory = new ethers.ContractFactory(
      VESTING_PACT_ABI,
      VESTING_PACT_BYTECODE,
      signer
    );

    const pact = await factory.deploy(
      founderB,
      cliffSeconds,
      vestingSeconds,
      TROPYKUS.kRBTC,
      {
        value: ethers.utils.parseEther(amount),
        gasLimit: 3000000,
      }
    );

    setTxHash(pact.deployTransaction.hash);
    await pact.deployed();
    setContractAddress(pact.address);
    setStep(3);
  } catch (err) {
    console.error("Error creando pacto:", err);
    setError(err.reason || err.message || "Error al crear el pacto");
  } finally {
    setLoading(false);
  }
};
```

---

## Bug 3 — MEDIO: ABI falta `startTime` y otros getters post-fix

### Fix — Actualizar `contracts.js`

Agregar las funciones faltantes al ABI. IMPORTANTE: después de que FIX_A agregue `exitedA` y `exitedB`, incluirlas también.

```javascript
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
  "function startTime() view returns (uint256)",   // AGREGAR
  "function cliffEnd() view returns (uint256)",
  "function vestingEnd() view returns (uint256)",
  "function claimedA() view returns (uint256)",
  "function claimedB() view returns (uint256)",
  "function kTokensA() view returns (uint256)",    // AGREGAR
  "function kTokensB() view returns (uint256)",    // AGREGAR
  "function isActive() view returns (bool)",
  "function exitedA() view returns (bool)",        // AGREGAR (post FIX_A)
  "function exitedB() view returns (bool)",        // AGREGAR (post FIX_A)
  "function dissolveApprovedA() view returns (bool)",
  "function dissolveApprovedB() view returns (bool)",
  "event PactCreated(address founderA, address founderB, uint256 cliffEnd, uint256 vestingEnd)",
  "event Claimed(address founder, uint256 amount)",
  "event EarlyExit(address departing, address remaining, uint256 forfeitedAmount)",
  "event Dissolved(address founderA, address founderB)",
];
```

---

## Bug 4 — MEDIO: Dashboard calcula `startTime` incorrectamente

### Problema
Línea 67: `cliffEnd.sub(vestingEnd.sub(cliffEnd.sub(0)))` — esto no tiene sentido. El contrato ya expone `startTime` como public.

### Fix — Leer `startTime` del contrato directamente

En `Dashboard.jsx`, dentro de `loadPact()`, agregar al Promise.all:

```javascript
const [
  founderA, founderB, depositA, depositB,
  startTime,    // AGREGAR
  cliffEnd, vestingEnd,
  claimedA, claimedB, isActive,
  dissolveApprovedA, dissolveApprovedB,
] = await Promise.all([
  contract.founderA(),
  contract.founderB(),
  contract.depositA(),
  contract.depositB(),
  contract.startTime(),    // AGREGAR
  contract.cliffEnd(),
  contract.vestingEnd(),
  contract.claimedA(),
  contract.claimedB(),
  contract.isActive(),
  contract.dissolveApprovedA(),
  contract.dissolveApprovedB(),
]);
```

Y reemplazar el cálculo malo de startTime (L67-83) por:

```javascript
setPact({
  founderA,
  founderB,
  depositA,
  depositB,
  startTime: startTime.toNumber(),    // directo del contrato
  cliffEnd: cliffEnd.toNumber(),
  vestingEnd: vestingEnd.toNumber(),
  // ... resto igual
});
```

Eliminar las líneas 67 y 83 que calculaban startTime con lógica rota.

---

## Bug 5 — MENOR: catch vacío en getVestedAmount

### Problema
Línea 60: `catch {}` traga errores silenciosamente.

### Fix
```javascript
try {
  [vestedA, vestedB] = await Promise.all([
    contract.getVestedAmount(founderA),
    contract.getVestedAmount(founderB),
  ]);
} catch (err) {
  console.warn("Vested amount not available (before cliff?):", err.message);
}
```

---

## Criterio de Éxito
- `npm run build` en `frontend/` → 0 errors
- xo-connect usa `XOConnectProvider` con rpcs configurado
- CreatePact puede deployar contratos con bytecode real
- Dashboard lee `startTime` del contrato directamente
- ABI incluye todos los getters del contrato (incluyendo los nuevos post FIX_A)
- No hay catch vacíos
