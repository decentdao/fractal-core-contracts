//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";
import "./interfaces/IModuleBase.sol";

/// @notice An abstract contract to be inherited by module contracts
abstract contract ModuleBase is IModuleBase, UUPSUpgradeable, ERC165Storage {
    IDAOAccessControl public accessControl;
    address public moduleFactory;
    string internal _name;

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

    /// @notice Function for initializing the contract that can only be called once
    /// @param _accessControl The address of the access control contract
    /// @param _moduleFactory The address of the factory deploying the module
    /// @param __name Human readable string of the module name
    function __initBase(address _accessControl, address _moduleFactory, string memory __name)
        internal
        onlyInitializing
    {
        accessControl = IDAOAccessControl(_accessControl);
        moduleFactory = _moduleFactory;
        _name = __name;
        __UUPSUpgradeable_init();
        _registerInterface(type(IModuleBase).interfaceId);
    }

    /// @dev Applies authorized modifier so that an upgrade require the caller to have the correct role
    /// @param newImplementation The address of the new implementation contract being upgraded to
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        authorized
    {}

    /// @notice Returns the module name
    /// @return The module name
    function name() public view virtual returns (string memory) {
      return _name;
    }
}
