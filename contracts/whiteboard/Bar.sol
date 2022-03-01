//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./FooModule.sol";
import "hardhat/console.sol";

contract Bar {
    FooModule foo;

    constructor(address _foo) {
        foo = FooModule(_foo);
    }

    function barPermissionedA() public {
        console.log("bar permissioned A");
        foo.fooPermissionedA();
    }

    function barPermissionedB() public {
        console.log("bar permissioned B");
        foo.fooPermissionedB();
    }

    function barPermissionedC() public {
        console.log("bar permissioned C");
        foo.fooPermissionedC();
    }
}
