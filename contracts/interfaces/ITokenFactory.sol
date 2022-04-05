//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface ITokenFactory {
    /// @notice Deploys a new votes token contract
    function create(bytes[] calldata data) external returns (address token);
}