//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IModuleBase {
    error NotAuthorized();

    function initialize(address _accessControl) external;
}
