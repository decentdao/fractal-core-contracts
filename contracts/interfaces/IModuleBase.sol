//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IAccessControlDAO.sol";

interface IModuleBase {
    error NotAuthorized();

    /// @return IAccessControlDAO The Access control interface
    function accessControl() external view returns (IAccessControlDAO);

        /// @notice Returns whether a given interface ID is supported
    /// @param interfaceId An interface ID bytes4 as defined by ERC-165
    /// @return bool Indicates whether the interface is supported
    function supportsInterface(bytes4 interfaceId)
        external
        view
        returns (bool);

    function currentImpl() external view returns(address);

    function isImplCurrent() external view returns(address uptodateImpl, bool isCurrent);
}
