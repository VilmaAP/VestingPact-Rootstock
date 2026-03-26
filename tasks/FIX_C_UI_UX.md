# FIX C — UI/UX De-Slop Overhaul (37/100 → ~9/100)

> **Sesión independiente. No toca lógica de contratos.**
> Verificar con `npm run dev` en `frontend/` después de cada sección.
> Al terminar: `npm run build` sin errors + zero console warnings.

---

## Contexto
Auditoría de UX dio 37/100. El proyecto tiene alma en el copy y funcionalidad pero el visual es template Web3 genérico. Este plan ataca las 7 categorías para bajar el slop score a ~9.

**Principio rector:** El slop es siempre la opción más probable. El alma es la opción que solo VestingPact haría.

---

# BLOQUE 1 — META-SEÑALES (65 → ~10)
> Lo más rápido y de mayor impacto inmediato.

## 1.1 — `index.html` completo

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VestingPact — Pacto de Socios en Bitcoin</title>
    <meta name="description" content="Protocolo de vesting entre co-fundadores sobre Rootstock. Depositá RBTC, generá yield en Tropykus, y protegé tu startup. Sin abogados." />

    <meta property="og:title" content="VestingPact — Pacto de Socios en Bitcoin" />
    <meta property="og:description" content="El 50% de las startups muere por conflictos entre socios. Nosotros pusimos el pacto dentro del contrato. En Bitcoin." />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />

    <!-- Favicon: ₿ -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>₿</text></svg>" />

    <!-- Fonts: Space Grotesk (headlines) + Inter (body) + JetBrains Mono (numbers/addresses) -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## 1.2 — Easter egg en main.jsx

Agregar al final de `main.jsx`:
```javascript
console.log(
  "%c₿ VestingPact",
  "color: #f7931a; font-size: 20px; font-weight: bold;"
);
console.log(
  "%cSi estás leyendo esto, sos el tipo de socio que queremos.",
  "color: #94a3b8; font-size: 12px;"
);
```

---

# BLOQUE 2 — PALETA VISUAL (35 → ~10)

## 2.1 — CSS Variables: tipografía triple + radii variados + textura

En `index.css`, reemplazar el bloque `:root` completo:

```css
:root {
  --bg-primary: #0a0e17;
  --bg-secondary: #111827;
  --bg-card: #1a2332;
  --bg-card-hover: #1f2b3d;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --accent: #f7931a;
  --accent-hover: #e8850f;
  --accent-glow: rgba(247, 147, 26, 0.2);
  --success: #22c55e;
  --warning: #eab308;
  --danger: #ef4444;
  --border: #1e293b;
  --border-accent: rgba(247, 147, 26, 0.3);

  /* Tipografía triple — opinión tipográfica */
  --font: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display: "Space Grotesk", var(--font);
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  /* Radii variados — no todo igual */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius: 8px;
  --radius-lg: 16px;
  --radius-pill: 100px;
}
```

## 2.2 — Textura de fondo: noise grain sutil + radial gradient

Agregar después del `body` rule:

```css
body {
  font-family: var(--font);
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  /* Radial gradient sutil desde el centro — no plano */
  background-image: radial-gradient(ellipse at 50% 0%, rgba(247, 147, 26, 0.03) 0%, transparent 60%);
  background-attachment: fixed;
}

/* Noise grain overlay */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  opacity: 0.015;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

#root {
  position: relative;
  z-index: 1;
}
```

## 2.3 — Aplicar tipografía display y mono

```css
/* Display font en headlines */
.hero-title,
.section-title,
.create-pact h1,
.dashboard h1,
.navbar-brand .logo-text,
.flow-label,
.outcome-label {
  font-family: var(--font-display);
}

/* Mono font en números, addresses, valores */
.wallet-address,
.review-value,
.pact-card-address,
.stat-value,
.share-link code,
.progress-percent {
  font-family: var(--font-mono);
}
```

## 2.4 — Variación de border-radius

