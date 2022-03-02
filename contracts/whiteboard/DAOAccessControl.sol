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
    mapping(bytes32 => bytes32[]) private _actionsToRoles;
    error ArraysNotEqual();

    function initialize(
        address dao,
        address[] memory executors,
        bytes32[] memory roles,
        bytes32[] memory roleAdmins,
        address[][] memory members
    ) public initializer {
        bytes32 EXECUTE_ROLE = keccak256("EXECUTE");

        _grantRole(DEFAULT_ADMIN_ROLE, dao);

        uint256 executorsLength = executors.length;
        for (uint256 i = 0; i < executorsLength; ) {
            _grantRole(EXECUTE_ROLE, executors[i]);
            unchecked {
                i++;
            }
        }

        _grantRolesAndAdmins(roles, roleAdmins, members);
    }

    function createRoles(
        bytes32[] memory roles,
        bytes32[] memory roleAdmins,
        address[][] memory members
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRolesAndAdmins(roles, roleAdmins, members);
    }

    function _grantRolesAndAdmins(
        bytes32[] memory roles,
        bytes32[] memory roleAdmins,
        address[][] memory members
    ) private {
        if (roles.length != roleAdmins.length) revert InvalidRoles();
        if (roles.length != members.length) revert InvalidRoles();

        // TODO: accept "roles" and "rolesAdmins" as strings
        // TODO: emit some events
        uint256 rolesLength = roles.length;
        for (uint256 i = 0; i < rolesLength; ) {
            _setRoleAdmin(roles[i], roleAdmins[i]);

            uint256 membersLength = members[i].length;
            for (uint256 j = 0; j < membersLength; ) {
                _grantRole(roles[i], members[i][j]);
                unchecked {
                    j++;
                }
            }
            unchecked {
                i++;
            }
        }
    }

    function grantRoles(bytes32[] memory roles, address[][] memory members)
        public
    {
        if (roles.length != members.length) revert InvalidRoles();

        uint256 rolesLength = roles.length;
        for (uint256 i = 0; i < rolesLength; ) {
            uint256 membersLength = members[i].length;
            for (uint256 j = 0; j < membersLength; ) {
                grantRole(roles[i], members[i][j]);
                unchecked {
                    j++;
                }
            }
            unchecked {
                i++;
            }
        }
    }

    function updateRolesAdmins(
        bytes32[] calldata roles,
        bytes32[] calldata newRoleAdmins
    ) public {
        if (roles.length != newRoleAdmins.length) revert InvalidRoles();

        uint256 rolesLength = roles.length;
        for (uint256 i = 0; i < rolesLength; ) {
            _updateRoleAdmin(roles[i], newRoleAdmins[i]);
            unchecked {
                i++;
            }
        }
    }

    function _updateRoleAdmin(bytes32 role, bytes32 newRoleAdmin)
        internal
        onlyRole(getRoleAdmin(getRoleAdmin(role)))
    {
        _setRoleAdmin(role, newRoleAdmin);
    }

    function actionIsAuthorized(
        address sender,
        address module,
        bytes4 sig
    ) external view override returns (bool isAuthorized) {
        bytes32 action = keccak256(abi.encodePacked(module, sig));
        bytes32[] memory roles = _actionsToRoles[action];
        uint256 roleLength = roles.length;

        for (uint256 i = 0; i < roleLength; ) {
            if (hasRole(roles[i], sender)) {
                isAuthorized = true;
                break;
            }
            unchecked {
                i++;
            }
        }
    }

    function addActionRoles(
        bytes32[] calldata actions,
        bytes32[][] calldata roles
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        if (actions.length != roles.length) {
            revert ArraysNotEqual();
        }

        uint256 actionsLength = actions.length;
        for (uint256 i = 0; i < actionsLength; ) {
            uint256 rolesLength = roles[i].length;
            for (uint256 j = 0; j < rolesLength; ) {
                _addActionRole(actions[i], roles[i][j]);
                unchecked {
                    j++;
                }
            }
            unchecked {
                i++;
            }
        }
    }

    function _addActionRole(bytes32 action, bytes32 role) internal {
        _actionsToRoles[action].push(role);
    }

    function removeActionsRoles(
        bytes32[] calldata actions,
        bytes32[][] calldata roles
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        if (actions.length != roles.length) {
            revert ArraysNotEqual();
        }

        uint256 actionsLength = actions.length;
        for (uint256 i = 0; i < actionsLength; ) {
            uint256 rolesLength = roles[i].length;
            for (uint256 j = 0; j < rolesLength; ) {
                _removeActionRole(actions[i], roles[i][j]);
                unchecked {
                    j++;
                }
            }
            unchecked {
                i++;
            }
        }
    }

    function _removeActionRole(bytes32 action, bytes32 role) internal {
        uint256 rolesLength = _actionsToRoles[action].length;
        for (uint256 i = 0; i < rolesLength; ) {
            if (_actionsToRoles[action][i] == role) {
                _actionsToRoles[action][i] = _actionsToRoles[action][
                    rolesLength - 1
                ];
                _actionsToRoles[action].pop();
                break;
            }
            unchecked {
                i++;
            }
        }
    }

    function getActionRoles(bytes32 action)
        external
        view
        override
        returns (bytes32[] memory roles)
    {
        return _actionsToRoles[action];
    }

    function isRoleAuthorized(bytes32 action, bytes32 role)
        external
        view
        override
        returns (bool isTrue)
    {
        bytes32[] memory roles = _actionsToRoles[action];
        uint256 rolesLength = roles.length;

        for (uint256 i = 0; i < rolesLength; ) {
            if (roles[i] == role) {
                isTrue = true;
                break;
            }
            unchecked {
                i++;
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
