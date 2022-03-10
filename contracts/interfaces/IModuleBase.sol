//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IAccessControl.sol";

interface IModuleBase {
    error NotAuthorized();

    function accessControl() external returns (IAccessControl);
}
