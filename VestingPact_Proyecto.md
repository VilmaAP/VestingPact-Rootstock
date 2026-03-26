# VestingPact — Pacto de Socios en Bitcoin
## Documento de Proyecto · VendimiaTech Hackathon 2026

---

## 1. Resumen Ejecutivo

**VestingPact** es un protocolo de vesting de capital en Bitcoin construido sobre Rootstock (RSK). Permite a dos co-fundadores de una startup formalizar su pacto de socios on-chain: cada uno deposita RBTC como colateral de su compromiso, el capital se desbloquea proporcionalmente al tiempo que permanecen en el proyecto, y el RBTC que todavía no se ganó genera yield automáticamente en Tropykus mientras espera.

Si un socio se va antes del cliff, pierde su colateral unvested. El socio que se queda recibe ese capital más el yield acumulado. Si ambos cumplen, ambos recuperan su RBTC con rendimiento extra.

**Pitch de 10 segundos:** *"El 50% de las startups muere por conflictos entre socios. Nosotros pusimos el pacto de socios dentro del contrato. En Bitcoin. Sin abogados."*

---

## 2. El Problema

### 2.1 El dato
El 50% de las startups falla por conflictos entre co-fundadores. En LATAM, donde el acceso a asesoría legal especializada en startups es costoso y escaso, ese porcentaje es mayor.

### 2.2 Cómo se maneja hoy
En Silicon Valley existe el **founder vesting**: los socios firman un shareholders agreement donde el equity se gana con el tiempo (típicamente 4 años con 1 de cliff). Si alguien se va antes del cliff, no lleva nada. Si se va después, lleva proporcional.

En LATAM esto no existe de manera accesible porque:
- Requiere un abogado especializado en startups ($2,000–$5,000 USD)
- Requiere una estructura societaria formal (SAP, SAS, LLC)
- Los contratos no se ejecutan solos — alguien tiene que demandar
- No hay consecuencias reales para quien rompe el acuerdo verbal

El resultado: dos personas se sientan, se dividen el 50/50, uno se va a los 3 meses y se lleva la mitad de la empresa. O peor: se queda sin contribuir pero bloqueando decisiones.

### 2.3 Por qué Bitcoin/RSK es la solución correcta
- Las consecuencias son **automáticas e inmediatas** — no hay juicio
- El RBTC es **Bitcoin real**, el store of value más consolidado del mundo
- Rootstock es **EVM-compatible** — se puede construir con Solidity estándar
- El capital bloqueado **genera yield** en Tropykus — el costo de oportunidad de cumplir es cero

---

## 3. La Solución

### 3.1 Mecánica del contrato

Dos socios (Founder A y Founder B) crean un pacto con los siguientes parámetros:

| Parámetro | Descripción | Valor típico |
|---|---|---|
| `cliffDuration` | Tiempo mínimo antes de poder retirar algo | 365 días |
| `vestingDuration` | Tiempo total para desbloquear el 100% | 1460 días (4 años) |
| `depositA` | RBTC que deposita el Founder A | Variable |
| `depositB` | RBTC que deposita el Founder B | Variable |
| `feeToken` | Token para pagar fee del protocolo | DOC o RIF |

Una vez creado el pacto, el RBTC de ambos socios va automáticamente a Tropykus para generar yield.

### 3.2 Flujos posibles

**Flujo 1 — Ambos socios cumplen (happy path)**
```
Día 0:    Ambos depositan RBTC → va a Tropykus
Día 365:  Cliff completado → empieza el unlock gradual
Día 730:  Cada uno puede retirar el 50% de su depósito + yield proporcional
Día 1460: 100% desbloqueado → cada uno retira todo su capital + yield total
```

**Flujo 2 — Socio se va antes del cliff**
```
Día 0:    Ambos depositan RBTC → va a Tropykus
Día 180:  Founder B abandona el proyecto
          → Founder B recibe 0 RBTC (no llegó al cliff)
          → Founder A recibe el depósito de B + yield acumulado de B
          → Founder A sigue vestando normalmente su propio capital
```

