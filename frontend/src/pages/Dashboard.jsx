import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import { getVestingPactContract } from "../lib/contracts";
import { RSK_TESTNET } from "../config";
import VestingProgress from "../components/VestingProgress";
import PactCard from "../components/PactCard";

export default function Dashboard({ wallet }) {
  const { contractAddress } = useParams();
  const { provider, signer, address, isConnected } = wallet;

  const [pact, setPact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [txStatus, setTxStatus] = useState("");

  const loadPact = useCallback(async () => {
    if (!provider || !contractAddress) return;
    setLoading(true);
    try {
      const contract = getVestingPactContract(contractAddress, provider);

      const [
        founderA,
        founderB,
        depositA,
        depositB,
        startTime,
        cliffEnd,
        vestingEnd,
        claimedA,
        claimedB,
        isActive,
        dissolveApprovedA,
        dissolveApprovedB,
      ] = await Promise.all([
        contract.founderA(),
        contract.founderB(),
        contract.depositA(),
        contract.depositB(),
        contract.startTime(),
        contract.cliffEnd(),
        contract.vestingEnd(),
        contract.claimedA(),
        contract.claimedB(),
        contract.isActive(),
        contract.dissolveApprovedA(),
        contract.dissolveApprovedB(),
      ]);

      // Get vested amounts if active
      let vestedA = ethers.BigNumber.from(0);
      let vestedB = ethers.BigNumber.from(0);
      if (isActive) {
        try {
          [vestedA, vestedB] = await Promise.all([
            contract.getVestedAmount(founderA),
            contract.getVestedAmount(founderB),
          ]);
        } catch (err) {
          console.warn("Vested amount not available (before cliff?):", err.message);
        }
      }

      setPact({
        founderA,
        founderB,
        depositA,
        depositB,
        startTime: startTime.toNumber(),
        cliffEnd: cliffEnd.toNumber(),
        vestingEnd: vestingEnd.toNumber(),
        claimedA,
        claimedB,
        vestedA,
        vestedB,
        isActive,
        dissolveApprovedA,
        dissolveApprovedB,
      });
    } catch (err) {
      console.error("Error cargando pacto:", err);
      setError("No se pudo cargar el pacto. ¿Existe esa dirección? ¿Estás en RSK Testnet?");
    } finally {
      setLoading(false);
    }
  }, [provider, contractAddress]);

  useEffect(() => {
    loadPact();
    const interval = setInterval(loadPact, 30000);
    return () => clearInterval(interval);
  }, [loadPact]);

  const execAction = async (actionName, fn) => {
    setActionLoading(actionName);
    setTxStatus("");
    setError("");
    try {
      const contract = getVestingPactContract(contractAddress, signer);
      const tx = await fn(contract);
      setTxStatus(`Transacción enviada: ${tx.hash}`);
      await tx.wait();
      setTxStatus("Confirmado en Rootstock ✓");
      await loadPact();
    } catch (err) {
      console.error(`Error en ${actionName}:`, err);
      setError(err.reason || err.message || `Error en ${actionName}`);
    } finally {
      setActionLoading("");
    }
  };

  const handleJoin = () => {
    const depositAmount = prompt("¿Cuánto RBTC querés depositar?", "0.001");
    if (!depositAmount) return;
    execAction("joinPact", (c) =>
      c.joinPact({ value: ethers.utils.parseEther(depositAmount) })
    );
  };

  const handleClaim = () => execAction("claim", (c) => c.claim());

  const handleExitEarly = () => {
    if (!confirm("Salida anticipada: vas a perder tu parte unvested y se la lleva el otro fundador. ¿Estás seguro?")) return;
    execAction("exitEarly", (c) => c.exitEarly());
  };

  const handleDissolve = () => {
    if (!confirm("¿Estás seguro de aprobar la disolución del pacto? Ambos fundadores deben aprobar.")) return;
    execAction("dissolve", (c) => c.dissolve());
  };

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

  if (error && !pact) {
    return (
      <div className="dashboard">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

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

  const formatRBTC = (val) => {
    if (!val) return "0";
    const num = parseFloat(ethers.utils.formatEther(val));
    if (num === 0) return "0";
    if (num < 0.0001) return num.toFixed(6);
    return num.toFixed(4);
  };

  const isFounderA = address?.toLowerCase() === pact.founderA.toLowerCase();
  const isFounderB = address?.toLowerCase() === pact.founderB.toLowerCase();
  const isFounder = isFounderA || isFounderB;

  return (
    <div className="dashboard">
      <h1>Dashboard del Pacto</h1>
      <p className="dashboard-address">
        Contrato:{" "}
        <a
          href={`${RSK_TESTNET.explorer}/address/${contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {contractAddress}
        </a>
      </p>

      <div className={`status-badge ${pact.isActive ? "active" : "inactive"}`}>
        {pact.isActive ? "Activo" : "Inactivo"}
      </div>

      <div className="pact-summary">
        <div className="pact-summary-item">
          <span className="pact-summary-label">Depósito Fundador A</span>
          <span className="pact-summary-value">{formatRBTC(pact.depositA)} RBTC</span>
        </div>
        <div className="pact-summary-item">
          <span className="pact-summary-label">Depósito Fundador B</span>
          <span className="pact-summary-value">{formatRBTC(pact.depositB)} RBTC</span>
        </div>
        <div className="pact-summary-item total">
          <span className="pact-summary-label">Total del Pacto</span>
          <span className="pact-summary-value">{formatRBTC(pact.depositA.add(pact.depositB))} RBTC</span>
        </div>
      </div>

      {pact.isActive && (
        <VestingProgress
          cliffEnd={pact.cliffEnd}
          vestingEnd={pact.vestingEnd}
          startTime={pact.startTime}
        />
      )}

      <div className="pact-cards">
        <PactCard
          label="Fundador A"
          address={pact.founderA}
          deposit={pact.depositA}
          vested={pact.vestedA}
          claimed={pact.claimedA}
        />
        <PactCard
          label="Fundador B"
          address={pact.founderB}
          deposit={pact.depositB}
          vested={pact.vestedB}
          claimed={pact.claimedB}
        />
      </div>

      <div className="dissolve-status">
        <h3>Estado de Disolución</h3>
        <div className="dissolve-indicators">
          <span className={pact.dissolveApprovedA ? "approved" : ""}>
            Fundador A: {pact.dissolveApprovedA ? "Aprobado" : "Pendiente"}
          </span>
          <span className={pact.dissolveApprovedB ? "approved" : ""}>
            Fundador B: {pact.dissolveApprovedB ? "Aprobado" : "Pendiente"}
          </span>
        </div>
      </div>

      {txStatus && <div className="alert alert-success">{txStatus}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {isConnected && (
        <div className="dashboard-actions">
          {/* Join — solo founderB cuando pacto no activo y no ha depositado aún */}
          {isFounderB && !pact.isActive && pact.depositB.isZero() && (
            <button
              className="btn btn-primary"
              onClick={handleJoin}
              disabled={!!actionLoading}
            >
              {actionLoading === "joinPact" ? "Uniéndose..." : "Unirse al Pacto"}
            </button>
          )}

          {/* Claim — cualquier founder cuando activo y cliff pasado */}
          {isFounder && pact.isActive && Date.now() / 1000 > pact.cliffEnd && (
            <button
              className="btn btn-primary"
              onClick={handleClaim}
              disabled={!!actionLoading}
            >
              {actionLoading === "claim" ? "Reclamando..." : "Reclamar"}
            </button>
          )}

          {isFounder && pact.isActive && (
            <button
              className="btn btn-warning"
              onClick={handleExitEarly}
              disabled={!!actionLoading}
            >
              {actionLoading === "exitEarly" ? "Saliendo..." : "Salida Anticipada"}
            </button>
          )}

          {isFounder && pact.isActive && (pact.vestedA.lt(pact.depositA) || pact.vestedB.lt(pact.depositB)) && (
            <button
              className="btn btn-danger"
              onClick={handleDissolve}
              disabled={!!actionLoading}
            >
              {actionLoading === "dissolve" ? "Disolviendo..." : "Disolver Pacto"}
            </button>
          )}
        </div>
      )}

      {!isConnected && (
        <div className="alert alert-warning">
          Conectá tu wallet para interactuar con el pacto
        </div>
      )}

      <a
        href="https://alpha.sovryn.app/fast-btc/withdraw"
        target="_blank"
        rel="noopener noreferrer"
        className="fastbtc-link"
      >
        ¿No tenés RBTC? Obtené con FastBTC (mainnet)
      </a>
    </div>
  );
}
