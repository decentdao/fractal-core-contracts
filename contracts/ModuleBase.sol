//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./interfaces/IModuleBase.sol";

/// @notice An abstract contract to be inherited by module contracts
abstract contract ModuleBase is IModuleBase, UUPSUpgradeable, ERC165 {
    IAccessControl public accessControl;

    /// @notice Requires that a function caller has the associated role
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

    /// @notice Returns whether a given interface ID is supported
    /// @param interfaceId An interface ID bytes4 as defined by ERC-165
    /// @return bool Indicates whether the interface is supported
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IModuleBase).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /// @notice Function for initializing the contract that can only be called once
    /// @param _accessControl The address of the access control contract
    function __initBase(address _accessControl) internal onlyInitializing {
        accessControl = IAccessControl(_accessControl);
        __UUPSUpgradeable_init();
    }

    /// @dev Applies authorized modifier so that an upgrade require the caller to have the correct role

    /// @param newImplementation The address of the new implementation contract being upgraded to
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        authorized
    {}
}
