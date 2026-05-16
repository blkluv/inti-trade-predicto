// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SubscriptionManager.sol";
import "../src/SignalAttestation.sol";

contract Deploy is Script {
    address constant USDC_ARCTESTNET = 0x3600000000000000000000000000000000000000;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        SubscriptionManager subManager = new SubscriptionManager(USDC_ARCTESTNET);
        SignalAttestation signalAttest = new SignalAttestation();

        vm.stopBroadcast();

        console.log("SubscriptionManager deployed at:", address(subManager));
        console.log("SignalAttestation deployed at:", address(signalAttest));
    }
}
