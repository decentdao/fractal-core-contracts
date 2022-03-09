//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IDAO {
    error Unauthorized(bytes32 role, address account);
    error UnequalArrayLengths();

    event Executed(address[] targets, uint256[] values, bytes[] calldatas);

    function execute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) external;
}
