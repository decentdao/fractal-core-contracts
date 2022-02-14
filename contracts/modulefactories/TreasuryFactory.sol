//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../modules/Treasury.sol";

/// @notice A contract for creating new treasury contracts
contract TreasuryFactory {
    event TreasuryCreated(address treasury, address acl);

    /// @notice Creates a new treasury contract
    /// @param acl Address of systems Access control list
    /// @param role roles required to call treasury methods
    /// @return treasury address of the treasury contract
    function createTreasury(
        address acl,
        bytes32 role
    ) external returns (address treasury) {
        treasury = address(
            new Treasury(
                acl,
                role
            )
        );
        emit TreasuryCreated(treasury, acl);
    }
}