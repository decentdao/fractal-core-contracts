import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DaoFactory,
  DaoFactory__factory,
  GovernanceToken,
  GovernanceToken__factory,
  MyGovernor,
  MyGovernor__factory,
  TimelockController,
  TimelockController__factory,
  TokenFactory,
  TokenFactory__factory,
} from "../typechain";
import chai from "chai";
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";
import {
  VoteType,
  delegateTokens,
  createDaoBringToken,
  propose,
  vote,
  queueProposal,
  executeProposal,
} from "../helpers";

const expect = chai.expect;

describe("Fractal DAO", function () {
  let daoFactory: DaoFactory;
  let governanceToken: GovernanceToken;
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

  describe("When creating a DAO an existing ERC20Votes token", function () {
    beforeEach(async function () {
      [deployer, wallet, voterA, voterB, voterC] = await ethers.getSigners();
      tokenFactory = await new TokenFactory__factory(deployer).deploy();

      // Deploy an instance of the DAO Factory
      daoFactory = await new DaoFactory__factory(deployer).deploy(
        tokenFactory.address
      );

      // Create a new ERC20Votes token to bring as the DAO governance token
      governanceToken = await new GovernanceToken__factory(deployer).deploy(
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
      daoInfo = await createDaoBringToken(
        daoFactory,
        governanceToken.address,
        BigNumber.from("0"),
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

      await governanceToken
        .connect(voterA)
        .transfer(
          timelockController.address,
          ethers.utils.parseUnits("500.0", 18)
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
        transferCallData,
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
        transferCallDataOne,
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
        transferCallDataTwo,
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
        transferCallDataOne,
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
        transferCallDataTwo,
        "Proposal #2: Transfer 250 tokens to Voter C"
      );

      // Voters A, B, C votes "For" for proposal 1
      await vote(dao, proposalCreatedEventOne.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEventOne.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEventOne.proposalId, VoteType.For, voterC);

      // Voters A, B, C votes "For" for proposal 2
      await vote(dao, proposalCreatedEventTwo.proposalId, VoteType.For, voterA);
      await vote(dao, proposalCreatedEventTwo.proposalId, VoteType.For, voterB);
      await vote(dao, proposalCreatedEventTwo.proposalId, VoteType.For, voterC);

      expect(
        await dao.hasVoted(proposalCreatedEventOne.proposalId, voterA.address)
      ).to.eq(true);
      expect(
        await dao.hasVoted(proposalCreatedEventOne.proposalId, voterB.address)
      ).to.eq(true);
      expect(
        await dao.hasVoted(proposalCreatedEventOne.proposalId, voterC.address)
      ).to.eq(true);

      expect(
        await dao.hasVoted(proposalCreatedEventTwo.proposalId, voterA.address)
      ).to.eq(true);
      expect(
        await dao.hasVoted(proposalCreatedEventTwo.proposalId, voterB.address)
      ).to.eq(true);
      expect(
        await dao.hasVoted(proposalCreatedEventTwo.proposalId, voterC.address)
      ).to.eq(true);
    });

    it("Should execute a passing proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
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

      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterB.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterC.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(timelockController.address)).to.eq(
        ethers.utils.parseUnits("500.0", 18)
      );

      await executeProposal(dao, voterA, proposalCreatedEvent.proposalId);

      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterB.address)).to.eq(
        ethers.utils.parseUnits("600.0", 18)
      );

      expect(await governanceToken.balanceOf(voterC.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(timelockController.address)).to.eq(
        ethers.utils.parseUnits("0", 18)
      );
    });

    it("Does not allow a proposal with no votes to get queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
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
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalCreatedEvent = await propose(
        [governanceToken.address],
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
