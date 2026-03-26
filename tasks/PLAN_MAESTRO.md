# Plan Maestro — VestingPact Hackathon

## Estado Actual
- Plan A (Contract) ✅ completado — 15/15 tests pasan, pero tiene bugs
- Plan B (Frontend) ✅ completado — build OK, pero tiene bugs
- Auditoría ✅ completada — 5 bugs encontrados (2 críticos contrato, 2 críticos frontend, 1 medio)

## Fase Actual: UI/UX Overhaul + Deploy

```
FIX_A_CONTRACT.md ✅ COMPLETADO      FIX_B_FRONTEND.md ✅ COMPLETADO
22/22 tests pasan                     Build OK, bytecode sincronizado

FIX_C_UI_UX.md (AHORA)              PLAN_C_DEPLOY.md (AHORA)
├── Meta tags + <title>              ├── Deploy RSK testnet
├── Space Grotesk headlines          ├── 2+ tx on-chain
├── SVG icons (matar emojis)         ├── README.md final
├── Flow diagram (matar 3+3 cards)   └── Subir a DoraHacks
├── Matar translateY hover
└── Quitar comentarios decorativos
```

## Ejecución

| Orden | Sesión | Puede arrancar | Depende de |
|---|---|---|---|
| ✅ | FIX_A (Contract) | Completado | — |
| ✅ | FIX_B (Frontend) | Completado | — |
| 1 | FIX_C (UI/UX) | **Ahora** | Nada |
| 1 | PLAN_C (Deploy) | **Ahora** | Nada |

**FIX_C y PLAN_C son 100% paralelos.**
FIX_C toca solo visual (HTML/CSS/JSX presentacional). PLAN_C toca deploy/README/entregables.

## Datos Compartidos

### RSK Testnet
- Chain ID: 31 (0x1f) | RPC: https://public-node.testnet.rsk.co
- Gas: 60000000 wei | EVM: london | Solidity: 0.8.20

### Tropykus Testnet
- Comptroller: `0xb1BEc5376929b4E0235F1353819DBa92c4B0C6bb`
- kRBTC: `0x5b35072cd6110606c8421e013304110fa04a32a3`

### GitHub
- Repo: https://github.com/VilmaAP/VestingPact-Rootstock.git

## Deadline
**Viernes 27 marzo 2026, 16:20 hs** (40 min antes del cierre de 17:00)
