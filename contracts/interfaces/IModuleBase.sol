//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IAccessControl.sol";

interface IModuleBase {
    error NotAuthorized();

    /// @return IAccessControl The Access control interface
    function accessControl() external view returns (IAccessControl);
}
