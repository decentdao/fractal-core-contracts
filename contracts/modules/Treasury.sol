//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

/// @notice A treasury module contract for managing a DAOs assets
contract Treasury is Ownable, ERC721Holder {
    using SafeERC20 for IERC20;

    error ArraysNotEqual();

    constructor(address timelockController) {
        _transferOwnership(timelockController);
    }

    function withdrawEth(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        if(recipients.length != amounts.length) {
          revert ArraysNotEqual();
        }

        for (uint256 index = 0; index < recipients.length; index++) {
          payable(recipients[index]).transfer(amounts[index]);
        }
    }

    function depositErc20Tokens(
        address[] calldata tokenAddresses,
        address[] calldata senders,
        uint256[] calldata amounts
    ) external onlyOwner {
        if(tokenAddresses.length != senders.length || tokenAddresses.length != amounts.length) {
          revert ArraysNotEqual();
        }

        for (uint256 index = 0; index < tokenAddresses.length; index++) {
            IERC20(tokenAddresses[index]).safeTransferFrom(
                senders[index],
                address(this),
                amounts[index]
            );
        }
    }

    function withdrawErc20Tokens(
        address[] calldata tokenAddresses,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        if(tokenAddresses.length != recipients.length || tokenAddresses.length != amounts.length) {
          revert ArraysNotEqual();
        }

        for (uint256 index = 0; index < tokenAddresses.length; index++) {
            IERC20(tokenAddresses[index]).safeTransfer(
                recipients[index],
                amounts[index]
            );
        }
    }

       function depositErc721Tokens(
        address[] calldata tokenAddresses,
        address[] calldata senders,
        uint256[] calldata tokenIds
    ) external onlyOwner {
        if(tokenAddresses.length != senders.length || tokenAddresses.length != tokenIds.length) {
          revert ArraysNotEqual();
        }

        for (uint256 index = 0; index < tokenAddresses.length; index++) {
            IERC721(tokenAddresses[index]).safeTransferFrom(
                senders[index],
                address(this),
                tokenIds[index]
            );
        }
    }

    function withdrawErc721Tokens(
        address[] calldata tokenAddresses,
        address[] calldata recipients,
        uint256[] calldata tokenIds
    ) external onlyOwner {
        if(tokenAddresses.length != recipients.length || tokenAddresses.length != tokenIds.length) {
          revert ArraysNotEqual();
        }

        for (uint256 index = 0; index < tokenAddresses.length; index++) {
            IERC721(tokenAddresses[index]).safeTransferFrom(
                address(this),
                recipients[index],
                tokenIds[index]
            );
        }
    }
}
