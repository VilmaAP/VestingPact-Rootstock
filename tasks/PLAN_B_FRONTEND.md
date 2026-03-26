# PLAN B — Frontend React + xo-connect + MetaMask

> **Sesión independiente. Puede arrancar en paralelo con Plan A.**
> Usa ABI placeholder hasta que Plan A termine. La address del contrato se actualiza después del deploy (Plan C).

---

## Tu Objetivo
Construir el frontend de VestingPact: Landing, flujo de creación de pacto, y dashboard.
Wallet: xo-connect (Beexo) como primario, MetaMask como fallback.
UX impecable — hay un premio de $100 USD por mejor UX.

---

## 1. Inicializar React + Vite

```bash
cd "d:\JUAN CARLITOS XD\proyectos cursor\hackathon vendimia\rootstock"
mkdir frontend && cd frontend
npm create vite@latest . -- --template react
npm install
npm install ethers@5.7.2 xo-connect@2.1.4 react-router-dom
```

---

## 2. Estructura de archivos

```
frontend/src/
├── App.jsx                 # Router principal
├── main.jsx
├── config.js               # Addresses, chain config
├── lib/
│   ├── provider.js          # xo-connect + MetaMask provider logic
│   └── contracts.js         # ABI + contract instances
├── hooks/
│   └── useWallet.js         # Hook de conexión de wallet
├── pages/
│   ├── Landing.jsx
│   ├── CreatePact.jsx
│   └── Dashboard.jsx
├── components/
│   ├── Navbar.jsx
│   ├── WalletButton.jsx
│   ├── VestingProgress.jsx
│   └── PactCard.jsx
└── styles/
    └── index.css
```

---

## 3. Config — `src/config.js`

```javascript
export const RSK_TESTNET = {
  chainId: "0x1f",
  chainIdDecimal: 31,
  name: "RSK Testnet",
  rpc: "https://public-node.testnet.rsk.co",
  explorer: "https://explorer.testnet.rootstock.io",
  currency: { name: "tRBTC", symbol: "tRBTC", decimals: 18 },
};

// Se actualiza después del deploy (Plan C)
export const VESTING_PACT_ADDRESS = "0x_PLACEHOLDER_DEPLOY_ADDRESS";

export const TROPYKUS = {
  kRBTC: "0x5b35072cd6110606c8421e013304110fa04a32a3",
  comptroller: "0xb1BEc5376929b4E0235F1353819DBa92c4B0C6bb",
};
```

---

## 4. Provider — `src/lib/provider.js`

xo-connect funciona dentro del WebView de Beexo (via postMessage).
Para desarrollo y demo fuera de Beexo → fallback a MetaMask.

```javascript
import { ethers } from "ethers";
import { XOConnectProvider } from "xo-connect";

export function createProvider() {
  // Intentar xo-connect primero (dentro de Beexo wallet)
  if (window.XOConnect) {
    const xoProvider = new XOConnectProvider({
      rpcs: {
        "0x1f": "https://public-node.testnet.rsk.co",
        "0x1e": "https://public-node.rsk.co",
      },
      defaultChainId: "0x1f",
      debug: true,
    });
    return new ethers.providers.Web3Provider(xoProvider, "any");
  }

  // Fallback a MetaMask
  if (window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum, "any");
  }

  // Read-only provider
  return new ethers.providers.JsonRpcProvider("https://public-node.testnet.rsk.co");
}

export function getProviderType() {
  if (window.XOConnect) return "beexo";
  if (window.ethereum) return "metamask";
  return "readonly";
}
```

---

## 5. Hook — `src/hooks/useWallet.js`

Estado: `{ address, provider, signer, chainId, providerType, isConnected }`

Funciones:
- `connect()` → pide eth_requestAccounts, guarda signer
- `disconnect()` → limpia estado
- `switchToRSK()` → wallet_addEthereumChain si es MetaMask
- Escuchar eventos: accountsChanged, chainChanged

---

## 6. Páginas

