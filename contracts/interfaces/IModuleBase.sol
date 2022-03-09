//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IAccessControl.sol";

interface IModuleBase {
    error NotAuthorized();

    function initialize(address _accessControl) external;

    function accessControl() external returns (IAccessControl);
}
