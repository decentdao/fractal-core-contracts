// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./GovernanceUUPS.sol";
import "./Voting.sol";
import "./TimelockController.sol";

contract MyTokenFactoryUUPS {
    address immutable governanceImplementation;

    event DaoDeployed(address daoAddress);

    constructor() {
        governanceImplementation = address(new MyGovernor());
    }

    function createDAO(
        string calldata daoName,
        string calldata tokenName,
        string calldata symbol,
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors
    ) external returns (address) {
        address votingToken = address(new FractalToken(tokenName, symbol));
        address timelockController = address(
            new TimelockController(minDelay, proposers, executors)
        );

        ERC1967Proxy proxy = new ERC1967Proxy(
            governanceImplementation,
            abi.encodeWithSelector(
                MyGovernor(payable(address(0))).initialize.selector,
                daoName,
                votingToken,
                timelockController
            )
        );
        emit DaoDeployed(address(proxy));
        return address(proxy);
    }
}
