//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IDAOAccessControl.sol";

interface IModuleBase {
    error NotAuthorized();

    /// @return IDAOAccessControl The Access control interface
    function accessControl() external view returns (IDAOAccessControl);

    /// @return string The string "Name"
    function name() external view returns (string memory);
}
