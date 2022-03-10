//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IDAOFactory {
    struct CreateDAOParams {
        address daoImplementation;
        address accessControlImplementation;
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

    function createDAO(CreateDAOParams calldata createDAOParams)
        external
        returns (address, address);
}
