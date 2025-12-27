// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC3643.sol";

/**
 * @title Compliance
 * @notice Modular compliance engine for ERC-3643 tokens
 * @dev Validates transfers based on configurable rules
 */
contract Compliance is ICompliance, Ownable {
    // Bound tokens
    mapping(address => bool) private _boundTokens;
    address[] private _tokenList;

    // Compliance Rules
    struct CountryRestriction {
        bool isBlacklisted;
        uint256 maxInvestors;
    }
    
    // Country restrictions (ISO 3166-1 numeric codes)
    mapping(uint16 => CountryRestriction) public countryRestrictions;
    mapping(uint16 => uint256) public investorCountByCountry;
    
    // Global limits
    uint256 public maxHolders;
    uint256 public currentHolders;
    
    // Per-address lockups (supplement to token-level lockups)
    mapping(address => uint256) public transferLockupEnd;
    
    // Min/max transfer amounts
    uint256 public minTransferAmount;
    uint256 public maxTransferAmount;
    
    // Holding limits per investor
    mapping(address => uint256) public maxBalance;
    uint256 public defaultMaxBalance;

    // Events for rule changes
    event CountryRestrictionSet(uint16 indexed country, bool blacklisted, uint256 maxInvestors);
    event MaxHoldersSet(uint256 maxHolders);
    event TransferLockupSet(address indexed investor, uint256 endTime);
    event TransferLimitsSet(uint256 minAmount, uint256 maxAmount);
    event MaxBalanceSet(address indexed investor, uint256 maxBalance);

    constructor() Ownable(msg.sender) {
        // Default settings
        maxHolders = 10000; // Allow up to 10,000 token holders
        maxTransferAmount = type(uint256).max; // No max by default
        minTransferAmount = 1; // Minimum 1 unit
        defaultMaxBalance = type(uint256).max; // No limit by default
        
        // Blacklist OFAC sanctioned countries (examples)
        // 408 = North Korea, 364 = Iran, 760 = Syria
        countryRestrictions[408] = CountryRestriction(true, 0);
        countryRestrictions[364] = CountryRestriction(true, 0);
        countryRestrictions[760] = CountryRestriction(true, 0);
    }

    // ============ Token Binding ============

    /**
     * @notice Bind a token to this compliance contract
     * @param token The token address to bind
     */
    function bindToken(address token) external override onlyOwner {
        require(token != address(0), "INVALID_TOKEN");
        require(!_boundTokens[token], "TOKEN_ALREADY_BOUND");
        
        _boundTokens[token] = true;
        _tokenList.push(token);
        
        emit TokenBound(token);
    }

    /**
     * @notice Unbind a token from this compliance contract
     * @param token The token address to unbind
     */
    function unbindToken(address token) external override onlyOwner {
        require(_boundTokens[token], "TOKEN_NOT_BOUND");
        
        _boundTokens[token] = false;
        
        // Remove from list
        for (uint256 i = 0; i < _tokenList.length; i++) {
            if (_tokenList[i] == token) {
                _tokenList[i] = _tokenList[_tokenList.length - 1];
                _tokenList.pop();
                break;
            }
        }
        
        emit TokenUnbound(token);
    }

    function isTokenBound(address token) external view override returns (bool) {
        return _boundTokens[token];
    }

    // ============ Compliance Checks ============

    /**
     * @notice Check if a transfer is compliant
     * @param from Sender address
     * @param to Receiver address
     * @param amount Transfer amount
     * @return True if the transfer is compliant
     */
    function canTransfer(
        address from,
        address to,
        uint256 amount
    ) external view override returns (bool) {
        // Check lockup period
        if (block.timestamp < transferLockupEnd[from]) {
            return false;
        }

        // Check transfer amount limits
        if (amount < minTransferAmount || amount > maxTransferAmount) {
            return false;
        }

        // Check max balance for receiver
        uint256 receiverMaxBalance = maxBalance[to] > 0 ? maxBalance[to] : defaultMaxBalance;
        // Note: We can't check actual balance here without token reference
        // This would be checked at the token level

        // For new holders, check max holders limit
        // Note: This check would need token balance data in production
        
        return true;
    }

    /**
     * @notice Called after a transfer to update compliance state
     * @param from Sender address
     * @param to Receiver address
     * @param amount Transfer amount
     */
    function transferred(
        address from,
        address to,
        uint256 amount
    ) external override {
        require(_boundTokens[msg.sender], "NOT_BOUND_TOKEN");
        // Update holder counts, country investor counts, etc.
        // In production, this would track state changes
    }

    /**
     * @notice Called after minting to update compliance state
     * @param to Receiver address
     * @param amount Minted amount
     */
    function created(address to, uint256 amount) external override {
        require(_boundTokens[msg.sender], "NOT_BOUND_TOKEN");
        // Track new holder if applicable
    }

    /**
     * @notice Called after burning to update compliance state
     * @param from Address tokens were burned from
     * @param amount Burned amount
     */
    function destroyed(address from, uint256 amount) external override {
        require(_boundTokens[msg.sender], "NOT_BOUND_TOKEN");
        // Update holder counts
    }

    // ============ Rule Configuration ============

    /**
     * @notice Set country restriction rules
     * @param country Country code (ISO 3166-1 numeric)
     * @param blacklisted Whether the country is blacklisted
     * @param maxInvestorsFromCountry Maximum investors allowed from this country
     */
    function setCountryRestriction(
        uint16 country,
        bool blacklisted,
        uint256 maxInvestorsFromCountry
    ) external onlyOwner {
        countryRestrictions[country] = CountryRestriction(blacklisted, maxInvestorsFromCountry);
        emit CountryRestrictionSet(country, blacklisted, maxInvestorsFromCountry);
    }

    /**
     * @notice Set maximum number of token holders
     * @param _maxHolders Maximum holders allowed
     */
    function setMaxHolders(uint256 _maxHolders) external onlyOwner {
        maxHolders = _maxHolders;
        emit MaxHoldersSet(_maxHolders);
    }

    /**
     * @notice Set transfer lockup for an investor
     * @param investor Investor address
     * @param endTime Lockup end timestamp
     */
    function setTransferLockup(address investor, uint256 endTime) external onlyOwner {
        transferLockupEnd[investor] = endTime;
        emit TransferLockupSet(investor, endTime);
    }

    /**
     * @notice Set min/max transfer amounts
     * @param minAmount Minimum transfer amount
     * @param maxAmount Maximum transfer amount
     */
    function setTransferLimits(uint256 minAmount, uint256 maxAmount) external onlyOwner {
        require(minAmount <= maxAmount, "INVALID_LIMITS");
        minTransferAmount = minAmount;
        maxTransferAmount = maxAmount;
        emit TransferLimitsSet(minAmount, maxAmount);
    }

    /**
     * @notice Set max balance for an investor
     * @param investor Investor address
     * @param _maxBalance Maximum balance allowed
     */
    function setMaxBalance(address investor, uint256 _maxBalance) external onlyOwner {
        maxBalance[investor] = _maxBalance;
        emit MaxBalanceSet(investor, _maxBalance);
    }

    /**
     * @notice Check if a country is blacklisted
     * @param country Country code to check
     * @return True if blacklisted
     */
    function isCountryBlacklisted(uint16 country) external view returns (bool) {
        return countryRestrictions[country].isBlacklisted;
    }

    /**
     * @notice Get bound tokens list
     * @return Array of bound token addresses
     */
    function getBoundTokens() external view returns (address[] memory) {
        return _tokenList;
    }
}
