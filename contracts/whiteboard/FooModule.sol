//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IDAOAccessControl.sol";

contract FooModule {
    error NotAuthorized();

    IDAOAccessControl public accessControl;

    constructor(address _accessControl) {
        accessControl = IDAOAccessControl(_accessControl);
    }

    modifier authorized {
        // TODO: confirm that msg.sig behaves like msg.sender (changes between contract/function hops)
        
        if (!accessControl.actionIsAuthorized(msg.sender, address(this), msg.sig)) {
            revert NotAuthorized();
        }
        _;
    }

    function permissionedA() public authorized {

    }

    function permissionedB() public authorized {
        
    }

    function permissionedC() public authorized {
        
    }
}
