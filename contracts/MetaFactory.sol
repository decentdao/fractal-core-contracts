//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/governance/utils/IVotesUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";


import "./interfaces/IMetaFactory.sol";
import "./interfaces/IDAOFactory.sol";
import "./interfaces/IGovernorFactory.sol";
import "./interfaces/ITreasuryModuleFactory.sol";
import "./interfaces/ITimelockUpgradeable.sol";

/// @notice A factory contract for deploying DAOs along with any desired modules within one transaction
contract MetaFactory is IMetaFactory, ERC165 {
    /// @notice Creates a DAO, access control, governor, and treasury contracts
    /// @param daoFactory The address of the DAO factory
    /// @param governorFactory The address of the governor factory
    /// @param treasuryFactory The address of the treasury factory
    /// @param treasuryImplementation The address of the treasury implementation
    /// @param createDAOParams The struct of parameters used for the DAO creation
    /// @param createGovernorParams The struct of parameters used for the governor creation
    /// @return dao The address of the created DAO contract
    /// @return accessControl The address of the created access control contract
    /// @return timelock The address of the created timelock contract
    /// @return governor The address of the created governor contract
    /// @return treasury The address of the created treasury contract
    function createDAOAndModules(
        address daoFactory,
        address governorFactory,
        address treasuryFactory,
        address treasuryImplementation,
        IDAOFactory.CreateDAOParams calldata createDAOParams,
        IGovernorFactory.CreateGovernorParams calldata createGovernorParams
    )
        external
        returns (
            address dao,
            address accessControl,
            address timelock,
            address governor,
            address treasury
        )
    {
        (dao, accessControl) = IDAOFactory(daoFactory).createDAO(msg.sender, createDAOParams);
        (timelock, governor) = IGovernorFactory(governorFactory).createGovernor(dao, accessControl, createGovernorParams);
        treasury = ITreasuryModuleFactory(treasuryFactory).createTreasury(accessControl, treasuryImplementation);
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
            interfaceId == type(IMetaFactory).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
