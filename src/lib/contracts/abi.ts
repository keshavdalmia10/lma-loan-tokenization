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
