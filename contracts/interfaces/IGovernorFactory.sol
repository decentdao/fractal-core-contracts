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

    /// @dev Configures Gov Module implementation
    /// @param _dao The address of the dao contract
    /// @param _accessControl The address of the access control contract
    /// @param _createGovernorParams The struct of parameters to create the governor contract
    /// @return timelock The address of the created timelock contract
    /// @return governorModule The address of the created governor module contract
    function createGovernor(
        address _dao,
        address _accessControl,
        CreateGovernorParams calldata _createGovernorParams
    ) external returns (address timelock, address governorModule);
}