**Flujo 3 — Socio se va después del cliff**
```
Día 0:    Ambos depositan RBTC → va a Tropykus
Día 365:  Cliff completado
Día 900:  Founder B abandona
          → Founder B retira: (900/1460) × depositoB + yield proporcional
          → El resto del depósito de B + su yield va a Founder A
          → Founder A sigue vestando normalmente
```

**Flujo 4 — Mutuo acuerdo de disolución**
```
Ambos firman dissolve() con multi-sig 2-of-2
→ Cada uno retira su porción vested + yield proporcional
→ El unvested restante se distribuye en base a porcentaje vested de cada uno
```

### 3.3 Mecánica del yield (Tropykus)

El RBTC unvested no duerme — trabaja. Al crear el pacto:

```
depositTotal = depositA + depositB
→ VestingPact.sol llama a Tropykus.supply(depositTotal)
→ Tropykus retorna kTokens (como cTokens en Compound)
→ Los kTokens se guardan en el contrato

Al hacer claim o exit:
→ VestingPact calcula la proporción de kTokens correspondiente
→ Llama a Tropykus.redeem(kTokens)
→ Retorna RBTC original + yield generado
```

**Por qué esto es el diferenciador clave:** el socio que cumple su vesting termina recibiendo *más* RBTC del que depositó. El costo de cumplir es negativo — te conviene quedarte.

---

## 4. Track y Premios

### 4.1 Track principal — Rootstock
- **Premio máximo:** $1,000 USD (1° lugar)
- **Bono participación:** $100 USD (primeros 7 en presentar)
- **Criterio clave:** "Uso real de smart contracts en RSK + capacidades únicas vs otras EVM"

### 4.2 Track secundario — Beexo Connect (doble track simultáneo)
- **Bono participación:** $50 USD (primeros 8 en integrar xo-connect)
- **Premio UX:** $100 USD (mejor experiencia de usuario)
- **Requisito:** integrar `xo-connect` SDK como provider EIP-1193

### 4.3 Total máximo acumulable
| Concepto | Monto |
|---|---|
| Rootstock 1° lugar | $1,000 |
| Rootstock bono participación | $100 |
| Beexo bono participación | $50 |
| Beexo premio UX | $100 |
| **Total** | **$1,250 USD** |

---

## 5. Integraciones del Ecosistema RSK

### 5.1 RBTC (nativo)
El colateral del pacto es RBTC — Bitcoin en Rootstock. Es el activo central del contrato. No hay integración adicional que hacer, es el token de gas y el store of value que respalda el compromiso.

### 5.2 Tropykus SDK ⭐ (especialmente valorado por el jurado)
SDK para integrar ahorro y préstamos en Bitcoin sobre RSK. El RBTC unvested se deposita automáticamente para generar yield. Activos soportados: rBTC, DOC, DLLR, RIF, rUSDT.

```
Docs: lendaraprotocol.gitbook.io/lendara
```

### 5.3 Money on Chain — DOC
Stablecoin colateralizada en Bitcoin sobre RSK. El protocolo acepta DOC como token para pagar el fee de creación del pacto. Relevante porque el jurado Manuel Ferrari es co-fundador de MoneyOnChain.

```
Contratos MoC: moneyonchain.com
```

### 5.4 Sovryn — FastBTC (onramp)
Widget que permite convertir BTC → RBTC en minutos. Se integra en el frontend como botón de onramp para usuarios que tienen BTC pero no RBTC. No requiere código en el contrato — es una integración de frontend.

```
FastBTC: app.sovryn.app/fastbtc
```

### 5.5 RIF Token (fee alternativo)
El contrato acepta RIF como alternativa a DOC para pagar fees. Integración ligera que suma presencia en el ecosistema RSK sin complejidad adicional.

### 5.6 Beexo xo-connect (doble track)
SDK EIP-1193 estándar. Cambiar el provider de MetaMask a Beexo es una modificación de 3 líneas en el frontend. Habilita acceso a millones de usuarios de Beexo Wallet y abre el segundo track de premios.

```
npm install xo-connect
```

---

## 6. Arquitectura Técnica

### 6.1 Stack

