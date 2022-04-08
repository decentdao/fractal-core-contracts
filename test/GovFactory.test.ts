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
  IModuleFactory__factory,
} from "../typechain-types";
import chai from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, ContractTransaction } from "ethers";
import getInterfaceSelector from "./helpers/getInterfaceSelector";
import {
  VoteType,
  delegateTokens,
  govModPropose,
} from "./helpers/governorModuleHelpers";

const expect = chai.expect;

describe("Gov Module Factory", function () {
  let deployer: SignerWithAddress;
  let voterA: SignerWithAddress;
  let voterB: SignerWithAddress;
  let voterC: SignerWithAddress;
  let executor1: SignerWithAddress;
  let executor2: SignerWithAddress;

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
  let accessControl: AccessControl;
  let dao: DAO;

  const abiCoder = new ethers.utils.AbiCoder();

  beforeEach(async function () {
    [deployer, voterA, voterB, voterC, executor1, executor2] =
      await ethers.getSigners();

    daoFactory = await new DAOFactory__factory(deployer).deploy();
    daoImpl = await new DAO__factory(deployer).deploy();
    accessControlImpl = await new AccessControl__factory(deployer).deploy();
    [daoAddress, accessControlAddress] = await daoFactory.callStatic.createDAO(
      deployer.address,
      {
        daoImplementation: daoImpl.address,
        accessControlImplementation: accessControlImpl.address,
        daoName: "TestDao",
        roles: ["EXECUTE_ROLE"],
        rolesAdmins: ["DAO_ROLE"],
        members: [[executor1.address, executor2.address]],
        daoFunctionDescs: ["execute(address[],uint256[],bytes[])"],
        daoActionRoles: [["EXECUTE_ROLE"]],
      }
    );
    createDAOTx = await daoFactory.createDAO(deployer.address, {
      daoImplementation: daoImpl.address,
      accessControlImplementation: accessControlImpl.address,
      daoName: "TestDao",
      roles: ["EXECUTE_ROLE"],
      rolesAdmins: ["DAO_ROLE"],
      members: [[executor1.address, executor2.address]],
      daoFunctionDescs: ["execute(address[],uint256[],bytes[])"],
      daoActionRoles: [["EXECUTE_ROLE"]],
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
    // eslint-disable-next-line camelcase
    accessControl = AccessControl__factory.connect(
      accessControlAddress,
      deployer
    );
    // eslint-disable-next-line camelcase
    dao = DAO__factory.connect(daoAddress, deployer);
  });

  describe("Init Gov + timelock", function () {
    beforeEach(async function () {
      // Gov Module
      govModuleImpl = await new GovernorModule__factory(deployer).deploy();
      // Create a timelock contract
      timelockImpl = await new TimelockUpgradeable__factory(deployer).deploy();
      govFactory = await new GovernorFactory__factory(deployer).deploy();

      const govCalldata = [
        abiCoder.encode(["address"], [daoAddress]),
        abiCoder.encode(["address"], [accessControlAddress]),
        abiCoder.encode(["address"], [governanceToken.address]),
        abiCoder.encode(["address"], [govModuleImpl.address]),
        abiCoder.encode(["address"], [timelockImpl.address]),
        abiCoder.encode(["string"], ["TestGov"]),
        abiCoder.encode(["uint64"], [BigNumber.from("0")]),
        abiCoder.encode(["uint256"], [BigNumber.from("1")]),
        abiCoder.encode(["uint256"], [BigNumber.from("5")]),
        abiCoder.encode(["uint256"], [BigNumber.from("0")]),
        abiCoder.encode(["uint256"], [BigNumber.from("4")]),
        abiCoder.encode(["uint256"], [BigNumber.from("1")]),
      ];

      [governorModuleAddress, timelockAddress] =
        await govFactory.callStatic.create(govCalldata);
      createGovTx = await govFactory.create(govCalldata);
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
        .withArgs(
          daoAddress,
          accessControlAddress,
          deployer.address,
          deployer.address
        );
    });

    it("emits an event with the new Gov's address", async () => {
      expect(createGovTx)
        .to.emit(govFactory, "GovernorCreated")
        .withArgs(governorModuleAddress, timelockAddress);
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

    it("Supports the expected ERC165 interface", async () => {
      // Supports Module Factory interface
      expect(
        await govFactory.supportsInterface(
          // eslint-disable-next-line camelcase
          getInterfaceSelector(IModuleFactory__factory.createInterface())
        )
      ).to.eq(true);
      // Supports ERC-165 interface
      expect(await govFactory.supportsInterface("0x01ffc9a7")).to.eq(true);
    });
  });

  describe("Execution", function () {
    beforeEach(async function () {
      // Gov Module
      govModuleImpl = await new GovernorModule__factory(deployer).deploy();
      // Create a timelock contract
      timelockImpl = await new TimelockUpgradeable__factory(deployer).deploy();
      govFactory = await new GovernorFactory__factory(deployer).deploy();

      const govCalldata = [
        abiCoder.encode(["address"], [daoAddress]),
        abiCoder.encode(["address"], [accessControlAddress]),
        abiCoder.encode(["address"], [governanceToken.address]),
        abiCoder.encode(["address"], [govModuleImpl.address]),
        abiCoder.encode(["address"], [timelockImpl.address]),
        abiCoder.encode(["string"], ["TestGov"]),
        abiCoder.encode(["uint64"], [BigNumber.from("0")]),
        abiCoder.encode(["uint256"], [BigNumber.from("1")]),
        abiCoder.encode(["uint256"], [BigNumber.from("5")]),
        abiCoder.encode(["uint256"], [BigNumber.from("0")]),
        abiCoder.encode(["uint256"], [BigNumber.from("4")]),
        abiCoder.encode(["uint256"], [BigNumber.from("1")]),
      ];

      [governorModuleAddress, timelockAddress] =
        await govFactory.callStatic.create(govCalldata);
      createGovTx = await govFactory.create(govCalldata);
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

      const transferCallDataRoles = accessControl.interface.encodeFunctionData(
        "grantRolesAndAdmins",
        [
          ["GOV_ROLE", "EXECUTE_ROLE", "UPGRADE_ROLE"],
          ["DAO_ROLE", "DAO_ROLE", "DAO_ROLE"],
          [[govModule.address], [timelock.address], [dao.address]],
        ]
      );
      await dao
        .connect(executor1)
        .execute([accessControl.address], [0], [transferCallDataRoles]);

      const transferCallDataActions =
        accessControl.interface.encodeFunctionData("addActionsRoles", [
          [
            timelock.address,
            timelock.address,
            timelock.address,
            timelock.address,
            govModule.address,
            timelock.address,
          ],
          [
            "updateDelay(uint256)",
            "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)",
            "cancel(bytes32)",
            "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)",
            "upgradeTo(address)",
            "upgradeTo(address)",
          ],
          [
            ["GOV_ROLE"],
            ["GOV_ROLE"],
            ["GOV_ROLE"],
            ["GOV_ROLE"],
            ["UPGRADE_ROLE"],
            ["UPGRADE_ROLE"],
          ],
        ]);
      await dao
        .connect(executor1)
        .execute([accessControl.address], [0], [transferCallDataActions]);
      await delegateTokens(governanceToken, [voterA, voterB]);
    });

    it("Should setup Roles", async () => {
      expect(await accessControl.hasRole("UPGRADE_ROLE", dao.address)).to.eq(
        true
      );
      expect(await accessControl.hasRole("GOV_ROLE", govModule.address)).to.eq(
        true
      );
    });

    it("Should setup Actions", async () => {
      expect(
        await accessControl.getActionRoles(
          timelock.address,
          "updateDelay(uint256)"
        )
      ).to.deep.eq(["GOV_ROLE"]);
      expect(
        await accessControl.getActionRoles(
          timelock.address,
          "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)"
        )
      ).to.deep.eq(["GOV_ROLE"]);
      expect(
        await accessControl.getActionRoles(timelock.address, "cancel(bytes32)")
      ).to.deep.eq(["GOV_ROLE"]);
      expect(
        await accessControl.getActionRoles(
          timelock.address,
          "executeBatch(address[],uint256[],bytes[],bytes32,bytes32)"
        )
      ).to.deep.eq(["GOV_ROLE"]);
      expect(
        await accessControl.getActionRoles(
          timelock.address,
          "upgradeTo(address)"
        )
      ).to.deep.eq(["UPGRADE_ROLE"]);
      expect(
        await accessControl.getActionRoles(
          govModule.address,
          "upgradeTo(address)"
        )
      ).to.deep.eq(["UPGRADE_ROLE"]);
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

      expect(await governanceToken.balanceOf(daoAddress)).to.eq(
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

      expect(await governanceToken.balanceOf(daoAddress)).to.eq(
        ethers.utils.parseUnits("700.0", 18)
      );
    });

    it("Should revert if non Gov tries to execute", async () => {
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

      await expect(
        timelock
          .connect(executor1)
          .executeBatch(
            proposalCreatedEvent.targets,
            proposalCreatedEvent._values,
            proposalCreatedEvent.calldatas,
            ethers.utils.id("0"),
            ethers.utils.id("0")
          )
      ).to.revertedWith("NotAuthorized()");
      await govModule
        .connect(voterA)
        .execute(
          proposalCreatedEvent.targets,
          proposalCreatedEvent._values,
          proposalCreatedEvent.calldatas,
          ethers.utils.id(proposalCreatedEvent.description)
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

    it("Revert non Gov schedules transaction", async () => {
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
        timelock
          .connect(executor1)
          .scheduleBatch(
            proposalCreatedEvent.targets,
            proposalCreatedEvent._values,
            proposalCreatedEvent.calldatas,
            ethers.utils.id("0"),
            ethers.utils.id(proposalCreatedEvent.description),
            0
          )
      ).to.revertedWith("NotAuthorized()");
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

    it("Should upgrade the timelock contract", async () => {
      const timelock2 = await new TimelockUpgradeable__factory(
        deployer
      ).deploy();

      const transferCallData = timelock.interface.encodeFunctionData(
        "upgradeTo",
        [timelock2.address]
      );

      const proposalCreatedEvent = await govModPropose(
        [timelock.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallData],
        "upgradeTo new timelock"
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

      expect(await govModule.timelock()).to.eq(timelock.address);

      await expect(
        govModule
          .connect(voterA)
          .execute(
            proposalCreatedEvent.targets,
            proposalCreatedEvent._values,
            proposalCreatedEvent.calldatas,
            ethers.utils.id(proposalCreatedEvent.description)
          )
      )
        .to.emit(timelock, "Upgraded")
        .withArgs(timelock2.address);

      expect(await govModule.timelock()).to.eq(timelock.address);
    });

    it("Should upgrade the timelock contract", async () => {
      const govModule2 = await new GovernorModule__factory(deployer).deploy();

      const transferCallData = govModule.interface.encodeFunctionData(
        "upgradeTo",
        [govModule2.address]
      );

      const proposalCreatedEvent = await govModPropose(
        [govModule.address],
        [BigNumber.from("0")],
        govModule,
        voterA,
        [transferCallData],
        "upgradeTo new GovModule"
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

      await expect(
        govModule
          .connect(voterA)
          .execute(
            proposalCreatedEvent.targets,
            proposalCreatedEvent._values,
            proposalCreatedEvent.calldatas,
            ethers.utils.id(proposalCreatedEvent.description)
          )
      )
        .to.emit(govModule, "Upgraded")
        .withArgs(govModule2.address);
    });
  });
});
