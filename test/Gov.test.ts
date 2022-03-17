import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  VotesTokenWithSupply,
  VotesTokenWithSupply__factory,
  AccessControl,
  AccessControl__factory,
  TimelockUpgradeable,
  TimelockUpgradeable__factory,
  DAO,
  DAO__factory,
  GovernorModule,
  GovernorModule__factory,
} from "../typechain";
import chai from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";

const expect = chai.expect;

const VoteType = {
  Against: 0,
  For: 1,
  Abstain: 2,
};

type ProposalCreatedEvent = {
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

async function govModPropose(
  _targets: string[],
  _values: BigNumber[],
  _DAO: GovernorModule,
  _proposer: SignerWithAddress,
  _transferCallData: string[],
  _description: string
): Promise<ProposalCreatedEvent> {
  const tx: ContractTransaction = await _DAO
    .connect(_proposer)
    .propose(_targets, _values, _transferCallData, _description);

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

async function delegateTokens(
  governanceToken: VotesTokenWithSupply,
  voters: SignerWithAddress[]
): Promise<void> {
  for (let i = 0; i < voters.length; i++) {
    await governanceToken.connect(voters[i]).delegate(voters[i].address);
  }
}

describe("Gov Module", function () {
  let deployer: SignerWithAddress;
  let voterA: SignerWithAddress;
  let voterB: SignerWithAddress;
  let voterC: SignerWithAddress;
  let executor1: SignerWithAddress;
  let executor2: SignerWithAddress;
  let executor3: SignerWithAddress;
  let upgrader: SignerWithAddress;
  let accessControl: AccessControl;
  let dao: DAO;
  let governanceToken: VotesTokenWithSupply;
  let timelock: TimelockUpgradeable;
  let govModule: GovernorModule;

  beforeEach(async function () {
    [
      deployer,
      voterA,
      voterB,
      voterC,
      executor1,
      executor2,
      executor3,
      upgrader,
    ] = await ethers.getSigners();

    // Create an access Control contract
    accessControl = await new AccessControl__factory(deployer).deploy();

    // Create a new DAO
    dao = await new DAO__factory(deployer).deploy();

    // Gov Module
    govModule = await new GovernorModule__factory(deployer).deploy();

    // Create a timelock contract
    timelock = await new TimelockUpgradeable__factory(deployer).deploy();

    // Create a new ERC20Votes token to bring as the DAO governance token
    governanceToken = await new VotesTokenWithSupply__factory(deployer).deploy(
      "Test Token",
      "TEST",
      [voterA.address, voterB.address, voterC.address],
      [
        ethers.utils.parseUnits("600.0", 18),
        ethers.utils.parseUnits("100.0", 18),
        ethers.utils.parseUnits("100.0", 18),
      ],
      ethers.utils.parseUnits("1600", 18),
      dao.address
    );
  });

  describe("Init DAO", function () {
    beforeEach(async function () {
      await dao.initialize(accessControl.address);
      await govModule.initialize(
        "TestGov",
        governanceToken.address,
        timelock.address,
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        accessControl.address
      );

      await timelock.initialize(
        accessControl.address,
        dao.address,
        BigNumber.from("0")
      );
      await accessControl.initialize(
        dao.address,
        ["EXECUTE_ROLE", "UPGRADE_ROLE", "GOV_ROLE"],
        ["DAO_ROLE", "DAO_ROLE", "DAO_ROLE"],
        [
          [executor1.address, executor2.address],
          [upgrader.address],
          [govModule.address],
        ],
        [
          dao.address,
          govModule.address,
          timelock.address,
          timelock.address,
          timelock.address,
          timelock.address,
        ],
        [
          "execute(address[],uint256[],bytes[])",
          "upgradeTo(address)",
          "updateDelay(uint256)",
          "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32 ,uint256)",
          "cancel(bytes32)",
          "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)",
        ],
        [
          ["EXECUTE_ROLE"],
          ["UPGRADE_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
        ]
      );
    });

    it("Contracts are deployed", async () => {
      // eslint-disable-next-line no-unused-expressions
      expect(governanceToken.address).to.be.properAddress;
      // eslint-disable-next-line no-unused-expressions
      expect(accessControl.address).to.be.properAddress;
      // eslint-disable-next-line no-unused-expressions
      expect(timelock.address).to.be.properAddress;
      // eslint-disable-next-line no-unused-expressions
      expect(dao.address).to.be.properAddress;
      // eslint-disable-next-line no-unused-expressions
      expect(govModule.address).to.be.properAddress;
    });

    it("Initiate DAO", async () => {
      expect(await dao.accessControl()).to.eq(accessControl.address);
    });

    it("Initiate Timelock Controller", async () => {
      expect(await timelock.accessControl()).to.eq(accessControl.address);
      expect(await timelock.dao()).to.eq(dao.address);
      expect(await timelock.minDelay()).to.eq(0);
    });

    it("Gov Module", async () => {
      expect(await govModule.name()).to.eq("TestGov");
      expect(await govModule.token()).to.eq(governanceToken.address);
      expect(await govModule.timelock()).to.eq(timelock.address);
      expect(await govModule.accessControl()).to.eq(accessControl.address);
      expect(await govModule.votingDelay()).to.eq(1);
      expect(await govModule.votingPeriod()).to.eq(5);
      expect(await govModule.proposalThreshold()).to.eq(0);
      expect(await govModule.lateQuorumVoteExtension()).to.eq(0);
      expect(await govModule.quorumNumerator()).to.eq(4);
    });

    it("Gov Token", async () => {
      expect(await governanceToken.name()).to.eq("Test Token");
      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("600.0", 18)
      );
      expect(await governanceToken.balanceOf(voterB.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );
      expect(await governanceToken.balanceOf(voterC.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );
      expect(await governanceToken.balanceOf(dao.address)).to.eq(
        ethers.utils.parseUnits("800.0", 18)
      );
    });
  });

  describe("Proposals", function () {
    beforeEach(async function () {
      await dao.initialize(accessControl.address);
      await govModule.initialize(
        "TestGov",
        governanceToken.address,
        timelock.address,
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("1"),
        BigNumber.from("4"),
        accessControl.address
      );

      await timelock.initialize(
        accessControl.address,
        dao.address,
        BigNumber.from("0")
      );
      await accessControl.initialize(
        dao.address,
        ["EXECUTE_ROLE", "UPGRADE_ROLE", "GOV_ROLE"],
        ["DAO_ROLE", "DAO_ROLE", "DAO_ROLE"],
        [
          [executor1.address, executor2.address],
          [upgrader.address],
          [govModule.address],
        ],
        [
          dao.address,
          govModule.address,
          timelock.address,
          timelock.address,
          timelock.address,
          timelock.address,
        ],
        [
          "execute(address[],uint256[],bytes[])",
          "upgradeTo(address)",
          "updateDelay(uint256)",
          "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32 ,uint256)",
          "cancel(bytes32)",
          "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)",
        ],
        [
          ["EXECUTE_ROLE"],
          ["UPGRADE_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
        ]
      );
      await delegateTokens(governanceToken, [voterA, voterB]);
    });

    it("Creates a DAO proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      const proposalCreatedEvent = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
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

    it("Reverts w/ out delegated vote weight", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [executor1.address, ethers.utils.parseUnits("500", 18)]
      );

      await expect(
        govModPropose(
          [governanceToken.address],
          [BigNumber.from("0")],
          govModule,
          voterC,
          [transferCallData],
          "Proposal #1: Transfer 500 tokens to Voter B"
        )
      ).to.revertedWith("");
    });

    it("Reverts w/ duplicate proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("500", 18)]
      );

      await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallData],
        "Proposal #1: Transfer 500 tokens to Voter B"
      );

      await expect(
        govModPropose(
          [governanceToken.address],
          [BigNumber.from("0")],
          govModule,
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

      const proposalCreatedEventOne = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );

      const transferCallDataTwo = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterC.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventTwo = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
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
      await dao.initialize(accessControl.address);
      await govModule.initialize(
        "TestGov",
        governanceToken.address,
        timelock.address,
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        accessControl.address
      );

      await timelock.initialize(
        accessControl.address,
        dao.address,
        BigNumber.from("0")
      );
      await accessControl.initialize(
        dao.address,
        ["EXECUTE_ROLE", "UPGRADE_ROLE", "GOV_ROLE"],
        ["DAO_ROLE", "DAO_ROLE", "DAO_ROLE"],
        [
          [executor1.address, executor2.address],
          [upgrader.address],
          [govModule.address],
        ],
        [
          dao.address,
          govModule.address,
          timelock.address,
          timelock.address,
          timelock.address,
          timelock.address,
        ],
        [
          "execute(address[],uint256[],bytes[])",
          "upgradeTo(address)",
          "updateDelay(uint256)",
          "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32 ,uint256)",
          "cancel(bytes32)",
          "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)",
        ],
        [
          ["EXECUTE_ROLE"],
          ["UPGRADE_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
        ]
      );
      await delegateTokens(governanceToken, [voterA, voterB]);
    });

    it("Allows voting on two DAO proposals", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventOne = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );

      const transferCallDataTwo = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterC.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventTwo = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallDataTwo],
        "Proposal #2: Transfer 250 tokens to Voter C"
      );

      // Voters A, B, C votes "For" for proposal 1
      await govModule
        .connect(voterA)
        .castVote(proposalCreatedEventOne.proposalId, VoteType.For);
      await govModule
        .connect(voterB)
        .castVote(proposalCreatedEventOne.proposalId, VoteType.For);

      // Voters A, B, C votes "For" for proposal 2
      await govModule
        .connect(voterA)
        .castVote(proposalCreatedEventTwo.proposalId, VoteType.For);
      await govModule
        .connect(voterB)
        .castVote(proposalCreatedEventTwo.proposalId, VoteType.For);

      expect(
        await govModule.hasVoted(
          proposalCreatedEventOne.proposalId,
          voterA.address
        )
      ).to.eq(true);
      expect(
        await govModule.hasVoted(
          proposalCreatedEventOne.proposalId,
          voterB.address
        )
      ).to.eq(true);

      expect(
        await govModule.hasVoted(
          proposalCreatedEventTwo.proposalId,
          voterA.address
        )
      ).to.eq(true);
      expect(
        await govModule.hasVoted(
          proposalCreatedEventTwo.proposalId,
          voterB.address
        )
      ).to.eq(true);
    });

    it("Revert voting before votes start", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventOne = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );

      await expect(
        govModule
          .connect(voterA)
          .castVote(proposalCreatedEventOne.proposalId, VoteType.For)
      ).to.be.revertedWith("Governor: vote not currently active");
    });

    it("Revert proposal does not exist", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );

      const fakeProposalId = await govModule.hashProposal(
        [governanceToken.address],
        [BigNumber.from("0")],
        [transferCallDataOne],
        ethers.utils.id("fake")
      );
      await expect(
        govModule.connect(voterA).castVote(fakeProposalId, VoteType.For)
      ).to.be.revertedWith("Governor: unknown proposal id");
    });

    it("Revert duplicate votes", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventOne = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );
      await network.provider.send("evm_mine");
      await govModule
        .connect(voterA)
        .castVote(proposalCreatedEventOne.proposalId, VoteType.For);
      await expect(
        govModule
          .connect(voterA)
          .castVote(proposalCreatedEventOne.proposalId, VoteType.Against)
      ).to.be.revertedWith("GovernorVotingSimple: vote already cast");
    });

    it("Users without vote power do not update status", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventOne = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );
      await network.provider.send("evm_mine");

      const proposalStatus = await govModule.proposalVotes(
        proposalCreatedEventOne.proposalId
      );
      expect(proposalStatus.abstainVotes).to.equal("0");
      expect(proposalStatus.forVotes).to.equal("0");
      expect(proposalStatus.againstVotes).to.equal("0");
      await govModule
        .connect(voterC)
        .castVote(proposalCreatedEventOne.proposalId, VoteType.For);
      expect(proposalStatus.abstainVotes).to.equal("0");
      expect(proposalStatus.forVotes).to.equal("0");
      expect(proposalStatus.againstVotes).to.equal("0");
    });

    it("Users without delegate votes cannot delegate votes after voting", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );

      const proposalCreatedEventOne = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );
      await network.provider.send("evm_mine");

      const proposalStatus = await govModule.proposalVotes(
        proposalCreatedEventOne.proposalId
      );
      expect(proposalStatus.forVotes).to.equal("0");
      await govModule
        .connect(voterC)
        .castVote(proposalCreatedEventOne.proposalId, VoteType.For);
      expect(proposalStatus.forVotes).to.equal("0");
      await delegateTokens(governanceToken, [voterC]);
      expect(proposalStatus.forVotes).to.equal("0");
      await expect(
        govModule
          .connect(voterC)
          .castVote(proposalCreatedEventOne.proposalId, VoteType.For)
      ).to.be.revertedWith("GovernorVotingSimple: vote already cast");
    });

    it("Users can delegate votes", async () => {
      const transferCallDataOne = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("250", 18)]
      );
      await governanceToken.connect(voterC).delegate(executor1.address);
      const proposalCreatedEventOne = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );
      await network.provider.send("evm_mine");

      await govModule
        .connect(executor1)
        .castVote(proposalCreatedEventOne.proposalId, VoteType.For);

      const proposalStatus = await govModule.proposalVotes(
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
      const proposalCreatedEventOne = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallDataOne],
        "Proposal #1: Transfer 250 tokens to Voter B"
      );
      for (let i = 0; i < 6; i++) {
        await network.provider.send("evm_mine");
      }
      await expect(
        govModule
          .connect(voterA)
          .castVote(proposalCreatedEventOne.proposalId, VoteType.For)
      ).to.be.revertedWith("Governor: vote not currently active");
    });
  });

  describe("Queue", function () {
    beforeEach(async function () {
      await dao.initialize(accessControl.address);
      await govModule.initialize(
        "TestGov",
        governanceToken.address,
        timelock.address,
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        accessControl.address
      );

      await timelock.initialize(
        accessControl.address,
        dao.address,
        BigNumber.from("0")
      );
      await accessControl.initialize(
        dao.address,
        ["EXECUTE_ROLE", "UPGRADE_ROLE", "GOV_ROLE"],
        ["DAO_ROLE", "DAO_ROLE", "DAO_ROLE"],
        [
          [executor1.address, executor2.address],
          [upgrader.address],
          [govModule.address],
        ],
        [
          dao.address,
          govModule.address,
          timelock.address,
          timelock.address,
          timelock.address,
          timelock.address,
        ],
        [
          "execute(address[],uint256[],bytes[])",
          "upgradeTo(address)",
          "updateDelay(uint256)",
          "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)",
          "cancel(bytes32)",
          "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)",
        ],
        [
          ["EXECUTE_ROLE"],
          ["UPGRADE_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
        ]
      );
      await delegateTokens(governanceToken, [voterA, voterB]);
    });

    it("Queues a passed proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await govModule
        .connect(voterA)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await govModule
        .connect(voterB)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await govModule
        .connect(voterC)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");
      const status = await govModule.proposalVotes(
        proposalCreatedEvent.proposalId
      );
      expect(status.forVotes).gt(status.againstVotes);
      await govModule
        .connect(voterA)
        .queue(
          proposalCreatedEvent.targets,
          proposalCreatedEvent._values,
          proposalCreatedEvent.calldatas,
          ethers.utils.id(proposalCreatedEvent.description)
        );
      const state = await govModule.state(proposalCreatedEvent.proposalId);
      expect(state).to.eq(5);
    });

    it("Does not allow a proposal without quorum to get queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await govModule
        .connect(voterA)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await govModule
        .connect(voterB)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await expect(
        govModule
          .connect(voterA)
          .queue(
            proposalCreatedEvent.targets,
            proposalCreatedEvent._values,
            proposalCreatedEvent.calldatas,
            ethers.utils.id(proposalCreatedEvent.description)
          )
      ).to.be.revertedWith("Governor: proposal not successful");
    });

    it("Does not allow a proposal without votes to get queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await expect(
        govModule
          .connect(voterA)
          .queue(
            proposalCreatedEvent.targets,
            proposalCreatedEvent._values,
            proposalCreatedEvent.calldatas,
            ethers.utils.id(proposalCreatedEvent.description)
          )
      ).to.be.revertedWith("Governor: proposal not successful");
    });
  });

  describe("PreventLateQuorum", function () {
    beforeEach(async function () {
      await dao.initialize(accessControl.address);
      await govModule.initialize(
        "TestGov",
        governanceToken.address,
        timelock.address,
        BigNumber.from("5"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        accessControl.address
      );

      await timelock.initialize(
        accessControl.address,
        dao.address,
        BigNumber.from("0")
      );
      await accessControl.initialize(
        dao.address,
        ["EXECUTE_ROLE", "UPGRADE_ROLE", "GOV_ROLE"],
        ["DAO_ROLE", "DAO_ROLE", "DAO_ROLE"],
        [
          [executor1.address, executor2.address],
          [upgrader.address],
          [govModule.address],
        ],
        [
          dao.address,
          govModule.address,
          timelock.address,
          timelock.address,
          timelock.address,
          timelock.address,
        ],
        [
          "execute(address[],uint256[],bytes[])",
          "upgradeTo(address)",
          "updateDelay(uint256)",
          "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)",
          "cancel(bytes32)",
          "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)",
        ],
        [
          ["EXECUTE_ROLE"],
          ["UPGRADE_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
        ]
      );
      await delegateTokens(governanceToken, [voterA, voterB]);
    });

    it("Queues proposal w/ quorum delay", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );
      await network.provider.send("evm_mine");
      await govModule
        .connect(voterA)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await network.provider.send("evm_mine");
      await govModule
        .connect(voterB)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await govModule
        .connect(voterC)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await network.provider.send("evm_mine");
      await expect(
        govModule
          .connect(voterA)
          .queue(
            proposalCreatedEvent.targets,
            proposalCreatedEvent._values,
            proposalCreatedEvent.calldatas,
            ethers.utils.id(proposalCreatedEvent.description)
          )
      ).to.revertedWith("Governor: proposal not successful");
    });

    it("Reverts if Quorum delay is not respected ", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );
      await network.provider.send("evm_mine");
      await govModule
        .connect(voterA)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await network.provider.send("evm_mine");
      await govModule
        .connect(voterB)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await govModule
        .connect(voterC)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await network.provider.send("evm_mine");
      const currentBlock = await ethers.provider.getBlockNumber();
      const currentDeadline = await govModule.proposalDeadline(
        proposalCreatedEvent.proposalId
      );
      await expect(
        govModule
          .connect(voterA)
          .queue(
            proposalCreatedEvent.targets,
            proposalCreatedEvent._values,
            proposalCreatedEvent.calldatas,
            ethers.utils.id(proposalCreatedEvent.description)
          )
      ).to.revertedWith("Governor: proposal not successful");
      expect(currentBlock).lt(currentDeadline);
      await network.provider.send("evm_mine");
      await govModule
        .connect(voterA)
        .queue(
          proposalCreatedEvent.targets,
          proposalCreatedEvent._values,
          proposalCreatedEvent.calldatas,
          ethers.utils.id(proposalCreatedEvent.description)
        );
      const afterBlock = await ethers.provider.getBlockNumber();
      const afterDeadline = await govModule.proposalDeadline(
        proposalCreatedEvent.proposalId
      );
      expect(afterBlock).gt(afterDeadline);
    });
  });

  describe("Execution", function () {
    beforeEach(async function () {
      await dao.initialize(accessControl.address);
      await govModule.initialize(
        "TestGov",
        governanceToken.address,
        timelock.address,
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        accessControl.address
      );

      await timelock.initialize(
        accessControl.address,
        dao.address,
        BigNumber.from("0")
      );
      await accessControl.initialize(
        dao.address,
        ["EXECUTE_ROLE", "UPGRADE_ROLE", "GOV_ROLE"],
        ["DAO_ROLE", "DAO_ROLE", "DAO_ROLE"],
        [
          [executor1.address, executor2.address, timelock.address],
          [dao.address],
          [govModule.address],
        ],
        [
          dao.address,
          govModule.address,
          timelock.address,
          timelock.address,
          timelock.address,
          timelock.address,
        ],
        [
          "execute(address[],uint256[],bytes[])",
          "upgradeTo(address)",
          "updateDelay(uint256)",
          "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)",
          "cancel(bytes32)",
          "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)",
        ],
        [
          ["EXECUTE_ROLE"],
          ["UPGRADE_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
          ["GOV_ROLE"],
        ]
      );
      await delegateTokens(governanceToken, [voterA, voterB]);
    });

    it("Should execute a passing proposal", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await govModule
        .connect(voterA)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await govModule
        .connect(voterB)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await govModule
        .connect(voterC)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await govModule
        .connect(voterA)
        .queue(
          proposalCreatedEvent.targets,
          proposalCreatedEvent._values,
          proposalCreatedEvent.calldatas,
          ethers.utils.id(proposalCreatedEvent.description)
        );

      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("600.0", 18)
      );

      expect(await governanceToken.balanceOf(voterB.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(voterC.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(dao.address)).to.eq(
        ethers.utils.parseUnits("800.0", 18)
      );

      await govModule
        .connect(voterA)
        .execute(
          proposalCreatedEvent.targets,
          proposalCreatedEvent._values,
          proposalCreatedEvent.calldatas,
          ethers.utils.id(proposalCreatedEvent.description)
        );

      expect(await governanceToken.balanceOf(voterA.address)).to.eq(
        ethers.utils.parseUnits("600.0", 18)
      );

      expect(await governanceToken.balanceOf(voterB.address)).to.eq(
        ethers.utils.parseUnits("200.0", 18)
      );

      expect(await governanceToken.balanceOf(voterC.address)).to.eq(
        ethers.utils.parseUnits("100.0", 18)
      );

      expect(await governanceToken.balanceOf(dao.address)).to.eq(
        ethers.utils.parseUnits("700.0", 18)
      );
    });

    it("Revert if execution is too early", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await govModule
        .connect(voterA)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await govModule
        .connect(voterB)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await govModule
        .connect(voterC)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      govModule
        .connect(voterA)
        .queue(
          proposalCreatedEvent.targets,
          proposalCreatedEvent._values,
          proposalCreatedEvent.calldatas,
          ethers.utils.id(proposalCreatedEvent.description)
        );
      await expect(
        govModule
          .connect(voterA)
          .execute(
            proposalCreatedEvent.targets,
            proposalCreatedEvent._values,
            proposalCreatedEvent.calldatas,
            ethers.utils.id(proposalCreatedEvent.description)
          )
      ).to.be.revertedWith("TimelockController: operation is not ready");
    });

    it("Does not allow a non proposalid to be executed", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      await network.provider.send("evm_mine");
      await expect(
        govModule
          .connect(voterA)
          .execute(
            [governanceToken.address],
            [BigNumber.from("0")],
            [transferCallData],
            ethers.utils.id("fakeId")
          )
      ).to.be.revertedWith("Governor: unknown proposal id");
    });

    it("Does not allow a proposal to be executed before it is queued", async () => {
      const transferCallData = governanceToken.interface.encodeFunctionData(
        "transfer",
        [voterB.address, ethers.utils.parseUnits("100", 18)]
      );

      const proposalCreatedEvent = await govModPropose(
        [governanceToken.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallData],
        "Proposal #1: transfer 100 tokens to Voter B"
      );

      await network.provider.send("evm_mine");

      // Voters A, B, C votes "For"
      await govModule
        .connect(voterA)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await govModule
        .connect(voterB)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);
      await govModule
        .connect(voterC)
        .castVote(proposalCreatedEvent.proposalId, VoteType.For);

      await network.provider.send("evm_mine");
      await network.provider.send("evm_mine");

      await expect(
        govModule
          .connect(voterA)
          .execute(
            proposalCreatedEvent.targets,
            proposalCreatedEvent._values,
            proposalCreatedEvent.calldatas,
            ethers.utils.id(proposalCreatedEvent.description)
          )
      ).to.be.revertedWith("TimelockController: operation is not ready");
    });
  });
});