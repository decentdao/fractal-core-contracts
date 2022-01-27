//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./VotesToken.sol";

contract VotesTokenWithSupply is VotesToken {
    constructor(
        string memory name,
        string memory symbol,
        address[] memory hodlers,
        uint256[] memory allocations,
        uint256 totalSupply,
        address treasury
    ) VotesToken(name, symbol) {
        uint256 tokenSum;
        for (uint256 i = 0; i < hodlers.length; i++) {
            _mint(hodlers[i], allocations[i]);
            tokenSum += allocations[i];
        }

        if (totalSupply > tokenSum) {
            _mint(treasury, totalSupply - tokenSum);
        }
    }
}
