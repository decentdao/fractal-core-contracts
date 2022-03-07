//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IDAOAccessControl.sol";
import "./IDAOModuleBase.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

abstract contract DAOModuleBase is IDAOModuleBase, UUPSUpgradeable, ERC165 {
    IDAOAccessControl public accessControl;

    function initialize(address _accessControl) public initializer {
        accessControl = IDAOAccessControl(_accessControl);
        __UUPSUpgradeable_init();
    }

    modifier authorized() {
        if (
            !accessControl.actionIsAuthorized(
                msg.sender,
                address(this),
                msg.sig
            )
        ) {
            revert NotAuthorized();
        }
        _;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        authorized
    {}
}