Buscar y reemplazar usos de radii:
- `.btn` → `border-radius: var(--radius-sm);` (ya estaba, ahora es 6px)
- `.btn-lg` → `border-radius: var(--radius-lg);` (16px, generoso)
- `.status-badge` → `border-radius: var(--radius-pill);` (pill)
- `.wallet-badge` → `border-radius: var(--radius-xs);` (4px, tight)
- `.form-group input` → `border-radius: var(--radius-sm);` (6px)
- `.step`, `.pact-card`, `.vesting-progress`, `.review-card`, `.dissolve-status` → `border-radius: var(--radius);` (8px)

---

# BLOQUE 3 — LAYOUT: DESTRUIR EL HERO GENÉRICO (55 → ~15)

## 3.1 — Hero split: texto izquierda + diagrama de flujo derecha

Reescribir `Landing.jsx` completo:

```jsx
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landing">
      {/* Hero split */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              El 50% de las startups muere por conflictos entre socios.
            </h1>
            <p className="hero-subtitle">
              Nosotros pusimos el pacto dentro del contrato.{" "}
              <span className="text-accent">En Bitcoin. Sin abogados.</span>
            </p>
            <div className="hero-actions">
              <Link to="/create" className="btn btn-primary btn-lg">
                Crear Pacto
              </Link>
              <a
                href="https://explorer.testnet.rootstock.io"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-lg"
              >
                Ver en Explorer
              </a>
            </div>
          </div>

          <div className="hero-diagram">
            <div className="diagram-flow">
              <div className="diagram-node">
                <span className="diagram-icon">A</span>
                <span className="diagram-label">Founder A</span>
              </div>
              <div className="diagram-connector" />
              <div className="diagram-node diagram-node-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                <span className="diagram-label">VestingPact</span>
              </div>
              <div className="diagram-connector" />
              <div className="diagram-node">
                <span className="diagram-icon">B</span>
                <span className="diagram-label">Founder B</span>
              </div>
            </div>
            <div className="diagram-yield">
              <div className="diagram-yield-line" />
              <span className="diagram-yield-label">yield en Tropykus</span>
            </div>
          </div>
        </div>
      </section>

      {/* Provocación — whitespace intencional */}
      <section className="provocation">
        <p className="provocation-text">
          Tu socio no puede huir con la plata.
          <br />
          <span className="text-muted">El contrato no negocia, no miente, no se olvida.</span>
        </p>
      </section>

      {/* Cómo funciona — timeline vertical, NO 3 cards iguales */}
      <section className="how-it-works">
        <h2 className="section-title">Cómo funciona</h2>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-marker">1</div>
            <div className="timeline-content">
              <h3>Depositar</h3>
              <p>Cada co-fundador deposita RBTC como compromiso. El contrato deposita todo en Tropykus y empieza a generar yield desde el minuto cero.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-marker">2</div>
            <div className="timeline-content">
              <h3>Vestear</h3>
              <p>Los fondos se liberan gradualmente después del cliff. Sin atajos, sin trampas. El que se queda, gana.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-marker">3</div>
            <div className="timeline-content">
              <h3>Reclamar</h3>
              <p>Reclamá tu RBTC vesteado + yield acumulado cuando quieras. Si el otro se va temprano, te llevás su parte también.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Flujo de fondos — visual, reemplaza "¿Por qué Bitcoin?" 3-cards */}
      <section className="fund-flow">
        <h2 className="section-title">Flujo de Fondos</h2>
        <div className="flow-outcomes">
          <div className="outcome outcome-good">
            <span className="outcome-emoji">→</span>
            <span className="outcome-label">Ambos cumplen</span>
            <span className="outcome-result">Cada uno recupera su RBTC + yield generado en Tropykus. El costo de cumplir es negativo.</span>
          </div>
          <div className="outcome outcome-bad">
            <span className="outcome-emoji">✕</span>
            <span className="outcome-label">Uno se va antes</span>
            <span className="outcome-result">Pierde su parte unvested. El que se queda recibe ese capital + yield. Los abogados odian esto.</span>
          </div>
        </div>
      </section>

      {/* Snippet técnico — credibilidad, rompe patrón visual */}
      <section className="tech-proof">
        <div className="code-block">
          <div className="code-header">
            <span className="code-dot" />
            <span className="code-dot" />
            <span className="code-dot" />
            <span className="code-filename">VestingPact.sol</span>
          </div>
          <pre className="code-content"><code>{`function getVestedAmount(address founder)
  public view returns (uint256)
{
  if (block.timestamp < cliffEnd) return 0;
  if (block.timestamp >= vestingEnd) return deposit;

  return (deposit * (block.timestamp - cliffEnd))
       / (vestingEnd - cliffEnd);
}`}</code></pre>
        </div>
        <p className="tech-caption">
          Vesting lineal. Determinístico. Sin oráculos, sin confianza.
          <br />
          <a href="https://github.com/VilmaAP/VestingPact-Rootstock" target="_blank" rel="noopener noreferrer">
            Ver código completo →
          </a>
        </p>
      </section>

      <footer className="landing-footer">
        <div className="footer-links">
          <a href="https://explorer.testnet.rootstock.io" target="_blank" rel="noopener noreferrer">Explorer</a>
          <a href="https://app.sovryn.app/fastbtc" target="_blank" rel="noopener noreferrer">Obtener RBTC</a>
          <a href="https://rootstock.io" target="_blank" rel="noopener noreferrer">Rootstock</a>
          <a href="https://github.com/VilmaAP/VestingPact-Rootstock" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
        <p className="footer-copy">VestingPact · VendimiaTech Hackathon 2026</p>
      </footer>
    </div>
  );
}
```

