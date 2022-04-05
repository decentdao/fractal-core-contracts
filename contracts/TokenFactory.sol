//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./mocks/VotesTokenWithSupply.sol";
import "./interfaces/ITokenFactory.sol";

import "hardhat/console.sol";

/// @notice Token Factory used to deploy votes tokens
contract TokenFactory is ITokenFactory, ERC165 {
    function create(bytes[] calldata data) external returns (address token) {
        address treasury = abi.decode(data[0], (address));
        string memory name = abi.decode(data[1], (string));
        string memory symbol = abi.decode(data[2], (string));
        address[] memory hodlers = abi.decode(data[3], (address[]));
        uint256[] memory allocations = abi.decode(data[4], (uint256[]));
        uint256 totalSupply = abi.decode(data[5], (uint256));

        token = address(
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
            interfaceId == type(ITokenFactory).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
