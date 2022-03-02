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

    function initialize(
        address dao,
        address[] memory executors,
        string[] memory roles,
        string[] memory roleAdmins,
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

    function grantRolesAndAdmins(
        string[] memory roles,
        string[] memory roleAdmins,
        address[][] memory members
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRolesAndAdmins(roles, roleAdmins, members);
    }

    function _grantRolesAndAdmins(
        string[] memory roles,
        string[] memory roleAdmins,
        address[][] memory members
    ) private {
        if (roles.length != roleAdmins.length) revert ArraysNotEqual();
        if (roles.length != members.length) revert ArraysNotEqual();

        // TODO: accept "roles" and "rolesAdmins" as strings
        // TODO: emit some events
        uint256 rolesLength = roles.length;
        for (uint256 i = 0; i < rolesLength; ) {
            _setRoleAdmin(
                keccak256(abi.encodePacked(roles[i])),
                keccak256(abi.encodePacked(roleAdmins[i]))
            );

            uint256 membersLength = members[i].length;
            for (uint256 j = 0; j < membersLength; ) {
                _grantRole(
                    keccak256(abi.encodePacked(roles[i])),
                    members[i][j]
                );
                unchecked {
                    j++;
                }
            }
            unchecked {
                i++;
            }
        }

        emit RolesAndAdminsGranted(roles, roleAdmins, members);
    }

    function updateRolesAdmins(
        string[] calldata roles,
        string[] calldata roleAdmins
    ) public {
        if (roles.length != roleAdmins.length) revert ArraysNotEqual();

        uint256 rolesLength = roles.length;
        for (uint256 i = 0; i < rolesLength; ) {
            _updateRoleAdmin(roles[i], roleAdmins[i]);
            unchecked {
                i++;
            }
        }
    }

    function _updateRoleAdmin(string calldata role, string calldata roleAdmin)
        internal
        onlyRole(getRoleAdmin(getRoleAdmin(keccak256(abi.encodePacked(role)))))
    {
        _setRoleAdmin(
            keccak256(abi.encodePacked(role)),
            keccak256(abi.encodePacked(roleAdmin))
        );

        emit RoleAdminUpdated(role, roleAdmin);
    }

    function actionIsAuthorized(
        address caller,
        address target,
        bytes4 sig
    ) external view override returns (bool isAuthorized) {
        bytes32 action = keccak256(abi.encodePacked(target, sig));
        bytes32[] memory roles = _actionsToRoles[action];
        uint256 roleLength = roles.length;

        for (uint256 i = 0; i < roleLength; ) {
            if (hasRole(roles[i], caller)) {
                isAuthorized = true;
                break;
            }
            unchecked {
                i++;
            }
        }
    }

    function addActionsRoles(
        bytes32[] calldata actions,
        string[][] calldata roles
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        if (actions.length != roles.length) revert ArraysNotEqual();

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

    function _addActionRole(bytes32 action, string calldata role) internal {
        _actionsToRoles[action].push(keccak256(abi.encodePacked(role)));

        emit ActionRoleAdded(action, role);
    }

    function removeActionsRoles(
        bytes32[] calldata actions,
        string[][] calldata roles
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        if (actions.length != roles.length) revert ArraysNotEqual();

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

    function _removeActionRole(bytes32 action, string calldata role) internal {
        uint256 rolesLength = _actionsToRoles[action].length;
        for (uint256 i = 0; i < rolesLength; ) {
            if (
                _actionsToRoles[action][i] == keccak256(abi.encodePacked(role))
            ) {
                _actionsToRoles[action][i] = _actionsToRoles[action][
                    rolesLength - 1
                ];
                _actionsToRoles[action].pop();

                emit ActionRoleRemoved(action, role);

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
