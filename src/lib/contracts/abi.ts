// Pre-compiled ABI for LoanToken contract
// Generated from contracts/LoanToken.sol

export const LoanTokenABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "string", "name": "_symbol", "type": "string" },
      { "internalType": "string", "name": "_borrowerName", "type": "string" },
      { "internalType": "uint256", "name": "_facilityAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "_interestRateBps", "type": "uint256" },
      { "internalType": "uint256", "name": "_maturityDate", "type": "uint256" },
      { "internalType": "string", "name": "_nelProtocolId", "type": "string" },
      { "internalType": "bytes32", "name": "_documentHash", "type": "bytes32" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "partition", "type": "bytes32" },
      { "internalType": "address", "name": "tokenHolder", "type": "address" }
    ],
    "name": "balanceOfByPartition",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "value", "type": "uint256" },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "canTransfer",
    "outputs": [
      { "internalType": "bytes1", "name": "reasonCode", "type": "bytes1" },
      { "internalType": "bytes32", "name": "appCode", "type": "bytes32" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "partition", "type": "bytes32" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "value", "type": "uint256" },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "canTransferByPartition",
    "outputs": [
      { "internalType": "bytes1", "name": "reasonCode", "type": "bytes1" },
      { "internalType": "bytes32", "name": "appCode", "type": "bytes32" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "partition", "type": "bytes32" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "value", "type": "uint256" },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "transferByPartition",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "tokenHolder", "type": "address" },
      { "internalType": "uint256", "name": "value", "type": "uint256" },
      { "internalType": "bytes32", "name": "partition", "type": "bytes32" }
    ],
    "name": "issue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "value", "type": "uint256" },
      { "internalType": "bytes32", "name": "partition", "type": "bytes32" }
    ],
    "name": "redeem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "bool", "name": "approved", "type": "bool" }
    ],
    "name": "setKYCStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "bool", "name": "accredited", "type": "bool" }
    ],
    "name": "setAccreditedStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "uint256", "name": "endTime", "type": "uint256" }
    ],
    "name": "setLockup",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLoanSummary",
    "outputs": [
      { "internalType": "string", "name": "borrowerName", "type": "string" },
      { "internalType": "uint256", "name": "facilityAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "interestRateBps", "type": "uint256" },
      { "internalType": "uint256", "name": "maturityDate", "type": "uint256" },
      { "internalType": "string", "name": "nelProtocolId", "type": "string" },
      { "internalType": "uint256", "name": "_totalSupply", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "getComplianceStatus",
    "outputs": [
      { "internalType": "bool", "name": "kyc", "type": "bool" },
      { "internalType": "bool", "name": "accredited", "type": "bool" },
      { "internalType": "uint256", "name": "lockupEnd", "type": "uint256" },
      { "internalType": "bool", "name": "canCurrentlyTransfer", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "isKYCApproved",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "isAccreditedInvestor",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "loanDetails",
    "outputs": [
      { "internalType": "string", "name": "borrowerName", "type": "string" },
      { "internalType": "uint256", "name": "facilityAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "interestRateBps", "type": "uint256" },
      { "internalType": "uint256", "name": "maturityDate", "type": "uint256" },
      { "internalType": "string", "name": "nelProtocolId", "type": "string" },
      { "internalType": "bytes32", "name": "documentHash", "type": "bytes32" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "addr", "type": "address" }],
    "name": "isFrozen",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "addr", "type": "address" }],
    "name": "getFrozenTokens",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "frozen",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "frozenTokens",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "bytes32", "name": "partition", "type": "bytes32" }
    ],
    "name": "Issued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "partition", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
    ],
    "name": "TransferByPartition",
    "type": "event"
  }
] as const;

export const LoanTokenFactoryABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "string", "name": "_symbol", "type": "string" },
      { "internalType": "string", "name": "_borrowerName", "type": "string" },
      { "internalType": "uint256", "name": "_facilityAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "_interestRateBps", "type": "uint256" },
      { "internalType": "uint256", "name": "_maturityDate", "type": "uint256" },
      { "internalType": "string", "name": "_nelProtocolId", "type": "string" },
      { "internalType": "bytes32", "name": "_documentHash", "type": "bytes32" }
    ],
    "name": "createLoanToken",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDeployedTokens",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDeployedTokensCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "nelId", "type": "string" }],
    "name": "getTokenByNelId",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "tokenAddress", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "symbol", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "borrowerName", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "facilityAmount", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "nelProtocolId", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "creator", "type": "address" }
    ],
    "name": "LoanTokenCreated",
    "type": "event"
  }
] as const;

