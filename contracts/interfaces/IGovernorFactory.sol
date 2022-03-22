//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IGovernorModule.sol";
import "./ITimelockUpgradeable.sol";

/// @dev Governor Module used to implement 1 token 1 vote.
/// This acts as an extension of the MVD and permissions are controlled by access control.
/// @dev Gov Module is extended by the timelock contract which creates a lockup period before execution.
interface IGovernorFactory {
    event GovernorCreated(address timelock, address governorModule);

    /// @dev Configures Gov Module implementation
    /// @param _govImpl Address of Gov implmentation
    /// @param _name Name of the DAO
    /// @param _token Voting token uses snapshot feature
    /// @param _timelockImpl Timelock vest proposals to allow detractors to exit system
    /// @param _initialVoteExtension Allow users to vote if quorum attack is preformed
    /// @param _initialVotingDelay Allow users to research proposals before voting period
    /// @param _initialVotingPeriod Length of voting period (blocks)
    /// @param _initialProposalThreshold Total tokens required to submit a proposal
    /// @param _initialQuorumNumeratorValue Total votes needed to reach quorum
    /// @param _minDelay init the contract with a given `minDelay`.
    /// @param _accessControl The address of the access control contract
    /// @param _dao The address of the dao contract
    function createGovernor(
        IGovernorModule _govImpl,
        string memory _name,
        IVotesUpgradeable _token,
        ITimelockUpgradeable _timelockImpl,
        uint64 _initialVoteExtension,
        uint256 _initialVotingDelay,
        uint256 _initialVotingPeriod,
        uint256 _initialProposalThreshold,
        uint256 _initialQuorumNumeratorValue,
        uint256 _minDelay,
        address _accessControl,
        address _dao
    ) external returns(address timelock, address governorModule);
}