# FIX A — Smart Contract Fixes

> **Sesión independiente. Corregir los bugs encontrados en la auditoría.**
> Después de cada fix, correr `npx hardhat test` y verificar que todos pasen.

---

## Contexto
El contrato VestingPact.sol tiene 3 bugs identificados en auditoría. Los tests actuales pasan pero no cubren los edge cases de los bugs. Hay que arreglar el contrato Y actualizar/agregar tests.

Archivos a modificar:
- `contracts/VestingPact.sol`
- `test/VestingPact.test.js`

---

## Bug 1 — CRÍTICO: `exitEarly()` no deja al remaining seguir vesteando

### Problema
Líneas 169 y 192-206: cuando un founder sale, el contrato:
1. Setea `isActive = false` (L169) — bloquea futuros `claim()`
2. Redime TODOS los kTokens del remaining y le transfiere todo su RBTC inmediatamente (L192-206)

Según la spec (VestingPact_Proyecto.md flujos 2 y 3), el remaining founder debería poder seguir vesteando normalmente su propio capital.

### Fix
Rediseñar `exitEarly()`:
- Solo redimir y transferir los kTokens del EXITER (su porción vested)
- Los kTokens unvested del exiter se transfieren al remaining como bonus
- **NO** redimir los kTokens del remaining — él sigue vesteando
- **NO** setear `isActive = false` — el pacto sigue activo para el remaining
- Agregar tracking de qué founders han salido (ej: `bool public exitedA; bool public exitedB;`)
- `claim()` debe funcionar para el remaining después del exit del otro
- Si ambos founders salen, ahí sí `isActive = false`

### Lógica nueva de exitEarly():
```solidity
function exitEarly() external onlyFounders {
    require(isActive, "Pact not active");

    bool isA = (msg.sender == founderA);
    require(isA ? !exitedA : !exitedB, "Already exited");

    uint256 exiterDeposit = isA ? depositA : depositB;
    uint256 exiterClaimed = isA ? claimedA : claimedB;
    uint256 exiterKTokens = isA ? kTokensA : kTokensB;

    uint256 exiterVested = getVestedAmount(msg.sender);
    uint256 exiterClaimable = exiterVested - exiterClaimed;

    // kTokens para la porción vested no reclamada del exiter
    uint256 kTokensForExiter = 0;
    uint256 remainingDeposit = exiterDeposit - exiterClaimed;
    if (exiterClaimable > 0 && remainingDeposit > 0) {
        kTokensForExiter = (exiterKTokens * exiterClaimable) / remainingDeposit;
    }

    // kTokens forfeited (unvested) → van al otro founder
    uint256 kTokensForfeited = exiterKTokens - kTokensForExiter;
    uint256 forfeitedAmount = exiterDeposit - exiterVested;

    // Actualizar estado
    if (isA) {
        exitedA = true;
        claimedA = exiterVested;
        kTokensA = 0;
        kTokensB += kTokensForfeited;  // bonus para remaining
    } else {
        exitedB = true;
        claimedB = exiterVested;
        kTokensB = 0;
        kTokensA += kTokensForfeited;
    }

    // Si ambos salieron, desactivar
    if (exitedA && exitedB) {
        isActive = false;
    }

    // Redimir solo la porción del exiter
    if (kTokensForExiter > 0) {
        uint256 balBefore = address(this).balance;
        kRBTC.redeem(kTokensForExiter);
        uint256 redeemed = address(this).balance - balBefore;

        (bool success, ) = payable(msg.sender).call{value: redeemed}("");
        require(success, "Transfer failed");
    }

    emit EarlyExit(msg.sender, isA ? founderB : founderA, forfeitedAmount);
}
```

### State variables nuevas a agregar:
```solidity
bool public exitedA;
bool public exitedB;
```

### Actualizar `claim()`:
- Agregar check: `require(isA ? !exitedA : !exitedB, "Already exited");`

### Actualizar `getVestedAmount()`:
- Si el founder ya salió, retornar su deposit completo (ya se fue, su vested está fijo)

