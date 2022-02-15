import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  BravoFactory,
  VotesTokenWithSupply,
  BravoGovernor,
  TestToken,
  VotesTokenWrapped,
  OpenZFactory,
  Treasury,
  OpenZGovernor,
} from "../typechain";
import {
  ethers,
  BigNumber,
  ContractReceipt,
  ContractTransaction,
} from "ethers";

export const VoteType = {
  Against: 0,
  For: 1,
  Abstain: 2,
};

export type DAOInfo = {
  votingToken: string;
  timelockController: string;
  daoProxy: string;
  acl: string;
};

export type ProposalCreatedEvent = {
  proposalId: BigNumber;
  proposer: string;
  targets: string[];
  _values: BigNumber[];
  signatures: string[];
  calldatas: string[];
  startBlock: BigNumber;
  endBlock: BigNumber;
  description: string;
};

export type TreasuryEthDepositedEvent = {
  sender: string;
  amount: BigNumber;
};

export type TreasuryEthWithdrawnEvent = {
  recipients: string[];
  amounts: BigNumber[];
};

export type TreasuryERC20TokensDepositedEvent = {
  tokenAddresses: string[];
  senders: string[];
  amounts: BigNumber[];
};

export type TreasuryERC20TokensWithdrawnEvent = {
  tokenAddresses: string[];
  recipients: string[];
  amounts: BigNumber[];
};

export type TreasuryERC721TokensDepositedEvent = {
  tokenAddresses: string[];
  senders: string[];
  tokenIds: BigNumber[];
};

export type TreasuryERC721TokensWithdrawnEvent = {
  tokenAddresses: string[];
  recipients: string[];
  tokenIds: BigNumber[];
};

export async function delegateTokens(
  governanceToken: VotesTokenWithSupply | VotesTokenWrapped,
  voters: SignerWithAddress[]
): Promise<void> {
  for (let i = 0; i < voters.length; i++) {
    await governanceToken.connect(voters[i]).delegate(voters[i].address);
  }
}

export async function wrapTokens(
  token: TestToken,
  wrappedToken: VotesTokenWrapped,
  users: SignerWithAddress[],
  amounts: BigNumber[]
): Promise<void> {
  for (let i = 0; i < users.length; i++) {
    await token.connect(users[i]).approve(wrappedToken.address, amounts[i]);

    await wrappedToken
      .connect(users[i])
      .depositFor(users[i].address, amounts[i]);
  }
}

export async function bravoCreateDAOAndToken(
  _DAOFactory: BravoFactory,
  _governanceImplementation: string,
  _proposers: string[],
  _executors: string[],
  _daoName: string,
  _minDelay: BigNumber,
  _initialVoteExtension: BigNumber,
  _initialVotingDelay: BigNumber,
  _initialVotingPeriod: BigNumber,
  _initialProposalThreshold: BigNumber,
  _initialQuorumNumeratorValue: BigNumber,
  _tokenFactory: string,
  _tokenName: string,
  _tokenSymbol: string,
  _tokenTotalSupply: BigNumber,
  _hodlers: string[],
  _allocations: BigNumber[]
): Promise<DAOInfo> {
  // create DAO via factory
  const tx: ContractTransaction = await _DAOFactory.createDAOAndToken({
    createDAOParameters: {
      governanceImplementation: _governanceImplementation,
      proposers: _proposers,
      executors: _executors,
      daoName: _daoName,
      minDelay: _minDelay,
      initialVoteExtension: _initialVoteExtension,
      initialVotingDelay: _initialVotingDelay,
      initialVotingPeriod: _initialVotingPeriod,
      initialProposalThreshold: _initialProposalThreshold,
      initialQuorumNumeratorValue: _initialQuorumNumeratorValue,
    },
    tokenFactory: _tokenFactory,
    tokenName: _tokenName,
    tokenSymbol: _tokenSymbol,
    tokenTotalSupply: _tokenTotalSupply,
    hodlers: _hodlers,
    allocations: _allocations,
  });

  const receipt: ContractReceipt = await tx.wait();

  const DAOEvent = receipt.events?.filter((x) => {
    return x.event === "DAODeployed";
  });

  if (DAOEvent === undefined || DAOEvent[0].args === undefined) {
    return {
      votingToken: "",
      timelockController: "",
      daoProxy: "",
      acl: "",
    };
  }
  return {
    votingToken: DAOEvent[0].args[1],
    timelockController: DAOEvent[0].args[2],
    daoProxy: DAOEvent[0].args[3],
    acl: DAOEvent[0].args[4],
  };
}

