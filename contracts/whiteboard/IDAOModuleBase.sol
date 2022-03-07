//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IDAOModuleBase {
    error NotAuthorized();

    function initialize(address _accessControl) external;
}
