import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DaoFactory,
  DaoFactory__factory,
  GovernanceToken,
  GovernanceToken__factory,
  MyGovernor,
  MyGovernor__factory,
} from "../typechain";

import chai from "chai";
import { ethers, network } from "hardhat";

// const daoABI = require("../data/abi/MyGovernor.json");

const expect = chai.expect;

describe("Fractal DAO", function () {
  let daoFactory: DaoFactory;
  let governanceToken: GovernanceToken;
  let dao: MyGovernor;

  let deployer: SignerWithAddress;
  let wallet: SignerWithAddress;
  let voterA: SignerWithAddress;
  let voterB: SignerWithAddress;
  let voterC: SignerWithAddress;

  async function distributeTokens(governanceTokenAddress: string) {
    governanceToken = GovernanceToken__factory.connect(
      governanceTokenAddress,
      deployer
    );

    // Distribute governance tokens
    const votes = ethers.utils.parseUnits("100.0", 18);
    await governanceToken.connect(voterA).mint(voterA.address, votes);
    await governanceToken.connect(voterB).mint(voterB.address, votes);
    await governanceToken.connect(voterC).mint(voterC.address, votes);

    // delegate votes
    await governanceToken.connect(voterA).delegate(voterA.address);
    await governanceToken.connect(voterB).delegate(voterB.address);
    await governanceToken.connect(voterC).delegate(voterC.address);
  }

  async function createDAO() {
    // create DAO via factory
    await expect(
      daoFactory.createDAO(
        "testDAO",
        "testToken",
        "TTT",
        0,
        [wallet.address],
        [wallet.address]
      )
    ).to.emit(daoFactory, "DaoDeployed");
    return daoFactory.daos(0);
  }

  async function propose(_governanceToken: GovernanceToken, daoAddress: string) {
    governanceToken = await GovernanceToken.attach(_governanceToken);
    dao = await new ethers.Contract(daoAddress, daoABI, wallet);
    const grant = ethers.utils.parseUnits("500.0", 18);
    const newProposal = {
      grantAmount: grant,
      transferCalldata: governanceToken.interface.encodeFunctionData("mint", [
        wallet.address,
        grant,
      ]),
      descriptionHash: "Proposal #2: Give wallet some tokens",
    };

    await dao
      .connect(voterA)
      ["propose(address[],uint256[],bytes[],string)"](
        [governanceToken.address],
        [0],
        [newProposal.transferCalldata],
        newProposal.descriptionHash
      );

    const proposalId = await dao.hashProposal(
      [governanceToken.address],
      [0],
      [newProposal.transferCalldata],
      ethers.utils.id(newProposal.descriptionHash)
    );
    return proposalId;
  }

  async function vote(proposalId: any) {
    await network.provider.send("evm_mine"); // wait 1 block before opening voting
    const VoteType = {
      Against: 0,
      For: 1,
      Abstain: 2,
    };

    await dao.connect(voterA).castVote(proposalId, VoteType.For);
    await dao.connect(voterB).castVote(proposalId, VoteType.For);
    await dao.connect(voterC).castVote(proposalId, VoteType.Against);
    expect(await dao.hasVoted(proposalId, voterA.address)).to.eq(true);
    expect(await dao.hasVoted(proposalId, voterB.address)).to.eq(true);
    expect(await dao.hasVoted(proposalId, voterC.address)).to.eq(true);
  }

  async function execute(proposalId: any) {
    // Queue Proposal
    const grant = ethers.utils.parseUnits("500.0", 18);
    const newProposal = {
      grantAmount: grant,
      transferCalldata: GovernanceToken.interface.encodeFunctionData("mint", [
        wallet.address,
        grant,
      ]),
      descriptionHash: "Proposal #2: Give wallet some tokens",
    };

    await dao
      .connect(wallet)
      ["queue(address[],uint256[],bytes[],bytes32)"](
        [governanceToken.address],
        [0],
        [newProposal.transferCalldata],
        ethers.utils.id(newProposal.descriptionHash)
      );

    // Execute Proposal
    await dao
      .connect(wallet)
      ["execute(address[],uint256[],bytes[],bytes32)"](
        [governanceToken.address],
        [0],
        [newProposal.transferCalldata],
        ethers.utils.id(newProposal.descriptionHash)
      );
  }

  beforeEach(async function () {
    [deployer, wallet, voterA, voterB, voterC] = await ethers.getSigners();
    daoFactory = await new DaoFactory__factory(deployer).deploy();
    DAO = await ethers.getContractFactory("MyGovernor");
    GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  });

  describe("Deployment", function () {
    it("Should Set MyGovernor Implementation", async () => {
      return expect(await daoFactory.governanceImplementation()).to.be
        .properAddress;
    });

    it("Should create a dao proposal", async () => {
      const DaoInfo = await createDAO();
      await distributeTokens(DaoInfo.votingToken);
      await propose(DaoInfo.votingToken, DaoInfo.daoProxy);
    });

    it("Should vote on a dao proposal", async () => {
      const DaoInfo = await createDAO();
      await distributeTokens(DaoInfo.votingToken);
      const proposalId = await propose(DaoInfo.votingToken, DaoInfo.daoProxy);
      await vote(proposalId);
    });

    it("Should execute a passing proposal", async () => {
      const DaoInfo = await createDAO();
      await distributeTokens(DaoInfo.votingToken);

      const proposalId = await propose(DaoInfo.votingToken, DaoInfo.daoProxy);

      await vote(proposalId);
      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await execute(proposalId);
    });
  });
});
