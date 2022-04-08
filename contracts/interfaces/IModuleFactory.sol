//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/// @dev The interface to be inherited by Fractal module factories
interface IModuleFactory {
    /// @dev Creates a module
    /// @param data The array of bytes used to create the module
    /// @return address[] Array of the created module addresses
    function create(
        bytes[] calldata data
    ) external returns (address[] memory);
}