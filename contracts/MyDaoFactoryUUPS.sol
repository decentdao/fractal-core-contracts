// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./MyGovernor.sol";
import "./FractalToken.sol";
import "./TimelockController.sol";

contract MyDAOFactoryUUPS {
    struct DaoInfo {
        address votingToken;
        address timelockController;
        address daoProxy;
    }
    DaoInfo[] public Daos;

    address public immutable governanceImplementation;

    event DaoDeployed(address votingToken, address timelockController, address daoProxy);

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
    ) external returns (address votingToken, address timelockController, address daoProxy) {
        votingToken = address(new FractalToken(tokenName, symbol));
        timelockController = address(
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
        Daos.push(DaoInfo(votingToken, timelockController, address(proxy)));
        emit DaoDeployed(votingToken, timelockController, address(proxy));
        return (votingToken, timelockController, address(proxy));
    }
}
