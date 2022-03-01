//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ModuleBase.sol";
import "hardhat/console.sol";

contract FooModule is ModuleBase {
    constructor(address accessControl) ModuleBase(accessControl) {}

    function fooPermissionedA() public authorized {
        console.log("foo permissioned A");
    }

    function fooPermissionedB() public authorized {
        console.log("foo permissioned B");
    }

    function fooPermissionedC() public authorized {
        console.log("foo permissioned C");
    }
}