export async function bravoCreateDAOWrapToken(
  _DAOFactory: BravoFactory,
  _governanceImplementation: string,
  _proposers: string[],
  _executors: string[],
  _daoName: string,
  _minDelay: BigNumber,
  _initialVoteExtension: BigNumber,
  _initialVotingDelay: BigNumber,
  _initialVotingPeriod: BigNumber,
  _initialProposalThreshold: BigNumber,
  _initialQuorumNumeratorValue: BigNumber,
  _tokenFactory: string,
  _tokenAddress: string,
  _tokenName: string,
  _tokenSymbol: string
): Promise<DAOInfo> {
  const tx: ContractTransaction = await _DAOFactory.createDAOWrapToken({
    createDAOParameters: {
      governanceImplementation: _governanceImplementation,
      proposers: _proposers,
      executors: _executors,
      daoName: _daoName,
      minDelay: _minDelay,
      initialVoteExtension: _initialVoteExtension,
      initialVotingDelay: _initialVotingDelay,
      initialVotingPeriod: _initialVotingPeriod,
      initialProposalThreshold: _initialProposalThreshold,
      initialQuorumNumeratorValue: _initialQuorumNumeratorValue,
    },
    tokenFactory: _tokenFactory,
    tokenAddress: _tokenAddress,
    tokenName: _tokenName,
    tokenSymbol: _tokenSymbol,
  });

  const receipt: ContractReceipt = await tx.wait();

  const DAOEvent = receipt.events?.filter((x) => {
    return x.event === "DAODeployed";
  });

  if (DAOEvent === undefined || DAOEvent[0].args === undefined) {
    return {
      votingToken: "",
      timelockController: "",
      daoProxy: "",
      acl: "",
    };
  }
  return {
    votingToken: DAOEvent[0].args[1],
    timelockController: DAOEvent[0].args[2],
    daoProxy: DAOEvent[0].args[3],
    acl: DAOEvent[0].args[4],
  };
}

export async function bravoCreateDAOBringToken(
  _DAOFactory: BravoFactory,
  _governanceImplementation: string,
  _proposers: string[],
  _executors: string[],
  _daoName: string,
  _minDelay: BigNumber,
  _initialVoteExtension: BigNumber,
  _initialVotingDelay: BigNumber,
  _initialVotingPeriod: BigNumber,
  _initialProposalThreshold: BigNumber,
  _initialQuorumNumeratorValue: BigNumber,
  _tokenAddress: string
): Promise<DAOInfo> {
  const tx: ContractTransaction = await _DAOFactory.createDAOBringToken({
    createDAOParameters: {
      governanceImplementation: _governanceImplementation,
      proposers: _proposers,
      executors: _executors,
      daoName: _daoName,
      minDelay: _minDelay,
      initialVoteExtension: _initialVoteExtension,
      initialVotingDelay: _initialVotingDelay,
      initialVotingPeriod: _initialVotingPeriod,
      initialProposalThreshold: _initialProposalThreshold,
      initialQuorumNumeratorValue: _initialQuorumNumeratorValue,
    },
    tokenAddress: _tokenAddress,
  });

  const receipt: ContractReceipt = await tx.wait();

  const DAOEvent = receipt.events?.filter((x) => {
    return x.event === "DAODeployed";
  });

  if (DAOEvent === undefined || DAOEvent[0].args === undefined) {
    return {
      votingToken: "",
      timelockController: "",
      daoProxy: "",
      acl: "",
    };
  }
  return {
    votingToken: DAOEvent[0].args[1],
    timelockController: DAOEvent[0].args[2],
    daoProxy: DAOEvent[0].args[3],
    acl: DAOEvent[0].args[4],
  };
}

