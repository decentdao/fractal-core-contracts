// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MyGovernor.sol";
import "./TokenFactory.sol";

contract DaoFactory is Ownable {
    address public governanceImplementation;
    TokenFactory public tokenFactory;

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

    constructor(address tokenFactoryAddress) {
        governanceImplementation = address(new MyGovernor());
        tokenFactory = TokenFactory(tokenFactoryAddress);
    }

    function createDaoAndToken(
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
        address votingToken = tokenFactory.createToken(
            tokenName,
            symbol,
            hodlers,
            allocations
        );

        (address timelockController, address proxyAddress) = _createDao(
            minDelay,
            votingToken,
            daoName,
            proposers,
            executors
        );

        return (votingToken, timelockController, proxyAddress);
    }

    function createDaoWrapToken(
        address votingTokenAddress,
        string memory votingTokenName,
        string memory votingTokenSymbol,
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
        address wrappedAddress = tokenFactory.WrapToken(
            votingTokenAddress,
            votingTokenName,
            votingTokenSymbol
        );

        (address timelockController, address proxyAddress) = _createDao(
            minDelay,
            wrappedAddress,
            daoName,
            proposers,
            executors
        );

        return (wrappedAddress, timelockController, proxyAddress);
    }

    function _createDao(
        uint256 minDelay,
        address votingToken,
        string memory daoName,
        address[] memory proposers,
        address[] memory executors
    ) private returns (address, address) {
        address timelockController = address(
            new TimelockController(minDelay, proposers, executors)
        );

        address proxyAddress = address(
            new ERC1967Proxy(
                governanceImplementation,
                abi.encodeWithSelector(
                    MyGovernor(payable(address(0))).initialize.selector,
                    daoName,
                    votingToken,
                    timelockController
                )
            )
        );

        _configTimelock(timelockController, proxyAddress);

        emit DaoDeployed(
            msg.sender,
            votingToken,
            timelockController,
            proxyAddress
        );

        return (timelockController, proxyAddress);
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
        onlyOwner
    {
        address oldImpl = governanceImplementation;
        if (oldImpl == newImplementation) revert UpdateAddress();
        governanceImplementation = newImplementation;
        emit GovernanceImplementationUpdated(oldImpl, newImplementation);
    }
}
