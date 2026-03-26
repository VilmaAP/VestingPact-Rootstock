# PLAN C — Deploy RSK Testnet + Entregables + README

> **Depende de Plan A (contrato compilado).** Puede arrancar parcialmente en paralelo preparando scripts y README.

---

## Tu Objetivo
Deploy del contrato en RSK testnet, generar evidencia on-chain (mínimo 2 tx), conectar frontend con address real, y preparar todos los entregables del hackathon.

---

## 1. Pre-requisitos

- Plan A completado: contrato compila y tests pasan
- Private key con tRBTC del faucet (https://faucet.rootstock.io)
- Necesitás 2 wallets: una para founderA, otra para founderB

### Obtener tRBTC
1. Ir a https://faucet.rootstock.io
2. Pegar address (lowercase) → conseguir tRBTC
3. Repetir para la segunda wallet
4. Si el faucet pide checksum RSK, usar address en lowercase

### Configurar `.env`
```
PRIVATE_KEY=0x_private_key_founderA
PRIVATE_KEY_B=0x_private_key_founderB
```

---

## 2. Deploy Script — `scripts/deploy.js`

```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "tRBTC");

  const kRBTC = "0x5b35072cd6110606c8421e013304110fa04a32a3";
  const founderB = process.env.FOUNDER_B_ADDRESS;

  // Demo: cliff 5 min, vesting 10 min
  const cliffDuration = 5 * 60;
  const vestingDuration = 10 * 60;

  const VestingPact = await hre.ethers.getContractFactory("VestingPact");
  const pact = await VestingPact.deploy(founderB, cliffDuration, vestingDuration, kRBTC, {
    value: hre.ethers.parseEther("0.0005"),
    gasLimit: 3000000,
  });
  await pact.waitForDeployment();
  const address = await pact.getAddress();
  console.log("VestingPact deployed to:", address);
  console.log("Explorer:", `https://explorer.testnet.rootstock.io/address/${address}`);
}

main().catch(console.error);
```

```bash
npx hardhat run scripts/deploy.js --network rskTestnet
```

---

## 3. Generar Evidencia On-Chain (mínimo 2 tx)

Crear `scripts/demo.js` para ejecutar el flujo completo:

```javascript
// TX 1: Deploy (ya hecho arriba)
// TX 2: founderB joinPact()
// TX 3 (bonus): claim() después del cliff (si usamos cliff corto)
```

Script que:
1. Conecta con wallet de founderB
2. Llama `joinPact()` con msg.value → TX 2
3. (Opcional) Esperar cliff, llamar `claim()` → TX 3

Esto genera las 2+ transacciones requeridas por el track Rootstock.

---

## 4. Actualizar Frontend con Address Real

Una vez deployado, actualizar `frontend/src/config.js`:
```javascript
export const VESTING_PACT_ADDRESS = "0x_REAL_DEPLOYED_ADDRESS";
```

Rebuild frontend:
```bash
cd frontend && npm run build
```

---

## 5. Deploy Frontend (hosting estático)

Opción rápida — Vercel:
```bash
npm install -g vercel
cd frontend
vercel --prod
```

O Netlify:
```bash
npm install -g netlify-cli
cd frontend
netlify deploy --prod --dir=dist
```

Guardar la URL pública para DoraHacks.

---

## 6. README.md

Crear en la raíz del proyecto. Esto es lo que ve el jurado primero.

```markdown
# VestingPact — Pacto de Socios en Bitcoin

Protocolo de vesting de capital entre co-fundadores, construido sobre Rootstock (RSK).
Cada socio deposita RBTC como colateral de su compromiso. El capital se desbloquea
proporcionalmente al tiempo en el proyecto. El RBTC unvested genera yield en Tropykus.

## El Problema
El 50% de las startups falla por conflictos entre co-fundadores. En LATAM, los pactos
de socios requieren abogados caros y no se ejecutan solos. VestingPact automatiza el
pacto con smart contracts en Bitcoin.

## Cómo Funciona
1. **Crear Pacto** — Founder A configura cliff, duración, y deposita RBTC
2. **Unirse** — Founder B acepta y deposita su RBTC
3. **Yield Automático** — Todo el RBTC va a Tropykus (lending protocol en RSK)
4. **Vesting Gradual** — Después del cliff, el capital se desbloquea linealmente
5. **Reclamar** — Cada founder retira su RBTC vested + yield acumulado

## Stack Técnico
| Capa | Tecnología |
|---|---|
| Smart Contract | Solidity 0.8.20 en Rootstock (RSK) |
| Yield | Tropykus SDK (Compound V2 fork en RSK) |
| Frontend | React + Vite + Ethers.js v5.7.2 |
| Wallet | xo-connect (Beexo) + MetaMask fallback |
| Onramp | Sovryn FastBTC |

## Contrato Deployado
- **Red:** RSK Testnet (Chain ID 31)
- **Address:** `0x_ADDRESS`
- **Explorer:** [Ver en Explorer](https://explorer.testnet.rootstock.io/address/0x_ADDRESS)

## Demo
- **App:** [URL de la app]
- **Video:** [URL del video]

## Instalación

### Smart Contract
git clone [repo]
cd rootstock
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network rskTestnet

### Frontend
cd frontend
npm install
npm run dev

## Integraciones RSK
- **RBTC** — Colateral nativo del pacto
- **Tropykus** — Yield sobre RBTC unvested (kRBTC)
- **xo-connect (Beexo)** — Wallet provider EIP-1193
- **Sovryn FastBTC** — Onramp BTC → RBTC

## Equipo
[Nombre del equipo]

## Licencia
MIT
```

---

## 7. Checklist de Entregables DoraHacks

### Track Rootstock
- [ ] Smart contract deployado en RSK testnet
- [ ] Mínimo 2 tx on-chain durante el hackathon
- [ ] Repo GitHub público con README
- [ ] Demo funcional accesible vía link
- [ ] Video demo (máx 5 min)
- [ ] Pitch deck PDF
- [ ] Evidencia validación de mercado

### Track Beexo Connect (simultáneo)
- [ ] xo-connect integrado y demostrable
- [ ] Flujo UX documentado

### Prioridad de Entrega
1. Subir a DoraHacks Track Rootstock PRIMERO → capturar bono $100 (primeros 7)
2. Subir a Track Beexo Connect → capturar bono $50 (primeros 8)
3. **Subir antes de las 16:20 hs del viernes 27**

---

## Criterio de Éxito
- Contrato deployado con address verificable en explorer
- Mínimo 2 transacciones exitosas on-chain
- Frontend live con URL pública
- README completo y profesional
- Todos los entregables subidos a DoraHacks antes del deadline
