# Cipherbid — Confidential Sealed-Bid Auctions

**The first procurement auction where fairness doesn't require trust.** Every bid is encrypted end-to-end. The chain computes the winner on ciphertext, and only the winning bid is ever revealed — every losing bid stays encrypted forever.

Built on [Zama FHEVM](https://docs.zama.org/protocol) for the Zama Developer Program (Mainnet Season 3 — Builder Track, "Composable Privacy").

- **Live app:** https://cipherbid-one.vercel.app/
- **Verified contract (Sepolia):** [`0x9d13a82959e4fF818460c711fFAE7eaf487cd7e6`](https://sepolia.etherscan.io/address/0x9d13a82959e4fF818460c711fFAE7eaf487cd7e6#code)
- **Network:** Ethereum Sepolia testnet

---

## The problem

On a normal blockchain, every bid in an auction is public the moment it's submitted. That breaks sealed-bid auctions — the format used across real procurement, where bidders must commit without seeing each other's numbers. Zero-knowledge proofs can hide a single value, but they can't *compute over a growing pile of encrypted bids* to determine a winner. Fully Homomorphic Encryption (FHE) can — and it's composable, which is the whole point of Season 3.

## How it works

1. **Bid blind.** Each bidder encrypts an amount client-side in the browser. The ciphertext goes on-chain; the number never does.
2. **Compare encrypted.** The contract tracks the highest bid using FHE comparison (`FHE.gt` + `FHE.select`) — computing on data that stays encrypted throughout. While bidding is open, no one — not even the auctioneer — can see any bid or who's leading.
3. **Reveal only the winner.** After the auctioneer finalizes, only the winning bid is decrypted, to the authorized party. Every losing bid stays sealed.

Roles: **bidders** are anyone (no pre-registration); the **auctioneer** is the deploying wallet, the only address allowed to finalize and decrypt the winner.

## Tech stack

- **Contract:** Solidity 0.8.27, `@fhevm/solidity` (FHE, euint64, eaddress), Hardhat, deployed and verified on Sepolia.
- **Frontend:** Next.js (App Router) + TypeScript, wagmi v2 + viem, RainbowKit, `@zama-fhe/sdk` + `@zama-fhe/react-sdk` v3 for client-side encryption and user-decryption.
- **Hosting:** Vercel.

## Run locally

```bash
git clone https://github.com/nftkinging/cipherbid.git
cd cipherbid
npm install --legacy-peer-deps
cp env.local.example .env.local   # then fill in your own values
npm run dev
```

Open http://localhost:3000. You'll need:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — a free project ID from https://cloud.reown.com
- `NEXT_PUBLIC_SEPOLIA_RPC_URL` — a Sepolia RPC URL (Infura, Alchemy, etc.)

A browser wallet (e.g. MetaMask) on Sepolia with test ETH is required to bid.

> Note: `--legacy-peer-deps` is required because the wallet and FHE SDKs have overlapping peer-dependency ranges.

## Lifecycle (what the live demo shows)

Two separate wallets each submit an encrypted bid → "Sealed bids received" climbs while "Visible bid amounts" stays 0 → the auctioneer finalizes the round → the auctioneer authorizes decryption and the single winning bid is revealed (with the winner's address), while the losing bid remains encrypted on-chain.

## Security & dependencies

Cipherbid runs on Sepolia testnet. The contract is verified on Etherscan (exact-match source). `npm audit` reports advisories in **transitive** dependencies of the wallet and FHE SDKs (wagmi / RainbowKit / WalletConnect / Reown / MetaMask / Coinbase / `@zama-fhe`), all rooted in shared sub-packages (`viem`, `ws`, `uuid`, `postcss`). These are not reachable at runtime in this app — for example, `ws` is used as a client (not a server), and `postcss` runs only at build time on first-party CSS. The auto-offered fixes would downgrade Next.js and wagmi across major versions and break the build, so they are intentionally not applied. No secrets are committed; environment values are testnet, public-by-design `NEXT_PUBLIC_` keys.

## License

BSD-3-Clause-Clear (matching the Zama FHEVM libraries).