export async function openZCreateDAOAndToken(
  _DAOFactory: OpenZFactory,
  _governanceImplementation: string,
  _proposers: string[],
  _executors: string[],
  _daoName: string,
  _minDelay: BigNumber,
  _initialVotingDelay: BigNumber,
  _initialVotingPeriod: BigNumber,
  _initialProposalThreshold: BigNumber,
  _initialQuorumNumeratorValue: BigNumber,
  _tokenFactory: string,
  _tokenName: string,
  _tokenSymbol: string,
  _tokenTotalSupply: BigNumber,
  _hodlers: string[],
  _allocations: BigNumber[]
): Promise<DAOInfo> {
  // create DAO via factory
  const tx: ContractTransaction = await _DAOFactory.createDAOAndToken({
    createDAOParameters: {
      governanceImplementation: _governanceImplementation,
      proposers: _proposers,
      executors: _executors,
      daoName: _daoName,
      minDelay: _minDelay,
      initialVotingDelay: _initialVotingDelay,
      initialVotingPeriod: _initialVotingPeriod,
      initialProposalThreshold: _initialProposalThreshold,
      initialQuorumNumeratorValue: _initialQuorumNumeratorValue,
    },
    tokenFactory: _tokenFactory,
    tokenName: _tokenName,
    tokenSymbol: _tokenSymbol,
    tokenTotalSupply: _tokenTotalSupply,
    hodlers: _hodlers,
    allocations: _allocations,
  });

  const receipt: ContractReceipt = await tx.wait();

  const DAOEvent = receipt.events?.filter((x) => {
    return x.event === "DAODeployed";
  });

  if (DAOEvent === undefined || DAOEvent[0].args === undefined) {
    return {
      votingToken: "",
      timelockController: "",
      daoProxy: "",
      acl: "",
    };
  }
  return {
    votingToken: DAOEvent[0].args[1],
    timelockController: DAOEvent[0].args[2],
    daoProxy: DAOEvent[0].args[3],
    acl: DAOEvent[0].args[4],
  };
}

export async function openZCreateDAOWrapToken(
  _DAOFactory: OpenZFactory,
  _governanceImplementation: string,
  _proposers: string[],
  _executors: string[],
  _daoName: string,
  _minDelay: BigNumber,
  _initialVotingDelay: BigNumber,
  _initialVotingPeriod: BigNumber,
  _initialProposalThreshold: BigNumber,
  _initialQuorumNumeratorValue: BigNumber,
  _tokenFactory: string,
  _tokenAddress: string,
  _tokenName: string,
  _tokenSymbol: string
): Promise<DAOInfo> {
  const tx: ContractTransaction = await _DAOFactory.createDAOWrapToken({
    createDAOParameters: {
      governanceImplementation: _governanceImplementation,
      proposers: _proposers,
      executors: _executors,
      daoName: _daoName,
      minDelay: _minDelay,
      initialVotingDelay: _initialVotingDelay,
      initialVotingPeriod: _initialVotingPeriod,
      initialProposalThreshold: _initialProposalThreshold,
      initialQuorumNumeratorValue: _initialQuorumNumeratorValue,
    },
    tokenFactory: _tokenFactory,
    tokenAddress: _tokenAddress,
    tokenName: _tokenName,
    tokenSymbol: _tokenSymbol,
  });

  const receipt: ContractReceipt = await tx.wait();

  const DAOEvent = receipt.events?.filter((x) => {
    return x.event === "DAODeployed";
  });

  if (DAOEvent === undefined || DAOEvent[0].args === undefined) {
    return {
      votingToken: "",
      timelockController: "",
      daoProxy: "",
      acl: "",
    };
  }
  return {
    votingToken: DAOEvent[0].args[1],
    timelockController: DAOEvent[0].args[2],
    daoProxy: DAOEvent[0].args[3],
    acl: DAOEvent[0].args[4],
  };
}

