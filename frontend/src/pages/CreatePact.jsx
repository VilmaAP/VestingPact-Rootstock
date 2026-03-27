import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { VESTING_PACT_ABI } from "../lib/contracts";
import { VESTING_PACT_BYTECODE } from "../lib/bytecode";
import { RSK_TESTNET, TROPYKUS } from "../config";

export default function CreatePact({ wallet }) {
  const navigate = useNavigate();
  const { signer, isConnected, chainId } = wallet;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [copied, setCopied] = useState(false);

  // Form state
  const [founderB, setFounderB] = useState("");
  const [cliffDays, setCliffDays] = useState("");
  const [vestingDays, setVestingDays] = useState("");
  const [amount, setAmount] = useState("");

  const isWrongChain = chainId && chainId !== 31;

  const setDemoMode = () => {
    setFounderB("0x0000000000000000000000000000000000000001");
    setCliffDays("0.0035"); // ~5 minutes
    setVestingDays("0.007"); // ~10 minutes
    setAmount("0.001");
  };

  const cliffSeconds = Math.floor(parseFloat(cliffDays || 0) * 86400);
  const vestingSeconds = Math.floor(parseFloat(vestingDays || 0) * 86400);

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

  // Step 1: Configure
  if (step === 1) {
    return (
      <div className="create-pact">
        <h1>Crear Pacto de Vesting</h1>
        <p className="create-subtitle">
          Configurá los parámetros de tu pacto con tu co-fundador
        </p>

        <div className="form-group">
          <label htmlFor="founderB">
            Dirección del co-fundador
            <span className="tooltip" title="La wallet address de tu socio">?</span>
          </label>
          <input
            id="founderB"
            type="text"
            placeholder="0x..."
            value={founderB}
            onChange={(e) => setFounderB(e.target.value)}
          />
          {founderB && !(founderB.length === 42 && founderB.startsWith("0x")) && (
            <span className="field-error">Dirección inválida (debe ser 0x... y 42 caracteres)</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="cliff">
            Duración del Cliff (días)
            <span className="tooltip" title="Período inicial donde no se puede reclamar nada">?</span>
          </label>
          <input
            id="cliff"
            type="number"
            placeholder="90"
            value={cliffDays}
            onChange={(e) => setCliffDays(e.target.value)}
            min="0"
            step="any"
          />
        </div>

        <div className="form-group">
          <label htmlFor="vesting">
            Duración total del Vesting (días)
            <span className="tooltip" title="Tiempo total hasta liberar el 100% de los fondos">?</span>
          </label>
          <input
            id="vesting"
            type="number"
            placeholder="365"
            value={vestingDays}
            onChange={(e) => setVestingDays(e.target.value)}
            min="0"
            step="any"
          />
          {vestingDays && cliffDays && !(parseFloat(vestingDays) > parseFloat(cliffDays)) && (
            <span className="field-error">El vesting debe ser mayor al cliff</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="amount">
            Monto a depositar (RBTC)
            <span className="tooltip" title="Cantidad de RBTC que depositarás en el pacto">?</span>
          </label>
          <input
            id="amount"
            type="number"
            placeholder="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="any"
          />
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={setDemoMode} title="Tiempos cortos para probar rápido">
            Modo Demo (5min/10min)
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setStep(2)}
            disabled={!founderB || !cliffDays || !vestingDays || !amount}
          >
            Siguiente
          </button>
        </div>

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

  // Step 2: Review & Confirm
  if (step === 2) {
    return (
      <div className="create-pact">
        <h1>Revisar y Confirmar</h1>

        <div className="review-card">
          <div className="review-row">
            <span>Co-fundador</span>
            <span className="review-value">{founderB}</span>
          </div>
          <div className="review-row">
            <span>Cliff</span>
            <span className="review-value">
              {cliffDays} días ({cliffSeconds}s)
            </span>
          </div>
          <div className="review-row">
            <span>Vesting total</span>
            <span className="review-value">
              {vestingDays} días ({vestingSeconds}s)
            </span>
          </div>
          <div className="review-row highlight">
            <span>Depósito</span>
            <span className="review-value">{amount} RBTC</span>
          </div>
        </div>

        {!isConnected && (
          <div className="alert alert-warning">
            Conectá tu wallet para crear el pacto
          </div>
        )}

        {isWrongChain && (
          <div className="alert alert-warning">
            Cambiá tu wallet a RSK Testnet antes de continuar
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => setStep(1)}>
            Volver
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={loading || !isConnected || isWrongChain}
          >
            {loading ? (
              <span className="loading-spinner">Deployando en Rootstock... ~15 segundos</span>
            ) : (
              "Crear Pacto"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation
  return (
    <div className="create-pact">
      <div className="success-icon">✅</div>
      <h1>¡Pacto Creado!</h1>

      <div className="review-card">
        <div className="review-row">
          <span>Transacción</span>
          <a
            href={`${RSK_TESTNET.explorer}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="review-value link"
          >
            {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </a>
        </div>
        {contractAddress && (
          <div className="review-row">
            <span>Contrato</span>
            <a
              href={`${RSK_TESTNET.explorer}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="review-value link"
            >
              {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}
            </a>
          </div>
        )}
      </div>

      <p className="success-instructions">
        Compartí este link con tu co-fundador para que se una al pacto:
      </p>
      <div className="share-link">
        <code>{window.location.origin}/dashboard/{contractAddress}</code>
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
      </div>

      <p className="success-note">
        Tu co-fundador debe llamar <strong>joinPact()</strong> y depositar su RBTC para activar el vesting.
      </p>

      <button
        className="btn btn-primary"
        onClick={() => navigate(`/dashboard/${contractAddress}`)}
      >
        Ir al Dashboard
      </button>
    </div>
  );
}