### Landing.jsx — `/`
- Hero: "El 50% de las startups muere por conflictos entre socios. Nosotros pusimos el pacto dentro del contrato. En Bitcoin. Sin abogados."
- CTA grande: "Crear Pacto" → navega a /create
- Sección "Cómo funciona": 3 pasos visuales (Depositar → Vestear → Reclamar)
- Sección "¿Por qué Bitcoin?": RBTC como colateral, yield automático en Tropykus
- Footer con links al explorer, docs, FastBTC

### CreatePact.jsx — `/create`
- **Paso 1:** Configurar parámetros
  - Input: dirección del co-fundador (founderB)
  - Input: duración del cliff (días)
  - Input: duración total del vesting (días)
  - Input: monto a depositar (RBTC)
  - Para demo rápida: botón "Demo mode" que setea cliff=5min, vesting=10min
- **Paso 2:** Revisar y confirmar
  - Resumen visual de todos los parámetros
  - Mostrar cuánto RBTC se depositará
  - Botón "Crear Pacto" → llama al constructor del contrato con msg.value
- **Paso 3:** Confirmación
  - Tx hash con link al explorer
  - Link para compartir con el co-fundador (URL del dashboard con la address)
  - Instrucciones para que founderB llame joinPact()

### Dashboard.jsx — `/dashboard/:contractAddress`
- Lee la address del contrato de la URL
- Muestra estado completo del pacto:
  - Barra de progreso visual: tiempo transcurrido vs vesting total
  - Cliff indicator (completado o faltante)
  - RBTC vested / unvested de cada founder
  - Yield acumulado (leer de Tropykus via exchangeRate)
  - Estado: Active / Dissolved
- Acciones (según el sender):
  - **"Unirse al Pacto"** → joinPact() payable (solo si founderB y pacto no activo)
  - **"Reclamar"** → claim() (si hay vested disponible)
  - **"Salida Anticipada"** → exitEarly() (con modal de advertencia)
  - **"Disolver Pacto"** → dissolve() (con indicador de aprobación del otro)
- Link al onramp FastBTC: botón "¿No tenés RBTC?" → abre https://app.sovryn.app/fastbtc en nueva tab

---

## 7. Componentes clave

### WalletButton.jsx
- Muestra "Conectar Wallet" o address truncada (0x1234...abcd)
- Badge: "Beexo" o "MetaMask" según el provider detectado
- Dropdown: Disconnect, Switch to RSK Testnet

### VestingProgress.jsx
- Barra de progreso animada
- Markers: Start → Cliff → Now → End
- Porcentaje vested actual
- Tiempo restante

### PactCard.jsx
- Card con info de un founder: address, deposit, vested, claimed, yield

---

## 8. ABI placeholder — `src/lib/contracts.js`

Hasta que Plan A termine, usar este ABI mínimo:
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
  "function cliffEnd() view returns (uint256)",
  "function vestingEnd() view returns (uint256)",
  "function claimedA() view returns (uint256)",
  "function claimedB() view returns (uint256)",
  "function isActive() view returns (bool)",
  "function dissolveApprovedA() view returns (bool)",
  "function dissolveApprovedB() view returns (bool)",
  "event PactCreated(address founderA, address founderB, uint256 cliffEnd, uint256 vestingEnd)",
  "event Claimed(address founder, uint256 amount)",
  "event EarlyExit(address departing, address remaining, uint256 forfeitedAmount)",
  "event Dissolved(address founderA, address founderB)",
];
```

Cuando Plan A genere el ABI real, reemplazar.

---

## 9. Estilo y UX

- Diseño limpio, oscuro (tema crypto/DeFi)
- Mobile-first (Beexo es wallet mobile)
- Toda la UI en **español** (mercado LATAM, jurado argentino)
- Feedback visual en cada transacción: loading spinner, confirmación, error
- Tooltips explicativos en cada campo
- Responsive: funciona en mobile WebView de Beexo

---

## 10. Build y deploy estático

```bash
npm run build
# Output en frontend/dist/
# Servir con Vercel, Netlify, o GitHub Pages
```

---

## Criterio de Éxito
- `npm run build` → 0 errors
- Landing atractiva con narrativa clara
- Flujo crear pacto funcional end-to-end
- Dashboard lee datos del contrato y muestra progreso visual
- Wallet connect funciona con MetaMask (xo-connect se testea en Beexo)
- UI en español, responsive, sin fricción
- FastBTC link presente como onramp
