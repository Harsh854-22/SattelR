// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentPayVault} from "../src/AgentPayVault.sol";

contract AgentPayVaultTest is Test {
    AgentPayVault internal vault;

    address internal human = makeAddr("human");
    address internal agent = makeAddr("agent");
    address internal merchant = makeAddr("merchant");
    address internal stranger = makeAddr("stranger");

    uint256 internal constant FIVE_MON = 5 ether;
    uint256 internal constant TEN_MON = 10 ether;

    function setUp() public {
        vm.deal(human, 100 ether);
        vm.prank(human);
        vault = new AgentPayVault();
    }

    function _grantDefaultPolicy() internal returns (bytes32 policyId) {
        string[] memory sites = new string[](1);
        sites[0] = "trusted-gadgets.example";

        vm.prank(human);
        policyId = vault.grantPermission(
            agent,
            FIVE_MON,
            "electronics",
            sites,
            block.timestamp + 1 hours,
            true
        );
    }

    function test_ownerIsDeployer() public view {
        assertEq(vault.owner(), human);
    }

    function test_topUpAndSpendNativeMon() public {
        vm.prank(human);
        vault.topUp{value: TEN_MON}();

        bytes32 policyId = _grantDefaultPolicy();

        uint256 merchantBefore = merchant.balance;

        vm.prank(agent);
        vault.spend(
            policyId,
            merchant,
            3 ether,
            "electronics",
            "trusted-gadgets.example",
            "order_1"
        );

        assertEq(merchant.balance - merchantBefore, 3 ether);
        assertEq(vault.vaultBalance(), 7 ether);

        (
            address policyAgent,
            uint256 amountLimit,
            uint256 spent,
            ,
            ,
            ,
            ,
            bool used,
            bool active
        ) = vault.getPolicy(policyId);

        assertEq(policyAgent, agent);
        assertEq(amountLimit, FIVE_MON);
        assertEq(spent, 3 ether);
        assertTrue(used);
        assertFalse(active);
    }

    function test_rejectWrongWebsite() public {
        vm.prank(human);
        vault.topUp{value: TEN_MON}();
        bytes32 policyId = _grantDefaultPolicy();

        vm.prank(agent);
        vm.expectRevert(AgentPayVault.MerchantNotAllowed.selector);
        vault.spend(
            policyId,
            merchant,
            1 ether,
            "electronics",
            "random-seller.example",
            "order_bad"
        );
    }

    function test_rejectWrongCategory() public {
        vm.prank(human);
        vault.topUp{value: TEN_MON}();
        bytes32 policyId = _grantDefaultPolicy();

        vm.prank(agent);
        vm.expectRevert(AgentPayVault.CategoryNotAllowed.selector);
        vault.spend(
            policyId,
            merchant,
            1 ether,
            "domains",
            "trusted-gadgets.example",
            "order_bad"
        );
    }

    function test_rejectStrangerSpend() public {
        vm.prank(human);
        vault.topUp{value: TEN_MON}();
        bytes32 policyId = _grantDefaultPolicy();

        vm.prank(stranger);
        vm.expectRevert(AgentPayVault.NotAgent.selector);
        vault.spend(
            policyId,
            merchant,
            1 ether,
            "electronics",
            "trusted-gadgets.example",
            "order_bad"
        );
    }

    function test_rejectOverLimit() public {
        vm.prank(human);
        vault.topUp{value: TEN_MON}();
        bytes32 policyId = _grantDefaultPolicy();

        vm.prank(agent);
        vm.expectRevert(AgentPayVault.AmountLimitExceeded.selector);
        vault.spend(
            policyId,
            merchant,
            6 ether,
            "electronics",
            "trusted-gadgets.example",
            "order_bad"
        );
    }

    function test_humanCanRevoke() public {
        vm.prank(human);
        vault.topUp{value: TEN_MON}();
        bytes32 policyId = _grantDefaultPolicy();

        vm.prank(human);
        vault.revokePermission(policyId);

        vm.prank(agent);
        vm.expectRevert(AgentPayVault.PolicyInactive.selector);
        vault.spend(
            policyId,
            merchant,
            1 ether,
            "electronics",
            "trusted-gadgets.example",
            "order_bad"
        );
    }

    function test_rejectInsufficientVaultBalance() public {
        vm.prank(human);
        vault.topUp{value: 1 ether}();

        string[] memory sites = new string[](1);
        sites[0] = "trusted-gadgets.example";

        vm.prank(human);
        bytes32 policyId = vault.grantPermission(
            agent,
            FIVE_MON,
            "electronics",
            sites,
            block.timestamp + 1 hours,
            true
        );

        vm.prank(agent);
        vm.expectRevert(AgentPayVault.InsufficientVaultBalance.selector);
        vault.spend(
            policyId,
            merchant,
            2 ether,
            "electronics",
            "trusted-gadgets.example",
            "order_insuf"
        );
    }

    function test_rejectExpiredPolicy() public {
        vm.prank(human);
        vault.topUp{value: TEN_MON}();

        string[] memory sites = new string[](1);
        sites[0] = "trusted-gadgets.example";

        vm.prank(human);
        bytes32 policyId = vault.grantPermission(
            agent,
            FIVE_MON,
            "electronics",
            sites,
            block.timestamp + 1 hours,
            true
        );

        vm.warp(block.timestamp + 2 hours);

        vm.prank(agent);
        vm.expectRevert(AgentPayVault.PolicyExpired.selector);
        vault.spend(
            policyId,
            merchant,
            1 ether,
            "electronics",
            "trusted-gadgets.example",
            "order_expired"
        );
    }

    function test_rejectDoubleSpendSingleUse() public {
        vm.prank(human);
        vault.topUp{value: TEN_MON}();
        bytes32 policyId = _grantDefaultPolicy();

        vm.prank(agent);
        vault.spend(
            policyId,
            merchant,
            1 ether,
            "electronics",
            "trusted-gadgets.example",
            "order_1"
        );

        // singleUse deactivates after first spend; second attempt hits PolicyInactive first
        vm.prank(agent);
        vm.expectRevert(AgentPayVault.PolicyInactive.selector);
        vault.spend(
            policyId,
            merchant,
            1 ether,
            "electronics",
            "trusted-gadgets.example",
            "order_2"
        );
    }

    function test_onlyOwnerGrantTopUpWithdraw() public {
        vm.deal(stranger, 10 ether);

        vm.prank(stranger);
        vm.expectRevert(AgentPayVault.NotOwner.selector);
        vault.topUp{value: 1 ether}();

        string[] memory sites = new string[](1);
        sites[0] = "trusted-gadgets.example";

        vm.prank(stranger);
        vm.expectRevert(AgentPayVault.NotOwner.selector);
        vault.grantPermission(
            agent,
            FIVE_MON,
            "electronics",
            sites,
            block.timestamp + 1 hours,
            true
        );

        vm.prank(human);
        vault.topUp{value: TEN_MON}();

        vm.prank(stranger);
        vm.expectRevert(AgentPayVault.NotOwner.selector);
        vault.withdraw(1 ether);
    }

    function test_remainingAllowanceView() public {
        vm.prank(human);
        vault.topUp{value: TEN_MON}();

        string[] memory sites = new string[](1);
        sites[0] = "trusted-gadgets.example";

        vm.prank(human);
        bytes32 policyId = vault.grantPermission(
            agent,
            FIVE_MON,
            "electronics",
            sites,
            block.timestamp + 1 hours,
            false
        );

        assertEq(vault.remainingAllowance(policyId), FIVE_MON);

        vm.prank(agent);
        vault.spend(
            policyId,
            merchant,
            2 ether,
            "electronics",
            "trusted-gadgets.example",
            "order_partial"
        );

        assertEq(vault.remainingAllowance(policyId), 3 ether);

        vm.prank(human);
        vault.revokePermission(policyId);
        assertEq(vault.remainingAllowance(policyId), 0);
    }
}