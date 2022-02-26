//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import "./IDAOFactory.sol";
import "./IDAO.sol";

contract DAOFactory is IDAOFactory, ERC165 {
    function createDAO(
        address daoPrototype,
        address accessControlPrototype,
        address[] memory executors,
        bytes32[] memory roles,
        bytes32[] memory rolesAdmins,
        address[][] memory members
    ) external returns (address) {
        address dao = Clones.clone(daoPrototype);
        emit DAOCreated(dao);
        IDAO(dao).initialize(
            accessControlPrototype,
            executors,
            roles,
            rolesAdmins,
            members
        );
        return dao;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IDAOFactory).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
