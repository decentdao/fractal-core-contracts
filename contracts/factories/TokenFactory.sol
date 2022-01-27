// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../voting-tokens/VotesTokenWithSupply.sol";
import "../voting-tokens/VotesTokenWrapped.sol";

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
            address
        )
    {
        if (hodlers.length != allocations.length) revert ArraysNotEqual();
        address votingToken = address(new VotesTokenWithSupply(
            tokenName,
            symbol,
            hodlers,
            allocations,
            totalSupply,
            treasury 
            ));
        emit TokenDeployed(votingToken, tokenName, symbol);
        return votingToken;
    }

    function wrapToken(
        address votingTokenAddress,
        string memory votingTokenName,
        string memory votingTokenSymbol
    ) external returns (
      address
    ) {
        address wrappedToken = address(new VotesTokenWrapped(IERC20(votingTokenAddress), votingTokenName, votingTokenSymbol));
        emit TokenWrapped(votingTokenAddress, wrappedToken, votingTokenName, votingTokenSymbol);
        return (wrappedToken);
    }
}
