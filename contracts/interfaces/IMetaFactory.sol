//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IGovernorModule.sol";
import "./IDAOFactory.sol";
import "./IGovernorFactory.sol";

interface IMetaFactory {
    error CreateDAOReverted();
    error CreateGovernorReverted();
    error CreateTreasuryReverted();

    /// @notice Creates a DAO, access control, governor, and treasury contracts
    /// @param daoFactory The address of the DAO factory
    /// @param governorFactory The address of the governor factory
    /// @param treasuryFactory The address of the treasury factory
    /// @param treasuryImplementation The address of the treasury implementation
    /// @param createDAOParams The struct of parameters used for the DAO creation
    /// @param createGovernorParams The struct of parameters used for the governor creation
    /// @return dao The address of the created DAO contract
    /// @return accessControl The address of the created access control contract
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
            address governor,
            address treasury
        );
}