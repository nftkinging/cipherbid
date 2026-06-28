// Your deployed SealedBidAuction on Sepolia.
export const AUCTION_ADDRESS =
  "0xd17a8517ab440Bd77372c7646EF5d4B0E53F1611" as const;

// Minimal ABI for the functions/events the frontend uses.
// Note: FHE handle types (externalEuint64, euint64, eaddress) are all `bytes32`
// at the ABI level; the encryption proof is `bytes`.
export const AUCTION_ABI = [
  { type: "function", name: "auctioneer", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "title", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "endTime", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "finalized", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "bidCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "hasBid", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "bool" }] },
  {
    type: "function",
    name: "submitBid",
    stateMutability: "nonpayable",
    inputs: [{ name: "encryptedBid", type: "bytes32" }, { name: "inputProof", type: "bytes" }],
    outputs: [],
  },
  { type: "function", name: "finalizeAuction", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "getHighestBid", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "getHighestBidder", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
  { type: "event", name: "BidSubmitted", inputs: [{ name: "bidder", type: "address", indexed: true }] },
  { type: "event", name: "AuctionFinalized", inputs: [] },
] as const;
