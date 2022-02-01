//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor(string memory name, string memory symbol, address[] memory holders, uint256[] memory amounts)
        ERC20(name, symbol)
    {
      for(uint256 i = 0; i < holders.length; i++) {
        _mint(holders[i], amounts[i]);
      }
    }
}