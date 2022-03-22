//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../../interfaces/IGovernorFactory.sol";

/// @dev Governor Factory used to deploy Gov Modules
/// @dev Deploys Timelock dependecies
contract GovernorFactory is IGovernorFactory, ERC165 {
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
    ) external returns (address timelock, address governorModule) {
        timelock = address(
            new ERC1967Proxy(
                address(_timelockImpl),
                abi.encodeWithSelector(
                    ITimelockUpgradeable(payable(address(0)))
                        .initialize
                        .selector,
                    _accessControl,
                    _dao,
                    _minDelay
                )
            )
        );

        governorModule = address(
            new ERC1967Proxy(
                address(_govImpl),
                abi.encodeWithSelector(
                    IGovernorModule(payable(address(0))).initialize.selector,
                    _name,
                    _token,
                    timelock,
                    _initialVoteExtension,
                    _initialVotingDelay,
                    _initialVotingPeriod,
                    _initialProposalThreshold,
                    _initialQuorumNumeratorValue,
                    _accessControl
                )
            )
        );
        emit GovernorCreated(timelock, governorModule);
    }

    /// @notice Returns whether a given interface ID is supported
    /// @param interfaceId An interface ID bytes4 as defined by ERC-165
    /// @return bool Indicates whether the interface is supported
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IGovernorFactory).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
