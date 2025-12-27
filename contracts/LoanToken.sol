// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./erc3643/IERC3643.sol";

/**
 * @title LoanToken (ERC-3643 Security Token)
 * @notice Tokenized syndicated loan with on-chain identity verification and modular compliance
 * @dev Implements ERC-3643 standard for LMA loan tokenization with claim-based verification
 * 
 * ERC-3643 Advantages leveraged:
 * - On-chain Identity Registry: Centralized identity management with ONCHAINID
 * - Claim-based Verification: Signed attestations from trusted issuers (KYC, accreditation)
 * - Modular Compliance: Pluggable rules that can be updated without redeployment
 * - Token Recovery: Ability to recover tokens if investor loses wallet access
 * - Better Scalability: Shared identity infrastructure across multiple tokens
 */
contract LoanToken is Ownable, ReentrancyGuard {
    // ============ Token Metadata ============
    string public name;
    string public symbol;
    uint8 public constant decimals = 0; // Whole units only for loan positions
    uint256 public totalSupply;

    // ============ ERC-3643 Components ============
    IIdentityRegistry public identityRegistry;
    ICompliance public compliance;

    // ============ Loan Details ============
    struct LoanDetails {
        string borrowerName;
        uint256 facilityAmount; // In USD cents to avoid decimals
        uint256 interestRateBps; // Basis points (e.g., 500 = 5%)
        uint256 maturityDate;
        string nelProtocolId; // NEL Protocol reference ID
        bytes32 documentHash; // Hash of loan agreement
    }
    
    LoanDetails public loanDetails;

    // ============ Partitions (maintained for loan-specific needs) ============
    bytes32 public constant PRIMARY_PARTITION = keccak256("PRIMARY");
    bytes32 public constant SECONDARY_PARTITION = keccak256("SECONDARY");
    
    mapping(bytes32 => mapping(address => uint256)) private _balancesByPartition;
    mapping(address => uint256) private _totalBalances;
    bytes32[] private _partitions;

    // ============ Freeze & Pause (ERC-3643) ============
    bool public paused;
    mapping(address => bool) public frozen;
    mapping(address => uint256) public frozenTokens;

    // ============ Transfer Reason Codes (EIP-1066 compatible) ============
    bytes1 public constant SUCCESS = 0x51;
    bytes1 public constant INSUFFICIENT_BALANCE = 0x52;
    bytes1 public constant FUNDS_LOCKED = 0x55;
    bytes1 public constant INVALID_SENDER = 0x56;
    bytes1 public constant INVALID_RECEIVER = 0x57;
    bytes1 public constant COMPLIANCE_FAILURE = 0x58;

    // ============ Document Management ============
    struct Document {
        string uri;
        bytes32 documentHash;
        uint256 lastModified;
    }
    
    mapping(bytes32 => Document) private _documents;
    bytes32[] private _documentNames;

    // ============ Controller (for regulatory actions) ============
    address public controller;
    bool public isControllable = true;

    // ============ Events ============
    event Issued(address indexed to, uint256 amount, bytes32 partition);
    event Redeemed(address indexed from, uint256 amount, bytes32 partition);
    event TransferByPartition(
        bytes32 indexed partition,
        address indexed from,
        address indexed to,
        uint256 value
    );
    event DocumentUpdated(bytes32 indexed name, string uri, bytes32 documentHash);
    event ControllerTransfer(
        address controller,
        address indexed from,
        address indexed to,
        uint256 value,
        bytes data,
        bytes operatorData
    );
    
    // ERC-3643 specific events
    event IdentityRegistrySet(address indexed identityRegistry);
    event ComplianceSet(address indexed compliance);
    event AddressFrozen(address indexed addr, bool indexed isFrozen);
    event TokensFrozen(address indexed addr, uint256 amount);
    event TokensUnfrozen(address indexed addr, uint256 amount);
    event Paused(address indexed account);
    event Unpaused(address indexed account);
    event RecoverySuccess(address indexed lostWallet, address indexed newWallet, address indexed investorIdentity);

    // ============ Modifiers ============
    modifier whenNotPaused() {
        require(!paused, "TOKEN_PAUSED");
        _;
    }

    modifier whenNotFrozen(address account) {
        require(!frozen[account], "ADDRESS_FROZEN");
        _;
    }

    // ============ Constructor ============
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _borrowerName,
        uint256 _facilityAmount,
        uint256 _interestRateBps,
        uint256 _maturityDate,
        string memory _nelProtocolId,
        bytes32 _documentHash,
        address _identityRegistry,
        address _compliance
    ) Ownable(msg.sender) {
        name = _name;
        symbol = _symbol;
        controller = msg.sender;
        
        loanDetails = LoanDetails({
            borrowerName: _borrowerName,
            facilityAmount: _facilityAmount,
            interestRateBps: _interestRateBps,
            maturityDate: _maturityDate,
            nelProtocolId: _nelProtocolId,
            documentHash: _documentHash
        });
        
        _partitions.push(PRIMARY_PARTITION);
        _partitions.push(SECONDARY_PARTITION);

        // Set ERC-3643 components
        if (_identityRegistry != address(0)) {
            identityRegistry = IIdentityRegistry(_identityRegistry);
            emit IdentityRegistrySet(_identityRegistry);
        }
        if (_compliance != address(0)) {
            compliance = ICompliance(_compliance);
            emit ComplianceSet(_compliance);
        }
    }

    // ============ ERC-3643: Identity & Compliance Setters ============
    function setIdentityRegistry(address _identityRegistry) external onlyOwner {
        require(_identityRegistry != address(0), "INVALID_REGISTRY");
        identityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistrySet(_identityRegistry);
    }

    function setCompliance(address _compliance) external onlyOwner {
        require(_compliance != address(0), "INVALID_COMPLIANCE");
        compliance = ICompliance(_compliance);
        emit ComplianceSet(_compliance);
    }

    // ============ ERC-20 Compatible Views ============
    function balanceOf(address account) external view returns (uint256) {
        return _totalBalances[account];
    }

    // ============ Partitioned Balances ============
    function balanceOfByPartition(bytes32 partition, address tokenHolder) 
        external 
        view 
        returns (uint256) 
    {
        return _balancesByPartition[partition][tokenHolder];
    }

    function partitionsOf(address /*tokenHolder*/) external view returns (bytes32[] memory) {
        return _partitions;
    }

    // ============ ERC-3643: Transfer Validation ============
    /**
     * @notice Check if transfer is allowed using claim-based verification
     * @dev Uses Identity Registry to verify sender/receiver have valid claims
     */
    function canTransfer(
        address to,
        uint256 value,
        bytes calldata /*data*/
    ) external view returns (bytes1 reasonCode, bytes32 appCode) {
        return _canTransfer(msg.sender, to, value, PRIMARY_PARTITION);
    }

    function canTransferByPartition(
        bytes32 partition,
        address to,
        uint256 value,
        bytes calldata /*data*/
    ) external view returns (bytes1 reasonCode, bytes32 appCode) {
        return _canTransfer(msg.sender, to, value, partition);
    }

    /**
     * @notice Internal transfer validation using ERC-3643 components
     * @dev Checks identity registry for claim verification, then compliance rules
     */
    function _canTransfer(
        address from,
        address to,
        uint256 value,
        bytes32 partition
    ) internal view returns (bytes1 reasonCode, bytes32 appCode) {
        // Check paused state
        if (paused) {
            return (FUNDS_LOCKED, bytes32("TOKEN_PAUSED"));
        }

        // Check frozen addresses
        if (frozen[from]) {
            return (INVALID_SENDER, bytes32("SENDER_FROZEN"));
        }
        if (frozen[to]) {
            return (INVALID_RECEIVER, bytes32("RECEIVER_FROZEN"));
        }

        // ERC-3643: Verify sender identity through Identity Registry
        if (address(identityRegistry) != address(0)) {
            if (!identityRegistry.isVerified(from)) {
                return (INVALID_SENDER, bytes32("SENDER_NOT_VERIFIED"));
            }
            
            // ERC-3643: Verify receiver identity through Identity Registry
            if (!identityRegistry.isVerified(to)) {
                return (INVALID_RECEIVER, bytes32("RECEIVER_NOT_VERIFIED"));
            }
        }

        // ERC-3643: Check modular compliance rules
        if (address(compliance) != address(0)) {
            if (!compliance.canTransfer(from, to, value)) {
                return (COMPLIANCE_FAILURE, bytes32("COMPLIANCE_FAILED"));
            }
        }

        // Check frozen tokens
        uint256 availableBalance = _balancesByPartition[partition][from] - frozenTokens[from];
        if (availableBalance < value) {
            return (INSUFFICIENT_BALANCE, bytes32("INSUFFICIENT_BAL"));
        }
        
        return (SUCCESS, bytes32(0));
    }

    // ============ Transfer Functions ============
    function transferByPartition(
        bytes32 partition,
        address to,
        uint256 value,
        bytes calldata data
    ) external nonReentrant whenNotPaused whenNotFrozen(msg.sender) returns (bytes32) {
        (bytes1 reasonCode, bytes32 appCode) = _canTransfer(msg.sender, to, value, partition);
        require(reasonCode == SUCCESS, string(abi.encodePacked("TRANSFER_FAILED:", appCode)));
        
        _transferByPartition(partition, msg.sender, to, value);
        
        // Notify compliance of the transfer
        if (address(compliance) != address(0)) {
            compliance.transferred(msg.sender, to, value);
        }
        
        emit TransferByPartition(partition, msg.sender, to, value);
        
        return partition;
    }

    function _transferByPartition(
        bytes32 partition,
        address from,
        address to,
        uint256 value
    ) internal {
        _balancesByPartition[partition][from] -= value;
        _balancesByPartition[partition][to] += value;
        _totalBalances[from] -= value;
        _totalBalances[to] += value;
    }

    // ============ Issuance (Owner only) ============
    /**
     * @notice Issue tokens to verified investor
     * @dev Uses Identity Registry to verify holder has required claims
     */
    function issue(
        address tokenHolder,
        uint256 value,
        bytes32 partition
    ) external onlyOwner {
        // ERC-3643: Verify through Identity Registry instead of local flags
        if (address(identityRegistry) != address(0)) {
            require(identityRegistry.isVerified(tokenHolder), "HOLDER_NOT_VERIFIED");
        }
        
        _balancesByPartition[partition][tokenHolder] += value;
        _totalBalances[tokenHolder] += value;
        totalSupply += value;
        
        // Notify compliance of creation
        if (address(compliance) != address(0)) {
            compliance.created(tokenHolder, value);
        }
        
        emit Issued(tokenHolder, value, partition);
    }

    // ============ Redemption ============
    function redeem(uint256 value, bytes32 partition) external nonReentrant whenNotPaused {
        require(_balancesByPartition[partition][msg.sender] >= value, "INSUFFICIENT_BALANCE");
        require(_balancesByPartition[partition][msg.sender] - frozenTokens[msg.sender] >= value, "TOKENS_FROZEN");
        
        _balancesByPartition[partition][msg.sender] -= value;
        _totalBalances[msg.sender] -= value;
        totalSupply -= value;
        
        // Notify compliance of destruction
        if (address(compliance) != address(0)) {
            compliance.destroyed(msg.sender, value);
        }
        
        emit Redeemed(msg.sender, value, partition);
    }

    // ============ ERC-3643: Freeze Functions ============
    function freezeAddress(address addr, bool freeze) external onlyOwner {
        frozen[addr] = freeze;
        emit AddressFrozen(addr, freeze);
    }

    function freezeTokens(address addr, uint256 amount) external onlyOwner {
        require(_totalBalances[addr] >= frozenTokens[addr] + amount, "EXCEEDS_BALANCE");
        frozenTokens[addr] += amount;
        emit TokensFrozen(addr, amount);
    }

    function unfreezeTokens(address addr, uint256 amount) external onlyOwner {
        require(frozenTokens[addr] >= amount, "EXCEEDS_FROZEN");
        frozenTokens[addr] -= amount;
        emit TokensUnfrozen(addr, amount);
    }

    function isFrozen(address addr) external view returns (bool) {
        return frozen[addr];
    }

    function getFrozenTokens(address addr) external view returns (uint256) {
        return frozenTokens[addr];
    }

    // ============ ERC-3643: Pause Functions ============
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ============ ERC-3643: Recovery Function ============
    /**
     * @notice Recover tokens from lost wallet to new wallet
     * @dev Allows token recovery if investor loses private key but can prove identity
     */
    function recoveryAddress(
        address lostWallet,
        address newWallet,
        address investorIdentity
    ) external onlyOwner returns (bool) {
        require(lostWallet != address(0) && newWallet != address(0), "INVALID_ADDRESSES");
        
        // Verify the new wallet is registered to the same identity
        if (address(identityRegistry) != address(0)) {
            require(identityRegistry.identity(newWallet) == investorIdentity, "IDENTITY_MISMATCH");
        }

        // Transfer all tokens from lost wallet to new wallet
        uint256 balance = _totalBalances[lostWallet];
        if (balance > 0) {
            // Transfer PRIMARY partition
            uint256 primaryBalance = _balancesByPartition[PRIMARY_PARTITION][lostWallet];
            if (primaryBalance > 0) {
                _transferByPartition(PRIMARY_PARTITION, lostWallet, newWallet, primaryBalance);
            }
            
            // Transfer SECONDARY partition
            uint256 secondaryBalance = _balancesByPartition[SECONDARY_PARTITION][lostWallet];
            if (secondaryBalance > 0) {
                _transferByPartition(SECONDARY_PARTITION, lostWallet, newWallet, secondaryBalance);
            }
        }

        // Transfer frozen tokens designation
        if (frozenTokens[lostWallet] > 0) {
            frozenTokens[newWallet] = frozenTokens[lostWallet];
            frozenTokens[lostWallet] = 0;
        }

        emit RecoverySuccess(lostWallet, newWallet, investorIdentity);
        return true;
    }

    // ============ Document Management ============
    function setDocument(
        bytes32 _name,
        string calldata _uri,
        bytes32 _documentHash
    ) external onlyOwner {
        if (_documents[_name].lastModified == 0) {
            _documentNames.push(_name);
        }
        
        _documents[_name] = Document({
            uri: _uri,
            documentHash: _documentHash,
            lastModified: block.timestamp
        });
        
        emit DocumentUpdated(_name, _uri, _documentHash);
    }

    function getDocument(bytes32 _name) 
        external 
        view 
        returns (string memory uri, bytes32 documentHash, uint256 lastModified) 
    {
        Document memory doc = _documents[_name];
        return (doc.uri, doc.documentHash, doc.lastModified);
    }

    function getAllDocuments() external view returns (bytes32[] memory) {
        return _documentNames;
    }

    // ============ Controller Operations ============
    function controllerTransfer(
        address from,
        address to,
        uint256 value,
        bytes calldata data,
        bytes calldata operatorData
    ) external {
        require(msg.sender == controller, "NOT_CONTROLLER");
        require(isControllable, "NOT_CONTROLLABLE");
        require(_totalBalances[from] >= value, "INSUFFICIENT_BALANCE");
        
        // Force transfer bypassing compliance (for regulatory enforcement)
        _transferByPartition(PRIMARY_PARTITION, from, to, value);
        
        emit ControllerTransfer(msg.sender, from, to, value, data, operatorData);
    }

    function setController(address newController) external onlyOwner {
        controller = newController;
    }

    function setControllable(bool _isControllable) external onlyOwner {
        isControllable = _isControllable;
    }

    // ============ Loan Details Update ============
    function updateNelProtocolId(string calldata _nelProtocolId) external onlyOwner {
        loanDetails.nelProtocolId = _nelProtocolId;
    }

    function updateDocumentHash(bytes32 _documentHash) external onlyOwner {
        loanDetails.documentHash = _documentHash;
    }

    // ============ View Helpers ============
    function getLoanSummary() external view returns (
        string memory borrowerName,
        uint256 facilityAmount,
        uint256 interestRateBps,
        uint256 maturityDate,
        string memory nelProtocolId,
        uint256 _totalSupply
    ) {
        return (
            loanDetails.borrowerName,
            loanDetails.facilityAmount,
            loanDetails.interestRateBps,
            loanDetails.maturityDate,
            loanDetails.nelProtocolId,
            totalSupply
        );
    }

    /**
     * @notice Get compliance status using ERC-3643 Identity Registry
     * @dev Returns verification status from external identity system
     */
    function getComplianceStatus(address account) external view returns (
        bool verified,
        bool addressFrozen,
        uint256 frozenAmount,
        bool canCurrentlyTransfer
    ) {
        verified = address(identityRegistry) == address(0) || identityRegistry.isVerified(account);
        addressFrozen = frozen[account];
        frozenAmount = frozenTokens[account];
        canCurrentlyTransfer = verified && !addressFrozen && !paused;
    }

    /**
     * @notice Get investor country from Identity Registry
     */
    function getInvestorCountry(address account) external view returns (uint16) {
        if (address(identityRegistry) == address(0)) {
            return 0;
        }
        return identityRegistry.investorCountry(account);
    }
}
