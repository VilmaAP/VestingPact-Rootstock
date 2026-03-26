import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landing">
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

      <section className="provocation">
        <p className="provocation-text">
          Tu socio no puede huir con la plata.
          <br />
          <span className="text-muted">El contrato no negocia, no miente, no se olvida.</span>
        </p>
      </section>

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
