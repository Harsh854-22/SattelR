// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentPayVault
 * @notice Per-human vault on Monad. The deployer (human) owns the vault,
 *         tops up native MON, and grants restricted spend permissions to an
 *         AI agent wallet. The agent can only pay merchants within policy limits.
 *
 * Flow:
 *   1. Human deploys this contract (owner = msg.sender).
 *   2. Human calls topUp() with MON (or sends MON to the contract).
 *   3. Human calls grantPermission(...) for an agent wallet + rules.
 *   4. Agent calls spend(...) to pay a merchant in native MON.
 *   5. Human can revokePermission / withdraw anytime.
 */
contract AgentPayVault {
    // -------------------------------------------------------------------------
    // Types
    // -------------------------------------------------------------------------

    struct Policy {
        address agent;
        uint256 amountLimit; // max total spend in wei (native MON)
        uint256 spent; // amount already spent in wei
        string category; // e.g. "electronics"
        string[] allowedWebsites; // e.g. ["trusted-gadgets.example"]
        uint256 expiry; // unix timestamp; 0 = no expiry
        bool singleUse;
        bool used;
        bool active;
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    address public immutable owner;

    mapping(bytes32 => Policy) private _policies;
    bytes32[] private _policyIds;

    uint256 private _locked; // simple reentrancy guard

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error NotOwner();
    error NotAgent();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientVaultBalance();
    error PolicyNotFound();
    error PolicyInactive();
    error PolicyExpired();
    error PolicyAlreadyUsed();
    error AmountLimitExceeded();
    error CategoryNotAllowed();
    error MerchantNotAllowed();
    error TransferFailed();
    error Reentrancy();
    error EmptyCategory();
    error EmptyAllowlist();

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event TopUp(address indexed from, uint256 amount, uint256 vaultBalance);
    event Withdrawn(address indexed to, uint256 amount);
    event PermissionGranted(
        bytes32 indexed policyId,
        address indexed agent,
        uint256 amountLimit,
        string category,
        uint256 expiry,
        bool singleUse
    );
    event PermissionRevoked(bytes32 indexed policyId, address indexed agent);
    event PaymentAuthorized(
        bytes32 indexed policyId,
        address indexed agent,
        address indexed merchant,
        uint256 amount,
        string category,
        string website,
        string orderId
    );

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (_locked == 1) revert Reentrancy();
        _locked = 1;
        _;
        _locked = 0;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /// @dev Deployer becomes the human owner. Agent never owns the vault.
    constructor() {
        owner = msg.sender;
    }

    // -------------------------------------------------------------------------
    // Funding (human)
    // -------------------------------------------------------------------------

    /// @notice Deposit native MON into the vault.
    function topUp() external payable onlyOwner {
        if (msg.value == 0) revert ZeroAmount();
        emit TopUp(msg.sender, msg.value, address(this).balance);
    }

    /// @notice Accept plain MON transfers as top-ups (from owner only for clarity).
    receive() external payable {
        if (msg.sender != owner) revert NotOwner();
        if (msg.value == 0) revert ZeroAmount();
        emit TopUp(msg.sender, msg.value, address(this).balance);
    }

    /// @notice Human withdraws unused MON.
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (amount > address(this).balance) revert InsufficientVaultBalance();

        (bool ok, ) = owner.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(owner, amount);
    }

    /// @notice Withdraw entire vault balance.
    function withdrawAll() external onlyOwner nonReentrant {
        uint256 amount = address(this).balance;
        if (amount == 0) revert ZeroAmount();

        (bool ok, ) = owner.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(owner, amount);
    }

    // -------------------------------------------------------------------------
    // Permissions (human → agent)
    // -------------------------------------------------------------------------

    /**
     * @notice Grant the AI agent wallet a restricted spend permission.
     * @param agent Agent wallet that will call spend()
     * @param amountLimit Max MON the agent may spend under this policy (wei)
     * @param category Allowed product category (exact match)
     * @param allowedWebsites Domains the agent may pay on
     * @param expiry Unix expiry; pass 0 for no expiry
     * @param singleUse If true, policy dies after one successful spend
     * @return policyId Identifier the agent must pass to spend()
     */
    function grantPermission(
        address agent,
        uint256 amountLimit,
        string calldata category,
        string[] calldata allowedWebsites,
        uint256 expiry,
        bool singleUse
    ) external onlyOwner returns (bytes32 policyId) {
        if (agent == address(0)) revert ZeroAddress();
        if (amountLimit == 0) revert ZeroAmount();
        if (bytes(category).length == 0) revert EmptyCategory();
        if (allowedWebsites.length == 0) revert EmptyAllowlist();

        policyId = keccak256(
            abi.encode(
                owner,
                agent,
                amountLimit,
                category,
                allowedWebsites,
                expiry,
                singleUse,
                block.timestamp,
                _policyIds.length
            )
        );

        Policy storage p = _policies[policyId];
        p.agent = agent;
        p.amountLimit = amountLimit;
        p.spent = 0;
        p.category = category;
        p.expiry = expiry;
        p.singleUse = singleUse;
        p.used = false;
        p.active = true;

        for (uint256 i = 0; i < allowedWebsites.length; i++) {
            p.allowedWebsites.push(allowedWebsites[i]);
        }

        _policyIds.push(policyId);

        emit PermissionGranted(policyId, agent, amountLimit, category, expiry, singleUse);
    }

    /// @notice Human revokes an agent permission immediately.
    function revokePermission(bytes32 policyId) external onlyOwner {
        Policy storage p = _policies[policyId];
        if (p.agent == address(0)) revert PolicyNotFound();
        p.active = false;
        emit PermissionRevoked(policyId, p.agent);
    }

    // -------------------------------------------------------------------------
    // Spending (AI agent)
    // -------------------------------------------------------------------------

    /**
     * @notice Agent pays a merchant in native MON under a granted policy.
     * @param policyId Permission granted by the human
     * @param merchant Recipient wallet (website checkout settlement address)
     * @param amount MON to send (wei)
     * @param category Product category (must match policy)
     * @param website Domain being paid (must be on allowlist)
     * @param orderId Off-chain order reference stored in the event / invoice
     */
    function spend(
        bytes32 policyId,
        address merchant,
        uint256 amount,
        string calldata category,
        string calldata website,
        string calldata orderId
    ) external nonReentrant {
        Policy storage p = _policies[policyId];

        if (p.agent == address(0)) revert PolicyNotFound();
        if (msg.sender != p.agent) revert NotAgent();
        if (!p.active) revert PolicyInactive();
        if (p.expiry != 0 && block.timestamp > p.expiry) revert PolicyExpired();
        if (p.singleUse && p.used) revert PolicyAlreadyUsed();
        if (merchant == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (p.spent + amount > p.amountLimit) revert AmountLimitExceeded();
        if (!_eq(p.category, category)) revert CategoryNotAllowed();
        if (!_websiteAllowed(p, website)) revert MerchantNotAllowed();
        if (amount > address(this).balance) revert InsufficientVaultBalance();

        // Effects before interaction
        p.spent += amount;
        if (p.singleUse) {
            p.used = true;
            p.active = false;
        }

        (bool ok, ) = merchant.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit PaymentAuthorized(
            policyId,
            msg.sender,
            merchant,
            amount,
            category,
            website,
            orderId
        );
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    function vaultBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getPolicy(bytes32 policyId)
        external
        view
        returns (
            address agent,
            uint256 amountLimit,
            uint256 spent,
            string memory category,
            string[] memory allowedWebsites,
            uint256 expiry,
            bool singleUse,
            bool used,
            bool active
        )
    {
        Policy storage p = _policies[policyId];
        if (p.agent == address(0)) revert PolicyNotFound();
        return (
            p.agent,
            p.amountLimit,
            p.spent,
            p.category,
            p.allowedWebsites,
            p.expiry,
            p.singleUse,
            p.used,
            p.active
        );
    }

    function remainingAllowance(bytes32 policyId) external view returns (uint256) {
        Policy storage p = _policies[policyId];
        if (p.agent == address(0)) revert PolicyNotFound();
        if (!p.active) return 0;
        if (p.expiry != 0 && block.timestamp > p.expiry) return 0;
        if (p.singleUse && p.used) return 0;
        return p.amountLimit - p.spent;
    }

    function policyCount() external view returns (uint256) {
        return _policyIds.length;
    }

    function policyIdAt(uint256 index) external view returns (bytes32) {
        return _policyIds[index];
    }

    // -------------------------------------------------------------------------
    // Internals
    // -------------------------------------------------------------------------

    function _websiteAllowed(Policy storage p, string calldata website) private view returns (bool) {
        bytes32 needle = keccak256(bytes(website));
        uint256 len = p.allowedWebsites.length;
        for (uint256 i = 0; i < len; i++) {
            if (keccak256(bytes(p.allowedWebsites[i])) == needle) {
                return true;
            }
        }
        return false;
    }

    function _eq(string storage a, string calldata b) private pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}
