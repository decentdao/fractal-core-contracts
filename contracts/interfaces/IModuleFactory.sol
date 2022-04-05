//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/// @dev The interface to be inherited by Fractal module factories
interface IModuleFactory {
    /// @dev Creates a module
    /// @param data The array of bytes used to create the module
    /// @return address The address of the created module
    function create(
        bytes[] calldata data
    ) external returns (address);
}