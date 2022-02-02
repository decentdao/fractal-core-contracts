//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../MyGovernor.sol";
import "./TokenFactory.sol";

/// @notice A contract for creating new DAOs 
contract DaoFactory {
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

    /// @notice Creates a new DAO and an ERC-20 token that supports voting
    /// @param createDaoAndTokenParameters Struct of all DAO and token creation parameters
    /// @return The address of the created voting token contract
    /// @return The address of the deployed TimelockController contract
    /// @return The address of the proxy deployed for the created DAO
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

    /// @notice Creates a new DAO and wraps an existing ERC-20 token 
    /// @notice with a new governance token that supports voting
    /// @param createDaoWrapTokenParameters Struct of all DAO and wrapped token creation parameters
    /// @return The address of the created voting token contract
    /// @return The address of the deployed TimelockController contract
    /// @return The address of the proxy deployed for the created DAO
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

    /// @notice Creates a new DAO with an existing ERC-20 token that supports voting
    /// @param createDaoBringTokenParameters Struct of all DAO and existing voting token parameters
    /// @return The address of the voting token contract
    /// @return The address of the deployed TimelockController contract
    /// @return The address of the proxy deployed for the created DAO
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

    /// @dev Creates a new DAO by deploying a new instance of MyGovernor
    /// @param governanceImplementation The address of the MyGovernor implementation contract
    /// @param timelockController The address of the TimelockController created for the DAO
    /// @param daoName The name of the DAO
    /// @param initialVotingDelay The delay in blocks between when a proposal is submitted and voting begins
    /// @param initialVotingPeriod The delay in blocks between when a proposal is submitted and voting ends
    /// @param initialProposalThreshold The number of votes required for a voter to be a proposer
    /// @param initialQuorumNumeratorValue The numerator for the quorum fraction - the number of votes required
    /// @param initialQuorumNumeratorValue for a proposal to be successful as a fraction of total supply
    /// @return The address of the proxy contract deployed for the created 
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

    /// @dev Deploys a TimelockController contract for the new DAO
    /// @param proposers Array of addresses that can create proposals
    /// @param executors Array of addresses that can execute proposals
    /// @return The address of the deployed TimelockController contract
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

    /// @dev Configures the timelock controller to give the proxy address 
    /// @dev proposer and executor roles
    /// @param _timelock The address of the TimelockController contract
    /// @param _proxyAddress The address of the MyGovernor proxy
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
        TimelockController(payable(_timelock)).renounceRole(
            PROPOSER_ROLE,
            address(this)
        );
        TimelockController(payable(_timelock)).renounceRole(
            EXECUTOR_ROLE,
            address(this)
        );
    }
}
