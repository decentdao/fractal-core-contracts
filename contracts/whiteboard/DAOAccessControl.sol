//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import "./IDAOAccessControl.sol";

contract DAOAccessControl is
    IDAOAccessControl,
    ERC165,
    Initializable,
    AccessControl
{
    function initialize(
        address dao,
        address[] memory executors,
        bytes32[] memory roles,
        bytes32[] memory roleAdmins,
        address[][] memory members
    ) public initializer returns (bytes32 EXECUTE_ROLE) {
        if (
            roles.length != roleAdmins.length
        ) {
            revert InvalidRoles();
        }

        EXECUTE_ROLE = keccak256(
            abi.encodePacked(dao, "EXECUTE")
        );

        _grantRole(DEFAULT_ADMIN_ROLE, dao);

        unchecked {
            for (uint256 i = 0; i < executors.length; i++) {
                _grantRole(EXECUTE_ROLE, executors[i]);
            }

            for (uint256 i = 0; i < roles.length; i++) {
                _setRoleAdmin(roles[i], roleAdmins[i]);
                for (uint256 j = 0; j < members[i].length; j++) {
                    _grantRole(roles[i], members[i][j]);
                }
            }
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC165, AccessControl)
        returns (bool)
    {
        return
            interfaceId == type(IDAOAccessControl).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
