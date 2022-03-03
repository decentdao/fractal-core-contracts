//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/IAccessControl.sol";

interface IDAOAccessControl is IAccessControl {
    error ArraysNotEqual();

    event RolesAndAdminsGranted(
        string[] roles,
        string[] roleAdmins,
        address[][] members
    );
    event RoleAdminUpdated(string role, string roleAdmin);
    event ActionRoleAdded(address target, string functionDesc, bytes32 action, bytes32 role);
    event ActionRoleRemoved(bytes32 action, bytes32 role);

    function initialize(
        address dao,
        address[] memory executors,
        string[] memory roles,
        string[] memory rolesAdmins,
        address[][] memory members
    ) external;

    function actionIsAuthorized(
        address caller,
        address target,
        bytes4 sig
    ) external returns (bool isAuthorized);

    // TODO: make sure all the public/external functions are in here

    function addActionsRoles(
        address[] calldata targets,
        string[] calldata functionDescs,
        bytes32[][] calldata roles
    ) external;

    function removeActionsRoles(
        bytes32[] calldata actions,
        bytes32[][] calldata roles
    ) external;

    function getActionRoles(bytes32 action)
        external
        view
        returns (bytes32[] memory roles);

    function isRoleAuthorized(bytes32 action, bytes32 role)
        external
        view
        returns (bool isTrue);
}
