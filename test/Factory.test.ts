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
  TimelockController,
  TimelockController__factory,
  TokenFactory,
  TokenFactory__factory,
  WrappedToken,
  WrappedToken__factory,
} from "../typechain";
import chai from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";

const expect = chai.expect;

describe("Fractal DAO", function () {
  let daoFactory: DaoFactory;
  let governanceToken: GovernanceToken;
  let wrappedGovernanceToken: WrappedToken;
  let testToken: TestToken;
  let dao: MyGovernor;
  let timelockController: TimelockController;
  let tokenFactory: TokenFactory;
  let deployer: SignerWithAddress;
  let wallet: SignerWithAddress;
  let voterA: SignerWithAddress;
  let voterB: SignerWithAddress;
  let voterC: SignerWithAddress;
  let daoInfo: {
    votingToken: string;
    timelockController: string;
    daoProxy: string;
  };

  const VoteType = {
    Against: 0,
    For: 1,
    Abstain: 2,
  };

  async function delegateTokens(
    governanceToken: GovernanceToken | WrappedToken,
    voters: SignerWithAddress[]
  ) {
    for (let i = 0; i < voters.length; i++) {
      await governanceToken.connect(voters[i]).delegate(voters[i].address);
    }
  }

  async function wrapTokens(
    token: TestToken,
    wrappedToken: WrappedToken,
    users: SignerWithAddress[],
    amounts: BigNumber[]
  ) {
    for (let i = 0; i < users.length; i++) {
      await token.connect(users[i]).approve(wrappedToken.address, amounts[i]);

      await wrappedToken
        .connect(users[i])
        .depositFor(users[i].address, amounts[i]);
    }
  }

  async function createDaoAndToken(
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
  ) {
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
        votingToken: 0,
        timelockController: 0,
        daoProxy: 0,
      };
    }
    const daoBuild = {
      votingToken: daoEvent[0].args[1],
      timelockController: daoEvent[0].args[2],
      daoProxy: daoEvent[0].args[3],
    };

    return daoBuild;
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
        votingToken: 0,
        timelockController: 0,
        daoProxy: 0,
      };
    }
    const daoBuild = {
      votingToken: daoEvent[0].args[1],
      timelockController: daoEvent[0].args[2],
      daoProxy: daoEvent[0].args[3],
    };

    return daoBuild;
  }

  async function propose(
    _targets: string[],
    _values: BigNumber[],
    _dao: MyGovernor,
    _proposer: SignerWithAddress,
    _transferCallData: string,
    _description: string
  ) {
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
      daoInfo = await createDaoAndToken(
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
        ethers.utils.parseUnits("500.0", 18),
        [wallet.address],
        [wallet.address],
        "Test DAO"
      );

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
      await expect(daoInfo.votingToken).to.be.properAddress;
      await expect(daoInfo.timelockController).to.be.properAddress;
      await expect(daoInfo.daoProxy).to.be.properAddress;
    });

    it("Minted tokens to the specified voters", async () => {
      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(daoInfo.timelockController)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );
    });

    it("Creates a DAO proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      expect(proposalId).to.be.gt(0);
    });

    it("Allows voting on a DAO proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: transfer 100 tokens to Voter B"
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
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalId, VoteType.For, voterA);
      await vote(dao, proposalId, VoteType.For, voterB);
      await vote(dao, proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await queueProposal(dao, voterA, proposalId);

      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterB.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterC.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(daoInfo.timelockController)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );

      await executeProposal(dao, voterA, proposalId);

      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterB.address)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );

      expect(await governanceToken.balanceOf(voterC.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(daoInfo.timelockController)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );
    });

    it("Does not allow a proposal with no votes to get queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await expect(queueProposal(dao, voterA, proposalId)).to.be.revertedWith(
        "Governor: proposal not successful"
      );
    });

    it("Does not allow a proposal to be executed before it is queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalId = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalId, VoteType.For, voterA);
      await vote(dao, proposalId, VoteType.For, voterB);
      await vote(dao, proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await expect(executeProposal(dao, voterA, proposalId)).to.be.revertedWith(
        "TimelockController: operation is not ready"
      );
    });
  });

  describe("When creating a DAO with a wrapped token", function () {
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
          ethers.utils.parseUnits("600.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

      // Create a new DAO using the DAO Factory and the existing test token
      daoInfo = await createDaoWrapToken(
        daoFactory,
        testToken.address,
        "Test Token",
        "TEST",
        ethers.utils.parseUnits("0", 18),
        [wallet.address],
        [wallet.address],
        "Test DAO"
      );

      // eslint-disable-next-line camelcase
      dao = MyGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      timelockController = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );

      // eslint-disable-next-line camelcase
      wrappedGovernanceToken = WrappedToken__factory.connect(
        daoInfo.votingToken,
        deployer
      );

      await wrapTokens(
        testToken,
        wrappedGovernanceToken,
        [voterA, voterB, voterC],
        [
          ethers.utils.parseUnits("600.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

      await wrappedGovernanceToken
        .connect(voterA)
        .transfer(
          daoInfo.timelockController,
          ethers.utils.parseUnits("500.0", 18)
        );

      await delegateTokens(wrappedGovernanceToken, [voterA, voterB, voterC]);
    });

    it("Should Set MyGovernor Implementation", async function () {
      return expect(await daoFactory.governanceImplementation()).to.be
        .properAddress;
    });

    it("Created a DAO", async () => {
      await expect(daoInfo.votingToken).to.be.properAddress;
      await expect(daoInfo.timelockController).to.be.properAddress;
      await expect(daoInfo.daoProxy).to.be.properAddress;
    });

    it("Creates a DAO proposal", async () => {
      const transferCallData =
        wrappedGovernanceToken.interface.encodeFunctionData("transfer", [
          voterB.address,
          ethers.utils.parseUnits("500", 18),
        ]);

      const proposalId = await propose(
        [wrappedGovernanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
      );

      expect(proposalId).to.be.gt(0);
    });

    it("Allows voting on a DAO proposal", async () => {
      const transferCallData =
        wrappedGovernanceToken.interface.encodeFunctionData("transfer", [
          voterB.address,
          ethers.utils.parseUnits("500", 18),
        ]);

      const proposalId = await propose(
        [wrappedGovernanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
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
      const transferCallData =
        wrappedGovernanceToken.interface.encodeFunctionData("transfer", [
          voterB.address,
          ethers.utils.parseUnits("500", 18),
        ]);

      const proposalId = await propose(
        [wrappedGovernanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
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

      expect(await wrappedGovernanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await wrappedGovernanceToken.balanceOf(voterB.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await wrappedGovernanceToken.balanceOf(voterC.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(
        await wrappedGovernanceToken.balanceOf(timelockController.address)
      ).to.eq(ethers.utils.parseUnits("500.0", 18));

      await executeProposal(dao, voterA, proposalId);

      expect(await wrappedGovernanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await wrappedGovernanceToken.balanceOf(voterB.address)).to.eq(
        ethers.utils.parseUnits("600.0", 18)
      );

      expect(await wrappedGovernanceToken.balanceOf(voterC.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(
        await wrappedGovernanceToken.balanceOf(timelockController.address)
      ).to.eq(ethers.utils.parseUnits("0", 18));
    });

    it("Does not allow a proposal with no votes to get queued", async () => {
      const transferCallData =
        wrappedGovernanceToken.interface.encodeFunctionData("transfer", [
          voterB.address,
          ethers.utils.parseUnits("500", 18),
        ]);

      const proposalId = await propose(
        [wrappedGovernanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await expect(queueProposal(dao, voterA, proposalId)).to.be.revertedWith(
        "Governor: proposal not successful"
      );
    });

    it("Does not allow a proposal to be executed before it is queued", async () => {
      const transferCallData =
        wrappedGovernanceToken.interface.encodeFunctionData("transfer", [
          voterB.address,
          ethers.utils.parseUnits("500", 18),
        ]);

      const proposalId = await propose(
        [wrappedGovernanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalId, VoteType.For, voterA);
      await vote(dao, proposalId, VoteType.For, voterB);
      await vote(dao, proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await expect(executeProposal(dao, voterA, proposalId)).to.be.revertedWith(
        "TimelockController: operation is not ready"
      );
    });
  });
});
