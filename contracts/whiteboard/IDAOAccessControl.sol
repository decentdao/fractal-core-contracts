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
    ) external returns (bytes32 EXECUTE_ROLE);
}
