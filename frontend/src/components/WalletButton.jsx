import { useState } from "react";

function truncateAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function WalletButton({ wallet }) {
  const [showMenu, setShowMenu] = useState(false);
  const {
    address,
    providerType,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    switchToRSK,
    chainId,
  } = wallet;

  const isWrongChain = chainId && chainId !== 31;

  if (!isConnected) {
    return (
      <button
        className="btn btn-primary btn-wallet"
        onClick={connect}
        disabled={isConnecting}
      >
        {isConnecting ? "Conectando..." : "Conectar Wallet"}
      </button>
    );
  }

  return (
    <div className="wallet-connected">
      {isWrongChain && (
        <button className="btn btn-warning btn-sm" onClick={switchToRSK}>
          Cambiar a RSK
        </button>
      )}
      <button
        className="btn btn-outline btn-wallet"
        onClick={() => setShowMenu(!showMenu)}
      >
        <span className="wallet-badge">{providerType === "beexo" ? "Beexo" : "MetaMask"}</span>
        <span className="wallet-address">{truncateAddress(address)}</span>
      </button>
      {showMenu && (
        <div className="wallet-menu">
          <button onClick={switchToRSK}>Cambiar a RSK Testnet</button>
          <button onClick={() => { disconnect(); setShowMenu(false); }}>
            Desconectar
          </button>
        </div>
      )}
    </div>
  );
}
