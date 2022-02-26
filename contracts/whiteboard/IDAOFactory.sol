//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IDAOFactory {
    event DAOCreated(address indexed);

    function createDAO(
        address daoPrototype,
        address accessControlPrototype,
        address[] memory executors,
        bytes32[] memory roles,
        bytes32[] memory rolesAdmins,
        address[][] memory members
    ) external returns (address);
}
