// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC3643.sol";

/**
 * @title IdentityRegistryStorage
 * @notice Storage contract for identity data
 * @dev Separates storage from logic for upgradability
 */
contract IdentityRegistryStorage is Ownable {
    // Mapping: wallet address => identity contract address
    mapping(address => address) private _identities;
    // Mapping: wallet address => country code (ISO 3166-1 numeric)
    mapping(address => uint16) private _countries;
    // List of all registered wallets
    address[] private _registeredAddresses;
    mapping(address => bool) private _isRegistered;

    // Authorized agents (Identity Registry contracts)
    mapping(address => bool) private _agents;

    event AgentAdded(address indexed agent);
    event AgentRemoved(address indexed agent);

    constructor() Ownable(msg.sender) {}

    modifier onlyAgent() {
        require(_agents[msg.sender] || msg.sender == owner(), "NOT_AUTHORIZED");
        _;
    }

    function addAgent(address agent) external onlyOwner {
        require(agent != address(0), "INVALID_AGENT");
        _agents[agent] = true;
        emit AgentAdded(agent);
    }

    function removeAgent(address agent) external onlyOwner {
        _agents[agent] = false;
        emit AgentRemoved(agent);
    }

    function isAgent(address agent) external view returns (bool) {
        return _agents[agent];
    }

    function addIdentityToStorage(
        address userAddress,
        address identity,
        uint16 country
    ) external onlyAgent {
        require(!_isRegistered[userAddress], "ALREADY_REGISTERED");
        _identities[userAddress] = identity;
        _countries[userAddress] = country;
        _registeredAddresses.push(userAddress);
        _isRegistered[userAddress] = true;
    }

    function modifyStoredIdentity(address userAddress, address identity) external onlyAgent {
        require(_isRegistered[userAddress], "NOT_REGISTERED");
        _identities[userAddress] = identity;
    }

    function modifyStoredCountry(address userAddress, uint16 country) external onlyAgent {
        require(_isRegistered[userAddress], "NOT_REGISTERED");
        _countries[userAddress] = country;
    }

    function removeIdentityFromStorage(address userAddress) external onlyAgent {
        require(_isRegistered[userAddress], "NOT_REGISTERED");
        delete _identities[userAddress];
        delete _countries[userAddress];
        _isRegistered[userAddress] = false;
        
        // Remove from array
        for (uint256 i = 0; i < _registeredAddresses.length; i++) {
            if (_registeredAddresses[i] == userAddress) {
                _registeredAddresses[i] = _registeredAddresses[_registeredAddresses.length - 1];
                _registeredAddresses.pop();
                break;
            }
        }
    }

    function storedIdentity(address userAddress) external view returns (address) {
        return _identities[userAddress];
    }

    function storedCountry(address userAddress) external view returns (uint16) {
        return _countries[userAddress];
    }

    function contains(address userAddress) external view returns (bool) {
        return _isRegistered[userAddress];
    }

    function getRegisteredAddresses() external view returns (address[] memory) {
        return _registeredAddresses;
    }
}

/**
 * @title IdentityRegistry
 * @notice Central registry linking investor wallets to on-chain identities
 * @dev Core ERC-3643 component for compliance verification
 */
