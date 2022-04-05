//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface ITreasuryModuleFactory {
    event TreasuryCreated(address indexed treasuryAddress, address indexed accessControl);

    function create(bytes calldata data)
        external
        returns (address treasury);
}