// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./GovernanceToken.sol";
import "./WrappedToken.sol";

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
        uint256[] memory allocations
    )
        external
        returns (
            address
        )
    {
        if (hodlers.length != allocations.length) revert ArraysNotEqual();
        address votingToken = address(new GovernanceToken(tokenName, symbol));
        for (uint256 i = 0; i < hodlers.length; i++) {
            GovernanceToken(votingToken).mint(hodlers[i], allocations[i]);
        }
        emit TokenDeployed(votingToken, tokenName, symbol);
        return votingToken;
    }

    function WrapToken(
        address votingTokenAddress,
        string memory votingTokenName,
        string memory votingTokenSymbol
    ) external returns (
      address
    ) {
        address wrappedToken = address(new WrappedToken(IERC20(votingTokenAddress), votingTokenName, votingTokenSymbol));
        emit TokenWrapped(votingTokenAddress, wrappedToken, votingTokenName, votingTokenSymbol);
        return (wrappedToken);
    }
}