## 3.2 — CSS para el nuevo landing

Reemplazar TODA la sección `/* === Landing Page === */` en `index.css` con:

```css
/* === Landing Page === */
.hero {
  padding: 4rem 1rem 2rem;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

.hero-title {
  font-family: var(--font-display);
  font-size: 2.4rem;
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.hero-subtitle {
  font-size: 1.15rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.text-accent {
  color: var(--accent);
  font-weight: 600;
}

.text-muted {
  color: var(--text-muted);
}

.hero-actions {
  display: flex;
  gap: 1rem;
}

/* Hero diagram */
.hero-diagram {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2rem;
  position: relative;
}

.diagram-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.diagram-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.diagram-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
}

.diagram-node-center .diagram-icon {
  background: none;
  border: none;
}

.diagram-node-center {
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  padding: 1rem;
  box-shadow: 0 0 30px var(--accent-glow);
}

.diagram-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.diagram-connector {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--border), var(--accent), var(--border));
  min-width: 20px;
}

.diagram-yield {
  text-align: center;
  margin-top: 1.5rem;
  position: relative;
}

.diagram-yield-line {
  width: 60%;
  height: 1px;
  background: var(--success);
  margin: 0 auto 0.5rem;
  opacity: 0.4;
}

.diagram-yield-label {
  font-size: 0.75rem;
  color: var(--success);
  font-family: var(--font-mono);
  opacity: 0.7;
}

/* Provocación — whitespace intencional */
.provocation {
  padding: 5rem 1rem;
  text-align: center;
}

.provocation-text {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 500;
  line-height: 1.5;
  max-width: 500px;
  margin: 0 auto;
  color: var(--text-primary);
}

/* Timeline — no 3-card grid */
.how-it-works {
  padding: 3rem 0;
}

.timeline {
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.timeline::before {
  content: "";
  position: absolute;
  left: 19px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--border);
}

.timeline-item {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem 0;
  position: relative;
}

.timeline-marker {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--accent);
  z-index: 1;
}

.timeline-content h3 {
  font-family: var(--font-display);
  font-size: 1.1rem;
  margin-bottom: 0.35rem;
}

.timeline-content p {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

/* Fund flow outcomes */
.fund-flow {
  padding: 3rem 0;
}

.flow-outcomes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  max-width: 640px;
  margin: 0 auto;
}

.outcome {
  padding: 1.5rem;
  border-radius: var(--radius);
  text-align: left;
}

.outcome-good {
  background: rgba(34, 197, 94, 0.06);
  border: 1px solid rgba(34, 197, 94, 0.15);
}

.outcome-bad {
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.outcome-emoji {
  display: block;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.outcome-good .outcome-emoji { color: var(--success); }
.outcome-bad .outcome-emoji { color: var(--danger); }

.outcome-label {
  display: block;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.outcome-good .outcome-label { color: var(--success); }
.outcome-bad .outcome-label { color: var(--danger); }

.outcome-result {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* Tech proof — Solidity snippet */
.tech-proof {
  padding: 3rem 0;
  max-width: 520px;
  margin: 0 auto;
}

.code-block {
  background: #0d1117;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.code-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.75rem 1rem;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--border);
}

.code-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--border);
}

.code-dot:first-child { background: #ff5f57; }
.code-dot:nth-child(2) { background: #febc2e; }
.code-dot:nth-child(3) { background: #28c840; }

.code-filename {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.code-content {
  padding: 1.25rem;
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.7;
  color: var(--text-secondary);
  overflow-x: auto;
}

.tech-caption {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.6;
}
```

