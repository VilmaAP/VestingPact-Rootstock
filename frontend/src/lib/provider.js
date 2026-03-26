import { ethers } from "ethers";
import { XOConnectProvider } from "xo-connect";

export function createProvider() {
  // xo-connect (dentro de Beexo wallet WebView)
  if (window.XOConnect) {
    const xoProvider = new XOConnectProvider({
      rpcs: {
        "0x1e": "https://public-node.rsk.co",
        "0x1f": "https://public-node.testnet.rsk.co",
      },
      defaultChainId: "0x1f",
      debug: true,
    });
    return new ethers.providers.Web3Provider(xoProvider, "any");
  }

  // MetaMask fallback
  if (window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum, "any");
  }

  // Read-only
  return new ethers.providers.JsonRpcProvider(
    "https://public-node.testnet.rsk.co"
  );
}

export function getProviderType() {
  if (window.XOConnect) return "beexo";
  if (window.ethereum) return "metamask";
  return "readonly";
}
