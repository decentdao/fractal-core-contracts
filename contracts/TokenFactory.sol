//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./mocks/VotesTokenWithSupply.sol";
import "./interfaces/IModuleFactory.sol";

/// @notice Token Factory used to deploy votes tokens
contract TokenFactory is IModuleFactory, ERC165 {
    /// @dev Creates an ERC-20 votes token
    /// @param data The array of bytes used to create the token
    /// @return address The address of the created token
    function create(bytes[] calldata data) external returns (address) {
        address treasury = abi.decode(data[0], (address));
        string memory name = abi.decode(data[1], (string));
        string memory symbol = abi.decode(data[2], (string));
        address[] memory hodlers = abi.decode(data[3], (address[]));
        uint256[] memory allocations = abi.decode(data[4], (uint256[]));
        uint256 totalSupply = abi.decode(data[5], (uint256));

        return address(
            new VotesTokenWithSupply(
                name,
                symbol,
                hodlers,
                allocations,
                totalSupply,
                treasury
            )
        );
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
            interfaceId == type(IModuleFactory).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