Eliminar las secciones CSS viejas: `.steps`, `.step`, `.step:hover`, `.step-number`, `.step-icon`, `.step h3`, `.step p`, `.why-bitcoin`, `.features`, `.feature`, `.feature:hover`, `.feature h3`, `.feature p`.

---

# BLOQUE 4 — COPY REFINAMIENTO (25 → ~5)

## 4.1 — Microcopy con personalidad

En `CreatePact.jsx`:
- Loading: `"Creando pacto..."` → `"Deployando en Rootstock... ~15 segundos"`
- Demo mode button: agregar tooltip `title="Tiempos cortos para probar rápido"`

En `Dashboard.jsx`:
- Loading: `"Cargando pacto..."` → `"Leyendo el contrato..."`
- Error: agregar personalidad → `"No se pudo cargar el pacto. ¿Existe esa dirección? ¿Estás en RSK Testnet?"`
- handleExitEarly confirm: `"⚠️ Salida anticipada..."` → `"Salida anticipada: vas a perder tu parte unvested y se la lleva el otro fundador. ¿Estás seguro?"`
- Toast-style: cambiar el `setTxStatus` de `"¡Transacción confirmada!"` → `"Confirmado en Rootstock ✓"`

## 4.2 — Clipboard feedback

En `CreatePact.jsx`, el botón copiar debería dar feedback:
```jsx
const [copied, setCopied] = useState(false);

<button
  className="btn btn-sm btn-secondary"
  onClick={() => {
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/${contractAddress}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }}
>
  {copied ? "¡Copiado!" : "Copiar"}
</button>
```

---

# BLOQUE 5 — UX FUNCIONAL (30 → ~8)

## 5.1 — Validación de inputs real en CreatePact

Agregar validación inline antes del botón Siguiente:
```jsx
const isValidAddress = founderB.length === 42 && founderB.startsWith("0x");
const isValidCliff = parseFloat(cliffDays) > 0;
const isValidVesting = parseFloat(vestingDays) > parseFloat(cliffDays);
const isValidAmount = parseFloat(amount) > 0;

// Mostrar errores inline:
{founderB && !isValidAddress && (
  <span className="field-error">Dirección inválida (debe ser 0x... y 42 caracteres)</span>
)}
{vestingDays && cliffDays && !isValidVesting && (
  <span className="field-error">El vesting debe ser mayor al cliff</span>
)}
```

CSS:
```css
.field-error {
  display: block;
  color: var(--danger);
  font-size: 0.8rem;
  margin-top: 0.35rem;
}
```

## 5.2 — Feedback táctil en mobile

```css
.btn:active {
  transform: scale(0.97);
}

button, a, input, select {
  touch-action: manipulation;
}
```

## 5.3 — Skeleton loader en Dashboard (reemplaza spinner genérico)

Reemplazar el loading state del Dashboard:
```jsx
if (loading) {
  return (
    <div className="dashboard">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-badge" />
      <div className="skeleton skeleton-progress" />
      <div className="pact-cards">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    </div>
  );
}
```

