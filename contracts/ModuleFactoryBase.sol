//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";
import "./interfaces/IModuleFactoryBase.sol";

/// @notice An abstract contract to be inherited by module contracts
abstract contract ModuleFactoryBase is
    IModuleFactoryBase,
    Ownable,
    Initializable,
    ERC165Storage
{
    bytes32 public constant VERSION_ROLE = keccak256("VERSION_ROLE");
    VersionInfo[] public versionControl;

    /// @dev add a new version to update module users
    /// @param _semanticVersion semantic version control
    /// @param _frontendURI IPFS hash of the static frontend
    /// @param _impl address of the impl
    function addVersion(
        string calldata _semanticVersion,
        string calldata _frontendURI,
        address _impl
    ) external onlyOwner {
        versionControl.push(VersionInfo(_semanticVersion, _frontendURI, _impl));
        emit VersionCreated(_semanticVersion, _frontendURI, _impl);
    }

    /// @dev Creates a module
    /// @param data The array of bytes used to create the module
    /// @return address[] Array of the created module addresses
    function create(bytes[] calldata data)
        external
        virtual
        returns (address[] memory);

    /// @notice Function for initializing the contract that can only be called once
    function __initFactoryBase() internal onlyInitializing {
        _registerInterface(type(IModuleFactoryBase).interfaceId);
    }
}
