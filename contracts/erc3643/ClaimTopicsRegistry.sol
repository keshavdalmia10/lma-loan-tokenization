// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC3643.sol";

/**
 * @title ClaimTopicsRegistry
 * @notice Registry for required claim topics in ERC-3643 tokens
 * @dev Defines which claims investors must have (e.g., KYC=1, Accreditation=2)
 */
contract ClaimTopicsRegistry is IClaimTopicsRegistry, Ownable {
    // Standard claim topics
    uint256 public constant CLAIM_TOPIC_KYC = 1;
    uint256 public constant CLAIM_TOPIC_ACCREDITATION = 2;
    uint256 public constant CLAIM_TOPIC_JURISDICTION = 3;
    uint256 public constant CLAIM_TOPIC_AML = 4;
    uint256 public constant CLAIM_TOPIC_QUALIFIED_INVESTOR = 5;

    uint256[] private _claimTopics;
    mapping(uint256 => bool) private _claimTopicExists;

    constructor() Ownable(msg.sender) {
        // Initialize with standard loan tokenization claim requirements
        _addClaimTopic(CLAIM_TOPIC_KYC);
        _addClaimTopic(CLAIM_TOPIC_ACCREDITATION);
    }

    /**
     * @notice Add a claim topic to the required list
     * @param claimTopic The claim topic identifier to add
     */
    function addClaimTopic(uint256 claimTopic) external override onlyOwner {
        _addClaimTopic(claimTopic);
    }

    function _addClaimTopic(uint256 claimTopic) internal {
        require(!_claimTopicExists[claimTopic], "TOPIC_ALREADY_EXISTS");
        _claimTopics.push(claimTopic);
        _claimTopicExists[claimTopic] = true;
        emit ClaimTopicAdded(claimTopic);
    }

    /**
     * @notice Remove a claim topic from the required list
     * @param claimTopic The claim topic identifier to remove
     */
    function removeClaimTopic(uint256 claimTopic) external override onlyOwner {
        require(_claimTopicExists[claimTopic], "TOPIC_NOT_EXISTS");
        
        // Find and remove the topic
        for (uint256 i = 0; i < _claimTopics.length; i++) {
            if (_claimTopics[i] == claimTopic) {
                _claimTopics[i] = _claimTopics[_claimTopics.length - 1];
                _claimTopics.pop();
                break;
            }
        }
        
        _claimTopicExists[claimTopic] = false;
        emit ClaimTopicRemoved(claimTopic);
    }

    /**
     * @notice Get all required claim topics
     * @return Array of claim topic identifiers
     */
    function getClaimTopics() external view override returns (uint256[] memory) {
        return _claimTopics;
    }

    /**
     * @notice Check if a claim topic is required
     * @param claimTopic The claim topic to check
     * @return True if the topic is required
     */
    function isClaimTopicRequired(uint256 claimTopic) external view returns (bool) {
        return _claimTopicExists[claimTopic];
    }
}
