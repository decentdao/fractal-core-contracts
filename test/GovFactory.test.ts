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
  DAOFactory__factory,
  DAOFactory,
  GovernorFactory,
  GovernorFactory__factory,
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

describe.only("Gov Module", function () {
  let deployer: SignerWithAddress;
  let voterA: SignerWithAddress;
  let voterB: SignerWithAddress;
  let voterC: SignerWithAddress;
  let executor1: SignerWithAddress;
  let executor2: SignerWithAddress;
  let upgrader: SignerWithAddress;

  let daoFactory: DAOFactory;
  let createDAOTx: ContractTransaction;
  let govFactory: GovernorFactory;
  let createGovTx: ContractTransaction;
  let daoImpl: DAO;
  let accessControlImpl: AccessControl;
  let timelockImpl: TimelockUpgradeable;
  let govModuleImpl: GovernorModule;
  let governanceToken: VotesTokenWithSupply;
  let daoAddress: string;
  let accessControlAddress: string;
  let timelockAddress: string;
  let governorModuleAddress: string;

  let govModule: GovernorModule;
  let timelock: TimelockUpgradeable;

  beforeEach(async function () {
    [deployer, voterA, voterB, voterC, executor1, executor2, upgrader] =
      await ethers.getSigners();

    daoFactory = await new DAOFactory__factory(deployer).deploy();
    daoImpl = await new DAO__factory(deployer).deploy();
    accessControlImpl = await new AccessControl__factory(deployer).deploy();
    [daoAddress, accessControlAddress] = await daoFactory.callStatic.createDAO({
      daoImplementation: daoImpl.address,
      accessControlImplementation: accessControlImpl.address,
      roles: ["EXECUTE_ROLE", "UPGRADE_ROLE"],
      rolesAdmins: ["DAO_ROLE", "DAO_ROLE"],
      members: [[executor1.address, executor2.address], [upgrader.address]],
      daoFunctionDescs: [
        "execute(address[],uint256[],bytes[])",
        "upgradeTo(address)",
      ],
      daoActionRoles: [["EXECUTE_ROLE"], ["UPGRADE_ROLE"]],
      moduleTargets: [],
      moduleFunctionDescs: [],
      moduleActionRoles: [],
    });
    createDAOTx = await daoFactory.createDAO({
      daoImplementation: daoImpl.address,
      accessControlImplementation: accessControlImpl.address,
      roles: ["EXECUTE_ROLE", "UPGRADE_ROLE"],
      rolesAdmins: ["DAO_ROLE", "DAO_ROLE"],
      members: [[executor1.address, executor2.address], [upgrader.address]],
      daoFunctionDescs: [
        "execute(address[],uint256[],bytes[])",
        "upgradeTo(address)",
      ],
      daoActionRoles: [["EXECUTE_ROLE"], ["UPGRADE_ROLE"]],
      moduleTargets: [],
      moduleFunctionDescs: [],
      moduleActionRoles: [],
    });

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
      daoAddress
    );
  });

  describe("Init Gov + timelock", function () {
    beforeEach(async function () {
      // Gov Module
      govModuleImpl = await new GovernorModule__factory(deployer).deploy();
      // Create a timelock contract
      timelockImpl = await new TimelockUpgradeable__factory(deployer).deploy();
      govFactory = await new GovernorFactory__factory(deployer).deploy();

      [timelockAddress, governorModuleAddress] =
        await govFactory.callStatic.createGovernor(
          govModuleImpl.address,
          "TestGov",
          governanceToken.address,
          timelockImpl.address,
          BigNumber.from("0"),
          BigNumber.from("1"),
          BigNumber.from("5"),
          BigNumber.from("0"),
          BigNumber.from("4"),
          BigNumber.from("1"),
          accessControlAddress,
          daoAddress
        );
      createGovTx = await govFactory.createGovernor(
        govModuleImpl.address,
        "TestGov",
        governanceToken.address,
        timelockImpl.address,
        BigNumber.from("0"),
        BigNumber.from("1"),
        BigNumber.from("5"),
        BigNumber.from("0"),
        BigNumber.from("4"),
        BigNumber.from("1"),
        accessControlAddress,
        daoAddress
      );
      // eslint-disable-next-line camelcase
      govModule = GovernorModule__factory.connect(
        governorModuleAddress,
        deployer
      );

      // eslint-disable-next-line camelcase
      timelock = TimelockUpgradeable__factory.connect(
        timelockAddress,
        deployer
      );
    });

    it("emits an event with the new DAO's address", async () => {
      expect(createDAOTx)
        .to.emit(daoFactory, "DAOCreated")
        .withArgs(daoAddress, accessControlAddress);
    });

    it("emits an event with the new Gov's address", async () => {
      expect(createGovTx)
        .to.emit(govFactory, "GovernorCreated")
        .withArgs(timelockAddress, governorModuleAddress);
    });

    it("Contracts are deployed", async () => {
      // eslint-disable-next-line no-unused-expressions
      expect(govModule.address).to.be.properAddress;
      // eslint-disable-next-line no-unused-expressions
      expect(timelock.address).to.be.properAddress;
    });

    it("Initiate Timelock Controller", async () => {
      expect(await timelock.accessControl()).to.eq(accessControlAddress);
      expect(await timelock.dao()).to.eq(daoAddress);
      expect(await timelock.minDelay()).to.eq(1);
    });

    it("Gov Module", async () => {
      expect(await govModule.name()).to.eq("TestGov");
      expect(await govModule.token()).to.eq(governanceToken.address);
      expect(await govModule.timelock()).to.eq(timelock.address);
      expect(await govModule.accessControl()).to.eq(accessControlAddress);
      expect(await govModule.votingDelay()).to.eq(1);
      expect(await govModule.votingPeriod()).to.eq(5);
      expect(await govModule.proposalThreshold()).to.eq(0);
      expect(await govModule.lateQuorumVoteExtension()).to.eq(0);
      expect(await govModule.quorumNumerator()).to.eq(4);
    });
  });

  //   describe("Execution", function () {
  //     beforeEach(async function () {
  //       await dao.initialize(accessControl.address);
  //       await govModule.initialize(
  //         "TestGov",
  //         governanceToken.address,
  //         timelock.address,
  //         BigNumber.from("0"),
  //         BigNumber.from("1"),
  //         BigNumber.from("5"),
  //         BigNumber.from("0"),
  //         BigNumber.from("4"),
  //         accessControl.address
  //       );

  //       await timelock.initialize(
  //         accessControl.address,
  //         dao.address,
  //         BigNumber.from("0")
  //       );
  //       await accessControl.initialize(
  //         dao.address,
  //         ["EXECUTE_ROLE", "UPGRADE_ROLE", "GOV_ROLE"],
  //         ["DAO_ROLE", "DAO_ROLE", "DAO_ROLE"],
  //         [
  //           [executor1.address, executor2.address, timelock.address],
  //           [dao.address],
  //           [govModule.address],
  //         ],
  //         [
  //           dao.address,
  //           govModule.address,
  //           timelock.address,
  //           timelock.address,
  //           timelock.address,
  //           timelock.address,
  //         ],
  //         [
  //           "execute(address[],uint256[],bytes[])",
  //           "upgradeTo(address)",
  //           "updateDelay(uint256)",
  //           "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)",
  //           "cancel(bytes32)",
  //           "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)",
  //         ],
  //         [
  //           ["EXECUTE_ROLE"],
  //           ["UPGRADE_ROLE"],
  //           ["GOV_ROLE"],
  //           ["GOV_ROLE"],
  //           ["GOV_ROLE"],
  //           ["GOV_ROLE"],
  //         ]
  //       );
  //       await delegateTokens(governanceToken, [voterA, voterB]);
  //     });

  //     it("Should execute a passing proposal", async () => {
  //       const transferCallData = governanceToken.interface.encodeFunctionData(
  //         "transfer",
  //         [voterB.address, ethers.utils.parseUnits("100", 18)]
  //       );

  //       const proposalCreatedEvent = await govModPropose(
  //         [governanceToken.address],
  //         [BigNumber.from("0")],
  //         govModule,
  //         voterA,
  //         [transferCallData],
  //         "Proposal #1: transfer 100 tokens to Voter B"
  //       );

  //       await network.provider.send("evm_mine");

  //       // Voters A, B, C votes "For"
  //       await govModule
  //         .connect(voterA)
  //         .castVote(proposalCreatedEvent.proposalId, VoteType.For);
  //       await govModule
  //         .connect(voterB)
  //         .castVote(proposalCreatedEvent.proposalId, VoteType.For);
  //       await govModule
  //         .connect(voterC)
  //         .castVote(proposalCreatedEvent.proposalId, VoteType.For);

  //       await network.provider.send("evm_mine");
  //       await network.provider.send("evm_mine");

  //       await govModule
  //         .connect(voterA)
  //         .queue(
  //           proposalCreatedEvent.targets,
  //           proposalCreatedEvent._values,
  //           proposalCreatedEvent.calldatas,
  //           ethers.utils.id(proposalCreatedEvent.description)
  //         );

  //       expect(await governanceToken.balanceOf(voterA.address)).to.eq(
  //         ethers.utils.parseUnits("600.0", 18)
  //       );

  //       expect(await governanceToken.balanceOf(voterB.address)).to.eq(
  //         ethers.utils.parseUnits("100.0", 18)
  //       );

  //       expect(await governanceToken.balanceOf(voterC.address)).to.eq(
  //         ethers.utils.parseUnits("100.0", 18)
  //       );

  //       expect(await governanceToken.balanceOf(dao.address)).to.eq(
  //         ethers.utils.parseUnits("800.0", 18)
  //       );

  //       await govModule
  //         .connect(voterA)
  //         .execute(
  //           proposalCreatedEvent.targets,
  //           proposalCreatedEvent._values,
  //           proposalCreatedEvent.calldatas,
  //           ethers.utils.id(proposalCreatedEvent.description)
  //         );

  //       expect(await governanceToken.balanceOf(voterA.address)).to.eq(
  //         ethers.utils.parseUnits("600.0", 18)
  //       );

  //       expect(await governanceToken.balanceOf(voterB.address)).to.eq(
  //         ethers.utils.parseUnits("200.0", 18)
  //       );

  //       expect(await governanceToken.balanceOf(voterC.address)).to.eq(
  //         ethers.utils.parseUnits("100.0", 18)
  //       );

  //       expect(await governanceToken.balanceOf(dao.address)).to.eq(
  //         ethers.utils.parseUnits("700.0", 18)
  //       );
  //     });

  //     it("Revert if execution is too early", async () => {
  //       const transferCallData = governanceToken.interface.encodeFunctionData(
  //         "transfer",
  //         [voterB.address, ethers.utils.parseUnits("100", 18)]
  //       );

  //       const proposalCreatedEvent = await govModPropose(
  //         [governanceToken.address],
  //         [BigNumber.from("0")],
  //         govModule,
  //         voterA,
  //         [transferCallData],
  //         "Proposal #1: transfer 100 tokens to Voter B"
  //       );

  //       await network.provider.send("evm_mine");

  //       // Voters A, B, C votes "For"
  //       await govModule
  //         .connect(voterA)
  //         .castVote(proposalCreatedEvent.proposalId, VoteType.For);
  //       await govModule
  //         .connect(voterB)
  //         .castVote(proposalCreatedEvent.proposalId, VoteType.For);
  //       await govModule
  //         .connect(voterC)
  //         .castVote(proposalCreatedEvent.proposalId, VoteType.For);

  //       await network.provider.send("evm_mine");
  //       await network.provider.send("evm_mine");

  //       govModule
  //         .connect(voterA)
  //         .queue(
  //           proposalCreatedEvent.targets,
  //           proposalCreatedEvent._values,
  //           proposalCreatedEvent.calldatas,
  //           ethers.utils.id(proposalCreatedEvent.description)
  //         );
  //       await expect(
  //         govModule
  //           .connect(voterA)
  //           .execute(
  //             proposalCreatedEvent.targets,
  //             proposalCreatedEvent._values,
  //             proposalCreatedEvent.calldatas,
  //             ethers.utils.id(proposalCreatedEvent.description)
  //           )
  //       ).to.be.revertedWith("TimelockController: operation is not ready");
  //     });

  //     it("Does not allow a non proposalid to be executed", async () => {
  //       const transferCallData = governanceToken.interface.encodeFunctionData(
  //         "transfer",
  //         [voterB.address, ethers.utils.parseUnits("100", 18)]
  //       );

  //       await network.provider.send("evm_mine");
  //       await expect(
  //         govModule
  //           .connect(voterA)
  //           .execute(
  //             [governanceToken.address],
  //             [BigNumber.from("0")],
  //             [transferCallData],
  //             ethers.utils.id("fakeId")
  //           )
  //       ).to.be.revertedWith("Governor: unknown proposal id");
  //     });

  //     it("Does not allow a proposal to be executed before it is queued", async () => {
  //       const transferCallData = governanceToken.interface.encodeFunctionData(
  //         "transfer",
  //         [voterB.address, ethers.utils.parseUnits("100", 18)]
  //       );

  //       const proposalCreatedEvent = await govModPropose(
  //         [governanceToken.address],
  //         [BigNumber.from("0")],
  //         govModule,
  //         voterA,
  //         [transferCallData],
  //         "Proposal #1: transfer 100 tokens to Voter B"
  //       );

  //       await network.provider.send("evm_mine");

  //       // Voters A, B, C votes "For"
  //       await govModule
  //         .connect(voterA)
  //         .castVote(proposalCreatedEvent.proposalId, VoteType.For);
  //       await govModule
  //         .connect(voterB)
  //         .castVote(proposalCreatedEvent.proposalId, VoteType.For);
  //       await govModule
  //         .connect(voterC)
  //         .castVote(proposalCreatedEvent.proposalId, VoteType.For);

  //       await network.provider.send("evm_mine");
  //       await network.provider.send("evm_mine");

  //       await expect(
  //         govModule
  //           .connect(voterA)
  //           .execute(
  //             proposalCreatedEvent.targets,
  //             proposalCreatedEvent._values,
  //             proposalCreatedEvent.calldatas,
  //             ethers.utils.id(proposalCreatedEvent.description)
  //           )
  //       ).to.be.revertedWith("TimelockController: operation is not ready");
  //     });
  //   });
});