// ERC-3643 Identity Registry ABI
export const IdentityRegistryABI = [
  {
    inputs: [
      { name: "userAddress", type: "address" },
      { name: "identity", type: "address" },
      { name: "country", type: "uint16" }
    ],
    name: "registerIdentity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "userAddress", type: "address" }],
    name: "deleteIdentity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "userAddress", type: "address" }],
    name: "isVerified",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "userAddress", type: "address" }],
    name: "identity",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "userAddress", type: "address" }],
    name: "investorCountry",
    outputs: [{ type: "uint16" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "userAddresses", type: "address[]" },
      { name: "identities", type: "address[]" },
      { name: "countries", type: "uint16[]" }
    ],
    name: "batchRegisterIdentity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "userAddress", type: "address" },
      { name: "country", type: "uint16" }
    ],
    name: "updateCountry",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "userAddress", type: "address" },
      { name: "identity", type: "address" }
    ],
    name: "updateIdentity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "investorAddress", type: "address" },
      { indexed: true, name: "identity", type: "address" }
    ],
    name: "IdentityRegistered",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "investorAddress", type: "address" },
      { indexed: true, name: "identity", type: "address" }
    ],
    name: "IdentityRemoved",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "investorAddress", type: "address" },
      { indexed: true, name: "identity", type: "address" }
    ],
    name: "IdentityUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "investorAddress", type: "address" },
      { indexed: false, name: "country", type: "uint16" }
    ],
    name: "CountryUpdated",
    type: "event"
  },
] as const;

// ERC-3643 Compliance Module ABI
export const ComplianceABI = [
  {
    inputs: [{ name: "token", type: "address" }],
    name: "bindToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "unbindToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "canTransfer",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "transferred",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "created",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "destroyed",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "country", type: "uint16" },
      { name: "blacklisted", type: "bool" }
    ],
    name: "setCountryRestriction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "country", type: "uint16" }],
    name: "isCountryBlacklisted",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "investor", type: "address" },
      { name: "endTime", type: "uint256" }
    ],
    name: "setTransferLockup",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "investor", type: "address" }],
    name: "getLockupEnd",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "maxHolders", type: "uint256" }],
    name: "setMaxHolders",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getMaxHolders",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "country", type: "uint16" },
      { indexed: false, name: "blacklisted", type: "bool" }
    ],
    name: "CountryRestrictionSet",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "investor", type: "address" },
      { indexed: false, name: "endTime", type: "uint256" }
    ],
    name: "TransferLockupSet",
    type: "event"
  },
] as const;

// ERC-3643 Claim Topics Registry ABI
export const ClaimTopicsRegistryABI = [
  {
    inputs: [{ name: "claimTopic", type: "uint256" }],
    name: "addClaimTopic",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "claimTopic", type: "uint256" }],
    name: "removeClaimTopic",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getClaimTopics",
    outputs: [{ type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "claimTopic", type: "uint256" }],
    name: "ClaimTopicAdded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "claimTopic", type: "uint256" }],
    name: "ClaimTopicRemoved",
    type: "event"
  },
] as const;

// ERC-3643 Trusted Issuers Registry ABI
export const TrustedIssuersRegistryABI = [
  {
    inputs: [
      { name: "trustedIssuer", type: "address" },
      { name: "claimTopics", type: "uint256[]" }
    ],
    name: "addTrustedIssuer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "trustedIssuer", type: "address" }],
    name: "removeTrustedIssuer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "trustedIssuer", type: "address" },
      { name: "claimTopics", type: "uint256[]" }
    ],
    name: "updateIssuerClaimTopics",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getTrustedIssuers",
    outputs: [{ type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "issuer", type: "address" }],
    name: "isTrustedIssuer",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "issuer", type: "address" }],
    name: "getTrustedIssuerClaimTopics",
    outputs: [{ type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "issuer", type: "address" },
      { name: "claimTopic", type: "uint256" }
    ],
    name: "hasClaimTopic",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "trustedIssuer", type: "address" },
      { indexed: false, name: "claimTopics", type: "uint256[]" }
    ],
    name: "TrustedIssuerAdded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "trustedIssuer", type: "address" }],
    name: "TrustedIssuerRemoved",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "trustedIssuer", type: "address" },
      { indexed: false, name: "claimTopics", type: "uint256[]" }
    ],
    name: "ClaimTopicsUpdated",
    type: "event"
  },
] as const;
