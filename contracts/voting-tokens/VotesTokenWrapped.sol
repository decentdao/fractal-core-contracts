//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Wrapper.sol";

import "./VotesToken.sol";

contract VotesTokenWrapped is VotesToken, ERC20Wrapper {
    constructor(
        IERC20 wrappedToken,
        string memory name,
        string memory symbol
    ) VotesToken(name, symbol) ERC20Wrapper(wrappedToken) {}

    // The functions below are overrides required by Solidity.

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, VotesToken) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, VotesToken)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, VotesToken)
    {
        super._burn(account, amount);
    }
}
