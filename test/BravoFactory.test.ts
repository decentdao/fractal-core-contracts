import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  BravoFactory,
  BravoFactory__factory,
  VotesTokenWithSupply,
  VotesTokenWithSupply__factory,
  BravoGovernor,
  BravoGovernor__factory,
  TimelockController,
  TimelockController__factory,
  TokenFactory,
  TokenFactory__factory,
  TestToken,
  TestToken__factory,
  VotesTokenWrapped,
  VotesTokenWrapped__factory,
} from "../typechain";
import chai from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";
import {
  VoteType,
  delegateTokens,
  createDAOAndToken,
  vote,
  queueProposal,
  executeProposal,
  propose,
  createDAOWrapToken,
  wrapTokens,
  createDAOBringToken,
} from "../helpers/Bravo";

const expect = chai.expect;

describe("Bravo DAO", function () {
  let daoFactory: BravoFactory;
  let governanceToken: VotesTokenWithSupply;
  let dao: BravoGovernor;
  let testToken: TestToken;
  let wrappedGovernanceToken: VotesTokenWrapped;
  let governorImpl: BravoGovernor;
  let timelockController: TimelockController;
  let tokenFactory: TokenFactory;
  let deployer: SignerWithAddress;
  let proposerExecutor: SignerWithAddress;
  let voterA: SignerWithAddress;
  let voterB: SignerWithAddress;
  let voterC: SignerWithAddress;
  let daoInfo: {
    votingToken: string;
    timelockController: string;
    daoProxy: string;
  };

  describe("New Token", function () {
    beforeEach(async function () {
      [deployer, proposerExecutor, voterA, voterB, voterC] =
        await ethers.getSigners();
      tokenFactory = await new TokenFactory__factory(deployer).deploy();
      governorImpl = await new BravoGovernor__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new BravoFactory__factory(deployer).deploy();

      // Create a new DAO using the DAO Factory
      daoInfo = await createDAOAndToken(
        daoFactory,
        governorImpl.address,
        [proposerExecutor.address],
        [proposerExecutor.address],
        "Test DAO",
        BigNumber.from("0"),
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        tokenFactory.address,
        "Test Token",
        "TTT",
        ethers.utils.parseUnits("500.0", 18),
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

      // eslint-disable-next-line camelcase
      dao = BravoGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      timelockController = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );

      // eslint-disable-next-line camelcase
      governanceToken = VotesTokenWithSupply__factory.connect(
        daoInfo.votingToken,
        deployer
      );

      await delegateTokens(governanceToken, [voterA, voterB, voterC]);
    });

    it("Created a DAO", async () => {
      const PROPOSER_ROLE = ethers.utils.id("PROPOSER_ROLE");
      const EXECUTOR_ROLE = ethers.utils.id("EXECUTOR_ROLE");
      await expect(daoInfo.votingToken).to.equal(await dao.token());
      await expect(daoInfo.timelockController).to.equal(await dao.timelock());
      await expect(timelockController.hasRole(PROPOSER_ROLE, dao.address));
      await expect(timelockController.hasRole(EXECUTOR_ROLE, dao.address));
    });

    it("Revert if hodlers array length does not equal allocations array length", async () => {
      await expect(
        createDAOAndToken(
          daoFactory,
          governorImpl.address,
          [proposerExecutor.address],
          [proposerExecutor.address],
          "Test DAO",
          BigNumber.from("0"),
          BigNumber.from("0"),
          BigNumber.from("1"),
          BigNumber.from("5"),
          BigNumber.from("0"),
          BigNumber.from("4"),
          tokenFactory.address,
          "Test Token",
          "TTT",
          ethers.utils.parseUnits("500.0", 18),
          [voterA.address, voterB.address, voterC.address],
          [
            ethers.utils.parseUnits("100.0", 18),
            ethers.utils.parseUnits("100.0", 18),
          ]
        )
      ).to.be.revertedWith("ArraysNotEqual()");

      await expect(
        createDAOAndToken(
          daoFactory,
          governorImpl.address,
          [proposerExecutor.address],
          [proposerExecutor.address],
          "Test DAO",
          BigNumber.from("0"),
          BigNumber.from("0"),
          BigNumber.from("1"),
          BigNumber.from("5"),
          BigNumber.from("0"),
          BigNumber.from("4"),
          tokenFactory.address,
          "Test Token",
          "TTT",
          ethers.utils.parseUnits("500.0", 18),
          [voterA.address, voterB.address],
          [
            ethers.utils.parseUnits("100.0", 18),
            ethers.utils.parseUnits("100.0", 18),
            ethers.utils.parseUnits("100.0", 18),
          ]
        )
      ).to.be.revertedWith("ArraysNotEqual()");
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

    it("Total supply is less than allocations sum", async () => {
      // Create a new DAO using the DAO Factory
      daoInfo = await createDAOAndToken(
        daoFactory,
        governorImpl.address,
        [proposerExecutor.address],
        [proposerExecutor.address],
        "Test DAO",
        BigNumber.from("0"),
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        tokenFactory.address,
        "Test Token",
        "TTT",
        ethers.utils.parseUnits("100.0", 18),
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

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
        ethers.utils.parseUnits("0.0", 18)
      );
    });
  });

  describe("Wrap Token", function () {
    beforeEach(async function () {
      [deployer, proposerExecutor, voterA, voterB, voterC] =
        await ethers.getSigners();
      tokenFactory = await new TokenFactory__factory(deployer).deploy();
      governorImpl = await new BravoGovernor__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new BravoFactory__factory(deployer).deploy();

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
      daoInfo = await createDAOWrapToken(
        daoFactory,
        governorImpl.address,
        [proposerExecutor.address],
        [proposerExecutor.address],
        "Test DAO",
        BigNumber.from("0"),
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        tokenFactory.address,
        testToken.address,
        "Test Token",
        "TEST"
      );

      // eslint-disable-next-line camelcase
      dao = BravoGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      timelockController = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );

      // eslint-disable-next-line camelcase
      wrappedGovernanceToken = VotesTokenWrapped__factory.connect(
        daoInfo.votingToken,
        deployer
      );
    });

    it("Created a DAO", async () => {
      const PROPOSER_ROLE = ethers.utils.id("PROPOSER_ROLE");
      const EXECUTOR_ROLE = ethers.utils.id("EXECUTOR_ROLE");
      await expect(daoInfo.votingToken).to.equal(await dao.token());
      await expect(daoInfo.timelockController).to.equal(await dao.timelock());
      await expect(timelockController.hasRole(PROPOSER_ROLE, dao.address));
      await expect(timelockController.hasRole(EXECUTOR_ROLE, dao.address));
    });

    it("Should be able to wrap tokens", async () => {
      expect(await wrappedGovernanceToken.balanceOf(voterA.address)).to.equal(
        ethers.utils.parseUnits("0", 18)
      );
      expect(await wrappedGovernanceToken.balanceOf(voterB.address)).to.equal(
        ethers.utils.parseUnits("0", 18)
      );
      expect(await wrappedGovernanceToken.balanceOf(voterC.address)).to.equal(
        ethers.utils.parseUnits("0", 18)
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
      expect(await wrappedGovernanceToken.balanceOf(voterA.address)).to.equal(
        ethers.utils.parseUnits("600.0", 18)
      );
      expect(await wrappedGovernanceToken.balanceOf(voterB.address)).to.equal(
        ethers.utils.parseUnits("100.0", 18)
      );
      expect(await wrappedGovernanceToken.balanceOf(voterC.address)).to.equal(
        ethers.utils.parseUnits("100.0", 18)
      );
    });

    it("revert wrong underlying token", async () => {
      const wrongToken = await new TestToken__factory(deployer).deploy(
        "Wrong Token",
        "WRONG",
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("600.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );
      await expect(
        wrapTokens(
          wrongToken,
          wrappedGovernanceToken,
          [voterA, voterB, voterC],
          [
            ethers.utils.parseUnits("600.0", 18),
            ethers.utils.parseUnits("100.0", 18),
            ethers.utils.parseUnits("100.0", 18),
          ]
        )
      ).to.revertedWith("ERC20: insufficient allowance");
    });

    it("Initiate Timelock", async () => {
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
      expect(
        await wrappedGovernanceToken.balanceOf(daoInfo.timelockController)
      ).to.equal(ethers.utils.parseUnits("0", 18));
      await wrappedGovernanceToken
        .connect(voterA)
        .transfer(
          daoInfo.timelockController,
          ethers.utils.parseUnits("500.0", 18)
        );
      expect(
        await wrappedGovernanceToken.balanceOf(daoInfo.timelockController)
      ).to.equal(ethers.utils.parseUnits("500", 18));
    });
  });

  describe("Bring Token", function () {
    beforeEach(async function () {
      [deployer, proposerExecutor, voterA, voterB, voterC] =
        await ethers.getSigners();
      tokenFactory = await new TokenFactory__factory(deployer).deploy();
      governorImpl = await new BravoGovernor__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new BravoFactory__factory(deployer).deploy();

      // Create a new ERC20Votes token to bring as the DAO governance token
      governanceToken = await new VotesTokenWithSupply__factory(
        deployer
      ).deploy(
        "Test Token",
        "TEST",
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("600.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ],
        ethers.utils.parseUnits("800", 18),
        ethers.constants.AddressZero
      );

      // Create a new DAO using the DAO Factory and the existing test token

      daoInfo = await createDAOBringToken(
        daoFactory,
        governorImpl.address,
        [proposerExecutor.address],
        [proposerExecutor.address],
        "Test DAO",
        BigNumber.from("0"),
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        governanceToken.address
      );

      // eslint-disable-next-line camelcase
      dao = BravoGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      timelockController = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );
    });

    it("Created a DAO", async () => {
      const PROPOSER_ROLE = ethers.utils.id("PROPOSER_ROLE");
      const EXECUTOR_ROLE = ethers.utils.id("EXECUTOR_ROLE");
      await expect(daoInfo.votingToken).to.equal(await dao.token());
      await expect(daoInfo.timelockController).to.equal(await dao.timelock());
      await expect(timelockController.hasRole(PROPOSER_ROLE, dao.address));
      await expect(timelockController.hasRole(EXECUTOR_ROLE, dao.address));
    });

    it("Initiate Timelock", async () => {
      expect(
        await governanceToken.balanceOf(daoInfo.timelockController)
      ).to.equal(ethers.utils.parseUnits("0", 18));
      await governanceToken
        .connect(voterA)
        .transfer(
          timelockController.address,
          ethers.utils.parseUnits("500.0", 18)
        );
      expect(
        await governanceToken.balanceOf(daoInfo.timelockController)
      ).to.equal(ethers.utils.parseUnits("500", 18));
    });
  });

  describe("Proposals", function () {
    beforeEach(async function () {
      [deployer, proposerExecutor, voterA, voterB, voterC] =
        await ethers.getSigners();
      tokenFactory = await new TokenFactory__factory(deployer).deploy();
      governorImpl = await new BravoGovernor__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new BravoFactory__factory(deployer).deploy();

      // Create a new DAO using the DAO Factory
      daoInfo = await createDAOAndToken(
        daoFactory,
        governorImpl.address,
        [proposerExecutor.address],
        [proposerExecutor.address],
        "Test DAO",
        BigNumber.from("0"),
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        tokenFactory.address,
        "Test Token",
        "TTT",
        ethers.utils.parseUnits("500.0", 18),
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

      // eslint-disable-next-line camelcase
      dao = BravoGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      timelockController = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );

      // eslint-disable-next-line camelcase
      governanceToken = VotesTokenWithSupply__factory.connect(
        daoInfo.votingToken,
        deployer
      );

      await delegateTokens(governanceToken, [voterA, voterB, voterC]);
    });

    it("Creates a DAO proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: Transfer 500 tokens to Voter B"
      );

      expect(proposalCreatedEvent.proposalId).to.be.gt(0);
      expect(proposalCreatedEvent.proposer).to.eq(voterA.address);
      expect(proposalCreatedEvent.targets).to.deep.eq([
        governanceToken.address.toString(),
      ]);
      expect(proposalCreatedEvent._values).to.deep.eq([BigNumber.from("0")]);
      expect(proposalCreatedEvent.signatures).to.deep.eq([""]);
      expect(proposalCreatedEvent.calldatas).to.deep.eq([transferCallData]);
      expect(proposalCreatedEvent.description).to.eq(
        "Proposal #1: Transfer 500 tokens to Voter B"
      );
    });

    it("Reverts w/ duplicate proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: Transfer 500 tokens to Voter B"
      );

      await expect(
        propose(
          [governanceToken.address],
          [BigNumber.from("0")],
          dao,
          voterA,
          [transferCallData],
          "Proposal #1: Transfer 500 tokens to Voter B"
        )
      ).to.be.revertedWith("Governor: proposal already exists");
    });

    it("Creates two DAO proposals", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventOne = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );

      const transferCallDataTwo = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterC.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventTwo = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataTwo],
        "Proposal #2: Transfer 250 tokens to Voter C"
      );

      expect(proposalCreatedEventOne.proposalId).to.be.gt(0);
      expect(proposalCreatedEventOne.proposer).to.eq(voterA.address);
      expect(proposalCreatedEventOne.targets).to.deep.eq([
        governanceToken.address.toString(),
      ]);
      expect(proposalCreatedEventOne._values).to.deep.eq([BigNumber.from("0")]);
      expect(proposalCreatedEventOne.signatures).to.deep.eq([""]);
      expect(proposalCreatedEventOne.calldatas).to.deep.eq([
        transferCallDataOne,
      ]);
      expect(proposalCreatedEventOne.description).to.eq(
        "Proposal #1: Transfer 250 tokens to Voter B"
      );

      expect(proposalCreatedEventTwo.proposalId).to.be.gt(0);
      expect(proposalCreatedEventTwo.proposer).to.eq(voterA.address);
      expect(proposalCreatedEventTwo.targets).to.deep.eq([
        governanceToken.address.toString(),
      ]);
      expect(proposalCreatedEventTwo._values).to.deep.eq([BigNumber.from("0")]);
      expect(proposalCreatedEventTwo.signatures).to.deep.eq([""]);
      expect(proposalCreatedEventTwo.calldatas).to.deep.eq([
        transferCallDataTwo,
      ]);
      expect(proposalCreatedEventTwo.description).to.eq(
        "Proposal #2: Transfer 250 tokens to Voter C"
      );
    });
  });

  describe("Votes", function () {
    beforeEach(async function () {
      [deployer, proposerExecutor, voterA, voterB, voterC] =
        await ethers.getSigners();
      tokenFactory = await new TokenFactory__factory(deployer).deploy();
      governorImpl = await new BravoGovernor__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new BravoFactory__factory(deployer).deploy();

      // Create a new DAO using the DAO Factory
      daoInfo = await createDAOAndToken(
        daoFactory,
        governorImpl.address,
        [proposerExecutor.address],
        [proposerExecutor.address],
        "Test DAO",
        BigNumber.from("0"),
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        tokenFactory.address,
        "Test Token",
        "TTT",
        ethers.utils.parseUnits("500.0", 18),
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

      // eslint-disable-next-line camelcase
      dao = BravoGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      timelockController = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );

      // eslint-disable-next-line camelcase
      governanceToken = VotesTokenWithSupply__factory.connect(
        daoInfo.votingToken,
        deployer
      );

      await delegateTokens(governanceToken, [voterA, voterB]);
    });

    it("Allows voting on two DAO proposals", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventOne = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );

      const transferCallDataTwo = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventTwo = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataTwo],
        "Proposal #2: Transfer 250 tokens to Voter C"
      );

      // Voters A, B, C votes "For" for proposal 1
      await vote(dao, proposalCreatedEventOne.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEventOne.proposalId, VoteType.For, voterB);

      // Voters A, B, C votes "For" for proposal 2
      await vote(dao, proposalCreatedEventTwo.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEventTwo.proposalId, VoteType.For, voterB);

      expect(
        await dao.hasVoted(proposalCreatedEventOne.proposalId, voterA.address)
      ).to.eq(true);
      expect(
        await dao.hasVoted(proposalCreatedEventOne.proposalId, voterB.address)
      ).to.eq(true);

      expect(
        await dao.hasVoted(proposalCreatedEventTwo.proposalId, voterA.address)
      ).to.eq(true);
      expect(
        await dao.hasVoted(proposalCreatedEventTwo.proposalId, voterB.address)
      ).to.eq(true);
    });

    it("Revert voting before votes start", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventOne = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );
      await expect(
        vote(dao, proposalCreatedEventOne.proposalId, VoteType.For, voterA)
      ).to.be.revertedWith("Governor: vote not currently active");
    });

    it("Revert proposal does not exist", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );

      const fakeProposalId = await dao.hashProposal(
        [governanceToken.address],
        [BigNumber.from("0")],
        [transferCallDataOne],
        ethers.utils.id("fake")
      );
      await expect(
        vote(dao, fakeProposalId, VoteType.For, voterA)
      ).to.be.revertedWith("Governor: unknown proposal id");
    });

    it("Revert duplicate votes", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventOne = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );
      await network.provider.send("evm_mine");
      await vote(dao, proposalCreatedEventOne.proposalId, VoteType.For, voterA);
      await expect(
        vote(dao, proposalCreatedEventOne.proposalId, VoteType.Against, voterA)
      ).to.be.revertedWith("GovernorCompatibilityBravo: vote already cast");
    });

    it("Users without vote power do not update status", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventOne = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );
      await network.provider.send("evm_mine");

      const proposalStatus = await dao.proposals(
        proposalCreatedEventOne.proposalId
      );
      expect(proposalStatus.abstainVotes).to.equal("0");
      expect(proposalStatus.forVotes).to.equal("0");
      expect(proposalStatus.againstVotes).to.equal("0");
      await vote(
        dao,
        proposalCreatedEventOne.proposalId,
        VoteType.For,
        proposerExecutor
      );
      expect(proposalStatus.abstainVotes).to.equal("0");
      expect(proposalStatus.forVotes).to.equal("0");
      expect(proposalStatus.againstVotes).to.equal("0");
    });

    it("Users without delegate votes", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventOne = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );
      await network.provider.send("evm_mine");

      const proposalStatus = await dao.proposals(
        proposalCreatedEventOne.proposalId
      );
      expect(proposalStatus.abstainVotes).to.equal("0");
      expect(proposalStatus.forVotes).to.equal("0");
      expect(proposalStatus.againstVotes).to.equal("0");
      await vote(dao, proposalCreatedEventOne.proposalId, VoteType.For, voterC);
      expect(proposalStatus.abstainVotes).to.equal("0");
      expect(proposalStatus.forVotes).to.equal("0");
      expect(proposalStatus.againstVotes).to.equal("0");
      await delegateTokens(governanceToken, [voterC]);
      expect(proposalStatus.abstainVotes).to.equal("0");
      expect(proposalStatus.forVotes).to.equal("0");
      expect(proposalStatus.againstVotes).to.equal("0");
      await expect(
        vote(dao, proposalCreatedEventOne.proposalId, VoteType.Against, voterC)
      ).to.be.revertedWith("GovernorCompatibilityBravo: vote already cast");
    });

    it("Users without delegate votes", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );
      await governanceToken.connect(voterC).delegate(proposerExecutor.address);
      await governanceToken.connect(voterC).delegate(voterC.address);
      const proposalCreatedEventOne = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );
      await network.provider.send("evm_mine");

      await vote(dao, proposalCreatedEventOne.proposalId, VoteType.For, voterC);
      const proposalStatus = await dao.proposals(
        proposalCreatedEventOne.proposalId
      );
      expect(proposalStatus.forVotes).to.equal(
        ethers.utils.parseUnits("100", 18)
      );
    });

    it("Revert votes after voting period", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );
      const proposalCreatedEventOne = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );
      for (let i = 0; i < 6; i++) {
        await network.provider.send("evm_mine");
      }
      await expect(
        vote(dao, proposalCreatedEventOne.proposalId, VoteType.For, voterA)
      ).to.be.revertedWith("Governor: vote not currently active");
    });
  });

  describe("Queue", function () {
    beforeEach(async function () {
      [deployer, proposerExecutor, voterA, voterB, voterC] =
        await ethers.getSigners();
      tokenFactory = await new TokenFactory__factory(deployer).deploy();
      governorImpl = await new BravoGovernor__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new BravoFactory__factory(deployer).deploy();

      // Create a new DAO using the DAO Factory
      daoInfo = await createDAOAndToken(
        daoFactory,
        governorImpl.address,
        [proposerExecutor.address],
        [proposerExecutor.address],
        "Test DAO",
        BigNumber.from("0"),
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        tokenFactory.address,
        "Test Token",
        "TTT",
        ethers.utils.parseUnits("500.0", 18),
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

      // eslint-disable-next-line camelcase
      dao = BravoGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      timelockController = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );

      // eslint-disable-next-line camelcase
      governanceToken = VotesTokenWithSupply__factory.connect(
        daoInfo.votingToken,
        deployer
      );

      await delegateTokens(governanceToken, [voterA, voterB, voterC]);
    });

    it("Queues a passed proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);
      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");
      const status = await dao.proposals(proposalCreatedEvent.proposalId);
      expect(status.forVotes).gt(status.againstVotes);
      await queueProposal(dao, voterA, proposalCreatedEvent.proposalId);
      const state = await dao.state(proposalCreatedEvent.proposalId);
      expect(state).to.eq(5);
    });

    it("Revert queue a canceled proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);
      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");
      const status = await dao.proposals(proposalCreatedEvent.proposalId);
      expect(status.forVotes).gt(status.againstVotes);

      await dao.connect(voterA).cancel(proposalCreatedEvent.proposalId);
      await expect(
        queueProposal(dao, voterA, proposalCreatedEvent.proposalId)
      ).to.be.revertedWith("Governor: proposal not successful");
      const state = await dao.state(proposalCreatedEvent.proposalId);
      expect(state).to.eq(2);
    });

    it("Does not allow a proposal without quorum to get queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await expect(
        queueProposal(dao, voterA, proposalCreatedEvent.proposalId)
      ).to.be.revertedWith("Governor: proposal not successful");
    });

    it("Does not allow a non proposalid queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const fakeProposalId = await dao.hashProposal(
        [governanceToken.address],
        [BigNumber.from("0")],
        [transferCallData],
        ethers.utils.id("fake")
      );

      await network.provider.send("evm_mine");
      await expect(
        vote(dao, fakeProposalId, VoteType.For, voterA)
      ).to.be.revertedWith("Governor: unknown proposal id");
    });

    it("Does not allow a proposal without votes to get queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await expect(
        queueProposal(dao, voterA, proposalCreatedEvent.proposalId)
      ).to.be.revertedWith("Governor: proposal not successful");
    });
  });

  describe("PreventLateQuorum", function () {
    beforeEach(async function () {
      [deployer, proposerExecutor, voterA, voterB, voterC] =
        await ethers.getSigners();
      tokenFactory = await new TokenFactory__factory(deployer).deploy();
      governorImpl = await new BravoGovernor__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new BravoFactory__factory(deployer).deploy();

      // Create a new DAO using the DAO Factory
      daoInfo = await createDAOAndToken(
        daoFactory,
        governorImpl.address,
        [proposerExecutor.address],
        [proposerExecutor.address],
        "Test DAO",
        BigNumber.from("0"),
        BigNumber.from("5"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        tokenFactory.address,
        "Test Token",
        "TTT",
        ethers.utils.parseUnits("500.0", 18),
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

      // eslint-disable-next-line camelcase
      dao = BravoGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      timelockController = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );

      // eslint-disable-next-line camelcase
      governanceToken = VotesTokenWithSupply__factory.connect(
        daoInfo.votingToken,
        deployer
      );

      await delegateTokens(governanceToken, [voterA, voterB, voterC]);
    });

    it("Queues proposal w/ quorum delay", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );
      await network.provider.send("evm_mine");
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await network.provider.send("evm_mine");
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);
      await network.provider.send("evm_mine");
      await expect(
        queueProposal(dao, voterA, proposalCreatedEvent.proposalId)
      ).to.revertedWith("Governor: proposal not successful");
    });

    it("Reverts if Quorum delay is not respected ", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );
      await network.provider.send("evm_mine");
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await network.provider.send("evm_mine");
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);
      await network.provider.send("evm_mine");
      const currentBlock = await ethers.provider.getBlockNumber();
      const currentDeadline = await dao.proposalDeadline(
        proposalCreatedEvent.proposalId
      );
      await expect(
        queueProposal(dao, voterA, proposalCreatedEvent.proposalId)
      ).to.revertedWith("Governor: proposal not successful");
      expect(currentBlock).lt(currentDeadline);
      await network.provider.send("evm_mine");
      await queueProposal(dao, voterA, proposalCreatedEvent.proposalId);
      const afterBlock = await ethers.provider.getBlockNumber();
      const afterDeadline = await dao.proposalDeadline(
        proposalCreatedEvent.proposalId
      );
      expect(afterBlock).gt(afterDeadline);
    });
  });

  describe("Cancel", function () {
    beforeEach(async function () {
      [deployer, proposerExecutor, voterA, voterB, voterC] =
        await ethers.getSigners();
      tokenFactory = await new TokenFactory__factory(deployer).deploy();
      governorImpl = await new BravoGovernor__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new BravoFactory__factory(deployer).deploy();

      // Create a new DAO using the DAO Factory
      daoInfo = await createDAOAndToken(
        daoFactory,
        governorImpl.address,
        [proposerExecutor.address],
        [proposerExecutor.address],
        "Test DAO",
        BigNumber.from("0"),
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        tokenFactory.address,
        "Test Token",
        "TTT",
        ethers.utils.parseUnits("500.0", 18),
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

      // eslint-disable-next-line camelcase
      dao = BravoGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      timelockController = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );

      // eslint-disable-next-line camelcase
      governanceToken = VotesTokenWithSupply__factory.connect(
        daoInfo.votingToken,
        deployer
      );

      await delegateTokens(governanceToken, [voterA, voterB, voterC]);
    });

    it("Cancel a proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);
      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");
      const status = await dao.proposals(proposalCreatedEvent.proposalId);
      expect(status.forVotes).gt(status.againstVotes);
      await dao.connect(voterA).cancel(proposalCreatedEvent.proposalId);
      const state = await dao.state(proposalCreatedEvent.proposalId);
      expect(state).to.eq(2);
    });
    it("Revert only proposer cancel", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");
      await expect(
        dao.connect(voterB).cancel(proposalCreatedEvent.proposalId)
      ).to.be.revertedWith("GovernorBravo: proposer above threshold");
    });

    it("Revert cancel an executed proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);
      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");
      const status = await dao.proposals(proposalCreatedEvent.proposalId);
      expect(status.forVotes).gt(status.againstVotes);
      await queueProposal(dao, voterA, proposalCreatedEvent.proposalId);
      const state = await dao.state(proposalCreatedEvent.proposalId);
      expect(state).to.eq(5);
      await executeProposal(dao, voterA, proposalCreatedEvent.proposalId);
      await expect(
        dao.connect(voterA).cancel(proposalCreatedEvent.proposalId)
      ).to.be.revertedWith("Governor: proposal not active");
    });
  });

  describe("Execution", function () {
    beforeEach(async function () {
      [deployer, proposerExecutor, voterA, voterB, voterC] =
        await ethers.getSigners();
      tokenFactory = await new TokenFactory__factory(deployer).deploy();
      governorImpl = await new BravoGovernor__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new BravoFactory__factory(deployer).deploy();

      // Create a new DAO using the DAO Factory
      daoInfo = await createDAOAndToken(
        daoFactory,
        governorImpl.address,
        [proposerExecutor.address],
        [proposerExecutor.address],
        "Test DAO",
        BigNumber.from("0"),
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        tokenFactory.address,
        "Test Token",
        "TTT",
        ethers.utils.parseUnits("500.0", 18),
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

      // eslint-disable-next-line camelcase
      dao = BravoGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      timelockController = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );

      // eslint-disable-next-line camelcase
      governanceToken = VotesTokenWithSupply__factory.connect(
        daoInfo.votingToken,
        deployer
      );

      await delegateTokens(governanceToken, [voterA, voterB, voterC]);
    });

    it("Should execute a passing proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await queueProposal(dao, voterA, proposalCreatedEvent.proposalId);

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

      await executeProposal(dao, voterA, proposalCreatedEvent.proposalId);

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

    it("Should upgrade and a pass a proposal", async () => {
      const govUpgraded = await new BravoGovernor__factory(deployer).deploy();

      const transferCallData = dao.interface.encodeFunctionData("upgradeTo", [
        govUpgraded.address,
      ]);

      const proposalCreatedEvent = await propose(
        [dao.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Upgrade Implementation"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await queueProposal(dao, voterA, proposalCreatedEvent.proposalId);
      const tx: ContractTransaction = await dao
        .connect(voterA)
        ["execute(uint256)"](proposalCreatedEvent.proposalId);

      const receipt: ContractReceipt = await tx.wait();

      const DAOEvent = receipt.events?.filter((x) => {
        return x.topics[0] === ethers.utils.id("Upgraded(address)");
      });
      if (DAOEvent === undefined || DAOEvent[0] === undefined) {
        return;
      }
      const DAODecode = await dao.interface.decodeEventLog(
        "Upgraded",
        DAOEvent[0].data,
        DAOEvent[0].topics
      );
      expect(DAODecode[0]).to.equal(govUpgraded.address);
      expect(DAODecode[0]).to.not.equal(governorImpl.address);

      // Use new Impl

      const transferCallDataNew = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEventNew = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallDataNew],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEventNew.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEventNew.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEventNew.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await queueProposal(dao, voterA, proposalCreatedEventNew.proposalId);

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

      await executeProposal(dao, voterA, proposalCreatedEventNew.proposalId);

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

    it("Should fractalize", async () => {
      const transferCallData = daoFactory.interface.encodeFunctionData(
        "createDAOAndToken",
        [
          {
            createDAOParameters: {
              governanceImplementation: governorImpl.address,
              proposers: [proposerExecutor.address],
              executors: [proposerExecutor.address],
              daoName: "DAO Fractal",
              minDelay: BigNumber.from("0"),
              initialVoteExtension: BigNumber.from("0"),
              initialVotingDelay: BigNumber.from("1"),
              initialVotingPeriod: BigNumber.from("1"),
              initialProposalThreshold: BigNumber.from("5"),
              initialQuorumNumeratorValue: BigNumber.from("4"),
            },
            tokenFactory: tokenFactory.address,
            tokenName: "Fractal Token",
            tokenSymbol: "FFF",
            tokenTotalSupply: ethers.utils.parseUnits("500.0", 18),
            hodlers: [voterA.address, voterB.address, voterC.address],
            allocations: [
              ethers.utils.parseUnits("100.0", 18),
              ethers.utils.parseUnits("100.0", 18),
              ethers.utils.parseUnits("100.0", 18),
            ],
          },
        ]
      );

      const proposalCreatedEvent = await propose(
        [daoFactory.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Create DAO"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await queueProposal(dao, voterA, proposalCreatedEvent.proposalId);
      await network.provider.send("evm_mine");

      const tx: ContractTransaction = await dao
        .connect(voterA)
        ["execute(uint256)"](proposalCreatedEvent.proposalId);
      const receipt: ContractReceipt = await tx.wait();

      const DAOEvent = receipt.events?.filter((x) => {
        return (
          x.topics[0] ===
          ethers.utils.id("DAODeployed(address,address,address,address)")
        );
      });
      if (DAOEvent === undefined || DAOEvent[0] === undefined) {
        return {
          votingToken: "0",
          timelockController: "0",
          daoProxy: "0",
        };
      }
      const DAODecode = await daoFactory.interface.decodeEventLog(
        "DAODeployed",
        DAOEvent[0].data,
        DAOEvent[0].topics
      );
      daoInfo = {
        votingToken: DAODecode.votingToken,
        timelockController: DAODecode.timelockController,
        daoProxy: DAODecode.daoProxy,
      };

      // eslint-disable-next-line camelcase
      const fractalDAO = BravoGovernor__factory.connect(
        daoInfo.daoProxy,
        deployer
      );
      // eslint-disable-next-line camelcase
      const fractalTime = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );
      // eslint-disable-next-line camelcase
      const fractalGov = VotesTokenWithSupply__factory.connect(
        daoInfo.votingToken,
        deployer
      );

      const PROPOSER_ROLE = ethers.utils.id("PROPOSER_ROLE");
      const EXECUTOR_ROLE = ethers.utils.id("EXECUTOR_ROLE");
      await expect(daoInfo.votingToken).to.equal(await fractalDAO.token());
      await expect(daoInfo.timelockController).to.equal(
        await fractalDAO.timelock()
      );
      await expect(fractalTime.hasRole(PROPOSER_ROLE, fractalDAO.address));
      await expect(fractalTime.hasRole(EXECUTOR_ROLE, fractalDAO.address));

      expect(await fractalGov.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );
      expect(await fractalGov.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await fractalGov.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await fractalGov.balanceOf(daoInfo.timelockController)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );
    });

    it("Cannot execute a canceled proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);
      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");
      const status = await dao.proposals(proposalCreatedEvent.proposalId);
      expect(status.forVotes).gt(status.againstVotes);
      await queueProposal(dao, voterA, proposalCreatedEvent.proposalId);
      const state = await dao.state(proposalCreatedEvent.proposalId);
      expect(state).to.eq(5);

      await dao.connect(voterA).cancel(proposalCreatedEvent.proposalId);
      await expect(
        executeProposal(dao, voterA, proposalCreatedEvent.proposalId)
      ).to.be.revertedWith("Governor: proposal not successful");
    });

    it("Revert if execution is too early", async () => {
      // Create a new DAO using the DAO Factory
      daoInfo = await createDAOAndToken(
        daoFactory,
        governorImpl.address,
        [proposerExecutor.address],
        [proposerExecutor.address],
        "Test DAO",
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        tokenFactory.address,
        "Test Token",
        "TTT",
        ethers.utils.parseUnits("500.0", 18),
        [voterA.address, voterB.address, voterC.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ]
      );

      // eslint-disable-next-line camelcase
      dao = BravoGovernor__factory.connect(daoInfo.daoProxy, deployer);

      // eslint-disable-next-line camelcase
      timelockController = TimelockController__factory.connect(
        daoInfo.timelockController,
        deployer
      );

      // eslint-disable-next-line camelcase
      governanceToken = VotesTokenWithSupply__factory.connect(
        daoInfo.votingToken,
        deployer
      );

      await delegateTokens(governanceToken, [voterA, voterB, voterC]);

      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await queueProposal(dao, voterA, proposalCreatedEvent.proposalId);
      await expect(
        executeProposal(dao, voterA, proposalCreatedEvent.proposalId)
      ).to.be.revertedWith("TimelockController: operation is not ready");
    });

    it("Does not allow a non proposalid to be executed", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const fakeProposalId = await dao.hashProposal(
        [governanceToken.address],
        [BigNumber.from("0")],
        [transferCallData],
        ethers.utils.id("fake")
      );

      await network.provider.send("evm_mine");
      await expect(
        executeProposal(dao, voterA, fakeProposalId)
      ).to.be.revertedWith("Governor: unknown proposal id");
    });

    it("Does not allow a proposal to be executed before it is queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await expect(
        executeProposal(dao, voterA, proposalCreatedEvent.proposalId)
      ).to.be.revertedWith("TimelockController: operation is not ready");
    });
  });
});
