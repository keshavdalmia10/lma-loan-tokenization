// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LoanTokenFactoryLight
 * @notice Lightweight factory that tracks deployed loan tokens
 * @dev Uses pre-deployed ERC-3643 infrastructure to reduce contract size
 */
contract LoanTokenFactoryLight is Ownable {
    // Shared ERC-3643 Infrastructure (deployed separately)
    address public sharedClaimTopicsRegistry;
    address public sharedTrustedIssuersRegistry;

    // State
    address[] public deployedTokens;
    mapping(address => bool) public isDeployedToken;
    mapping(string => address) public tokenByNelId;

    // Per-token infrastructure
    mapping(address => address) public tokenIdentityRegistry;
    mapping(address => address) public tokenCompliance;

    // Events
    event LoanTokenRegistered(
        address indexed tokenAddress,
        string nelProtocolId,
        address indexed creator,
        address identityRegistry,
        address compliance
    );

    event InfrastructureSet(
        address claimTopicsRegistry,
        address trustedIssuersRegistry
    );

    constructor(
        address _claimTopicsRegistry,
        address _trustedIssuersRegistry
    ) Ownable(msg.sender) {
        sharedClaimTopicsRegistry = _claimTopicsRegistry;
        sharedTrustedIssuersRegistry = _trustedIssuersRegistry;

        emit InfrastructureSet(_claimTopicsRegistry, _trustedIssuersRegistry);
    }

    /**
     * @notice Register a pre-deployed loan token
     * @dev Tokens are deployed separately and registered here for tracking
     */
    function registerLoanToken(
        address _tokenAddress,
        string memory _nelProtocolId,
        address _identityRegistry,
        address _compliance
    ) external onlyOwner {
        require(tokenByNelId[_nelProtocolId] == address(0), "NEL_ID_EXISTS");
        require(!isDeployedToken[_tokenAddress], "TOKEN_EXISTS");

        deployedTokens.push(_tokenAddress);
        isDeployedToken[_tokenAddress] = true;
        tokenByNelId[_nelProtocolId] = _tokenAddress;
        tokenIdentityRegistry[_tokenAddress] = _identityRegistry;
        tokenCompliance[_tokenAddress] = _compliance;

        emit LoanTokenRegistered(
            _tokenAddress,
            _nelProtocolId,
            msg.sender,
            _identityRegistry,
            _compliance
        );
    }

    // View Functions
    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }

    function getDeployedTokensCount() external view returns (uint256) {
        return deployedTokens.length;
    }

    function getTokenByNelId(string memory nelId) external view returns (address) {
        return tokenByNelId[nelId];
    }

    function getTokenInfrastructure(address token) external view returns (
        address _identityRegistry,
        address _compliance,
        address _claimTopicsRegistry,
        address _trustedIssuersRegistry
    ) {
        return (
            tokenIdentityRegistry[token],
            tokenCompliance[token],
            sharedClaimTopicsRegistry,
            sharedTrustedIssuersRegistry
        );
    }
}