export async function openZCreateDAOBringToken(
  _DAOFactory: OpenZFactory,
  _governanceImplementation: string,
  _proposers: string[],
  _executors: string[],
  _daoName: string,
  _minDelay: BigNumber,
  _initialVotingDelay: BigNumber,
  _initialVotingPeriod: BigNumber,
  _initialProposalThreshold: BigNumber,
  _initialQuorumNumeratorValue: BigNumber,
  _tokenAddress: string
): Promise<DAOInfo> {
  const tx: ContractTransaction = await _DAOFactory.createDAOBringToken({
    createDAOParameters: {
      governanceImplementation: _governanceImplementation,
      proposers: _proposers,
      executors: _executors,
      daoName: _daoName,
      minDelay: _minDelay,
      initialVotingDelay: _initialVotingDelay,
      initialVotingPeriod: _initialVotingPeriod,
      initialProposalThreshold: _initialProposalThreshold,
      initialQuorumNumeratorValue: _initialQuorumNumeratorValue,
    },
    tokenAddress: _tokenAddress,
  });

  const receipt: ContractReceipt = await tx.wait();

  const DAOEvent = receipt.events?.filter((x) => {
    return x.event === "DAODeployed";
  });

  if (DAOEvent === undefined || DAOEvent[0].args === undefined) {
    return {
      votingToken: "",
      timelockController: "",
      daoProxy: "",
      acl: "",
    };
  }
  return {
    votingToken: DAOEvent[0].args[1],
    timelockController: DAOEvent[0].args[2],
    daoProxy: DAOEvent[0].args[3],
    acl: DAOEvent[0].args[4],
  };
}

export async function bravoPropose(
  _targets: string[],
  _values: BigNumber[],
  _DAO: BravoGovernor,
  _proposer: SignerWithAddress,
  _transferCallData: string[],
  _description: string
): Promise<ProposalCreatedEvent> {
  const tx: ContractTransaction = await _DAO
    .connect(_proposer)
    ["propose(address[],uint256[],bytes[],string)"](
      _targets,
      _values,
      _transferCallData,
      _description
    );

  const receipt: ContractReceipt = await tx.wait();

  const _proposalCreatedEvent = receipt.events?.filter((x) => {
    return x.event === "ProposalCreated";
  });

  if (
    _proposalCreatedEvent === undefined ||
    _proposalCreatedEvent[0].args === undefined
  ) {
    return {
      proposalId: BigNumber.from("0"),
      proposer: "",
      targets: [""],
      _values: [BigNumber.from("0")],
      signatures: [""],
      calldatas: [""],
      startBlock: BigNumber.from("0"),
      endBlock: BigNumber.from("0"),
      description: "",
    };
  }

  return {
    proposalId: _proposalCreatedEvent[0].args[0],
    proposer: _proposalCreatedEvent[0].args[1],
    targets: _proposalCreatedEvent[0].args[2],
    _values: _proposalCreatedEvent[0].args[3],
    signatures: _proposalCreatedEvent[0].args[4],
    calldatas: _proposalCreatedEvent[0].args[5],
    startBlock: _proposalCreatedEvent[0].args[6],
    endBlock: _proposalCreatedEvent[0].args[7],
    description: _proposalCreatedEvent[0].args[8],
  };
}

