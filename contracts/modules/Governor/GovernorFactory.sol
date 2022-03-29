//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../../interfaces/IGovernorFactory.sol";

/// @dev Governor Factory used to deploy Gov Modules
/// @dev Deploys Timelock dependecies
contract GovernorFactory is IGovernorFactory, ERC165 {
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
    ) external returns (address timelock, address governorModule) {
        timelock = address(
            new ERC1967Proxy(
                address(_createGovernorParams._timelockImpl),
                abi.encodeWithSelector(
                    ITimelockUpgradeable(payable(address(0)))
                        .initialize
                        .selector,
                    _accessControl,
                    _dao,
                    _createGovernorParams._minDelay
                )
            )
        );

        governorModule = address(
            new ERC1967Proxy(
                address(_createGovernorParams._govImpl),
                abi.encodeWithSelector(
                    IGovernorModule(payable(address(0))).initialize.selector,
                    _createGovernorParams._name,
                    _createGovernorParams._token,
                    timelock,
                    _createGovernorParams._initialVoteExtension,
                    _createGovernorParams._initialVotingDelay,
                    _createGovernorParams._initialVotingPeriod,
                    _createGovernorParams._initialProposalThreshold,
                    _createGovernorParams._initialQuorumNumeratorValue,
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
