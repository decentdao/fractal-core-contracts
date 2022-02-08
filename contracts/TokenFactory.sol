//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./voting-tokens/VotesTokenWithSupply.sol";
import "./voting-tokens/VotesTokenWrapped.sol";

/// @notice A contract for creating new ERC-20 tokens and wrapping existing ERC-20 tokens
contract TokenFactory {
    error ArraysNotEqual();

    event TokenDeployed(
        address tokenAddress,
        string name,
        string symbol
    );

    event TokenWrapped(
        address underlyingToken,
        address wrappedAddress,
        string name,
        string symbol
    );

    /// @notice Creates a new ERC-20 token that supports DAO voting
    /// @param tokenName The name of the ERC-20 token
    /// @param symbol The symbol of the ERC-20 token
    /// @param hodlers The array of addresses that will receive the new token
    /// @param allocations The array of amounts that each hodler will receive
    /// @param totalSupply The total supply of the token to be minted
    /// @param treasury The address of the treasury for remaining tokens to be minted to
    /// @return votingToken The address of the new ERC-20 token
    function createToken(
        string memory tokenName,
        string memory symbol,
        address[] memory hodlers,
        uint256[] memory allocations,
        uint256 totalSupply,
        address treasury
    )
        external
        returns (
            address votingToken
        )
    {
        if (hodlers.length != allocations.length) revert ArraysNotEqual();
        votingToken = address(new VotesTokenWithSupply(
            tokenName,
            symbol,
            hodlers,
            allocations,
            totalSupply,
            treasury 
            ));
        emit TokenDeployed(votingToken, tokenName, symbol);
    }

    /// @notice Wraps an existing ERC-20 token with a new token that supports DAO voting
    /// @param tokenAddress The address of the original ERC-20 token
    /// @param votingTokenName The name of the new ERC-20 voting token
    /// @param votingTokenSymbol The symbol of the new ERC-20 voting token
    function wrapToken(
        address tokenAddress,
        string memory votingTokenName,
        string memory votingTokenSymbol
    ) external returns (
      address votingToken
    ) {
        votingToken = address(new VotesTokenWrapped(IERC20(tokenAddress), votingTokenName, votingTokenSymbol));
        emit TokenWrapped(tokenAddress, votingToken, votingTokenName, votingTokenSymbol);
    }
}
