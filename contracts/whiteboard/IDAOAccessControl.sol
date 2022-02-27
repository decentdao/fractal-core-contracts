// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IDAOAccessControl {
    error MissingRole(address account, bytes32 role);
    error OnlySelfCanRenounce();
    error InvalidRoles();

    event RoleAdminChanged(
        bytes32 indexed role,
        bytes32 indexed previousAdminRole,
        bytes32 indexed newAdminRole
    );
    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    function initialize(
        address dao,
        address[] memory executors,
        bytes32[] memory roles,
        bytes32[] memory rolesAdmins,
        address[][] memory members
    ) external returns (bytes32 EXECUTE_ROLE);

    function hasRole(bytes32 role, address account)
        external
        view
        returns (bool);

    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    function grantRole(bytes32 role, address account) external;

    function revokeRole(bytes32 role, address account) external;

    function renounceRole(bytes32 role, address account) external;
}
