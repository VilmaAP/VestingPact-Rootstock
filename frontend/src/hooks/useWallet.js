import { useState, useEffect, useCallback } from "react";
import { createProvider, getProviderType } from "../lib/provider";
import { RSK_TESTNET } from "../config";

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [providerType, setProviderType] = useState("readonly");
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = !!address;

  // Initialize provider on mount
  useEffect(() => {
    const p = createProvider();
    setProvider(p);
    setProviderType(getProviderType());
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const p = createProvider();
      const type = getProviderType();

      if (type === "readonly") {
        throw new Error("No se detectó wallet. Instalá MetaMask o usá Beexo.");
      }

      await p.send("eth_requestAccounts", []);
      const s = p.getSigner();
      const addr = await s.getAddress();
      const network = await p.getNetwork();

      setProvider(p);
      setSigner(s);
      setAddress(addr);
      setChainId(network.chainId);
      setProviderType(type);
    } catch (err) {
      console.error("Error conectando wallet:", err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setSigner(null);
    setChainId(null);
    const p = createProvider();
    setProvider(p);
  }, []);

  const switchToRSK = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: RSK_TESTNET.chainId }],
      });
    } catch (switchError) {
      // Chain not added yet — add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: RSK_TESTNET.chainId,
              chainName: RSK_TESTNET.name,
              rpcUrls: [RSK_TESTNET.rpc],
              blockExplorerUrls: [RSK_TESTNET.explorer],
              nativeCurrency: RSK_TESTNET.currency,
            },
          ],
        });
      }
    }
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    const eth = window.ethereum || window.XOConnect;
    if (!eth?.on) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(parseInt(newChainId, 16));
      // Refresh provider
      const p = createProvider();
      setProvider(p);
      if (address) {
        const s = p.getSigner();
        setSigner(s);
      }
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);

    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, [address, disconnect]);

  return {
    address,
    provider,
    signer,
    chainId,
    providerType,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    switchToRSK,
  };
}
