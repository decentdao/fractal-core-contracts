import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DaoFactory,
  DaoFactory__factory,
  VotesTokenWithSupply,
  VotesTokenWithSupply__factory,
  MyGovernor,
  MyGovernor__factory,
  TestToken,
  TestToken__factory,
  TimelockController,
  TimelockController__factory,
  TokenFactory,
  TokenFactory__factory,
  VotesTokenWrapped,
  VotesTokenWrapped__factory,
} from "../typechain";
import chai from "chai";
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";
import {
  VoteType,
  delegateTokens,
  wrapTokens,
  createDaoWrapToken,
  propose,
  vote,
  queueProposal,
  executeProposal,
} from "../helpers";

const expect = chai.expect;

describe("Fractal DAO", function () {
  let daoFactory: DaoFactory;
  let governanceToken: VotesTokenWithSupply;
  let wrappedGovernanceToken: VotesTokenWrapped;
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
      wrappedGovernanceToken = VotesTokenWrapped__factory.connect(
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

      const proposalCreatedEvent = await propose(
        [wrappedGovernanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
      );

      expect(proposalCreatedEvent.proposalId).to.be.gt(0);
      expect(proposalCreatedEvent.proposer).to.eq(voterA.address);
      expect(proposalCreatedEvent.targets).to.deep.eq([
        wrappedGovernanceToken.address.toString(),
      ]);
      expect(proposalCreatedEvent._values).to.deep.eq([BigNumber.from("0")]);
      expect(proposalCreatedEvent.signatures).to.deep.eq([""]);
      expect(proposalCreatedEvent.calldatas).to.deep.eq([transferCallData]);
      expect(proposalCreatedEvent.description).to.eq(
        "Proposal #1: Transfer 500 tokens to Voter B"
      );
    });

    it("Allows voting on a DAO proposal", async () => {
      const transferCallData =
        wrappedGovernanceToken.interface.encodeFunctionData("transfer", [
          voterB.address,
          ethers.utils.parseUnits("500", 18),
        ]);

      const proposalCreatedEvent = await propose(
        [wrappedGovernanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);

      expect(
        await dao.hasVoted(proposalCreatedEvent.proposalId, voterA.address)
      ).to.eq(true);
      expect(
        await dao.hasVoted(proposalCreatedEvent.proposalId, voterB.address)
      ).to.eq(true);
      expect(
        await dao.hasVoted(proposalCreatedEvent.proposalId, voterC.address)
      ).to.eq(true);
    });

    it("Should execute a passing proposal", async () => {
      const transferCallData =
        wrappedGovernanceToken.interface.encodeFunctionData("transfer", [
          voterB.address,
          ethers.utils.parseUnits("500", 18),
        ]);

      const proposalCreatedEvent = await propose(
        [wrappedGovernanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEvent.proposalId, VoteType.For, voterC);

      expect(
        await dao.hasVoted(proposalCreatedEvent.proposalId, voterA.address)
      ).to.eq(true);
      expect(
        await dao.hasVoted(proposalCreatedEvent.proposalId, voterB.address)
      ).to.eq(true);
      expect(
        await dao.hasVoted(proposalCreatedEvent.proposalId, voterC.address)
      ).to.eq(true);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await queueProposal(dao, voterA, proposalCreatedEvent.proposalId);

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

      await executeProposal(dao, voterA, proposalCreatedEvent.proposalId);

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

      const proposalCreatedEvent = await propose(
        [wrappedGovernanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await expect(
        queueProposal(dao, voterA, proposalCreatedEvent.proposalId)
      ).to.be.revertedWith("Governor: proposal not successful");
    });

    it("Does not allow a proposal to be executed before it is queued", async () => {
      const transferCallData =
        wrappedGovernanceToken.interface.encodeFunctionData("transfer", [
          voterB.address,
          ethers.utils.parseUnits("500", 18),
        ]);

      const proposalCreatedEvent = await propose(
        [wrappedGovernanceToken.address],
        [BigNumber.from("0")],
        dao,
        voterA,
        transferCallData,
        "Proposal #1: Transfer 500 tokens to Voter B"
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
