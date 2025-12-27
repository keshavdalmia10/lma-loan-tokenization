// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC3643.sol";

/**
 * @title TrustedIssuersRegistry
 * @notice Registry for trusted claim issuers in ERC-3643 ecosystem
 * @dev Manages which issuers can attest to specific claim topics
 */
contract TrustedIssuersRegistry is ITrustedIssuersRegistry, Ownable {
    // Trusted issuers list
    address[] private _trustedIssuers;
    mapping(address => bool) private _isTrustedIssuer;
    mapping(address => uint256[]) private _issuerClaimTopics;
    mapping(address => mapping(uint256 => bool)) private _issuerHasTopic;

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Add a trusted issuer with allowed claim topics
     * @param trustedIssuer Address of the issuer to trust
     * @param claimTopics Array of claim topics this issuer can attest to
     */
    function addTrustedIssuer(
        address trustedIssuer, 
        uint256[] calldata claimTopics
    ) external override onlyOwner {
        require(trustedIssuer != address(0), "INVALID_ISSUER_ADDRESS");
        require(!_isTrustedIssuer[trustedIssuer], "ISSUER_ALREADY_TRUSTED");
        require(claimTopics.length > 0, "NO_CLAIM_TOPICS");

        _trustedIssuers.push(trustedIssuer);
        _isTrustedIssuer[trustedIssuer] = true;

        for (uint256 i = 0; i < claimTopics.length; i++) {
            _issuerClaimTopics[trustedIssuer].push(claimTopics[i]);
            _issuerHasTopic[trustedIssuer][claimTopics[i]] = true;
        }

        emit TrustedIssuerAdded(trustedIssuer, claimTopics);
    }

    /**
     * @notice Remove a trusted issuer
     * @param trustedIssuer Address of the issuer to remove
     */
    function removeTrustedIssuer(address trustedIssuer) external override onlyOwner {
        require(_isTrustedIssuer[trustedIssuer], "ISSUER_NOT_TRUSTED");

        // Remove from array
        for (uint256 i = 0; i < _trustedIssuers.length; i++) {
            if (_trustedIssuers[i] == trustedIssuer) {
                _trustedIssuers[i] = _trustedIssuers[_trustedIssuers.length - 1];
                _trustedIssuers.pop();
                break;
            }
        }

        // Clear mappings
        uint256[] memory topics = _issuerClaimTopics[trustedIssuer];
        for (uint256 i = 0; i < topics.length; i++) {
            _issuerHasTopic[trustedIssuer][topics[i]] = false;
        }
        delete _issuerClaimTopics[trustedIssuer];
        _isTrustedIssuer[trustedIssuer] = false;

        emit TrustedIssuerRemoved(trustedIssuer);
    }

    /**
     * @notice Update claim topics for an existing trusted issuer
     * @param trustedIssuer Address of the issuer to update
     * @param claimTopics New array of claim topics
     */
    function updateIssuerClaimTopics(
        address trustedIssuer, 
        uint256[] calldata claimTopics
    ) external override onlyOwner {
        require(_isTrustedIssuer[trustedIssuer], "ISSUER_NOT_TRUSTED");
        require(claimTopics.length > 0, "NO_CLAIM_TOPICS");

        // Clear old topics
        uint256[] memory oldTopics = _issuerClaimTopics[trustedIssuer];
        for (uint256 i = 0; i < oldTopics.length; i++) {
            _issuerHasTopic[trustedIssuer][oldTopics[i]] = false;
        }
        delete _issuerClaimTopics[trustedIssuer];

        // Set new topics
        for (uint256 i = 0; i < claimTopics.length; i++) {
            _issuerClaimTopics[trustedIssuer].push(claimTopics[i]);
            _issuerHasTopic[trustedIssuer][claimTopics[i]] = true;
        }

        emit ClaimTopicsUpdated(trustedIssuer, claimTopics);
    }

    /**
     * @notice Get all trusted issuers
     * @return Array of trusted issuer addresses
     */
    function getTrustedIssuers() external view override returns (address[] memory) {
        return _trustedIssuers;
    }

    /**
     * @notice Check if an address is a trusted issuer
     * @param issuer Address to check
     * @return True if the issuer is trusted
     */
    function isTrustedIssuer(address issuer) external view override returns (bool) {
        return _isTrustedIssuer[issuer];
    }

    /**
     * @notice Get claim topics for a trusted issuer
     * @param trustedIssuer Address of the issuer
     * @return Array of claim topics the issuer can attest to
     */
    function getTrustedIssuerClaimTopics(
        address trustedIssuer
    ) external view override returns (uint256[] memory) {
        return _issuerClaimTopics[trustedIssuer];
    }

    /**
     * @notice Check if an issuer can attest to a specific claim topic
     * @param issuer Address of the issuer
     * @param claimTopic The claim topic to check
     * @return True if the issuer can attest to this topic
     */
    function hasClaimTopic(
        address issuer, 
        uint256 claimTopic
    ) external view override returns (bool) {
        return _issuerHasTopic[issuer][claimTopic];
    }
}
