//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IDAOFactory {
  error InputsNotEqual();
  event DAOCreated(address indexed DAOAddress, address indexed accessControl);
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

  function createDAO(
    CreateDAOParams calldata createDaoParams
  ) external returns (address, address);
}
