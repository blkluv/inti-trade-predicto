// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SignalAttestation is Ownable {
    struct Signal {
        bytes32 marketId;
        bytes32 signalHash;
        uint256 predictedProb;
        address builder;
        uint256 timestamp;
        bool resolved;
        bool outcome;
    }

    mapping(bytes32 => Signal) public signals;
    mapping(address => Builder) public builders;
    mapping(address => bool) public oracles;

    struct Builder {
        uint256 totalSignals;
        uint256 resolvedSignals;
        uint256 correctSignals;
        uint256 totalFees;
    }

    event SignalAttested(bytes32 indexed marketId, address indexed builder, uint256 prob, bytes32 signalHash);
    event SignalResolved(bytes32 indexed marketId, bool outcome, uint256 newBrierScore);

    constructor() Ownable(msg.sender) {}

    modifier onlyOracle() {
        require(oracles[msg.sender] || msg.sender == owner(), "Not oracle");
        _;
    }

    function addOracle(address oracle) external onlyOwner {
        oracles[oracle] = true;
    }

    function removeOracle(address oracle) external onlyOwner {
        oracles[oracle] = false;
    }

    function attestSignal(bytes32 marketId, bytes32 signalHash, uint256 prob) external {
        require(prob <= 10000, "Prob too high");
        require(signals[marketId].builder == address(0), "Already attested");

        signals[marketId] = Signal({
            marketId: marketId,
            signalHash: signalHash,
            predictedProb: prob,
            builder: msg.sender,
            timestamp: block.timestamp,
            resolved: false,
            outcome: false
        });

        builders[msg.sender].totalSignals++;
        emit SignalAttested(marketId, msg.sender, prob, signalHash);
    }

    function resolveSignal(bytes32 marketId, bool outcome) external onlyOracle {
        Signal storage signal = signals[marketId];
        require(signal.builder != address(0), "Signal not found");
        require(!signal.resolved, "Already resolved");

        signal.resolved = true;
        signal.outcome = outcome;

        Builder storage builder = builders[signal.builder];
        builder.resolvedSignals++;
        if (outcome == (signal.predictedProb >= 5000)) {
            builder.correctSignals++;
        }

        uint256 actual = outcome ? 10000 : 0;
        uint256 diff = signal.predictedProb > actual ? signal.predictedProb - actual : actual - signal.predictedProb;
        uint256 brierScore = (diff * diff) / 10000;

        emit SignalResolved(marketId, outcome, brierScore);
    }

    function getBuilderAccuracy(address builder) external view returns (uint256) {
        Builder memory b = builders[builder];
        if (b.resolvedSignals == 0) return 0;
        return (b.correctSignals * 10000) / b.resolvedSignals;
    }

    function getSignal(bytes32 marketId) external view returns (Signal memory) {
        return signals[marketId];
    }
}