| Capa | Tecnología |
|---|---|
| Smart contract | Solidity 0.8.x |
| Framework | Hardhat |
| Testing | Hardhat + ethers.js |
| Frontend | React + Ethers.js v5.7.2 |
| Wallet principal | xo-connect (Beexo) |
| Wallet fallback | MetaMask |
| RPC testnet | https://public-node.testnet.rsk.co |
| RPC mainnet | https://public-node.rsk.co |
| Faucet | faucet.rootstock.io |
| Explorer | explorer.testnet.rsk.co |
| Yield | Tropykus SDK |
| Stablecoin fee | DOC (Money on Chain) |

### 6.2 Contrato principal — VestingPact.sol

```
VestingPact.sol
│
├── State
│   ├── founderA: address
│   ├── founderB: address
│   ├── depositA: uint256 (RBTC en wei)
│   ├── depositB: uint256
│   ├── cliffEnd: uint256 (timestamp)
│   ├── vestingEnd: uint256 (timestamp)
│   ├── kTokensA: uint256 (Tropykus receipt tokens)
│   ├── kTokensB: uint256
│   ├── claimedA: uint256 (ya retirado)
│   ├── claimedB: uint256
│   └── status: enum { Active, Dissolved }
│
├── Functions
│   ├── createPact() payable
│   │   └── Recibe RBTC de ambos socios → deposita en Tropykus
│   ├── claim()
│   │   └── Retira la porción vested del caller + yield proporcional
│   ├── exitEarly()
│   │   └── Socio sale antes del vestingEnd → recibe solo lo vested
│   │       El resto va al otro socio
│   ├── dissolve()
│   │   └── Multi-sig 2-of-2 → disuelven el pacto por mutuo acuerdo
│   ├── getVestedAmount(address) view
│   │   └── Calcula cuánto puede retirar un socio hoy
│   ├── getYield(address) view
│   │   └── Calcula el yield acumulado de un socio
│   └── getPactStatus() view
│       └── Retorna estado completo del pacto
│
└── Events
    ├── PactCreated(address founderA, address founderB, uint cliff, uint duration)
    ├── Claimed(address founder, uint amount, uint yield)
    ├── EarlyExit(address departing, address remaining, uint forfeitedAmount)
    └── Dissolved(address founderA, address founderB)
```

### 6.3 Fórmula de vesting

```solidity
function getVestedAmount(address founder) public view returns (uint256) {
    uint256 deposit = (founder == founderA) ? depositA : depositB;

    if (block.timestamp < cliffEnd) return 0;
    if (block.timestamp >= vestingEnd) return deposit;

    uint256 elapsed = block.timestamp - cliffEnd;
    uint256 vestingPeriod = vestingEnd - cliffEnd;

    return (deposit * elapsed) / vestingPeriod;
}
```

### 6.4 Frontend — pantallas principales

```
/ Landing
  └── Explicación del problema + CTA "Crear Pacto"

/create
  ├── Paso 1: Configurar parámetros (cliff, duración, montos)
  ├── Paso 2: Invitar al co-fundador (link con dirección pre-cargada)
  ├── Paso 3: Ambos aprueban y firman → deploy del contrato
  └── Confirmación + link al dashboard

/dashboard/:contractAddress
  ├── Barra de progreso de vesting (tiempo transcurrido vs total)
  ├── RBTC vested / unvested de cada socio
  ├── Yield acumulado en tiempo real
  ├── Botón "Claim" (si hay algo para retirar)
  ├── Botón "Salida anticipada" (con advertencia de pérdida)
  └── Botón "Disolver pacto" (requiere aprobación del otro socio)

/onramp
  └── Widget FastBTC de Sovryn (BTC → RBTC)
```

---

## 7. Entregables del Hackathon

### 7.1 Obligatorios

| Entregable | Descripción |
|---|---|
| Smart contract deployado | `VestingPact.sol` en RSK testnet con al menos 2 tx on-chain |
| Repositorio público GitHub | README con descripción, instalación, arquitectura y testing |
| Demo funcional | App corriendo y accesible por link público |
| Video demo | Máximo 5 minutos mostrando el flujo completo |
| Pitch deck PDF | Problema, solución, arquitectura, roadmap |
| Evidencia validación | Encuestas a fundadores de LATAM (mínimo 5) |

