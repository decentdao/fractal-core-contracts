// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MyGovernor.sol";
import "./GovernanceToken.sol";
import "./TimelockController.sol";

contract DaoFactory is Ownable {
    struct DaoInfo {
        address votingToken;
        address timelockController;
        address daoProxy;
    }

    DaoInfo[] public daos;

    address public governanceImplementation;

    error ArraysNotEqual();
    error UpdateAddress();

    event DaoDeployed(
        address deployer,
        address votingToken,
        address timelockController,
        address daoProxy
    );
    event GovernanceImplementationUpdated(
        address oldImplementation,
        address newImplementation
    );

    constructor() {
        governanceImplementation = address(new MyGovernor());
    }

    function createDAO(
        string memory tokenName,
        string memory symbol,
        address[] memory hodlers,
        uint256[] memory allocations,
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        string memory daoName
    )
        external
        returns (
            address,
            address,
            address
        )
    {
        if (hodlers.length != allocations.length) revert ArraysNotEqual();

        address votingToken = _createToken(
            tokenName,
            symbol,
            hodlers,
            allocations
        );
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

        address proxyAddress = address(proxy);
        _configTimelock(timelockController, proxyAddress);

        daos.push(DaoInfo(votingToken, timelockController, proxyAddress));
        emit DaoDeployed(
            msg.sender,
            votingToken,
            timelockController,
            proxyAddress
        );

        return (votingToken, timelockController, proxyAddress);
    }

    function _createToken(
        string memory _tokenName,
        string memory _symbol,
        address[] memory _hodlers,
        uint256[] memory _allocations
    ) private returns (address) {
        address votingToken = address(new GovernanceToken(_tokenName, _symbol));

        for (uint256 i = 0; i < _hodlers.length; i++) {
            GovernanceToken(votingToken).mint(_hodlers[i], _allocations[i]);
        }
        return votingToken;
    }

    function _configTimelock(address _timelock, address _proxyAddress) private {
        bytes32 PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
        bytes32 EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

        TimelockController(payable(_timelock)).grantRole(
            PROPOSER_ROLE,
            _proxyAddress
        );
        TimelockController(payable(_timelock)).grantRole(
            EXECUTOR_ROLE,
            _proxyAddress
        );
    }

    function updateGovernanceImplementation(address newImplementation)
        public
        onlyOwner()
    {
        address oldImpl = governanceImplementation;
        if (oldImpl == newImplementation) revert UpdateAddress();
        governanceImplementation = newImplementation;
        emit GovernanceImplementationUpdated(oldImpl, newImplementation);
    }
}
