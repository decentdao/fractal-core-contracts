//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface ITokenFactory {
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
        ) external returns (address token);
}