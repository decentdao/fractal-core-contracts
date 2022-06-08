//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IDAOAccessControl.sol";

interface IModuleBase {
    error NotAuthorized();

    /// @return IDAOAccessControl The Access control interface
    function accessControl() external view returns (IDAOAccessControl);

    /// @notice Returns whether a given interface ID is supported
    /// @param interfaceId An interface ID bytes4 as defined by ERC-165
    /// @return bool Indicates whether the interface is supported
    function supportsInterface(bytes4 interfaceId) external view returns (bool);

    /// @return string The string "Name"
    function name() external view returns (string memory);
}