### 7.2 Adicionales (para Beexo)

| Entregable | Descripción |
|---|---|
| Integración xo-connect | Provider Beexo funcional y demostrable en la demo |
| Flujo UX documentado | Pantallas del onboarding desde cero hasta crear un pacto |

### 7.3 Checklist de submisión DoraHacks

- [ ] Crear BUIDL en el perfil de DoraHacks
- [ ] Entrar a la página del hackathon → "Submit BUIDL" → elegir Track Rootstock
- [ ] Subir también al track Beexo Connect simultáneamente
- [ ] **Subir con al menos 30–40 minutos de anticipación al viernes 17:00 hs**
- [ ] Para el bono de participación: ser de los primeros 7 en Rootstock y primeros 8 en Beexo

---

## 8. Criterios de Evaluación — Mapeados

### Rootstock

| Criterio | Cómo VestingPact lo responde |
|---|---|
| Uso real de smart contracts en RSK | Contrato deployado + Tropykus yield — imposible replicar igual en Ethereum |
| Impacto en DeFi / Bitcoin | Bitcoin como garantía de compromisos humanos — amplía sus capacidades financieras |
| Calidad del código | Contrato determinístico, sin oráculos, auditablemente simple, con tests |
| Viabilidad | TAM: todas las startups de LATAM; modelo sostenible con fee sobre yield |
| Demo y presentación | Flujo demostrable en vivo en 3 minutos — crear pacto, simular tiempo, claim |

### Beexo Connect

| Criterio | Cómo VestingPact lo responde |
|---|---|
| Integración real del SDK | xo-connect como provider principal, demostrable en la demo |
| Experiencia de usuario | Onboarding en 3 pasos, sin fricción, en español |
| Relevancia para LATAM | El problema del pacto de socios es específicamente grave en LATAM |
| Creatividad del caso de uso | Primer uso de Beexo como wallet para compromisos financieros entre socios |
| Demo y presentación | Flujo UX documentado y demostrable |

---

## 9. Jurado — Perfil y Resonancia

### Rootstock (preselección y final)

**Juani Podesta** — CBO LatamXO / CGO Beexo Wallet
Ecosistema startup de LATAM. Conoce el problema del pacto de socios de primera mano. La narrativa "sin abogados, en Bitcoin" va a resonar directamente.

**Manuel Ferrari** — Co-fundador MoneyOnChain
Builder técnico del ecosistema RSK desde el principio. La integración de DOC como fee token es un guiño directo hacia él. Evaluará la calidad del contrato con ojo crítico.

**Santiago Iwakawa** — CTO Beexo Wallet
CTO de una wallet multichain. Evaluará la integración de xo-connect y la calidad del frontend. El flujo UX va a ser importante para él.

---

## 10. Roadmap Post-Hackathon

| Fase | Descripción |
|---|---|
| v1 (hackathon) | Pacto 2 socios, RBTC, cliff + vesting lineal, Tropykus yield |
| v2 | Pactos de hasta 5 socios, porcentajes no iguales, vesting por hitos |
| v3 | NFT del pacto como prueba de compromiso, integración con sistemas de identidad on-chain |
| v4 | Pactos para DAOs, vesting de tokens propios sobre RSK |

---

## 11. Recursos

| Recurso | URL |
|---|---|
| Rootstock Docs | dev.rootstock.io |
| Tropykus | lendaraprotocol.gitbook.io/lendara |
| Money on Chain | moneyonchain.com |
| Sovryn FastBTC | app.sovryn.app/fastbtc |
| Beexo xo-connect | npmjs.com/package/xo-connect |
| RPC Testnet | https://public-node.testnet.rsk.co |
| Faucet RBTC | faucet.rootstock.io |
| Explorer Testnet | explorer.testnet.rsk.co |
| DoraHacks | dorahacks.io |

---

*VestingPact · VendimiaTech Hackathon 2026 · Track Rootstock + Beexo Connect*
