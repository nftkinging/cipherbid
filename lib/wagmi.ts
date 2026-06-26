"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "wagmi";

// RainbowKit's getDefaultConfig wires up wagmi connectors (MetaMask, WalletConnect, etc.)
// Get a free WalletConnect projectId at https://cloud.reown.com (formerly WalletConnect Cloud).
export const wagmiConfig = getDefaultConfig({
  appName: "Sealed-Bid Auction",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
  },
  ssr: true,
});