export async function openZPropose(
  _targets: string[],
  _values: BigNumber[],
  _DAO: OpenZGovernor,
  _proposer: SignerWithAddress,
  _transferCallData: string,
  _description: string
): Promise<ProposalCreatedEvent> {
  const tx: ContractTransaction = await _DAO
    .connect(_proposer)
    .propose(_targets, _values, [_transferCallData], _description);

  const receipt: ContractReceipt = await tx.wait();

  const _proposalCreatedEvent = receipt.events?.filter((x) => {
    return x.event === "ProposalCreated";
  });

  if (
    _proposalCreatedEvent === undefined ||
    _proposalCreatedEvent[0].args === undefined
  ) {
    return {
      proposalId: BigNumber.from("0"),
      proposer: "",
      targets: [""],
      _values: [BigNumber.from("0")],
      signatures: [""],
      calldatas: [""],
      startBlock: BigNumber.from("0"),
      endBlock: BigNumber.from("0"),
      description: "",
    };
  }

  return {
    proposalId: _proposalCreatedEvent[0].args[0],
    proposer: _proposalCreatedEvent[0].args[1],
    targets: _proposalCreatedEvent[0].args[2],
    _values: _proposalCreatedEvent[0].args[3],
    signatures: _proposalCreatedEvent[0].args[4],
    calldatas: _proposalCreatedEvent[0].args[5],
    startBlock: _proposalCreatedEvent[0].args[6],
    endBlock: _proposalCreatedEvent[0].args[7],
    description: _proposalCreatedEvent[0].args[8],
  };
}

export async function vote(
  _dao: BravoGovernor | OpenZGovernor,
  _proposalId: BigNumber,
  _vote: number,
  _voter: SignerWithAddress
): Promise<void> {
  await _dao.connect(_voter).castVote(_proposalId, _vote);
}

export async function bravoQueueProposal(
  _dao: BravoGovernor,
  _queuer: SignerWithAddress,
  _proposalId: BigNumber
): Promise<void> {
  await _dao.connect(_queuer)["queue(uint256)"](_proposalId);
}

export async function openZQueueProposal(
  _dao: OpenZGovernor,
  _queuer: SignerWithAddress,
  _targets: string[],
  _values: BigNumber[],
  _transferCallData: string[],
  _description: string
): Promise<void> {
  await _dao
    .connect(_queuer)
    .queue(_targets, _values, _transferCallData, ethers.utils.id(_description));
}

export async function bravoExecuteProposal(
  _dao: BravoGovernor,
  _executer: SignerWithAddress,
  _proposalId: BigNumber
): Promise<void> {
  await _dao.connect(_executer)["execute(uint256)"](_proposalId);
}

export async function openZExecuteProposal(
  _dao: OpenZGovernor,
  _executer: SignerWithAddress,
  _targets: string[],
  _values: BigNumber[],
  _transferCallData: string[],
  _description: string
): Promise<void> {
  await _dao
    .connect(_executer)
    .execute(
      _targets,
      _values,
      _transferCallData,
      ethers.utils.id(_description)
    );
}

export async function TreasuryDepositEth(
  _treasury: Treasury,
  _sender: SignerWithAddress,
  _amount: BigNumber
): Promise<TreasuryEthDepositedEvent> {
  const tx: ContractTransaction = await _sender.sendTransaction({
    to: _treasury.address,
    value: _amount,
  });

  const receipt: ContractReceipt = await tx.wait();

  const depositEvent = receipt.events?.filter((x) => {
    return x.event === "EthDeposited";
  });

  if (depositEvent === undefined || depositEvent[0].args === undefined) {
    return {
      sender: "",
      amount: BigNumber.from("0"),
    };
  }
  return {
    sender: depositEvent[0].args[0],
    amount: depositEvent[0].args[1],
  };
}

export async function TreasuryWithdrawEth(
  _treasury: Treasury,
  _caller: SignerWithAddress,
  _recipients: string[],
  _amounts: BigNumber[]
): Promise<TreasuryEthWithdrawnEvent> {
  const tx: ContractTransaction = await _treasury
    .connect(_caller)
    .withdrawEth(_recipients, _amounts);

  const receipt: ContractReceipt = await tx.wait();

  const withdrawEvent = receipt.events?.filter((x) => {
    return x.event === "EthWithdrawn";
  });

  if (withdrawEvent === undefined || withdrawEvent[0].args === undefined) {
    return {
      recipients: [""],
      amounts: [BigNumber.from("0")],
    };
  }
  return {
    recipients: withdrawEvent[0].args[0],
    amounts: withdrawEvent[0].args[1],
  };
}

