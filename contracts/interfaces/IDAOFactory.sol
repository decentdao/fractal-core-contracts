//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IDAOFactory {
    struct CreateDAOParams {
        address daoImplementation;
        address accessControlImplementation;
        string daoName;
        string[] roles;
        string[] rolesAdmins;
        address[][] members;
        string[] daoFunctionDescs;
        string[][] daoActionRoles;
        address[] moduleTargets;
        string[] moduleFunctionDescs;
        string[][] moduleActionRoles;
    }

    event DAOCreated(address indexed daoAddress, address indexed accessControl);

    /// @notice Creates a DAO with an access control contract
    /// @param createDAOParams Struct of all the parameters required to create a DAO
    /// @return dao The address of the deployed DAO proxy contract
    /// @return accessControl The address of the deployed access control proxy contract
    function createDAO(CreateDAOParams calldata createDAOParams)
        external
        returns (address, address);
}
