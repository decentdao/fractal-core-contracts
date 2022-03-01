//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// TODO: maybe we should use the enumerable version, for frontend purposes
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
        address sender,
        address module,
        bytes4 sig
    ) external returns (bool isAuthorized);

    function addActionRoles(bytes32[] calldata actions, bytes32[] calldata roles) external;

    function removeActionRoles(bytes32[] calldata actions, bytes32[] calldata roles) external;

    function getActionRoles(bytes32 action) external view returns(bytes32[] memory roles);
}
