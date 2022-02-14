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

  event EthDeposited(address sender, uint256 amount);

  event EthWithdrawn(address[] recipients, uint256[] amounts);

  event ERC20TokensDeposited(
    address[] tokenAddresses,
    address[] senders,
    uint256[] amounts
  );

  event ERC20TokensWithdrawn(
    address[] tokenAddresses,
    address[] recipients,
    uint256[] amounts
  );

  event ERC721TokensDeposited(
    address[] tokenAddresses,
    address[] senders,
    uint256[] tokenIds
  );

  event ERC721TokensWithdrawn(
    address[] tokenAddresses,
    address[] recipients,
    uint256[] tokenIds
  );

  /// @notice Creates a new treasury instance
  /// @param initialOwner The address to initialize ownership of the contract to
  constructor(address initialOwner) {
    _transferOwnership(initialOwner);
  }

  /// @notice Allows the contract to receive Ether
  receive() external payable {
    emit EthDeposited(msg.sender, msg.value);
  }

  /// @notice Allows the owner to withdraw ETH to multiple addresses
  /// @param recipients Array of addresses that ETH will be withdrawn to
  /// @param amounts Array of amounts of ETH that will be withdrawnnn
  function withdrawEth(
    address[] calldata recipients,
    uint256[] calldata amounts
  ) external onlyOwner {
    if (recipients.length != amounts.length) {
      revert ArraysNotEqual();
    }

    for (uint256 index = 0; index < recipients.length; index++) {
      payable(recipients[index]).transfer(amounts[index]);
    }

    emit EthWithdrawn(recipients, amounts);
  }

  /// @notice Allows the owner to deposit ERC-20 tokens from multiple addresses
  /// @param tokenAddresses Array of token contract addresses
  /// @param senders Array of addresses that the ERC-20 token will be transferred from
  /// @param amounts Array of amounts of the ERC-20 token that will be transferred
  function depositERC20Tokens(
    address[] calldata tokenAddresses,
    address[] calldata senders,
    uint256[] calldata amounts
  ) external onlyOwner {
    if (
      tokenAddresses.length != senders.length ||
      tokenAddresses.length != amounts.length
    ) {
      revert ArraysNotEqual();
    }

    for (uint256 index = 0; index < tokenAddresses.length; index++) {
      IERC20(tokenAddresses[index]).safeTransferFrom(
        senders[index],
        address(this),
        amounts[index]
      );
    }

    emit ERC20TokensDeposited(tokenAddresses, senders, amounts);
  }

  /// @notice Allows the owner to withdraw ERC-20 tokens from multiple addresses
  /// @param tokenAddresses Array of token contract addresses
  /// @param recipients Array of addresses that the ERC-20 token will be transferred to
  /// @param amounts Array of amounts of the ERC-20 token that will be transferred 
  function withdrawERC20Tokens(
    address[] calldata tokenAddresses,
    address[] calldata recipients,
    uint256[] calldata amounts
  ) external onlyOwner {
    if (
      tokenAddresses.length != recipients.length ||
      tokenAddresses.length != amounts.length
    ) {
      revert ArraysNotEqual();
    }

    for (uint256 index = 0; index < tokenAddresses.length; index++) {
      IERC20(tokenAddresses[index]).safeTransfer(
        recipients[index],
        amounts[index]
      );
    }

    emit ERC20TokensWithdrawn(tokenAddresses, recipients, amounts);
  }

  /// @notice Allows the owner to deposit ERC-721 tokens from multiple addresses
  /// @param tokenAddresses Array of token contract addresses
  /// @param senders Array of addresses that the ERC-721 tokens will be transferred from
  /// @param tokenIds Array of amounts of the ERC-20 token that will be transferred 
  function depositERC721Tokens(
    address[] calldata tokenAddresses,
    address[] calldata senders,
    uint256[] calldata tokenIds
  ) external onlyOwner {
    if (
      tokenAddresses.length != senders.length ||
      tokenAddresses.length != tokenIds.length
    ) {
      revert ArraysNotEqual();
    }

    for (uint256 index = 0; index < tokenAddresses.length; index++) {
      IERC721(tokenAddresses[index]).safeTransferFrom(
        senders[index],
        address(this),
        tokenIds[index]
      );
    }

    emit ERC721TokensDeposited(tokenAddresses, senders, tokenIds);
  }

  /// @notice Allows the owner to withdraw ERC-721 tokens from multiple addresses
  /// @param tokenAddresses Array of token contract addresses
  /// @param recipients Array of addresses that the ERC-721 tokens will be transferred to
  /// @param tokenIds Array of amounts of the ERC-20 token that will be transferred 
  function withdrawERC721Tokens(
    address[] calldata tokenAddresses,
    address[] calldata recipients,
    uint256[] calldata tokenIds
  ) external onlyOwner {
    if (
      tokenAddresses.length != recipients.length ||
      tokenAddresses.length != tokenIds.length
    ) {
      revert ArraysNotEqual();
    }

    for (uint256 index = 0; index < tokenAddresses.length; index++) {
      IERC721(tokenAddresses[index]).safeTransferFrom(
        address(this),
        recipients[index],
        tokenIds[index]
      );
    }

    emit ERC721TokensWithdrawn(tokenAddresses, recipients, tokenIds);
  }
}
