import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import {
  DAO__factory,
  DAO,
  DAOFactory,
  DAOFactory__factory,
  AccessControl,
  AccessControl__factory,
  MetaFactory__factory,
  MetaFactory,
  GovernorModule,
  GovernorModule__factory,
  GovernorFactory,
  GovernorFactory__factory,
  TreasuryModule,
  TreasuryModule__factory,
  TreasuryModuleFactory,
  TreasuryModuleFactory__factory,
  TimelockUpgradeable,
  TimelockUpgradeable__factory,
  VotesTokenWithSupply,
  VotesTokenWithSupply__factory,
  IMetaFactory__factory,
} from "../typechain";
import getInterfaceSelector from "./helpers/getInterfaceSelector";

describe.only("MetaFactory", () => {
  // Factories
  let daoFactory: DAOFactory;
  let govFactory: GovernorFactory;
  let treasuryFactory: TreasuryModuleFactory;
  let metaFactory: MetaFactory;

  // Impl
  let accessControlImpl: AccessControl;
  let daoImpl: DAO;
  let govImpl: GovernorModule;
  let timelockImpl: TimelockUpgradeable;
  let treasuryImpl: TreasuryModule;
  let governanceToken: VotesTokenWithSupply;

  // Deployed contracts(Proxy)
  let daoAddress: string;
  let accessControlAddress: string;
  let timelockAddress: string;
  let governorAddress: string;
  let treasuryAddress: string;
  let accessControl: AccessControl;
  let dao: DAO;
  let govModule: GovernorModule;
  let timelock: TimelockUpgradeable;
  let treasury: TreasuryModule;
  let createTx: ContractTransaction;

  // Wallets
  let deployer: SignerWithAddress;
  let upgrader: SignerWithAddress;
  let executor1: SignerWithAddress;
  let voterA: SignerWithAddress;
  let voterB: SignerWithAddress;
  let voterC: SignerWithAddress;

  // Calldata
  let daoCalldata: {
    daoImplementation: string;
    accessControlImplementation: string;
    daoName: string;
    roles: string[];
    rolesAdmins: string[];
    members: string[][];
    daoFunctionDescs: string[];
    daoActionRoles: string[][];
    moduleTargets: never[];
    moduleFunctionDescs: never[];
    moduleActionRoles: never[];
  };
  let govCalldata: {
    _govImpl: string;
    _token: string;
    _timelockImpl: string;
    _name: string;
    _initialVoteExtension: BigNumber;
    _initialVotingDelay: BigNumber;
    _initialVotingPeriod: BigNumber;
    _initialProposalThreshold: BigNumber;
    _initialQuorumNumeratorValue: BigNumber;
    _minDelay: BigNumber;
  };

  beforeEach(async () => {
    [deployer, executor1, voterA, voterB, voterC, upgrader] =
      await ethers.getSigners();

    // Deploy Impl Contracts
    daoImpl = await new DAO__factory(deployer).deploy();
    accessControlImpl = await new AccessControl__factory(deployer).deploy();
    govImpl = await new GovernorModule__factory(deployer).deploy();
    timelockImpl = await new TimelockUpgradeable__factory(deployer).deploy();
    treasuryImpl = await new TreasuryModule__factory(deployer).deploy();
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
      daoImpl.address
    );

    // Deploy Factory Impl
    daoFactory = await new DAOFactory__factory(deployer).deploy();
    govFactory = await new GovernorFactory__factory(deployer).deploy();
    treasuryFactory = await new TreasuryModuleFactory__factory(
      deployer
    ).deploy();
    metaFactory = await new MetaFactory__factory(deployer).deploy();

    daoCalldata = {
      daoImplementation: daoImpl.address,
      accessControlImplementation: accessControlImpl.address,
      daoName: "TestDao",
      roles: ["EXECUTE_ROLE", "UPGRADE_ROLE"],
      rolesAdmins: ["DAO_ROLE", "DAO_ROLE"],
      members: [[executor1.address], [upgrader.address]],
      daoFunctionDescs: [
        "execute(address[],uint256[],bytes[])",
        "upgradeTo(address)",
      ],
      daoActionRoles: [["EXECUTE_ROLE"], ["EXECUTE_ROLE", "UPGRADE_ROLE"]],
      moduleTargets: [],
      moduleFunctionDescs: [],
      moduleActionRoles: [],
    };

    govCalldata = {
      _govImpl: govImpl.address,
      _token: governanceToken.address,
      _timelockImpl: timelockImpl.address,
      _name: "TestGov",
      _initialVoteExtension: BigNumber.from("0"),
      _initialVotingDelay: BigNumber.from("1"),
      _initialVotingPeriod: BigNumber.from("5"),
      _initialProposalThreshold: BigNumber.from("0"),
      _initialQuorumNumeratorValue: BigNumber.from("4"),
      _minDelay: BigNumber.from("1"),
    };
  });

  beforeEach(async () => {
    [
      daoAddress,
      accessControlAddress,
      timelockAddress,
      governorAddress,
      treasuryAddress,
    ] = await metaFactory.callStatic.createDAOAndModules(
      daoFactory.address,
      govFactory.address,
      treasuryFactory.address,
      treasuryImpl.address,
      daoCalldata,
      govCalldata
    );

    createTx = await metaFactory.createDAOAndModules(
      daoFactory.address,
      govFactory.address,
      treasuryFactory.address,
      treasuryImpl.address,
      daoCalldata,
      govCalldata
    );

    // eslint-disable-next-line camelcase
    govModule = GovernorModule__factory.connect(governorAddress, deployer);

    // eslint-disable-next-line camelcase
    timelock = TimelockUpgradeable__factory.connect(timelockAddress, deployer);

    // eslint-disable-next-line camelcase
    accessControl = AccessControl__factory.connect(
      accessControlAddress,
      deployer
    );

    // eslint-disable-next-line camelcase
    treasury = TreasuryModule__factory.connect(treasuryAddress, deployer);

    // eslint-disable-next-line camelcase
    dao = DAO__factory.connect(daoAddress, deployer);
  });

  it("emits an event with the new DAO's address", async () => {
    expect(createTx)
      .to.emit(daoFactory, "DAOCreated")
      .withArgs(
        daoAddress,
        accessControlAddress,
        metaFactory.address,
        deployer.address
      );
  });

  it("emits an event with the new Gov's address", async () => {
    expect(createTx)
      .to.emit(govFactory, "GovernorCreated")
      .withArgs(timelockAddress, governorAddress);
  });

  it("emits an event with the new treasury's address", async () => {
    expect(createTx)
      .to.emit(treasuryFactory, "TreasuryCreated")
      .withArgs(treasuryAddress, accessControlAddress);
  });

  it("Creates a DAO and AccessControl Contract", async () => {
    // eslint-disable-next-line no-unused-expressions
    expect(daoAddress).to.be.properAddress;
    // eslint-disable-next-line no-unused-expressions
    expect(accessControlAddress).to.be.properAddress;
  });

  it("Base Init for DAO", async () => {
    expect(await dao.accessControl()).to.eq(accessControlAddress);
    expect(await dao.name()).to.eq("TestDao");
  });

  it("Base Init for Access Control", async () => {
    expect(
      await accessControl.hasRole(await accessControl.DAO_ROLE(), daoAddress)
    ).to.eq(true);
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
    // Supports DAO Factory interface
    expect(
      await metaFactory.supportsInterface(
        // eslint-disable-next-line camelcase
        getInterfaceSelector(IMetaFactory__factory.createInterface())
      )
    ).to.eq(true);
    // Supports ERC-165 interface
    expect(await govFactory.supportsInterface("0x01ffc9a7")).to.eq(true);
  });

  it("Executor Role is set", async () => {
    expect(
      await accessControl.hasRole("EXECUTE_ROLE", executor1.address)
    ).to.eq(true);
    expect(await accessControl.getRoleAdmin("EXECUTE_ROLE")).to.eq("DAO_ROLE");
  });

  it("Upgrade Role is set", async () => {
    expect(await accessControl.hasRole("UPGRADE_ROLE", upgrader.address)).to.eq(
      true
    );
    expect(await accessControl.getRoleAdmin("UPGRADE_ROLE")).to.eq("DAO_ROLE");
  });

  it("Should setup Actions", async () => {
    expect(
      await accessControl.getActionRoles(
        daoAddress,
        "execute(address[],uint256[],bytes[])"
      )
    ).to.deep.eq(["EXECUTE_ROLE"]);

    expect(
      await accessControl.getActionRoles(daoAddress, "upgradeTo(address)")
    ).to.deep.eq(["EXECUTE_ROLE", "UPGRADE_ROLE"]);
  });
});
