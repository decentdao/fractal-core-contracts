import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DaoFactory,
  DaoFactory__factory,
  GovernanceToken,
  GovernanceToken__factory,
  MyGovernor,
  MyGovernor__factory,
  TestToken,
  TestToken__factory,
  TokenFactory,
  TokenFactory__factory,
} from "../typechain";
import chai from "chai";
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";

const expect = chai.expect;

describe("Fractal DAO", function () {
  let daoFactory: DaoFactory;
  let governanceToken: GovernanceToken;
  let testToken: TestToken;
  let dao: MyGovernor;
  let tokenFactory: TokenFactory;
  let deployer: SignerWithAddress;
  let wallet: SignerWithAddress;
  let voterA: SignerWithAddress;
  let voterB: SignerWithAddress;
  let voterC: SignerWithAddress;

  const VoteType = {
    Against: 0,
    For: 1,
    Abstain: 2,
  };

  async function delegateTokens(
    governanceToken: GovernanceToken,
    voters: SignerWithAddress[]
  ) {
    for (let i = 0; i < voters.length; i++) {
      await governanceToken.connect(voters[i]).delegate(voters[i].address);
    }
  }

  async function createDaoAndToken(
    _daoFactory: DaoFactory,
    _tokenName: string,
    _tokenSymbol: string,
    _hodlers: string[],
    _allocations: BigNumber[],
    _minDelay: BigNumber,
    _proposers: string[],
    _executors: string[],
    _daoName: string
  ) {
    // create DAO via factory
    await _daoFactory.createDaoAndToken(
      _tokenName,
      _tokenSymbol,
      _hodlers,
      _allocations,
      _minDelay,
      _proposers,
      _executors,
      _daoName
    );

    return daoFactory.daos(0);
  }

  async function createDaoWrapToken(
    _daoFactory: DaoFactory,
    _tokenAddress: string,
    _tokenName: string,
    _tokenSymbol: string,
    _minDelay: BigNumber,
    _proposers: string[],
    _executors: string[],
    _daoName: string
  ) {
    await _daoFactory.createDaoWrapToken(
      _tokenAddress,
      _tokenName,
      _tokenSymbol,
      _minDelay,
      _proposers,
      _executors,
      _daoName
    );
  }

  async function propose(
    _governanceToken: GovernanceToken,
    _dao: MyGovernor,
    _proposer: SignerWithAddress,
    _transferCallData: string,
    _grantReceiver: SignerWithAddress,
    _grantAmount: BigNumber,
    _description: string
  ) {
    await _dao
      .connect(_proposer)
      ["propose(address[],uint256[],bytes[],string)"](
        [_governanceToken.address],
        [0],
        [_transferCallData],
        _description
      );

    const proposalId = await _dao.hashProposal(
      [_governanceToken.address],
      [0],
      [_transferCallData],
      ethers.utils.id(_description)
    );
    return proposalId;
  }

  async function vote(
    _dao: MyGovernor,
    _proposalId: BigNumber,
    _vote: number,
    _voter: SignerWithAddress
  ) {
    await _dao.connect(_voter).castVote(_proposalId, _vote);
  }

  async function queueProposal(
    _dao: MyGovernor,
    _queuer: SignerWithAddress,
    _proposalId: BigNumber
  ) {
    await dao.connect(_queuer)["queue(uint256)"](_proposalId);
  }

  async function executeProposal(
    _dao: MyGovernor,
    _executer: SignerWithAddress,
    _proposalId: BigNumber
  ) {
    await dao.connect(_executer)["execute(uint256)"](_proposalId);
  }

  describe("When creating a DAO and new token", function () {
    beforeEach(async function () {
      [deployer, wallet, voterA, voterB, voterC] = await ethers.getSigners();
      tokenFactory = await new TokenFactory__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new DaoFactory__factory(deployer).deploy(
        tokenFactory.address
      );

      // Create a new DAO using the DAO Factory
      await createDaoAndToken(
        daoFactory,
        "Test Token",
        "TTT",
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ],
        ethers.utils.parseUnits("0", 18),
        [wallet.address],
        [wallet.address],
        "Test DAO"
      );

      const daoInfo = await daoFactory.daos(0);

      // eslint-disable-next-line camelcase
      dao = MyGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      governanceToken = GovernanceToken__factory.connect(
        daoInfo.votingToken,
        deployer
      );

      await delegateTokens(governanceToken, [voterA, voterB, voterC]);
    });

    it("Should Set MyGovernor Implementation", async function () {
      return expect(await daoFactory.governanceImplementation()).to.be
        .properAddress;
    });

    it("Created a DAO", async () => {
      const daoInfo = await daoFactory.daos(0);

      await expect(daoInfo.votingToken).to.be.properAddress;
      await expect(daoInfo.timelockController).to.be.properAddress;
      await expect(daoInfo.daoProxy).to.be.properAddress;
    });

    it("Creates a DAO proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "mint",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalId = await propose(
        governanceToken,
        dao,
        voterA,
        transferCallData,
        voterB,
        ethers.utils.parseUnits("500", 18),
        "Proposal #1: Mint some tokens"
      );

      expect(proposalId).to.be.gt(0);
    });

    it("Allows voting on a DAO proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "mint",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalId = await propose(
        governanceToken,
        dao,
        voterA,
        transferCallData,
        voterB,
        ethers.utils.parseUnits("500", 18),
        "Proposal #1: Mint some tokens"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalId, VoteType.For, voterA);
      await vote(dao, proposalId, VoteType.For, voterB);
      await vote(dao, proposalId, VoteType.For, voterC);

      expect(await dao.hasVoted(proposalId, voterA.address)).to.eq(true);
      expect(await dao.hasVoted(proposalId, voterB.address)).to.eq(true);
      expect(await dao.hasVoted(proposalId, voterC.address)).to.eq(true);
    });

    it("Should execute a passing proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "mint",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalId = await propose(
        governanceToken,
        dao,
        voterA,
        transferCallData,
        voterB,
        ethers.utils.parseUnits("500", 18),
        "Proposal #1: Mint some tokens"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalId, VoteType.For, voterA);
      await vote(dao, proposalId, VoteType.For, voterB);
      await vote(dao, proposalId, VoteType.For, voterC);

      expect(await dao.hasVoted(proposalId, voterA.address)).to.eq(true);
      expect(await dao.hasVoted(proposalId, voterB.address)).to.eq(true);
      expect(await dao.hasVoted(proposalId, voterC.address)).to.eq(true);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await queueProposal(dao, voterA, proposalId);

      await executeProposal(dao, voterA, proposalId);
    });
  });

  describe.only("When creating a DAO with a wrapped token", function () {
    beforeEach(async function () {
      [deployer, wallet, voterA, voterB, voterC] = await ethers.getSigners();
      tokenFactory = await new TokenFactory__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new DaoFactory__factory(deployer).deploy(
        tokenFactory.address
      );

      testToken = await new TestToken__factory(deployer).deploy(
        "Test Token",
        "TEST",
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

      // Create a new DAO using the DAO Factory and the existing test token
      await createDaoWrapToken(
        daoFactory,
        testToken.address,
        "Test Token",
        "TEST",
        ethers.utils.parseUnits("0", 18),
        [wallet.address],
        [wallet.address],
        "Test DAO"
      );

      const daoInfo = await daoFactory.daos(0);

      // eslint-disable-next-line camelcase
      dao = MyGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      governanceToken = GovernanceToken__factory.connect(
        daoInfo.votingToken,
        deployer
      );

      await delegateTokens(governanceToken, [voterA, voterB, voterC]);
    });

    it("Should Set MyGovernor Implementation", async function () {
      return expect(await daoFactory.governanceImplementation()).to.be
        .properAddress;
    });

    it("Created a DAO", async () => {
      const daoInfo = await daoFactory.daos(0);

      await expect(daoInfo.votingToken).to.be.properAddress;
      await expect(daoInfo.timelockController).to.be.properAddress;
      await expect(daoInfo.daoProxy).to.be.properAddress;
    });

    it("Creates a DAO proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "mint",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalId = await propose(
        governanceToken,
        dao,
        voterA,
        transferCallData,
        voterB,
        ethers.utils.parseUnits("500", 18),
        "Proposal #1: Mint some tokens"
      );

      expect(proposalId).to.be.gt(0);
    });

    it("Allows voting on a DAO proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "mint",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalId = await propose(
        governanceToken,
        dao,
        voterA,
        transferCallData,
        voterB,
        ethers.utils.parseUnits("500", 18),
        "Proposal #1: Mint some tokens"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalId, VoteType.For, voterA);
      await vote(dao, proposalId, VoteType.For, voterB);
      await vote(dao, proposalId, VoteType.For, voterC);

      expect(await dao.hasVoted(proposalId, voterA.address)).to.eq(true);
      expect(await dao.hasVoted(proposalId, voterB.address)).to.eq(true);
      expect(await dao.hasVoted(proposalId, voterC.address)).to.eq(true);
    });

    // it("Should execute a passing proposal", async () => {
    //   const transferCallData = governanceToken.interface.encodeFunctionData(
    //     "mint",
    //     [voterB.address, ethers.utils.parseUnits("500", 18)]
    //   );

    //   const proposalId = await propose(
    //     governanceToken,
    //     dao,
    //     voterA,
    //     transferCallData,
    //     voterB,
    //     ethers.utils.parseUnits("500", 18),
    //     "Proposal #1: Mint some tokens"
    //   );

    //   await network.provider.send("evm_mine");

    //   // Voters A, B, C votes "For"
    //   await vote(dao, proposalId, VoteType.For, voterA);
    //   await vote(dao, proposalId, VoteType.For, voterB);
    //   await vote(dao, proposalId, VoteType.For, voterC);

    //   expect(await dao.hasVoted(proposalId, voterA.address)).to.eq(true);
    //   expect(await dao.hasVoted(proposalId, voterB.address)).to.eq(true);
    //   expect(await dao.hasVoted(proposalId, voterC.address)).to.eq(true);

    //   await network.provider.send("evm_mine");
    //   await network.provider.send("evm_mine");

    //   await queueProposal(dao, voterA, proposalId);

    //   await executeProposal(dao, voterA, proposalId);
    // });
  });
});
