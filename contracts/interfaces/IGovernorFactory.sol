//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IGovernorModule.sol";
import "./ITimelockUpgradeable.sol";

/// @dev Governor Factory used to deploy Gov Modules
/// @dev Deploys Timelock dependecies
interface IGovernorFactory {
    event GovernorCreated(address timelock, address governorModule);

    struct CreateGovernorParams {
        IGovernorModule _govImpl;
        IVotesUpgradeable _token;
        ITimelockUpgradeable _timelockImpl;
        string _name;
        uint64 _initialVoteExtension;
        uint256 _initialVotingDelay;
        uint256 _initialVotingPeriod;
        uint256 _initialProposalThreshold;
        uint256 _initialQuorumNumeratorValue;
        uint256 _minDelay;
    }
    function createGovernor(
        bytes[] calldata data
    ) external returns (address governorModule);
}
