// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../MyGovernor.sol";
import "./TokenFactory.sol";

contract DaoFactory is Ownable {
    struct CreateDaoParameters {
        address governanceImplementation; 
        address[] proposers;
        address[] executors;
        string daoName;
        uint256 minDelay;
        uint256 initialVotingDelay;
        uint256 initialVotingPeriod;
        uint256 initialProposalThreshold;
        uint256 initialQuorumNumeratorValue;
    }

    struct CreateDaoAndTokenParameters {
       	CreateDaoParameters createDaoParameters;
        address tokenFactory;
        string tokenName;
        string tokenSymbol;
        uint256 tokenTotalSupply;
        address[] hodlers;
        uint256[] allocations;
    }

    struct CreateDaoWrapTokenParameters {
       	CreateDaoParameters createDaoParameters;
        address tokenFactory;
        address tokenAddress;
        string tokenName;
        string tokenSymbol;
    }

    struct CreateDaoBringTokenParameters {
       	CreateDaoParameters createDaoParameters;
        address tokenAddress;
    }

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
        CreateDaoAndTokenParameters calldata createDaoAndTokenParameters
    )
        external
        returns (
            address,
            address,
            address
        )
    {
        address timelockController = _createTimelock(
            createDaoAndTokenParameters.createDaoParameters.minDelay,
            createDaoAndTokenParameters.createDaoParameters.proposers,
            createDaoAndTokenParameters.createDaoParameters.executors
        );
        
        address votingToken = TokenFactory(createDaoAndTokenParameters.tokenFactory).createToken(
            createDaoAndTokenParameters.tokenName,
            createDaoAndTokenParameters.tokenSymbol,
            createDaoAndTokenParameters.hodlers,
            createDaoAndTokenParameters.allocations,
            createDaoAndTokenParameters.tokenTotalSupply,
            timelockController
        );

        address proxyAddress = _createDao(
            createDaoAndTokenParameters.createDaoParameters.governanceImplementation,
            votingToken,
            timelockController,
            createDaoAndTokenParameters.createDaoParameters.daoName,
            createDaoAndTokenParameters.createDaoParameters.initialVotingDelay,
            createDaoAndTokenParameters.createDaoParameters.initialVotingPeriod,
            createDaoAndTokenParameters.createDaoParameters.initialProposalThreshold,
            createDaoAndTokenParameters.createDaoParameters.initialQuorumNumeratorValue
        );

        return (votingToken, timelockController, proxyAddress);
    }

    function createDaoWrapToken(
        CreateDaoWrapTokenParameters calldata createDaoWrapTokenParameters
    )
        external
        returns (
            address,
            address,
            address
        )
    {
        address timelockController = _createTimelock(
            createDaoWrapTokenParameters.createDaoParameters.minDelay,
            createDaoWrapTokenParameters.createDaoParameters.proposers,
            createDaoWrapTokenParameters.createDaoParameters.executors
        );

        address wrappedTokenAddress = TokenFactory(createDaoWrapTokenParameters.tokenFactory).wrapToken(
            createDaoWrapTokenParameters.tokenAddress,
            createDaoWrapTokenParameters.tokenName,
            createDaoWrapTokenParameters.tokenSymbol
        );

        address proxyAddress = _createDao(
            createDaoWrapTokenParameters.createDaoParameters.governanceImplementation,
            wrappedTokenAddress,
            timelockController,
            createDaoWrapTokenParameters.createDaoParameters.daoName,
            createDaoWrapTokenParameters.createDaoParameters.initialVotingDelay,
            createDaoWrapTokenParameters.createDaoParameters.initialVotingPeriod,
            createDaoWrapTokenParameters.createDaoParameters.initialProposalThreshold,
            createDaoWrapTokenParameters.createDaoParameters.initialQuorumNumeratorValue
        );

        return (wrappedTokenAddress, timelockController, proxyAddress);
    }

    function createDaoBringToken(
        CreateDaoBringTokenParameters calldata createDaoBringTokenParameters
    )
        external
        returns (
            address,
            address,
            address
        )
    {       
        address timelockController = _createTimelock(
            createDaoBringTokenParameters.createDaoParameters.minDelay,
            createDaoBringTokenParameters.createDaoParameters.proposers,
            createDaoBringTokenParameters.createDaoParameters.executors
        );

        address proxyAddress = _createDao(
            createDaoBringTokenParameters.createDaoParameters.governanceImplementation,
            createDaoBringTokenParameters.tokenAddress,
            timelockController,
            createDaoBringTokenParameters.createDaoParameters.daoName,
            createDaoBringTokenParameters.createDaoParameters.initialVotingDelay,
            createDaoBringTokenParameters.createDaoParameters.initialVotingPeriod,
            createDaoBringTokenParameters.createDaoParameters.initialProposalThreshold,
            createDaoBringTokenParameters.createDaoParameters.initialQuorumNumeratorValue
        );

        return (createDaoBringTokenParameters.tokenAddress, timelockController, proxyAddress);
    }

    function _createDao(
        address governanceImplementation,
        address votingToken,
        address timelockController,
        string memory daoName,
        uint256 initialVotingDelay,
        uint256 initialVotingPeriod,
        uint256 initialProposalThreshold,
        uint256 initialQuorumNumeratorValue
    ) private returns (address) {
        address proxyAddress = address(
            new ERC1967Proxy(
                governanceImplementation,
                abi.encodeWithSelector(
                    MyGovernor(payable(address(0))).initialize.selector,
                    daoName,
                    votingToken,
                    timelockController,
                    initialVotingDelay,
                    initialVotingPeriod,
                    initialProposalThreshold,
                    initialQuorumNumeratorValue
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
