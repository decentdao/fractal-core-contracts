//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface ITreasuryModuleFactory {
    event TreasuryCreated(address indexed treasuryAddress, address indexed accessControl);

    /// @notice Creates a Treasury Module with an ERC-1967 proxy
    /// @param accessControl The address of the access control contract for the DAO
    /// @param treasuryImplementation The address of the treasury implementation contract
    function createTreasury(
        address accessControl,
        address treasuryImplementation
    ) external returns (address treasury);
}