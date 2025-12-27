// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC3643 - Security Token Standard Interface
 * @notice Core interface for ERC-3643 compliant tokens
 * @dev Extends ERC-20 with identity and compliance integration
 */
interface IERC3643 {
    // Events
    event IdentityRegistryAdded(address indexed identityRegistry);
    event ComplianceAdded(address indexed compliance);
    event RecoverySuccess(address indexed lostWallet, address indexed newWallet, address indexed investorOnchainID);
    event AddressFrozen(address indexed addr, bool indexed isFrozen, address indexed owner);
    event TokensFrozen(address indexed addr, uint256 amount);
    event TokensUnfrozen(address indexed addr, uint256 amount);
    event Paused(address indexed account);
    event Unpaused(address indexed account);

    // Token Information
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);

    // ERC-20 Compatible
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    // Identity & Compliance
    function identityRegistry() external view returns (address);
    function compliance() external view returns (address);
    function setIdentityRegistry(address _identityRegistry) external;
    function setCompliance(address _compliance) external;

    // Freeze Functions
    function freezeAddress(address addr, bool freeze) external;
    function freezeTokens(address addr, uint256 amount) external;
    function unfreezeTokens(address addr, uint256 amount) external;
    function isFrozen(address addr) external view returns (bool);
    function getFrozenTokens(address addr) external view returns (uint256);

    // Pause Functions
    function pause() external;
    function unpause() external;
    function paused() external view returns (bool);

    // Recovery
    function recoveryAddress(address lostWallet, address newWallet, address investorOnchainID) external returns (bool);

    // Batch Operations
    function batchTransfer(address[] calldata toList, uint256[] calldata amounts) external;
    function batchFreezeAddress(address[] calldata addrList, bool[] calldata freezeList) external;

    // Mint & Burn
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

/**
 * @title IIdentityRegistry
 * @notice Interface for the Identity Registry contract
 * @dev Manages the link between investor wallets and their on-chain identity
 */
interface IIdentityRegistry {
    event IdentityRegistered(address indexed investorAddress, address indexed identity);
    event IdentityRemoved(address indexed investorAddress, address indexed identity);
    event IdentityUpdated(address indexed oldIdentity, address indexed newIdentity);
    event CountryUpdated(address indexed investorAddress, uint16 indexed country);
    event ClaimTopicsRegistrySet(address indexed claimTopicsRegistry);
    event TrustedIssuersRegistrySet(address indexed trustedIssuersRegistry);
    event IdentityStorageSet(address indexed identityStorage);

    // Identity Management
    function registerIdentity(address userAddress, address identity, uint16 country) external;
    function deleteIdentity(address userAddress) external;
    function updateIdentity(address userAddress, address identity) external;
    function updateCountry(address userAddress, uint16 country) external;

    // Verification
    function isVerified(address userAddress) external view returns (bool);
    function identity(address userAddress) external view returns (address);
    function investorCountry(address userAddress) external view returns (uint16);

    // Registry References
    function claimTopicsRegistry() external view returns (address);
    function trustedIssuersRegistry() external view returns (address);
    function identityStorage() external view returns (address);

    // Batch Operations
    function batchRegisterIdentity(
        address[] calldata userAddresses,
        address[] calldata identities,
        uint16[] calldata countries
    ) external;

    // Validation
    function contains(address userAddress) external view returns (bool);
}

/**
 * @title IClaimTopicsRegistry
 * @notice Interface for managing required claim topics
 * @dev Defines which claims are needed for token holders
 */
interface IClaimTopicsRegistry {
    event ClaimTopicAdded(uint256 indexed claimTopic);
    event ClaimTopicRemoved(uint256 indexed claimTopic);

    function addClaimTopic(uint256 claimTopic) external;
    function removeClaimTopic(uint256 claimTopic) external;
    function getClaimTopics() external view returns (uint256[] memory);
}

/**
 * @title ITrustedIssuersRegistry
 * @notice Interface for managing trusted claim issuers
 * @dev Tracks which issuers can attest to specific claim topics
 */
interface ITrustedIssuersRegistry {
    event TrustedIssuerAdded(address indexed trustedIssuer, uint256[] claimTopics);
    event TrustedIssuerRemoved(address indexed trustedIssuer);
    event ClaimTopicsUpdated(address indexed trustedIssuer, uint256[] claimTopics);

    function addTrustedIssuer(address trustedIssuer, uint256[] calldata claimTopics) external;
    function removeTrustedIssuer(address trustedIssuer) external;
    function updateIssuerClaimTopics(address trustedIssuer, uint256[] calldata claimTopics) external;

    function getTrustedIssuers() external view returns (address[] memory);
    function isTrustedIssuer(address issuer) external view returns (bool);
    function getTrustedIssuerClaimTopics(address trustedIssuer) external view returns (uint256[] memory);
    function hasClaimTopic(address issuer, uint256 claimTopic) external view returns (bool);
}

/**
 * @title ICompliance
 * @notice Interface for modular compliance rules
 * @dev Pluggable compliance engine for transfer validation
 */
interface ICompliance {
    event TokenBound(address indexed token);
    event TokenUnbound(address indexed token);

    function bindToken(address token) external;
    function unbindToken(address token) external;

    function canTransfer(address from, address to, uint256 amount) external view returns (bool);
    function transferred(address from, address to, uint256 amount) external;
    function created(address to, uint256 amount) external;
    function destroyed(address from, uint256 amount) external;

    function isTokenBound(address token) external view returns (bool);
}

/**
 * @title IIdentity (ONCHAINID)
 * @notice Simplified interface for on-chain identity contracts
 * @dev Represents a user's on-chain identity with claims
 */
interface IIdentity {
    function getClaim(bytes32 claimId) external view returns (
        uint256 topic,
        uint256 scheme,
        address issuer,
        bytes memory signature,
        bytes memory data,
        string memory uri
    );

    function getClaimIdsByTopic(uint256 topic) external view returns (bytes32[] memory claimIds);

    function addClaim(
        uint256 topic,
        uint256 scheme,
        address issuer,
        bytes calldata signature,
        bytes calldata data,
        string calldata uri
    ) external returns (bytes32 claimId);

    function removeClaim(bytes32 claimId) external returns (bool success);
}
