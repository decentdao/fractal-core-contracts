//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockERC721 is ERC721 {
    constructor(string memory name, string memory symbol, address[] memory holders, uint256[] memory tokenIds)
        ERC721(name, symbol)
    {
      for(uint256 i = 0; i < holders.length; i++) {
        _mint(holders[i], tokenIds[i]);
      }
    }
}