CSS:
```css
.skeleton {
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

.skeleton-title { height: 32px; width: 60%; margin-bottom: 1rem; }
.skeleton-badge { height: 28px; width: 80px; margin-bottom: 1.5rem; border-radius: var(--radius-pill); }
.skeleton-progress { height: 120px; margin-bottom: 1.5rem; }
.skeleton-card { height: 160px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## 5.4 — Empty state con personalidad (Dashboard sin pacto)

Agregar después del `if (!pact) return null;`:
```jsx
if (!pact) {
  return (
    <div className="dashboard">
      <div className="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>
        <h2>No hay pacto en esta dirección</h2>
        <p>Verificá la URL o creá uno nuevo.</p>
        <Link to="/create" className="btn btn-primary">Crear Pacto</Link>
      </div>
    </div>
  );
}
```

Agregar `import { Link } from "react-router-dom";` al top del Dashboard si no está.

CSS:
```css
.empty-state {
  text-align: center;
  padding: 4rem 1rem;
}

.empty-state h2 {
  font-family: var(--font-display);
  margin: 1rem 0 0.5rem;
}

.empty-state p {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}
```

---

# BLOQUE 6 — CÓDIGO (30 → ~8)

## 6.0 — CSS Modules: partir el monolito de 870 líneas

Un archivo de 870 líneas grita "generado de un tirón". Partir en módulos:

```
frontend/src/styles/
  index.css              → variables globales, reset, utilities (queda chico)
  Landing.module.css     → hero split, timeline, flow, provocation, tech-proof
  CreatePact.module.css  → wizard steps, form, review, success
  Dashboard.module.css   → pact cards, progress, actions, skeleton
  Navbar.module.css      → navbar, logo, wallet badge
```

Cada componente importa su módulo:
```jsx
import styles from '../styles/Landing.module.css';
// ...
<section className={styles.hero}>
```

> **Nota pragmática:** Si no hay tiempo, al menos separar en archivos CSS normales (no modules) e importarlos por componente. Lo clave es que no sea un monolito — señal de que fue escrito incrementalmente.

## 6.1 — Eliminar TODOS los comentarios decorativos del JSX

Buscar y eliminar en todos los .jsx:
```
{/* Hero */}
{/* Cómo funciona */}
{/* Por qué Bitcoin */}
{/* Footer */}
{/* Status Badge */}
{/* Vesting Progress */}
{/* Founder Cards */}
{/* Transaction Status */}
{/* Actions */}
{/* FastBTC link */}
{/* Dissolve Approval Status */}
```

Mantener SOLO los que explican lógica:
```
{/* Join — solo founderB cuando pacto no activo */}
{/* Claim — cualquier founder cuando activo */}
```

## 6.2 — Lazy loading de rutas

En `App.jsx`:
```jsx
import { Routes, Route, lazy, Suspense } from "react-router-dom";
import { useWallet } from "./hooks/useWallet";
import Navbar from "./components/Navbar";