---

## Bug 2 — MEDIO: `dissolve()` distribuye por depósito, no por vested

### Problema
Líneas 234-237: distribución usa `(totalRedeemed * depositA) / totalDeposit`. Esto ignora cuánto tiene cada founder vested vs unvested. Si uno lleva más tiempo, debería recibir más.

### Fix
Distribuir proporcionalmente al vested amount de cada founder:

```solidity
if (dissolveApprovedA && dissolveApprovedB) {
    isActive = false;

    uint256 totalKTokens = kTokensA + kTokensB;
    uint256 balBefore = address(this).balance;
    if (totalKTokens > 0) {
        kRBTC.redeem(totalKTokens);
    }
    uint256 totalRedeemed = address(this).balance - balBefore;

    // Distribuir por porción vested de cada uno
    uint256 vestedA = getVestedAmount(founderA) - claimedA;
    uint256 vestedB = getVestedAmount(founderB) - claimedB;
    uint256 totalVested = vestedA + vestedB;

    uint256 shareA;
    uint256 shareB;

    if (totalVested > 0) {
        shareA = (totalRedeemed * vestedA) / totalVested;
        shareB = totalRedeemed - shareA;
    } else {
        // Edge case: ambos en 0 (antes del cliff) → devolver proporcional al depósito
        shareA = (totalRedeemed * depositA) / (depositA + depositB);
        shareB = totalRedeemed - shareA;
    }

    kTokensA = 0;
    kTokensB = 0;

    // ... transfers ...
}
```

---

## Bug 3 — MENOR: Falta `startTime` en ABI del frontend

### Fix en contrato
`startTime` ya es `public` → el getter se genera automáticamente. No hay nada que cambiar en el contrato.

---

## Tests nuevos a agregar

### Test: exitEarly NO cierra el pacto para el remaining
```javascript
it("remaining founder can still claim after other exits", async function () {
    await activePactFixture();
    const pastCliff = cliffDuration + (vestingDuration - cliffDuration) / 2;
    await increaseTime(pastCliff);

    // A exits
    await vestingPact.connect(founderA).exitEarly();

    // Pact should still be active
    expect(await vestingPact.isActive()).to.equal(true);

    // B should be able to claim
    await increaseTime((vestingDuration - cliffDuration) / 4);
    await vestingPact.connect(founderB).claim();
    // Should not revert
});
```

### Test: exitEarly before cliff, remaining claims after cliff
```javascript
it("after pre-cliff exit, remaining gets bonus and keeps vesting", async function () {
    await activePactFixture();

    // A exits before cliff → gets 0
    await vestingPact.connect(founderA).exitEarly();
    expect(await vestingPact.isActive()).to.equal(true);

    // Move past cliff
    await increaseTime(cliffDuration + (vestingDuration - cliffDuration) / 2);

    // B claims (should include bonus kTokens from A's forfeited portion)
    const balBefore = await ethers.provider.getBalance(founderB.address);
    const tx = await vestingPact.connect(founderB).claim();
    const receipt = await tx.wait();
    const gas = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(founderB.address);

    expect(balAfter + gas).to.be.gt(balBefore);
});
```

### Test: dissolve distributes by vested
```javascript
it("dissolve distributes proportionally to vested amounts", async function () {
    // ... setup where A has more vested than B ...
});
```

### Test: double exit deactivates pact
```javascript
it("pact deactivates when both founders exit", async function () {
    await activePactFixture();
    await increaseTime(cliffDuration + 1000);

    await vestingPact.connect(founderA).exitEarly();
    expect(await vestingPact.isActive()).to.equal(true);

    await vestingPact.connect(founderB).exitEarly();
    expect(await vestingPact.isActive()).to.equal(false);
});
```

---

## Criterio de Éxito
- `npx hardhat compile` → 0 errors
- `npx hardhat test` → todos pasan (originales + nuevos)
- exitEarly() deja al remaining seguir vesteando
- dissolve() distribuye por vested amount
- exitedA / exitedB trackeados correctamente
