<p align="center">
  <img src="https://i.imgur.com/MFV7jyO.png" alt="VestingPact Logo" width="280" />
</p>

<h1 align="center">VestingPact</h1>

<p align="center">
  <strong>Pacto de socios trustless en Bitcoin</strong><br/>
  Protocolo de vesting entre co-fundadores construido sobre Rootstock
</p>

<p align="center">
  <a href="#como-funciona">Como funciona</a> &nbsp;&bull;&nbsp;
  <a href="#instalacion">Instalacion</a> &nbsp;&bull;&nbsp;
  <a href="#smart-contract">Smart Contract</a> &nbsp;&bull;&nbsp;
  <a href="#frontend">Frontend</a> &nbsp;&bull;&nbsp;
  <a href="#testing">Testing</a> &nbsp;&bull;&nbsp;
  <a href="#integraciones-rsk">Integraciones RSK</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity" alt="Solidity" />
  <img src="https://img.shields.io/badge/Rootstock-Testnet-00b520?logo=bitcoin" alt="RSK Testnet" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6-646cff?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Ethers.js-5.7-2535a0" alt="Ethers" />
  <img src="https://img.shields.io/badge/Licencia-MIT-green" alt="MIT" />
</p>

---

## El Problema

> El **50% de las startups falla por conflictos entre co-fundadores**.

En Latinoamerica, los pactos de socios tradicionales requieren abogados costosos (USD $2.000-$5.000), tardan semanas en redactarse y, lo mas grave, **no se ejecutan solos**. Cuando un fundador abandona el proyecto, hacer cumplir el acuerdo es lento, caro y muchas veces inviable.

**VestingPact** resuelve esto con un smart contract auto-ejecutable en Bitcoin (via Rootstock). Cada co-fundador deposita RBTC como colateral de su compromiso. El capital se desbloquea gradualmente segun el tiempo dedicado al proyecto, y el RBTC que aun no se libera genera rendimiento automatico en Tropykus.

---

## Como Funciona

```
Founder A                                          Founder B
    |                                                  |
    |  1. Crea pacto + deposita RBTC                   |
    |─────────────────────► VestingPact                 |
    |                          |                        |
    |                          |  2. Founder B se une   |
    |                          |◄───────────────────────|
    |                          |     + deposita RBTC    |
    |                          |                        |
    |                    ┌─────▼─────┐                  |
    |                    │  Tropykus │  3. Yield auto   |
    |                    │  (kRBTC)  │     sobre RBTC   |
    |                    └─────┬─────┘                  |
    |                          |                        |
    |    ══════════════════════|═══════════════════     |
    |    ░░░░ CLIFF ░░░░░░░░░░|░░░░ VESTING ░░░░░     |
    |    ══════════════════════|═══════════════════     |
    |                          |                        |
    |  4. Reclama RBTC         |         Reclama RBTC   |
    |     vested + yield ◄─────┴────────► + yield       |
```

| Paso | Accion | Detalle |
|:----:|--------|---------|
| **1** | **Crear pacto** | Founder A configura cliff, duracion de vesting y deposita RBTC |
| **2** | **Unirse** | Founder B acepta los terminos y deposita su parte de RBTC |
| **3** | **Yield automatico** | Todo el RBTC se deposita en Tropykus y genera rendimiento |
| **4** | **Vesting gradual** | Despues del cliff, el capital se desbloquea linealmente |
| **5** | **Reclamar** | Cada founder retira su RBTC liberado + yield acumulado |

### Escenarios de salida

- **Claim** — Retirar el RBTC ya liberado + su proporcion de yield
- **Exit Early** — Un founder abandona; pierde su capital no liberado (se transfiere al otro)
- **Dissolve** — Ambos founders aprueban disolver el pacto por mutuo acuerdo (multisig 2-de-2)

---

## Stack Tecnico

| Capa | Tecnologia | Descripcion |
|------|-----------|-------------|
| Smart Contract | Solidity 0.8.20 | Contrato principal en Rootstock (RSK) |
| Yield | Tropykus (kRBTC) | Lending protocol, fork de Compound V2 en RSK |
| Frontend | React 19 + Vite | SPA con lazy loading y error boundaries |
| Web3 | Ethers.js v5.7.2 | Interaccion con la blockchain |
| Wallet | xo-connect (Beexo) + MetaMask | Soporte multi-wallet con deteccion automatica |
| Onramp | Sovryn FastBTC | Bridge de BTC a RBTC |

---

## Contrato Deployado

