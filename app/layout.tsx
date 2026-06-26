import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Providers } from "./providers";

// Telegraf (Zama's typeface) is paid; Space Grotesk is the closest free match —
// same geometric-grotesk feel. Swap to Telegraf later if you license it.
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "Cipherbid — Confidential Procurement",
  description: "Encrypted sealed-bid procurement auctions on Zama FHEVM. Fairness without trust.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={grotesk.className} style={{ margin: 0, background: "#0A0A0A", color: "#F4F4F4" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
