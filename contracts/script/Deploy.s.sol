// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AgentPayVault} from "../src/AgentPayVault.sol";

/**
 * @dev Deploy with the human wallet as broadcaster so owner == human.
 *
 *   forge script script/Deploy.s.sol:DeployAgentPayVault \
 *     --rpc-url $MONAD_RPC_URL \
 *     --broadcast \
 *     --private-key $HUMAN_PRIVATE_KEY
 */
contract DeployAgentPayVault is Script {
    function run() external {
        vm.startBroadcast();
        AgentPayVault vault = new AgentPayVault();
        vm.stopBroadcast();

        console2.log("AgentPayVault deployed at:", address(vault));
        console2.log("Owner (human):", vault.owner());
    }
}
