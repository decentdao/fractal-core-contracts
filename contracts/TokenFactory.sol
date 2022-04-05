//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./mocks/VotesTokenWithSupply.sol";
import "./interfaces/ITokenFactory.sol";

/// @notice Token Factory used to deploy votes tokens
contract TokenFactory is ITokenFactory, ERC165 {
    /// @notice Deploys a new votes token contract
    /// @param name The name of the token
    /// @param symbol The symbol of the token
    /// @param hodlers The array of token receivers
    /// @param allocations The array of token amounts for the hodlers to receive
    /// @param totalSupply The total token token supply to mint
    /// @param treasury The address of the 
    function createToken(
        string memory name,
        string memory symbol,
        address[] memory hodlers,
        uint256[] memory allocations,
        uint256 totalSupply,
        address treasury
        ) external returns (address token) {
          token = address(new VotesTokenWithSupply(name, symbol, hodlers, allocations, totalSupply, treasury));
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