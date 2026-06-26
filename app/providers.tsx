"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { useMemo, useState } from "react";
import { wagmiConfig } from "../lib/wagmi";
import { createZamaSdkConfig } from "../lib/zama";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  // Build the Zama config once, bound to our wagmi config.
  const zamaConfig = useMemo(() => createZamaSdkConfig(wagmiConfig), []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {/* ZamaProvider must sit inside Wagmi + QueryClient because it uses them.
              VERIFY: prop is `config` in v3.1.0; if your editor flags it, autocomplete shows the right one. */}
          <ZamaProvider config={zamaConfig}>{children}</ZamaProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
