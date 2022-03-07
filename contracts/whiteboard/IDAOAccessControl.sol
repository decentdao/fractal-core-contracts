//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IDAOAccessControl {
    struct RoleData {
        mapping(address => bool) members;
        string adminRole;
    }
    error UnequalArrayLengths();

    event ActionRoleAdded(
        address target,
        string functionDesc,
        bytes4 encodedSig,
        string role
    );
    event ActionRoleRemoved(
        address target,
        string functionDesc,
        bytes4 encodedSig,
        string role
    );
    event RoleAdminChanged(
        string role,
        string previousAdminRole,
        string adminRole
    );
    event RoleGranted(string role, address account, address admin);
    event RoleRevoked(string role, address account, address admin);

    function initialize(
        address dao,
        string[] memory roles,
        string[] memory roleAdmins,
        address[][] memory members,
        address[] memory targets,
        string[] memory functionDescs,
        string[][] memory actionRoles
    ) external;

    function grantRole(string memory role, address account) external;

    function revokeRole(string memory role, address account) external;

    function renounceRole(string memory role, address account) external;

    function grantRolesAndAdmins(
        string[] memory roles,
        string[] memory roleAdmins,
        address[][] memory members
    ) external;

    function addActionsRoles(
        address[] memory targets,
        string[] memory functionDescs,
        string[][] memory roles
    ) external;

    function removeActionsRoles(
        address[] memory targets,
        string[] memory functionDescs,
        string[][] memory roles
    ) external;

    function hasRole(string memory role, address account)
        external
        view
        returns (bool);

    function actionIsAuthorized(
        address caller,
        address target,
        bytes4 sig
    ) external view returns (bool isAuthorized);

    function getRoleAdmin(string memory role)
        external
        view
        returns (string memory);

    function isRoleAuthorized(
        string calldata role,
        address target,
        string memory functionDesc
    ) external view returns (bool isAuthorized);

    function getActionRoles(address target, string memory functionDesc)
        external
        view
        returns (string[] memory roles);
}
