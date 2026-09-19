// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AgentPayVault} from "../src/AgentPayVault.sol";

/**
 * Smoke test against a deployed vault.
 * Env: CONTRACT_ADDRESS, HUMAN_PRIVATE_KEY, AGENT_PRIVATE_KEY
 *
 * Note: forge multi-signer --broadcast simulation can fail on Monad
 * (agent spend sees PolicyNotFound). Prefer sequential cast send for
 * live smoke; this script remains useful for local anvil dry-runs.
 */
contract SmokeTest is Script {
    function run() external {
        address payable contractAddr = payable(vm.envAddress("CONTRACT_ADDRESS"));
        uint256 humanKey = vm.envUint("HUMAN_PRIVATE_KEY");
        uint256 agentKey = vm.envUint("AGENT_PRIVATE_KEY");

        AgentPayVault vault = AgentPayVault(contractAddr);
        address human = vm.addr(humanKey);
        address agent = vm.addr(agentKey);

        console2.log("Contract:", contractAddr);
        console2.log("Human:", human);
        console2.log("Agent:", agent);
        console2.log("Owner:", vault.owner());
        console2.log("Vault balance before:", vault.vaultBalance());

        require(vault.owner() == human, "human is not owner");

        // a) topUp 0.05 ether
        vm.startBroadcast(humanKey);
        vault.topUp{value: 0.05 ether}();
        console2.log("topUp done; vault balance:", vault.vaultBalance());

        // b) grantPermission
        string[] memory sites = new string[](1);
        sites[0] = "trusted-gadgets.example";
        bytes32 policyId = vault.grantPermission(
            agent,
            0.02 ether,
            "electronics",
            sites,
            block.timestamp + 3600,
            true
        );
        console2.log("policyId:");
        console2.logBytes32(policyId);
        vm.stopBroadcast();

        // c) agent spend 0.01 to human (as merchant)
        vm.startBroadcast(agentKey);
        vault.spend(
            policyId,
            human,
            0.01 ether,
            "electronics",
            "trusted-gadgets.example",
            "smoke_order_1"
        );
        console2.log("spend succeeded; vault balance:", vault.vaultBalance());

        // d) failing spend (wrong website) — expect revert
        // After single-use, policy is inactive; use a fresh grant for fail test via human again.
        vm.stopBroadcast();

        vm.startBroadcast(humanKey);
        bytes32 policyId2 = vault.grantPermission(
            agent,
            0.02 ether,
            "electronics",
            sites,
            block.timestamp + 3600,
            true
        );
        console2.log("policyId2 for fail test:");
        console2.logBytes32(policyId2);
        vm.stopBroadcast();

        vm.startBroadcast(agentKey);
        try vault.spend(
            policyId2,
            human,
            0.01 ether,
            "electronics",
            "evil-shop.example",
            "smoke_order_fail"
        ) {
            revert("expected MerchantNotAllowed");
        } catch (bytes memory reason) {
            console2.log("failing spend reverted as expected, reason length:", reason.length);
            if (reason.length >= 4) {
                bytes4 sel;
                assembly {
                    sel := mload(add(reason, 0x20))
                }
                console2.log("selector:");
                console2.logBytes4(sel);
            }
        }
        vm.stopBroadcast();

        console2.log("Final vault balance:", vault.vaultBalance());
        console2.log("SMOKE_OK");
    }
}