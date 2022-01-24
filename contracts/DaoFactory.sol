// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./MyGovernor.sol";
import "./GovernanceToken.sol";
import "./TimelockController.sol";

contract DaoFactory {
    struct DaoInfo {
        address votingToken;
        address timelockController;
        address daoProxy;
    }
    DaoInfo[] public daos;

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
        votingToken = address(new GovernanceToken(tokenName, symbol));
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

        TimelockController(payable(timelockController)).grantRole(0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1, address(proxy));
        TimelockController(payable(timelockController)).grantRole(0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63, address(proxy));
        daos.push(DaoInfo(votingToken, timelockController, address(proxy)));
        emit DaoDeployed(votingToken, timelockController, address(proxy));
        return (votingToken, timelockController, address(proxy));
    }
}
