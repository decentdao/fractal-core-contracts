//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IAccessControl.sol";

interface IModuleBase {
    error NotAuthorized();

    /// @notice Function for initializing the contract that can only be called once
    /// @param _accessControl The address of the access control contract
    function initialize(address _accessControl) external;

    /// @return IAccessControl The Access control interface
    function accessControl() external view returns (IAccessControl);
}
