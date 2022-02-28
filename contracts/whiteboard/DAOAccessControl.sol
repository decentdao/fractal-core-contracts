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
        if (roles.length != roleAdmins.length) {
            revert InvalidRoles();
        }

        EXECUTE_ROLE = keccak256(abi.encodePacked(dao, "EXECUTE"));

        _grantRole(DEFAULT_ADMIN_ROLE, dao);
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

    function batchCreateRoles(
        bytes32[] memory roles,
        bytes32[] memory roleAdmins,
        address[][] memory members
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i < roles.length; i++) {
            _setRoleAdmin(roles[i], roleAdmins[i]);
            for (uint256 j = 0; j < members[i].length; j++) {
                _grantRole(roles[i], members[i][j]);
            }
        }
    }

    function batchGrantRoles(bytes32[] memory roles, address[][] memory members)
        public
    {
        if (roles.length != members.length) revert InvalidRoles();
        for (uint256 i; i < roles.length; i++) {
            for (uint256 j = 0; j < members[i].length; j++) {
                grantRole(roles[i], members[i][j]);
            }
        }
    }

    function batchUpdateRoleAdmin(
        bytes32[] calldata roles,
        bytes32[] calldata newRoleAdmins
    ) public {
        if (roles.length != newRoleAdmins.length) revert InvalidRoles();
        for (uint256 i; i < roles.length; i++) {
            _updateRoleAdmin(roles[i], newRoleAdmins[i]);
        }
    }

    function _updateRoleAdmin(bytes32 role, bytes32 newRoleAdmin)
        internal
        onlyRole(getRoleAdmin(getRoleAdmin(role)))
    {
        _setRoleAdmin(role, newRoleAdmin);
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
