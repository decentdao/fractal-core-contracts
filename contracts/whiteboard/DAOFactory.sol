//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./IDAOFactory.sol";
import "./IDAO.sol";

contract DAOFactory is IDAOFactory, ERC165 {
    function createDAO(
        address daoImplementation,
        address accessControlImplementation,
        address[] memory executors,
        bytes32[] memory roles,
        bytes32[] memory rolesAdmins,
        address[][] memory members
    ) external returns (address) {
        address dao = address(
            new ERC1967Proxy(
                daoImplementation,
                abi.encodeWithSelector(
                    IDAO(payable(address(0))).initialize.selector,
                    accessControlImplementation,
                    executors,
                    roles,
                    rolesAdmins,
                    members
                )
            )
        );

        emit DAOCreated(dao);

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
