import { ethers } from "ethers";

function truncateAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function PactCard({ label, address, deposit, vested, claimed }) {
  const formatRBTC = (val) => {
    if (!val) return "0.0000";
    return parseFloat(ethers.utils.formatEther(val)).toFixed(4);
  };

  return (
    <div className="pact-card">
      <div className="pact-card-header">
        <span className="pact-card-label">{label}</span>
        <span className="pact-card-address" title={address}>
          {truncateAddress(address)}
        </span>
      </div>
      <div className="pact-card-stats">
        <div className="stat">
          <span className="stat-label">Depositado</span>
          <span className="stat-value">{formatRBTC(deposit)} RBTC</span>
        </div>
        <div className="stat">
          <span className="stat-label">Vesteado</span>
          <span className="stat-value accent">{formatRBTC(vested)} RBTC</span>
        </div>
        <div className="stat">
          <span className="stat-label">Reclamado</span>
          <span className="stat-value">{formatRBTC(claimed)} RBTC</span>
        </div>
      </div>
    </div>
  );
}
