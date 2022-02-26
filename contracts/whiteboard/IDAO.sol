//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IDAO {
    error Unauthorized(bytes32 role, address account);

    function initialize(
        address accessControlPrototype,
        address[] memory executors,
        bytes32[] memory roles,
        bytes32[] memory rolesAdmins,
        address[][] memory members
    ) external;

    function execute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) external;
}
