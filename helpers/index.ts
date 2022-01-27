import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DaoFactory,
  GovernanceToken,
  MyGovernor,
  TestToken,
  WrappedToken,
} from "../typechain";
import { ethers } from "hardhat";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";

export const VoteType = {
  Against: 0,
  For: 1,
  Abstain: 2,
};

export type DaoInfo = {
  votingToken: string;
  timelockController: string;
  daoProxy: string;
};

export async function delegateTokens(
  governanceToken: GovernanceToken | WrappedToken,
  voters: SignerWithAddress[]
): Promise<void> {
  for (let i = 0; i < voters.length; i++) {
    await governanceToken.connect(voters[i]).delegate(voters[i].address);
  }
}

export async function wrapTokens(
  token: TestToken,
  wrappedToken: WrappedToken,
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

export async function createDaoAndToken(
  _daoFactory: DaoFactory,
  _tokenName: string,
  _tokenSymbol: string,
  _hodlers: string[],
  _allocations: BigNumber[],
  _minDelay: BigNumber,
  _totalSupply: BigNumber,
  _proposers: string[],
  _executors: string[],
  _daoName: string
): Promise<DaoInfo> {
  // create DAO via factory
  const tx: ContractTransaction = await _daoFactory.createDaoAndToken(
    _tokenName,
    _tokenSymbol,
    _hodlers,
    _allocations,
    _minDelay,
    _totalSupply,
    _proposers,
    _executors,
    _daoName
  );

  const receipt: ContractReceipt = await tx.wait();

  // eslint-disable-next-line prettier/prettier
    const daoEvent = receipt.events?.filter((x) => {
    return x.event === "DaoDeployed";
  });

  if (daoEvent === undefined || daoEvent[0].args === undefined) {
    return {
      votingToken: "0",
      timelockController: "0",
      daoProxy: "0",
    };
  }
  return {
    votingToken: daoEvent[0].args[1],
    timelockController: daoEvent[0].args[2],
    daoProxy: daoEvent[0].args[3],
  };
}

export async function createDaoWrapToken(
  _daoFactory: DaoFactory,
  _tokenAddress: string,
  _tokenName: string,
  _tokenSymbol: string,
  _minDelay: BigNumber,
  _proposers: string[],
  _executors: string[],
  _daoName: string
): Promise<DaoInfo> {
  const tx: ContractTransaction = await _daoFactory.createDaoWrapToken(
    _tokenAddress,
    _tokenName,
    _tokenSymbol,
    _minDelay,
    _proposers,
    _executors,
    _daoName
  );

  const receipt: ContractReceipt = await tx.wait();

  // eslint-disable-next-line prettier/prettier
    const daoEvent = receipt.events?.filter((x) => {
    return x.event === "DaoDeployed";
  });

  if (daoEvent === undefined || daoEvent[0].args === undefined) {
    return {
      votingToken: "0",
      timelockController: "0",
      daoProxy: "0",
    };
  }
  return {
    votingToken: daoEvent[0].args[1],
    timelockController: daoEvent[0].args[2],
    daoProxy: daoEvent[0].args[3],
  };
}

export async function createDaoBringToken(
  _daoFactory: DaoFactory,
  _votingToken: string,
  _minDelay: BigNumber,
  _proposers: string[],
  _executors: string[],
  _daoName: string
): Promise<DaoInfo> {
  const tx: ContractTransaction = await _daoFactory.createDaoBringToken(
    _votingToken,
    _minDelay,
    _proposers,
    _executors,
    _daoName
  );

  const receipt: ContractReceipt = await tx.wait();

  // eslint-disable-next-line prettier/prettier
    const daoEvent = receipt.events?.filter((x) => {
    return x.event === "DaoDeployed";
  });

  if (daoEvent === undefined || daoEvent[0].args === undefined) {
    return {
      votingToken: "0",
      timelockController: "0",
      daoProxy: "0",
    };
  }
  return {
    votingToken: daoEvent[0].args[1],
    timelockController: daoEvent[0].args[2],
    daoProxy: daoEvent[0].args[3],
  };
}

export async function propose(
  _targets: string[],
  _values: BigNumber[],
  _dao: MyGovernor,
  _proposer: SignerWithAddress,
  _transferCallData: string,
  _description: string
): Promise<BigNumber> {
  await _dao
    .connect(_proposer)
    ["propose(address[],uint256[],bytes[],string)"](
      _targets,
      _values,
      [_transferCallData],
      _description
    );

  const proposalId = await _dao.hashProposal(
    _targets,
    _values,
    [_transferCallData],
    ethers.utils.id(_description)
  );

  return proposalId;
}

export async function vote(
  _dao: MyGovernor,
  _proposalId: BigNumber,
  _vote: number,
  _voter: SignerWithAddress
): Promise<void> {
  await _dao.connect(_voter).castVote(_proposalId, _vote);
}

export async function queueProposal(
  _dao: MyGovernor,
  _queuer: SignerWithAddress,
  _proposalId: BigNumber
): Promise<void> {
  await _dao.connect(_queuer)["queue(uint256)"](_proposalId);
}

export async function executeProposal(
  _dao: MyGovernor,
  _executer: SignerWithAddress,
  _proposalId: BigNumber
): Promise<void> {
  await _dao.connect(_executer)["execute(uint256)"](_proposalId);
}
