//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IDAOFactory {
  event DAOCreated(address indexed DAOAddress, address indexed accessControl);

  function createDAO(
    address daoImplementation,
    address accessControlImplementation,
    string[] memory roles,
    string[] memory rolesAdmins,
    address[][] memory members,
    address[] memory targets,
    string[] memory functionDescs,
    string[][] memory actionRoles
  ) external returns (address, address);
}