export async function TreasuryDepositERC20Tokens(
  _treasury: Treasury,
  _caller: SignerWithAddress,
  _tokenAddresses: string[],
  _senders: string[],
  _amounts: BigNumber[]
): Promise<TreasuryERC20TokensDepositedEvent> {
  const tx: ContractTransaction = await _treasury
    .connect(_caller)
    .depositERC20Tokens(_tokenAddresses, _senders, _amounts);

  const receipt: ContractReceipt = await tx.wait();

  const depositEvent = receipt.events?.filter((x) => {
    return x.event === "ERC20TokensDeposited";
  });

  if (depositEvent === undefined || depositEvent[0].args === undefined) {
    return {
      tokenAddresses: [""],
      senders: [""],
      amounts: [BigNumber.from("0")],
    };
  }
  return {
    tokenAddresses: depositEvent[0].args[0],
    senders: depositEvent[0].args[1],
    amounts: depositEvent[0].args[2],
  };
}

export async function TreasuryWithdrawERC20Tokens(
  _treasury: Treasury,
  _caller: SignerWithAddress,
  _tokenAddresses: string[],
  _recipients: string[],
  _amounts: BigNumber[]
): Promise<TreasuryERC20TokensWithdrawnEvent> {
  const tx: ContractTransaction = await _treasury
    .connect(_caller)
    .withdrawERC20Tokens(_tokenAddresses, _recipients, _amounts);

  const receipt: ContractReceipt = await tx.wait();

  const withdrawEvent = receipt.events?.filter((x) => {
    return x.event === "ERC20TokensWithdrawn";
  });

  if (withdrawEvent === undefined || withdrawEvent[0].args === undefined) {
    return {
      tokenAddresses: [""],
      recipients: [""],
      amounts: [BigNumber.from("0")],
    };
  }
  return {
    tokenAddresses: withdrawEvent[0].args[0],
    recipients: withdrawEvent[0].args[1],
    amounts: withdrawEvent[0].args[2],
  };
}

export async function TreasuryDepositERC721Tokens(
  _treasury: Treasury,
  _caller: SignerWithAddress,
  _tokenAddresses: string[],
  _senders: string[],
  _tokenIds: BigNumber[]
): Promise<TreasuryERC721TokensDepositedEvent> {
  const tx: ContractTransaction = await _treasury
    .connect(_caller)
    .depositERC721Tokens(_tokenAddresses, _senders, _tokenIds);

  const receipt: ContractReceipt = await tx.wait();

  const depositEvent = receipt.events?.filter((x) => {
    return x.event === "ERC721TokensDeposited";
  });

  if (depositEvent === undefined || depositEvent[0].args === undefined) {
    return {
      tokenAddresses: [""],
      senders: [""],
      tokenIds: [BigNumber.from("0")],
    };
  }
  return {
    tokenAddresses: depositEvent[0].args[0],
    senders: depositEvent[0].args[1],
    tokenIds: depositEvent[0].args[2],
  };
}

export async function TreasuryWithdrawERC721Tokens(
  _treasury: Treasury,
  _caller: SignerWithAddress,
  _tokenAddresses: string[],
  _recipients: string[],
  _tokenIds: BigNumber[]
): Promise<TreasuryERC721TokensWithdrawnEvent> {
  const tx: ContractTransaction = await _treasury
    .connect(_caller)
    .withdrawERC721Tokens(_tokenAddresses, _recipients, _tokenIds);

  const receipt: ContractReceipt = await tx.wait();

  const withdrawEvent = receipt.events?.filter((x) => {
    return x.event === "ERC721TokensWithdrawn";
  });

  if (withdrawEvent === undefined || withdrawEvent[0].args === undefined) {
    return {
      tokenAddresses: [""],
      recipients: [""],
      tokenIds: [BigNumber.from("0")],
    };
  }
  return {
    tokenAddresses: withdrawEvent[0].args[0],
    recipients: withdrawEvent[0].args[1],
    tokenIds: withdrawEvent[0].args[2],
  };
}
