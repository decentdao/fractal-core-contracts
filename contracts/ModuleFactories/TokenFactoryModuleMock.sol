//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Modules/VotesTokenWithSupplyModule.sol";

/// @notice A contract for creating new ERC-20 tokens and wrapping existing ERC-20 tokens
contract TokenFactoryModuleMock {
    error ArraysNotEqual();

    event TokenDeployed(address tokenAddress, string name, string symbol);

    /// @notice Creates a new ERC-20 token that supports DAO voting
    /// @param tokenName The name of the ERC-20 token
    /// @param symbol The symbol of the ERC-20 token
    /// @param hodlers The array of addresses that will receive the new token
    /// @param allocations The array of amounts that each hodler will receive
    /// @param totalSupply The total supply of the token to be minted
    /// @param treasury The address of the treasury for remaining tokens to be minted to
    /// @param acl Address of systems Access control list
    /// @return votingToken The address of the new ERC-20 token
    function createToken(
        string memory tokenName,
        string memory symbol,
        address[] memory hodlers,
        uint256[] memory allocations,
        uint256 totalSupply,
        address treasury,
        address acl,
        bytes32[] memory _roles
    ) external returns (address votingToken) {
        if (hodlers.length != allocations.length) revert ArraysNotEqual();
        votingToken = address(
            new VotesTokenWithSupplyModule(
                tokenName,
                symbol,
                hodlers,
                allocations,
                totalSupply,
                treasury,
                acl,
                _roles
            )
        );
        emit TokenDeployed(votingToken, tokenName, symbol);
    }
}