contract IdentityRegistry is IIdentityRegistry, Ownable {
    // Registry references
    IdentityRegistryStorage private _identityStorage;
    IClaimTopicsRegistry private _claimTopicsRegistry;
    ITrustedIssuersRegistry private _trustedIssuersRegistry;

    // Claim verification scheme (signature = 1)
    uint256 public constant SIGNATURE_SCHEME = 1;

    constructor(
        address claimTopicsRegistryAddr,
        address trustedIssuersRegistryAddr
    ) Ownable(msg.sender) {
        require(claimTopicsRegistryAddr != address(0), "INVALID_CLAIM_TOPICS");
        require(trustedIssuersRegistryAddr != address(0), "INVALID_TRUSTED_ISSUERS");

        _claimTopicsRegistry = IClaimTopicsRegistry(claimTopicsRegistryAddr);
        _trustedIssuersRegistry = ITrustedIssuersRegistry(trustedIssuersRegistryAddr);
        
        // Deploy and set up storage
        _identityStorage = new IdentityRegistryStorage();
        _identityStorage.addAgent(address(this));

        emit ClaimTopicsRegistrySet(claimTopicsRegistryAddr);
        emit TrustedIssuersRegistrySet(trustedIssuersRegistryAddr);
        emit IdentityStorageSet(address(_identityStorage));
    }

    /**
     * @notice Register an identity for a wallet address
     * @param userAddress The investor's wallet address
     * @param identityAddr The on-chain identity contract address
     * @param country The investor's country code (ISO 3166-1 numeric)
     */
    function registerIdentity(
        address userAddress,
        address identityAddr,
        uint16 country
    ) external override onlyOwner {
        require(userAddress != address(0), "INVALID_USER_ADDRESS");
        require(identityAddr != address(0), "INVALID_IDENTITY");
        
        _identityStorage.addIdentityToStorage(userAddress, identityAddr, country);
        emit IdentityRegistered(userAddress, identityAddr);
    }

    /**
     * @notice Remove an identity registration
     * @param userAddress The wallet address to remove
     */
    function deleteIdentity(address userAddress) external override onlyOwner {
        address identityAddr = _identityStorage.storedIdentity(userAddress);
        _identityStorage.removeIdentityFromStorage(userAddress);
        emit IdentityRemoved(userAddress, identityAddr);
    }

    /**
     * @notice Update the identity contract for a user
     * @param userAddress The wallet address
     * @param identityAddr The new identity contract address
     */
    function updateIdentity(
        address userAddress,
        address identityAddr
    ) external override onlyOwner {
        require(identityAddr != address(0), "INVALID_IDENTITY");
        address oldIdentity = _identityStorage.storedIdentity(userAddress);
        _identityStorage.modifyStoredIdentity(userAddress, identityAddr);
        emit IdentityUpdated(oldIdentity, identityAddr);
    }

    /**
     * @notice Update the country for a user
     * @param userAddress The wallet address
     * @param country The new country code
     */
    function updateCountry(
        address userAddress,
        uint16 country
    ) external override onlyOwner {
        _identityStorage.modifyStoredCountry(userAddress, country);
        emit CountryUpdated(userAddress, country);
    }

    /**
     * @notice Check if a user has valid claims for all required topics
     * @param userAddress The wallet address to verify
     * @return True if the user has all required valid claims
     */
    function isVerified(address userAddress) external view override returns (bool) {
        if (!_identityStorage.contains(userAddress)) {
            return false;
        }

        address identityAddr = _identityStorage.storedIdentity(userAddress);
        if (identityAddr == address(0)) {
            return false;
        }

        // Get required claim topics
        uint256[] memory requiredTopics = _claimTopicsRegistry.getClaimTopics();
        
        // For hackathon MVP, simplified verification
        // In production, would verify actual claims on the identity contract
        // by checking signatures from trusted issuers
        
        // Simplified: just check identity exists and is registered
        // Real implementation would iterate through requiredTopics and verify
        // each claim exists and is signed by a trusted issuer
        return requiredTopics.length == 0 || identityAddr != address(0);
    }

    /**
     * @notice Get the identity contract for a user
     * @param userAddress The wallet address
     * @return The identity contract address
     */
    function identity(address userAddress) external view override returns (address) {
        return _identityStorage.storedIdentity(userAddress);
    }

    /**
     * @notice Get the country for a user
     * @param userAddress The wallet address
     * @return The country code
     */
    function investorCountry(address userAddress) external view override returns (uint16) {
        return _identityStorage.storedCountry(userAddress);
    }

    function claimTopicsRegistry() external view override returns (address) {
        return address(_claimTopicsRegistry);
    }

    function trustedIssuersRegistry() external view override returns (address) {
        return address(_trustedIssuersRegistry);
    }

    function identityStorage() external view override returns (address) {
        return address(_identityStorage);
    }

    /**
     * @notice Batch register multiple identities
     */
    function batchRegisterIdentity(
        address[] calldata userAddresses,
        address[] calldata identities,
        uint16[] calldata countries
    ) external override onlyOwner {
        require(
            userAddresses.length == identities.length && 
            userAddresses.length == countries.length,
            "LENGTH_MISMATCH"
        );

        for (uint256 i = 0; i < userAddresses.length; i++) {
            _identityStorage.addIdentityToStorage(
                userAddresses[i],
                identities[i],
                countries[i]
            );
            emit IdentityRegistered(userAddresses[i], identities[i]);
        }
    }

    /**
     * @notice Check if a user is registered
     */
    function contains(address userAddress) external view override returns (bool) {
        return _identityStorage.contains(userAddress);
    }
}
