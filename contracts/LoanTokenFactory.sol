// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LoanToken.sol";
import "./erc3643/IdentityRegistry.sol";
import "./erc3643/ClaimTopicsRegistry.sol";
import "./erc3643/TrustedIssuersRegistry.sol";
import "./erc3643/Compliance.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LoanTokenFactory
 * @notice Factory contract for deploying ERC-3643 tokenized loans
 * @dev Creates LoanTokens with full ERC-3643 compliance infrastructure
 * 
 * ERC-3643 Deployment Strategy:
 * - Uses shared ClaimTopicsRegistry and TrustedIssuersRegistry across all tokens
 * - Creates new IdentityRegistry and Compliance per token for flexibility
 * - Allows tokens to share identity infrastructure while having custom compliance rules
 */
contract LoanTokenFactory is Ownable {
    // ============ Shared ERC-3643 Infrastructure ============
    ClaimTopicsRegistry public sharedClaimTopicsRegistry;
    TrustedIssuersRegistry public sharedTrustedIssuersRegistry;
    
    // ============ State ============
    address[] public deployedTokens;
    mapping(address => bool) public isDeployedToken;
    mapping(string => address) public tokenByNelId; // NEL Protocol ID -> Token address
    
    // Per-token infrastructure
    mapping(address => address) public tokenIdentityRegistry;
    mapping(address => address) public tokenCompliance;
    
    // ============ Events ============
    event LoanTokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        string borrowerName,
        uint256 facilityAmount,
        string nelProtocolId,
        address indexed creator,
        address identityRegistry,
        address compliance
    );
    
    event SharedInfrastructureDeployed(
        address claimTopicsRegistry,
        address trustedIssuersRegistry
    );

    // ============ Constructor ============
    constructor() Ownable(msg.sender) {
        // Deploy shared ERC-3643 infrastructure
        sharedClaimTopicsRegistry = new ClaimTopicsRegistry();
        sharedTrustedIssuersRegistry = new TrustedIssuersRegistry();
        
        // Transfer ownership of shared registries to factory owner
        sharedClaimTopicsRegistry.transferOwnership(msg.sender);
        sharedTrustedIssuersRegistry.transferOwnership(msg.sender);
        
        emit SharedInfrastructureDeployed(
            address(sharedClaimTopicsRegistry),
            address(sharedTrustedIssuersRegistry)
        );
    }

    // ============ Factory Function ============
    /**
     * @notice Create a new ERC-3643 compliant loan token with full infrastructure
     * @dev Deploys token with dedicated IdentityRegistry and Compliance contracts
     */
    function createLoanToken(
        string memory _name,
        string memory _symbol,
        string memory _borrowerName,
        uint256 _facilityAmount,
        uint256 _interestRateBps,
        uint256 _maturityDate,
        string memory _nelProtocolId,
        bytes32 _documentHash
    ) external returns (address) {
        require(tokenByNelId[_nelProtocolId] == address(0), "NEL_ID_EXISTS");
        
        // Deploy per-token ERC-3643 infrastructure
        IdentityRegistry newIdentityRegistry = new IdentityRegistry(
            address(sharedClaimTopicsRegistry),
            address(sharedTrustedIssuersRegistry)
        );
        
        Compliance newCompliance = new Compliance();
        
        // Deploy the token with ERC-3643 components
        LoanToken newToken = new LoanToken(
            _name,
            _symbol,
            _borrowerName,
            _facilityAmount,
            _interestRateBps,
            _maturityDate,
            _nelProtocolId,
            _documentHash,
            address(newIdentityRegistry),
            address(newCompliance)
        );
        
        address tokenAddress = address(newToken);
        
        // Bind compliance to token
        newCompliance.bindToken(tokenAddress);
        
        // Transfer ownership to the caller
        newToken.transferOwnership(msg.sender);
        newIdentityRegistry.transferOwnership(msg.sender);
        newCompliance.transferOwnership(msg.sender);
        
        // Track deployment
        deployedTokens.push(tokenAddress);
        isDeployedToken[tokenAddress] = true;
        tokenByNelId[_nelProtocolId] = tokenAddress;
        tokenIdentityRegistry[tokenAddress] = address(newIdentityRegistry);
        tokenCompliance[tokenAddress] = address(newCompliance);
        
        emit LoanTokenCreated(
            tokenAddress,
            _name,
            _symbol,
            _borrowerName,
            _facilityAmount,
            _nelProtocolId,
            msg.sender,
            address(newIdentityRegistry),
            address(newCompliance)
        );
        
        return tokenAddress;
    }

    // ============ View Functions ============
    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }

    function getDeployedTokensCount() external view returns (uint256) {
        return deployedTokens.length;
    }

    function getTokenByNelId(string memory nelId) external view returns (address) {
        return tokenByNelId[nelId];
    }

    /**
     * @notice Get all ERC-3643 infrastructure for a token
     */
    function getTokenInfrastructure(address token) external view returns (
        address _identityRegistry,
        address _compliance,
        address _claimTopicsRegistry,
        address _trustedIssuersRegistry
    ) {
        return (
            tokenIdentityRegistry[token],
            tokenCompliance[token],
            address(sharedClaimTopicsRegistry),
            address(sharedTrustedIssuersRegistry)
        );
    }
}
