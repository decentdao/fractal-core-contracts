//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/IAccessControl.sol";

interface IDAOAccessControl is IAccessControl {
    error InvalidRoles();
    error NoOp();

    function initialize(
        address dao,
        address[] memory executors,
        bytes32[] memory roles,
        bytes32[] memory rolesAdmins,
        address[][] memory members
    ) external;

    function actionIsAuthorized(
        address caller,
        address target,
        bytes4 sig
    ) external returns (bool isAuthorized);

    // TODO: make sure all the public/external functions are in here

    function addActionRoles(
        bytes32[] calldata actions,
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
