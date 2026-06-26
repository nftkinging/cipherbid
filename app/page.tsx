"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useEncrypt, useDecryptValues, useGrantPermit } from "@zama-fhe/react-sdk";
import { bytesToHex } from "viem";
import { useEffect, useState, Component } from "react";
import { AUCTION_ADDRESS, AUCTION_ABI } from "../lib/contract";

// ── Brand ────────────────────────────────────────────────
const BRAND = "Cipherbid";
const YELLOW = "#FFD208";
const TEXT = "#F4F4F4";
const MUTED = "#9A9A9A";

const glassCard: React.CSSProperties = { borderRadius: 18, padding: 28, marginBottom: 18 };
const btnPrimary: React.CSSProperties = {
  background: YELLOW, color: "#000", border: "none", borderRadius: 12,
  padding: "12px 22px", fontWeight: 700, cursor: "pointer", fontSize: 15,
};
const input: React.CSSProperties = {
  padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(0,0,0,0.4)", color: TEXT, marginRight: 10, width: 220, fontSize: 15,
};

// Option B — sealed "C" / keyhole logomark (custom, scales to a favicon)
function Logo({ size = 30 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden>
        <rect width="34" height="34" rx="9" fill={YELLOW} />
        <path d="M23.5 9.5 A11 11 0 1 0 23.5 24.5" stroke="#111111" strokeWidth="4.6" fill="none" strokeLinecap="round" />
        <circle cx="17" cy="16" r="3" fill="#111111" />
        <rect x="15.5" y="17.5" width="3" height="6" rx="1.2" fill="#111111" />
      </svg>
      <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: -0.3 }}>{BRAND}</span>
    </div>
  );
}

function FadeIn({ delay = 0, duration = 800, children }: { delay?: number; duration?: number; children: React.ReactNode }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div style={{ opacity: shown ? 1 : 0, transform: shown ? "translateY(0)" : "translateY(10px)", transition: `opacity ${duration}ms ease, transform ${duration}ms ease` }}>{children}</div>;
}

