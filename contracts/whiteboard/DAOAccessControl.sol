//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./IDAOAccessControl.sol";
import "hardhat/console.sol";

contract DAOAccessControl is
    IDAOAccessControl,
    ERC165,
    Initializable,
    AccessControl
{
    mapping(bytes32 => bytes32[]) private _actionsToRoles;

    // todo: Can we pass this into grantRolesAndAdmins
    // todo: pass the executor role in with the factory contract
    // todo: remove the executors params
    // todo: Set up actions - execute is just an action
    function initialize(
        address dao,
        address[] memory executors,
        string[] memory roles,
        string[] memory roleAdmins,
        address[][] memory members
    ) public initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, dao);
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

        uint256 rolesLength = roles.length;
        for (uint256 i = 0; i < rolesLength; ) {
            _setRoleAdmin(
                keccak256(abi.encodePacked(roles[i])),
                keccak256(abi.encodePacked(roleAdmins[i]))
            );

            uint256 membersLength = members[i].length;
            for (uint256 j = 0; j < membersLength; ) {
                // provide checks for each user attempting to add members to a role
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

    function addActionsRoles(
        address[] calldata targets,
        string[] calldata functionDescs,
        bytes32[][] calldata roles
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        if (targets.length != functionDescs.length) revert ArraysNotEqual();
        if (targets.length != roles.length) revert ArraysNotEqual();

        uint256 targetsLength = targets.length;
        for (uint256 i = 0; i < targetsLength; ) {
            uint256 rolesLength = roles[i].length;
            for (uint256 j = 0; j < rolesLength; ) {
                _addActionRole(targets[i], functionDescs[i], roles[i][j]);
                unchecked {
                    j++;
                }
            }
            unchecked {
                i++;
            }
        }
    }

    // Is funcDesc "afunctionName(uint, address)" enough to read?
    function _addActionRole(address target, string memory functionDesc, bytes32 role) internal {
        bytes4 encodedSig = bytes4(keccak256(abi.encodePacked(functionDesc)));
        bytes32 action = keccak256(abi.encodePacked(target, encodedSig));
        _actionsToRoles[action].push(role);

        emit ActionRoleAdded(target, functionDesc, action, role);
    }

    // todo: bytes32 for roles
    function removeActionsRoles(
        bytes32[] calldata actions,
        bytes32[][] calldata roles
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

    function _removeActionRole(bytes32 action, bytes32 role) internal {
        uint256 rolesLength = _actionsToRoles[action].length;
        for (uint256 i = 0; i < rolesLength; ) {
            if (
                _actionsToRoles[action][i] == role
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
