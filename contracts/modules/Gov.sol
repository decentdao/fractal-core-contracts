// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorPreventLateQuorumUpgradeable.sol";
import "../ModuleBase.sol";


/// @dev GovernorUpgradeable - System Core: needs votesucceded/ _countvote/ quorumReached/ Qurom 
/// - votingModule (GetVotes)
/// - voting period
/// @dev GovernorCountingSimpleUpgradeable -  Defines votesucceded/ _countvote/ quorumReached
/// @dev GovernorVotesQuorumFraction - Defines Qurom created by fraction (4)
/// @dev GovernorPreventLateQuorumUpgradeable Acts as a safe guard for late qurom attacks
///
/// @dev GovernorVotesUpgradeable - defines getVotes 
/// todo: votes module is missing the ability to change token - create from scratch
/// @dev correction - Cannot hot-switch because if a switch occurs during a vote - a person will lose voting power
/// todo: ability to deprecate system - Access Control Only
/// 
/// @dev todo: change ownableupgrade to access control structure
/// @dev todo: update modulebase to have an internal function initilize and a onlyInitilizer method
/// @dev todo: Pass in required Params for modbase


/// @dev todo: update TimelockController to call into dao contract

contract OpenZGovernor is
    Initializable,
    GovernorUpgradeable,
    GovernorSettingsUpgradeable,
    GovernorCountingSimpleUpgradeable,
    GovernorVotesUpgradeable,
    GovernorVotesQuorumFractionUpgradeable,
    GovernorTimelockControlUpgradeable,
    ModuleBase
    UUPSUpgradeable,
    GovernorPreventLateQuorumUpgradeable
{
    /**
     * @dev Configures DAO implementation
     * @dev Called once during deployment atomically
     * @param _name Name of the DAO
     * @param _token Voting token uses snapshot feature
     * @param _timelock Timelock vest proposals to allow detractors to exit system
     * @param _initialVoteExtension Allow users to vote if quorum attack is preformed
     * @param _initialVotingDelay Allow users to research proposals before voting period
     * @param _initialVotingPeriod Length of voting period (blocks)
     * @param _initialProposalThreshold Total tokens required to submit a proposal
     * @param _initialQuorumNumeratorValue Total votes needed to reach quorum
     */

    function initialize(
        string memory _name,
        IVotesUpgradeable _token,
        TimelockControllerUpgradeable _timelock,
        uint64 _initialVoteExtension,
        uint256 _initialVotingDelay,
        uint256 _initialVotingPeriod,
        uint256 _initialProposalThreshold,
        uint256 _initialQuorumNumeratorValue
    ) public initializer {
        __Governor_init(_name);
        __GovernorSettings_init(
            _initialVotingDelay,
            _initialVotingPeriod,
            _initialProposalThreshold
        );
        __GovernorCountingSimple_init();
        __GovernorVotes_init(_token);
        __GovernorVotesQuorumFraction_init(_initialQuorumNumeratorValue);
        __GovernorTimelockControl_init(_timelock);
        __Ownable_init();
        __UUPSUpgradeable_init();
        __GovernorPreventLateQuorum_init(_initialVoteExtension);
    }

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(IGovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function getVotes(address account, uint256 blockNumber)
        public
        view
        override(IGovernorUpgradeable, GovernorVotesUpgradeable)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

        function proposalDeadline(uint256 proposalId)
        public
        view
        virtual
        override(
            GovernorPreventLateQuorumUpgradeable,
            GovernorUpgradeable,
            IGovernorUpgradeable
        )
        returns (uint256)
    {
        return super.proposalDeadline(proposalId);
    }

    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason
    )
        internal
        virtual
        override(GovernorUpgradeable, GovernorPreventLateQuorumUpgradeable)
        returns (uint256)
    {
        return super._castVote(proposalId, account, support, reason);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    )
        public
        override(GovernorUpgradeable, IGovernorUpgradeable)
        returns (uint256)
    {
        return super.propose(targets, values, calldatas, description);
    }

    function proposalThreshold()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
    {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}