| Campo | Valor |
|-------|-------|
| **Red** | RSK Testnet (Chain ID 31) |
| **Address** | `pendiente de deploy` |
| **Explorer** | [explorer.testnet.rootstock.io](https://explorer.testnet.rootstock.io) |

---

## Demo

| Recurso | Link |
|---------|------|
| **App** | pendiente de deploy |
| **Video** | pendiente |

---

## Instalacion

### Requisitos previos

- Node.js 16+
- Git
- 2 wallets de prueba (MetaMask o Beexo) con tRBTC del [faucet de RSK](https://faucet.rootstock.io/)

### Smart Contract

```bash
# Clonar el repositorio
git clone https://github.com/VilmaAP/VestingPact-Rootstock.git
cd rootstock

# Instalar dependencias
npm install

# Compilar contratos
npx hardhat compile

# Ejecutar tests (42 tests)
npx hardhat test

# Reporte de cobertura
npx hardhat coverage

# Configurar variables de entorno
cp .env.example .env
# Completar: PRIVATE_KEY, PRIVATE_KEY_B, FOUNDER_B_ADDRESS

# Deploy en RSK Testnet
npx hardhat run scripts/deploy.js --network rskTestnet

# Generar evidencia on-chain (2+ transacciones)
npx hardhat run scripts/demo.js --network rskTestnet
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:5173)
npm run dev

# Build de produccion
npm run build
```

---

## Smart Contract

### VestingPact.sol

El contrato implementa vesting lineal con cliff y generacion de yield automatica via Tropykus.

**Formula de vesting:**

```
Si  tiempo < cliff       →  vested = 0
Si  tiempo >= vestingEnd  →  vested = deposito completo
Si  cliff <= tiempo < end →  vested = deposito * (tiempo - cliff) / (vestingEnd - cliff)
```

**Funciones principales:**

| Funcion | Descripcion |
|---------|-------------|
| `constructor(founderB, cliff, vesting, kRBTC)` | Crea el pacto con el deposito de Founder A |
| `joinPact()` | Founder B se une y deposita; todo el RBTC va a Tropykus |
| `getVestedAmount(founder)` | Consulta cuanto RBTC tiene liberado un founder |
| `claim()` | Retira RBTC liberado + yield proporcional |
| `exitEarly()` | Salida anticipada; se pierde el capital no liberado |
| `dissolve()` | Disolucion por mutuo acuerdo (requiere aprobacion de ambos) |

**Eventos:**

| Evento | Emitido en |
|--------|-----------|
| `PactCreated(founderA, founderB, cliffEnd, vestingEnd)` | `joinPact()` |
| `Claimed(founder, amount)` | `claim()` |
| `EarlyExit(departing, remaining, forfeited)` | `exitEarly()` |
| `Dissolved(founderA, founderB)` | `dissolve()` |

---

## Frontend

La aplicacion tiene 3 paginas principales:

### Landing (`/`)
Pagina de presentacion con el problema, la solucion y un diagrama visual del flujo.

### Crear Pacto (`/create`)
Formulario multi-paso para configurar y deployar un nuevo pacto:
1. Configurar parametros (address de Founder B, dias de cliff, dias de vesting, monto RBTC)
2. Revisar y confirmar
3. Confirmacion con address del contrato y link al explorer

Incluye un **modo demo** que pre-llena duraciones cortas para pruebas rapidas.

### Dashboard (`/dashboard/:address`)
Panel de control del pacto con:
- Estado del pacto y direcciones de ambos founders
- Barra de progreso visual del vesting
- Montos liberados, reclamados y pendientes por founder
- Yield acumulado via Tropykus
- Botones de accion contextuales (Claim, Exit Early, Dissolve)

### Soporte de wallets

| Prioridad | Wallet | Metodo |
|:---------:|--------|--------|
| 1 | Beexo | xo-connect (EIP-1193) |
| 2 | MetaMask | window.ethereum |
| 3 | Solo lectura | RPC directo |

---

## Testing

El proyecto cuenta con **42 tests** que cubren todos los flujos:

```bash
npx hardhat test
```

**Cobertura:**

| Categoria | Tests |
|-----------|:-----:|
| Deploy y estado inicial | 5 |
| joinPact y Tropykus | 6 |
| Calculo de vesting (cliff, parcial, completo) | 8 |
| Claim (post-cliff, yield, acumulado) | 7 |
| Exit Early (forfeiture, transferencia) | 6 |
| Dissolve (multisig 2-de-2) | 5 |
| Edge cases y seguridad | 5 |

```bash
# Reporte de cobertura detallado
npx hardhat coverage
```

---

## Integraciones RSK

| Integracion | Uso en VestingPact |
|------------|-------------------|
| **RBTC** | Colateral nativo del pacto entre co-fundadores |
| **Tropykus (kRBTC)** | Generacion de yield sobre el RBTC en vesting |
| **xo-connect (Beexo)** | Wallet provider principal via EIP-1193 |
| **Sovryn FastBTC** | Onramp de BTC a RBTC para usuarios nuevos |

---

## Variables de Entorno

```env
PRIVATE_KEY=0x...           # Clave privada de Founder A
PRIVATE_KEY_B=0x...         # Clave privada de Founder B
FOUNDER_B_ADDRESS=0x...     # Direccion de Founder B
VESTING_PACT_ADDRESS=0x...  # Direccion del contrato deployado
```

---

## Estructura del Proyecto

```
rootstock/
├── contracts/
│   ├── VestingPact.sol          # Contrato principal
│   ├── interfaces/
│   │   └── IKToken.sol          # Interface Tropykus kRBTC
│   └── mocks/
│       └── MockKRBTC.sol        # Mock para testing
├── frontend/
│   └── src/
│       ├── pages/               # Landing, CreatePact, Dashboard
│       ├── components/          # Navbar, WalletButton, VestingProgress
│       ├── hooks/               # useWallet (estado de wallet)
│       ├── lib/                 # provider, contracts, bytecode
│       └── styles/              # Sistema de diseno (dark theme)
├── test/
│   └── VestingPact.test.js      # 42 tests
├── scripts/
│   ├── deploy.js                # Deploy a RSK Testnet
│   ├── demo.js                  # Generar evidencia on-chain
│   └── export-bytecode.js       # Exportar bytecode al frontend
└── hardhat.config.js            # Config Solidity + RSK Testnet
```

---

## Licencia

MIT

---

<p align="center">
  Construido con Bitcoin sobre <a href="https://rootstock.io">Rootstock</a> para la <strong>Hackathon VendimiaTech 2026</strong>
</p>
