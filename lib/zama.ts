"use client";

import { web } from "@zama-fhe/sdk/web";
import { createConfig as createZamaConfig } from "@zama-fhe/react-sdk/wagmi";
import { sepolia } from "@zama-fhe/sdk/chains";
import type { Config } from "wagmi";

// v3.1.0 uses createConfig: it takes your wagmi config + chain presets + a relayer
// per chain. The Sepolia preset already carries the relayer URL and contract
// addresses, so there's nothing to hardcode. web() runs FHE in a Web Worker.
export function createZamaSdkConfig(wagmiConfig: Config) {
  return createZamaConfig({
    chains: [sepolia],
    wagmiConfig,
    relayers: {
      [sepolia.id]: web(),
    },
  });
}
