// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../MyGovernor.sol";
import "./TokenFactory.sol";

contract DaoFactory is Ownable {
    using Address for address;

    error ArraysNotEqual();
    error UpdateAddress();
    error AddressNotContract();

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

    function createDaoAndToken(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        string memory tokenName,
        string memory symbol,
        address[] memory hodlers,
        uint256[] memory allocations,
        uint256 totalSupply,
        string memory daoName,
        address governanceImplementation,
        address tokenFactory
    )
        external
        returns (
            address,
            address,
            address
        )
    {
        address timelockController = _createTimelock(
            minDelay,
            proposers,
            executors
        );
        
        address votingToken = TokenFactory(tokenFactory).createToken(
            tokenName,
            symbol,
            hodlers,
            allocations,
            totalSupply,
            timelockController
        );

        address proxyAddress = _createDao(
            governanceImplementation,
            votingToken,
            timelockController,
            daoName
        );

        return (votingToken, timelockController, proxyAddress);
    }

    function createDaoWrapToken(
        address governanceImplementation,
        address votingTokenAddress,
        address tokenFactory,
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
        address timelockController = _createTimelock(
            minDelay,
            proposers,
            executors
        );

        address wrappedAddress = TokenFactory(tokenFactory).wrapToken(
            votingTokenAddress,
            votingTokenName,
            votingTokenSymbol
        );

        address proxyAddress = _createDao(
            governanceImplementation,
            wrappedAddress,
            timelockController,
            daoName
        );

        return (wrappedAddress, timelockController, proxyAddress);
    }

        function createDaoBringToken(
        address governanceImplementation,
        address votingToken,
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
        if(votingToken.isContract() == false) revert AddressNotContract();
        
        address timelockController = _createTimelock(
            minDelay,
            proposers,
            executors
        );

        address proxyAddress = _createDao(
            governanceImplementation,
            votingToken,
            timelockController,
            daoName
        );

        return (votingToken, timelockController, proxyAddress);
    }

    function _createDao(
        address governanceImplementation,
        address votingToken,
        address timelockController,
        string memory daoName
    ) private returns (address) {
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

        return proxyAddress;
    }

    function _createTimelock(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors
    ) private returns(address) {
        address timelockController = address(
            new TimelockController(minDelay, proposers, executors)
        );
        return timelockController;
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
}