const Landing = lazy(() => import("./pages/Landing"));
const CreatePact = lazy(() => import("./pages/CreatePact"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

export default function App() {
  const wallet = useWallet();

  return (
    <div className="app">
      <Navbar wallet={wallet} />
      <main className="main-content">
        <Suspense fallback={<div className="loading-container"><div className="spinner" /></div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/create" element={<CreatePact wallet={wallet} />} />
            <Route path="/dashboard/:contractAddress" element={<Dashboard wallet={wallet} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="empty-state">
      <h2>Este pacto no existe</h2>
      <p>¿Tu socio se fue? 😏</p>
      <a href="/" className="btn btn-primary">Volver al inicio</a>
    </div>
  );
}
```

## 6.3 — Error boundary

Crear `frontend/src/components/ErrorBoundary.jsx`:
```jsx
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state">
          <h2>Algo se rompió</h2>
          <p>Recargá la página. Si el problema persiste, abrí un issue en GitHub.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Recargar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Wrapar en `main.jsx`:
```jsx
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
```

---

# BLOQUE 7 — NAVBAR LOGO (matar emoji)

En `Navbar.jsx`:
```jsx
<Link to="/" className="navbar-brand">
  <svg className="logo-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
  <span className="logo-text">VestingPact</span>
</Link>
```

CSS:
```css
.logo-svg {
  transition: transform 0.3s;
}

.navbar-brand:hover .logo-svg {
  transform: rotate(12deg);
}
```

---

# BLOQUE 8 — RESPONSIVE UPDATES

```css
@media (max-width: 640px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .hero-title {
    font-size: 1.8rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .flow-outcomes {
    grid-template-columns: 1fr;
  }

  .diagram-flow {
    flex-direction: column;
    gap: 1rem;
  }

  .diagram-connector {
    width: 1px;
    height: 20px;
    min-width: 1px;
    background: linear-gradient(180deg, var(--border), var(--accent), var(--border));
  }

  .provocation-text {
    font-size: 1.3rem;
  }
}
```

---

# BLOQUE 9 — ITEMS ADICIONALES DE-SLOP

## 9.1 — Toast notifications (reemplaza alerts estáticos)

Crear `frontend/src/components/Toast.jsx`:
```jsx
import { useState, useEffect } from 'react';

export function Toast({ message, type = 'info', duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {message}
    </div>
  );
}
```

CSS:
```css
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  z-index: 1000;
  animation: toast-in 0.3s ease;
}

.toast-success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: var(--success);
}

.toast-error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--danger);
}

@keyframes toast-in {
  from { transform: translateY(1rem); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

Uso: reemplazar `alert()` o `setTxStatus` estáticos por toasts que aparecen y desaparecen.

## 9.2 — Progress bar con animación

```css
.progress-fill {
  transition: width 1s ease-out;
}
```

Cuando el dashboard carga, el progress bar anima desde 0 hasta el % real. No snap instantáneo.

## 9.3 — Números reales en el copy

Reemplazar promesas vagas por datos concretos del testnet:
```jsx
<p className="tech-caption">
  En nuestra prueba, un pacto de <span className="rbtc-amount">0.005 RBTC</span> con cliff de 5 minutos
  generó yield en Tropykus. Verificalo en el explorer.
</p>
```

## 9.4 — Zero console errors/warnings (cleanup)

- Envolver `console.log` de debug en `if (import.meta.env.DEV)`
- Arreglar warnings de React: keys faltantes, deprecated props
- Verificar que no haya errores de red en Network tab
- El único console.log de producción es el easter egg

## 9.5 — Git history con commits iterativos

**No un commit gigante.** Hacer commits por feature/fix:
```
feat: landing page layout
feat: create pact wizard flow
feat: dashboard with vesting progress
fix: chain validation for RSK testnet
style: mobile responsive
feat: tropykus yield integration
style: de-slop visual overhaul — fonts, grain, icons
fix: input validation inline
feat: skeleton loaders, empty states, 404
```

Esto muestra proceso, no prompt-and-paste. Los jueces van a mirar el git log.

---

## Criterio de Éxito
- `npm run build` → 0 errors
- Zero console warnings/errors en el browser
- `<title>` = "VestingPact — Pacto de Socios en Bitcoin"
- `lang="es"`, og tags, favicon ₿
- 3 fonts: Space Grotesk (headlines), Inter (body), JetBrains Mono (numbers)
- Noise grain en background, no plano
- Hero split con diagrama, no centrado genérico
- Timeline vertical, no 3 cards iguales
- Flow outcomes, no "¿Por qué Bitcoin?" 3 cards
- Snippet de Solidity real como credibilidad técnica
- Sección de provocación con whitespace intencional
- SVG icons, no emojis
- Logo SVG con hover animation, no emoji 🤝
- Skeleton loaders, no spinner genérico
- Empty state con personalidad
- Validación inline en form
- Lazy loading de rutas
- ErrorBoundary
- 404 con personalidad
- Easter egg en console
- No hay `translateY(-4px)` en hovers
- No hay comentarios decorativos
- border-radius variado (4/6/8/16/pill)
- Feedback táctil en mobile (scale 0.97)
- "¡Copiado!" feedback en clipboard
- Toast notifications en vez de alerts estáticos
- Progress bar con animación (transition width)
- Números reales del testnet en el copy
- CSS splitteado por componente (no monolito 870 líneas)
- Git history con commits iterativos, no un commit gigante
- Console limpia en producción (solo easter egg)
