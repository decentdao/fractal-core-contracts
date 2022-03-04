//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./DAOAccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

abstract contract DAOModuleBase is Initializable {
    error NotAuthorized();

    DAOAccessControl public accessControl;

    function initialize(
        address _accessControl
    ) public initializer {
        accessControl = DAOAccessControl(_accessControl);
    }

    modifier authorized {
        if (!accessControl.actionIsAuthorized(msg.sender, address(this), msg.sig)) {
            revert NotAuthorized();
        }
        _;
    }
}