function AnimatedHeading({ text, style }: { text: string; style?: React.CSSProperties }) {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 200); return () => clearTimeout(t); }, []);
  const charDelay = 26;
  const words = text.split(" ");
  let idx = 0;
  return (
    <h1 style={style}>
      {words.map((word, w) => (
        <span key={w} style={{ display: "inline-block", whiteSpace: "nowrap", marginRight: "0.28em" }}>
          {word.split("").map((ch, c) => {
            const i = idx++;
            return (
              <span key={c} style={{
                display: "inline-block",
                opacity: go ? 1 : 0,
                transform: go ? "translateX(0)" : "translateX(-16px)",
                transition: "opacity 500ms ease, transform 500ms ease",
                transitionDelay: `${i * charDelay}ms`,
              }}>{ch}</span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const encrypt = useEncrypt();
  const { writeContractAsync } = useWriteContract();
  const [bid, setBid] = useState("");
  const [status, setStatus] = useState("");

  const { data: title } = useReadContract({ address: AUCTION_ADDRESS, abi: AUCTION_ABI, functionName: "title" });
  const { data: auctioneer } = useReadContract({ address: AUCTION_ADDRESS, abi: AUCTION_ABI, functionName: "auctioneer" });
  const { data: bidCount } = useReadContract({ address: AUCTION_ADDRESS, abi: AUCTION_ABI, functionName: "bidCount" });
  const { data: endTime } = useReadContract({ address: AUCTION_ADDRESS, abi: AUCTION_ABI, functionName: "endTime" });
  const { data: finalized } = useReadContract({ address: AUCTION_ADDRESS, abi: AUCTION_ABI, functionName: "finalized" });

  const isAuctioneer = !!address && !!auctioneer && address.toLowerCase() === (auctioneer as string).toLowerCase();
  const ended = !!endTime && Date.now() / 1000 >= Number(endTime);
  const statusLabel = finalized ? "Finalized" : ended ? "Ended · awaiting finalize" : "Open for bids";
  const statusColor = finalized ? MUTED : ended ? "#E6A700" : YELLOW;

  async function submitBid() {
    try {
      if (!address) return;
      setStatus("Encrypting your bid in your browser…");
      const enc: any = await encrypt.mutateAsync({
        values: [{ value: BigInt(bid), type: "euint64" }],
        contractAddress: AUCTION_ADDRESS, userAddress: address,
      });
      console.log("Cipherbid encrypt result:", enc);
      try {
        console.log("Cipherbid isArray:", Array.isArray(enc), "keys:", Object.keys(enc || {}));
        console.log("Cipherbid enc[0]:", enc?.[0]);
        console.log("Cipherbid enc[1]:", enc?.[1]);
      } catch {}

      // Convert any byte-ish value (Uint8Array | number[] | {0:..,1:..} | hex string) to 0x hex
      const toHex = (v: any): `0x${string}` => {
        if (typeof v === "string") return (v.startsWith("0x") ? v : "0x" + v) as `0x${string}`;
        if (v instanceof Uint8Array) return bytesToHex(v);
        if (Array.isArray(v)) return bytesToHex(Uint8Array.from(v));
        if (v && typeof v === "object") {
          const nums = Object.values(v).filter((x) => typeof x === "number") as number[];
          if (nums.length) return bytesToHex(Uint8Array.from(nums));
        }
        return bytesToHex(v);
      };

      // Pick the first handle out of whatever the "handles" slot contains
      const firstHandle = (h: any): any => {
        if (h == null) return h;
        if (typeof h === "string" || h instanceof Uint8Array) return h;
        if (Array.isArray(h)) {
          const e0 = h[0];
          if (typeof e0 === "string" || e0 instanceof Uint8Array || Array.isArray(e0) || (e0 && typeof e0 === "object")) return e0; // array of handles
          return h; // raw byte array
        }
        if (typeof h === "object") {
          if (typeof h[0] === "number") return h; // byte-object
          return h[0]; // { 0: handle, ... }
        }
        return h;
      };

      // enc may be a real array OR an array-like object with keys "0","1"
      const r: any = enc?.data ?? enc;
      const arrayLike = r && (Array.isArray(r) || ("0" in r && "1" in r));
      let rawHandle: any, rawProof: any;
      if (r?.encryptedValues != null) {
        // Zama React SDK shape: { encryptedValues: string[], inputProof: string }
        rawHandle = firstHandle(r.encryptedValues);
        rawProof = r.inputProof;
      } else if (arrayLike) {
        rawHandle = firstHandle(r[0]);
        rawProof = r[1];
      } else {
        rawHandle = firstHandle(r?.handles ?? r?.handle ?? r?.inputs);
        rawProof = r?.inputProof ?? r?.proof ?? r?.attestation;
      }
      if (rawHandle == null || rawProof == null) {
        throw new Error("Unexpected encrypt result — open the console (F12) and copy the 'Cipherbid enc[0]' and 'enc[1]' lines.");
      }
      const handleHex = toHex(rawHandle);
      const proofHex = toHex(rawProof);

      setStatus("Submitting sealed bid on-chain…");
      await writeContractAsync({
        address: AUCTION_ADDRESS, abi: AUCTION_ABI, functionName: "submitBid",
        args: [handleHex, proofHex],
      });
      setStatus("✅ Sealed bid submitted — encrypted end-to-end. No one can read it.");
      setBid("");
    } catch (e: any) { setStatus("Error: " + (e?.shortMessage || e?.message || String(e))); }
  }

  async function finalize() {
    try {
      setStatus("Finalizing auction…");
      await writeContractAsync({ address: AUCTION_ADDRESS, abi: AUCTION_ABI, functionName: "finalizeAuction" });
      setStatus("✅ Auction finalized — the winner can now be revealed.");
    } catch (e: any) { setStatus("Error: " + (e?.shortMessage || e?.message || String(e))); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A" }}>
      <style>{`
        .liquid-glass {
          background: rgba(10,10,10,0.45); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.1); position: relative; overflow: hidden;
        }
        .liquid-glass::before {
          content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1.4px;
          background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.08) 25%,
            rgba(255,255,255,0) 50%, rgba(255,255,255,0.08) 75%, rgba(255,255,255,0.3) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
        }
        .pbtn { transition: transform .06s ease, filter .15s ease; }
        .pbtn:hover { filter: brightness(1.06); } .pbtn:active { transform: translateY(1px); }
        a { color: ${YELLOW}; text-decoration: none; }
        .heroimg {
          position: absolute; inset: 0;
          background-image: url('/hero.jpg'); background-size: cover; background-position: center;
        }
        .heroscrim {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(10,10,10,0.45) 0%, rgba(10,10,10,0.05) 40%, rgba(10,10,10,0.55) 75%, rgba(10,10,10,0.92) 100%);
        }
        .card {
          position: relative; border-radius: 20px; padding: 26px 28px; margin-bottom: 18px;
          background: linear-gradient(180deg, rgba(26,26,26,0.9), rgba(15,15,15,0.95));
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 60px -34px rgba(0,0,0,0.9);
          overflow: hidden;
        }
        .card::before {
          content: ''; position: absolute; top: 0; left: 26px; right: 26px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,210,8,0.55), transparent);
        }
        .card::after {
          content: ''; position: absolute; top: -50px; right: -50px; width: 180px; height: 180px;
          background: radial-gradient(circle, rgba(255,210,8,0.10), transparent 70%); pointer-events: none;
        }
        .eyebrow { display: flex; align-items: center; gap: 8px; font-size: 12px; letter-spacing: 1.6px;
          text-transform: uppercase; color: ${MUTED}; margin-bottom: 14px; }
        .statbox { flex: 1; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 16px 18px; }
        .statnum { font-size: 34px; font-weight: 500; letter-spacing: -1px; font-variant-numeric: tabular-nums; }
        .divider { height: 1px; background: rgba(255,255,255,0.07); margin: 22px 0; }
        .step { position: relative; border-radius: 16px; padding: 22px 20px;
          background: linear-gradient(180deg, rgba(22,22,22,0.9), rgba(14,14,14,0.95));
          border: 1px solid rgba(255,255,255,0.07);
          transition: transform .18s ease, border-color .18s ease; }
        .step:hover { transform: translateY(-3px); border-color: rgba(255,210,8,0.35); }
        .stepnum { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center;
          justify-content: center; font-weight: 500; font-size: 14px; color: ${YELLOW};
          border: 1px solid rgba(255,210,8,0.4); background: rgba(255,210,8,0.08); margin-bottom: 14px; }
      `}</style>

      {/* ── Compact full-bleed hero ── */}
      <section style={{ position: "relative", height: "70vh", minHeight: 520, overflow: "hidden" }}>
        <div className="heroimg" />
        <div className="heroscrim" />

        {/* nav */}
        <div style={{ position: "relative", maxWidth: 1120, margin: "0 auto", padding: "20px 24px" }}>
          <nav className="liquid-glass" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderRadius: 14 }}>
            <Logo />
            <ConnectButton showBalance={false} />
          </nav>
        </div>

        {/* hero content pinned to bottom */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxWidth: 1120, margin: "0 auto", padding: "0 24px 40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 620 }}>
            <FadeIn delay={0}>
              <div className="liquid-glass" style={{ display: "inline-block", padding: "6px 14px", borderRadius: 999, color: "#dcdcdc", fontSize: 13, marginBottom: 16, letterSpacing: 0.2 }}>
                Confidential procurement · powered by FHE
              </div>
            </FadeIn>
            <AnimatedHeading
              text={"Sealed bids that stay sealed."}
              style={{ fontSize: 52, lineHeight: 1.02, margin: "0 0 16px", letterSpacing: "-0.04em", fontWeight: 400, color: "#fff" } as React.CSSProperties}
            />
            <FadeIn delay={900} duration={1000}>
              <p style={{ fontSize: 17, color: "#cfcfcf", margin: 0, lineHeight: 1.5, maxWidth: 520 }}>
                The first procurement auction where fairness doesn't require trust. Every bid is encrypted end-to-end.
              </p>
            </FadeIn>
          </div>
          <FadeIn delay={1300} duration={1000}>
            <div className="liquid-glass" style={{ padding: "12px 18px", borderRadius: 14, fontSize: 17, fontWeight: 300, color: "#fff", whiteSpace: "nowrap" }}>
              Encrypt. Compare. Reveal one.
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── dApp ── */}
      <main style={{ maxWidth: 780, margin: "0 auto", padding: "40px 20px 80px" }}>
        <FadeIn delay={200} duration={800}>
          <section className="card">
            <div className="eyebrow"><span style={{ width: 6, height: 6, borderRadius: 999, background: YELLOW, display: "inline-block" }} /> Active round</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 500, color: TEXT, letterSpacing: -0.4 }}>{(title as string) || "Confidential Auction"}</h2>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 13px", borderRadius: 999, fontSize: 13, fontWeight: 500, color: statusColor, background: "rgba(255,255,255,0.04)", border: `1px solid ${statusColor}40` }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: statusColor, display: "inline-block" }} /> {statusLabel}
              </span>
            </div>
            <div className="divider" />
            <div style={{ display: "flex", gap: 14 }}>
              <div className="statbox">
                <div style={{ color: MUTED, fontSize: 13, marginBottom: 6 }}>Sealed bids received</div>
                <div className="statnum" style={{ color: TEXT }}>{bidCount?.toString() ?? "—"}</div>
              </div>
              <div className="statbox">
                <div style={{ color: MUTED, fontSize: 13, marginBottom: 6 }}>Visible bid amounts</div>
                <div className="statnum" style={{ color: YELLOW }}>0</div>
              </div>
            </div>
            <p style={{ color: MUTED, fontSize: 13, marginTop: 18, marginBottom: 0, lineHeight: 1.5 }}>
              While bidding is open, no one — not even the auctioneer — can see any bid or who's leading.
            </p>
          </section>
        </FadeIn>

        {/* Role banner — separates auctioneer vs bidder views */}
        {isConnected && (
          <section className="card" style={{ padding: "16px 22px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: isAuctioneer ? "#000" : YELLOW, background: isAuctioneer ? YELLOW : "rgba(255,210,8,0.1)", border: `1px solid ${isAuctioneer ? "transparent" : "rgba(255,210,8,0.4)"}` }}>
              {isAuctioneer ? "A" : "B"}
            </div>
            <div>
              <div style={{ fontSize: 13, color: isAuctioneer ? YELLOW : MUTED, fontWeight: 600, letterSpacing: 0.4 }}>
                {isAuctioneer ? "AUCTIONEER VIEW" : "BIDDER VIEW"}
              </div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
                {isAuctioneer
                  ? "You created this round. You can finalize it once it ends and reveal the winner — no one else can."
                  : "You can submit one sealed bid. Highest bid wins; every losing bid stays encrypted forever."}
              </div>
            </div>
          </section>
        )}

        {isConnected && !ended && (
          <section className="card">
            <div className="eyebrow"><span style={{ width: 6, height: 6, borderRadius: 999, background: YELLOW, display: "inline-block" }} /> Your bid</div>
            <h3 style={{ marginTop: 0, marginBottom: 6, color: TEXT, fontWeight: 500, fontSize: 19 }}>Place a sealed bid</h3>
            <p style={{ color: MUTED, fontSize: 14, marginTop: 0, marginBottom: 18 }}>Your amount is encrypted in your browser before it ever leaves your device.</p>
            <input style={input} type="number" value={bid} onChange={(e) => setBid(e.target.value)} placeholder="Bid amount" />
            <button className="pbtn" style={btnPrimary} onClick={submitBid} disabled={!bid || encrypt.isPending}>
              {encrypt.isPending ? "Encrypting…" : "Submit sealed bid"}
            </button>
          </section>
        )}

        {!isConnected && (
          <section className="card" style={{ textAlign: "center", color: MUTED, padding: "30px 28px" }}>
            Connect your wallet to place a sealed bid.
          </section>
        )}

        {isAuctioneer && ended && !finalized && (
          <section className="card">
            <div className="eyebrow"><span style={{ width: 6, height: 6, borderRadius: 999, background: YELLOW, display: "inline-block" }} /> Auctioneer</div>
            <h3 style={{ marginTop: 0, marginBottom: 14, color: TEXT, fontWeight: 500, fontSize: 19 }}>Close the round</h3>
            <button className="pbtn" style={btnPrimary} onClick={finalize}>Finalize auction</button>
          </section>
        )}

        {isAuctioneer && finalized && <RevealWinner />}

        {status && <p style={{ textAlign: "center", color: "#cfcfcf", marginTop: 8 }}>{status}</p>}

        <section style={{ marginTop: 44 }}>
          <h3 style={{ textAlign: "center", color: MUTED, fontWeight: 500, fontSize: 13, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 22 }}>How it works</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {[
              ["1", "Bid blind", "Each bidder encrypts an amount client-side and submits it. The ciphertext goes on-chain; the number never does."],
              ["2", "Compare encrypted", "The contract compares bids and tracks the highest using FHE — computing on data that stays encrypted throughout."],
              ["3", "Reveal only the winner", "At close, only the winning bid is unsealed, to the authorized party. Every losing bid stays encrypted forever."],
            ].map(([n, t, d]) => (
              <div key={n} className="step">
                <div className="stepnum">{n}</div>
                <div style={{ fontWeight: 500, marginBottom: 6, fontSize: 15, color: TEXT }}>{t}</div>
                <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.55 }}>{d}</div>
              </div>
            ))}
          </div>
        </section>

        <footer style={{ textAlign: "center", marginTop: 56, color: MUTED, fontSize: 13 }}>
          Built on <a href="https://docs.zama.org/protocol" target="_blank" rel="noreferrer">Zama FHEVM</a>
          {" · "}
          <a href={`https://sepolia.etherscan.io/address/${AUCTION_ADDRESS}`} target="_blank" rel="noreferrer">View contract on Sepolia</a>
        </footer>
      </main>
    </div>
  );
}

// Error boundary so a finicky decrypt never white-screens the page
class RevealBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  constructor(props: any) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: any) { console.log("Cipherbid reveal error:", err); }
  render() {
    if (this.state.failed) {
      return (
        <p style={{ color: MUTED, fontSize: 13, marginTop: 8 }}>
          The winner is sealed on-chain and decryptable only by the auctioneer. Live browser decryption hit a snag —
          the encrypted result is verifiable on{" "}
          <a href={`https://sepolia.etherscan.io/address/${AUCTION_ADDRESS}`} target="_blank" rel="noreferrer">Sepolia</a>.
          Every losing bid stays encrypted forever.
        </p>
      );
    }
    return this.props.children;
  }
}

function RevealWinner() {
  const [revealing, setRevealing] = useState(false);
  return (
    <section className="card">
      <div className="eyebrow"><span style={{ width: 6, height: 6, borderRadius: 999, background: YELLOW, display: "inline-block" }} /> Result</div>
      <h3 style={{ marginTop: 0, marginBottom: 14, color: TEXT, fontWeight: 500, fontSize: 19 }}>Reveal the winner</h3>
      {!revealing ? (
        <>
          <p style={{ color: MUTED, fontSize: 14, marginTop: 0, marginBottom: 16 }}>
            The highest bid is sealed on-chain. As the auctioneer, you can authorize decryption to reveal it — every losing bid stays encrypted.
          </p>
          <button className="pbtn" style={btnPrimary} onClick={() => setRevealing(true)}>Reveal winning bid</button>
        </>
      ) : (
        <RevealBoundary>
          <RevealInner />
        </RevealBoundary>
      )}
    </section>
  );
}

function RevealInner() {
  const grant = useGrantPermit();
  const [granted, setGranted] = useState(false);

  async function authorize() {
    const attempts: any[] = [
      [AUCTION_ADDRESS],
      { contractAddresses: [AUCTION_ADDRESS] },
      { contracts: [AUCTION_ADDRESS] },
      { contractAddress: AUCTION_ADDRESS },
    ];
    for (const arg of attempts) {
      try {
        console.log("Cipherbid grant try:", arg);
        await grant.mutateAsync(arg);
        setGranted(true);
        return;
      } catch (e) {
        console.log("Cipherbid grant attempt failed:", e);
      }
    }
    console.log("Cipherbid grant: all shapes failed");
  }

  if (!granted) {
    return (
      <button className="pbtn" style={btnPrimary} onClick={authorize} disabled={grant.isPending}>
        {grant.isPending ? "Signing…" : "Authorize decryption"}
      </button>
    );
  }
  return <DecryptedResult />;
}

function DecryptedResult() {
  const { data: bidHandle } = useReadContract({ address: AUCTION_ADDRESS, abi: AUCTION_ABI, functionName: "getHighestBid" });
  const { data: bidderHandle } = useReadContract({ address: AUCTION_ADDRESS, abi: AUCTION_ABI, functionName: "getHighestBidder" });

  const handles = [
    bidHandle ? { encryptedValue: bidHandle as string, contractAddress: AUCTION_ADDRESS } : null,
    bidderHandle ? { encryptedValue: bidderHandle as string, contractAddress: AUCTION_ADDRESS } : null,
  ].filter(Boolean) as { encryptedValue: string; contractAddress: `0x${string}` }[];

  const { data: decrypted } = useDecryptValues(
    handles,
    { enabled: handles.length === 2 }
  );

  useEffect(() => { if (decrypted) console.log("Cipherbid decrypted:", decrypted); }, [decrypted]);

  const pick = (key: any) => {
    if (!decrypted || key == null) return undefined;
    const d: any = decrypted;
    return d[key] ?? d[String(key)] ?? (Array.isArray(d) ? d[0] : undefined);
  };
  const winningBid = pick(bidHandle)?.toString();
  const rawBidder = pick(bidderHandle);
  let winner: string | undefined;
  try { winner = rawBidder != null ? "0x" + BigInt(rawBidder).toString(16).padStart(40, "0") : undefined; } catch { winner = undefined; }

  return (
    <>
      <p style={{ color: TEXT }}>Winning bid: <b style={{ color: YELLOW }}>{winningBid ?? "Decrypting…"}</b></p>
      <p style={{ color: TEXT }}>Winner: <b style={{ fontFamily: "monospace" }}>{winner ?? "Decrypting…"}</b></p>
      <p style={{ color: MUTED, fontSize: 13 }}>Every losing bid stays encrypted forever.</p>
    </>
  );
}