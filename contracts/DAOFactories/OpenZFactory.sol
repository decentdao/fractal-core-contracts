//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../DAOConfigs/OpenZGovernor.sol";
import "../TokenFactory.sol";

/// @notice A contract for creating new DAOs 
contract OpenZFactory {
    struct CreateDAOParameters {
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

    struct CreateDAOAndTokenParameters {
       	CreateDAOParameters createDAOParameters;
        address tokenFactory;
        string tokenName;
        string tokenSymbol;
        uint256 tokenTotalSupply;
        address[] hodlers;
        uint256[] allocations;
    }

    struct CreateDAOWrapTokenParameters {
       	CreateDAOParameters createDAOParameters;
        address tokenFactory;
        address tokenAddress;
        string tokenName;
        string tokenSymbol;
    }

    struct CreateDAOBringTokenParameters {
       	CreateDAOParameters createDAOParameters;
        address tokenAddress;
    }

    error ArraysNotEqual();
    error UpdateAddress();
    error AddressNotContract();

    event DAODeployed(
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
    /// @param createDAOAndTokenParameters Struct of all DAO and token creation parameters
    /// @return The address of the created voting token contract
    /// @return The address of the deployed TimelockController contract
    /// @return The address of the proxy deployed for the created DAO
    function createDAOAndToken(
        CreateDAOAndTokenParameters calldata createDAOAndTokenParameters
    )
        external
        returns (
            address,
            address,
            address
        )
    {
        address timelockController = _createTimelock(
            createDAOAndTokenParameters.createDAOParameters.minDelay,
            createDAOAndTokenParameters.createDAOParameters.proposers,
            createDAOAndTokenParameters.createDAOParameters.executors
        );
        
        address votingToken = TokenFactory(createDAOAndTokenParameters.tokenFactory).createToken(
            createDAOAndTokenParameters.tokenName,
            createDAOAndTokenParameters.tokenSymbol,
            createDAOAndTokenParameters.hodlers,
            createDAOAndTokenParameters.allocations,
            createDAOAndTokenParameters.tokenTotalSupply,
            timelockController
        );

        address proxyAddress = _createDAO(
            createDAOAndTokenParameters.createDAOParameters.governanceImplementation,
            votingToken,
            timelockController,
            createDAOAndTokenParameters.createDAOParameters.daoName,
            createDAOAndTokenParameters.createDAOParameters.initialVotingDelay,
            createDAOAndTokenParameters.createDAOParameters.initialVotingPeriod,
            createDAOAndTokenParameters.createDAOParameters.initialProposalThreshold,
            createDAOAndTokenParameters.createDAOParameters.initialQuorumNumeratorValue
        );

        return (votingToken, timelockController, proxyAddress);
    }

    /// @notice Creates a new DAO and wraps an existing ERC-20 token 
    /// @notice with a new governance token that supports voting
    /// @param createDAOWrapTokenParameters Struct of all DAO and wrapped token creation parameters
    /// @return The address of the created voting token contract
    /// @return The address of the deployed TimelockController contract
    /// @return The address of the proxy deployed for the created DAO
    function createDAOWrapToken(
        CreateDAOWrapTokenParameters calldata createDAOWrapTokenParameters
    )
        external
        returns (
            address,
            address,
            address
        )
    {
        address timelockController = _createTimelock(
            createDAOWrapTokenParameters.createDAOParameters.minDelay,
            createDAOWrapTokenParameters.createDAOParameters.proposers,
            createDAOWrapTokenParameters.createDAOParameters.executors
        );

        address wrappedTokenAddress = TokenFactory(createDAOWrapTokenParameters.tokenFactory).wrapToken(
            createDAOWrapTokenParameters.tokenAddress,
            createDAOWrapTokenParameters.tokenName,
            createDAOWrapTokenParameters.tokenSymbol
        );

        address proxyAddress = _createDAO(
            createDAOWrapTokenParameters.createDAOParameters.governanceImplementation,
            wrappedTokenAddress,
            timelockController,
            createDAOWrapTokenParameters.createDAOParameters.daoName,
            createDAOWrapTokenParameters.createDAOParameters.initialVotingDelay,
            createDAOWrapTokenParameters.createDAOParameters.initialVotingPeriod,
            createDAOWrapTokenParameters.createDAOParameters.initialProposalThreshold,
            createDAOWrapTokenParameters.createDAOParameters.initialQuorumNumeratorValue
        );

        return (wrappedTokenAddress, timelockController, proxyAddress);
    }

    /// @notice Creates a new DAO with an existing ERC-20 token that supports voting
    /// @param createDAOBringTokenParameters Struct of all DAO and existing voting token parameters
    /// @return The address of the voting token contract
    /// @return The address of the deployed TimelockController contract
    /// @return The address of the proxy deployed for the created DAO
    function createDAOBringToken(
        CreateDAOBringTokenParameters calldata createDAOBringTokenParameters
    )
        external
        returns (
            address,
            address,
            address
        )
    {       
        address timelockController = _createTimelock(
            createDAOBringTokenParameters.createDAOParameters.minDelay,
            createDAOBringTokenParameters.createDAOParameters.proposers,
            createDAOBringTokenParameters.createDAOParameters.executors
        );

        address proxyAddress = _createDAO(
            createDAOBringTokenParameters.createDAOParameters.governanceImplementation,
            createDAOBringTokenParameters.tokenAddress,
            timelockController,
            createDAOBringTokenParameters.createDAOParameters.daoName,
            createDAOBringTokenParameters.createDAOParameters.initialVotingDelay,
            createDAOBringTokenParameters.createDAOParameters.initialVotingPeriod,
            createDAOBringTokenParameters.createDAOParameters.initialProposalThreshold,
            createDAOBringTokenParameters.createDAOParameters.initialQuorumNumeratorValue
        );

        return (createDAOBringTokenParameters.tokenAddress, timelockController, proxyAddress);
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
    function _createDAO(
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
                    OpenZGovernor(payable(address(0))).initialize.selector,
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
        OpenZGovernor(payable(proxyAddress)).transferOwnership(timelockController);

        _configTimelock(timelockController, proxyAddress);

        emit DAODeployed(
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
        bytes32 proposerRole = keccak256("PROPOSER_ROLE");
        bytes32 executorRole = keccak256("EXECUTOR_ROLE");
        TimelockController(payable(_timelock)).grantRole(
            proposerRole,
            _proxyAddress
        );
        TimelockController(payable(_timelock)).grantRole(
            executorRole,
            _proxyAddress
        );
        TimelockController(payable(_timelock)).renounceRole(
            proposerRole,
            address(this)
        );
        TimelockController(payable(_timelock)).renounceRole(
            executorRole,
            address(this)
        );
    }
}