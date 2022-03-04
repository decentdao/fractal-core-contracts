//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IDAOAccessControl.sol";
import "./IDAOModuleBase.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

abstract contract DAOModuleBase is Initializable, IDAOModuleBase {
    error NotAuthorized();

    IDAOAccessControl public accessControl;

    function initialize(
        address _accessControl
    ) public initializer {
        accessControl = IDAOAccessControl(_accessControl);
    }

    modifier authorized {
        if (!accessControl.actionIsAuthorized(msg.sender, address(this), msg.sig)) {
            revert NotAuthorized();
        }
        _;
    }
}
