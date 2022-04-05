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
  TokenFactory,
  TokenFactory__factory,
  VotesTokenWithSupply,
  VotesTokenWithSupply__factory,
  IMetaFactory__factory,
} from "../typechain-types";
import getInterfaceSelector from "./helpers/getInterfaceSelector";

describe("MetaFactory", () => {
  // Factories
  let daoFactory: DAOFactory;
  let govFactory: GovernorFactory;
  let treasuryFactory: TreasuryModuleFactory;
  let metaFactory: MetaFactory;
  let tokenFactory: TokenFactory;

  // Impl
  let accessControlImpl: AccessControl;
  let daoImpl: DAO;
  let govImpl: GovernorModule;
  let timelockImpl: TimelockUpgradeable;
  let treasuryImpl: TreasuryModule;
  let governanceToken: VotesTokenWithSupply;

  // Deployed contract addresses
  let daoAddress: string;
  let accessControlAddress: string;
  let timelockAddress: string;
  let governorAddress: string;
  let treasuryAddress: string;
  let tokenAddress: string;

  // Deployed contracts
  let accessControl: AccessControl;
  let dao: DAO;
  let govModule: GovernorModule;
  let treasuryModule: TreasuryModule;
  let timelock: TimelockUpgradeable;
  let token: VotesTokenWithSupply;

  // Wallets
  let deployer: SignerWithAddress;
  let upgrader: SignerWithAddress;
  let executor1: SignerWithAddress;
  let voterA: SignerWithAddress;
  let voterB: SignerWithAddress;
  let voterC: SignerWithAddress;

  let createTx: ContractTransaction;

  beforeEach(async () => {
    [deployer, executor1, voterA, voterB, voterC, upgrader] =
      await ethers.getSigners();

    // Deploy Impl Contracts
    daoImpl = await new DAO__factory(deployer).deploy();
    accessControlImpl = await new AccessControl__factory(deployer).deploy();
    // govImpl = await new GovernorModule__factory(deployer).deploy();
    // timelockImpl = await new TimelockUpgradeable__factory(deployer).deploy();
    treasuryImpl = await new TreasuryModule__factory(deployer).deploy();
    // Create a new ERC20Votes token to bring as the DAO governance token

    // Deploy Factory Impl
    daoFactory = await new DAOFactory__factory(deployer).deploy();
    govFactory = await new GovernorFactory__factory(deployer).deploy();
    treasuryFactory = await new TreasuryModuleFactory__factory(
      deployer
    ).deploy();
    tokenFactory = await new TokenFactory__factory(deployer).deploy();
    metaFactory = await new MetaFactory__factory(deployer).deploy();

    const abiCoder = new ethers.utils.AbiCoder();

    const createDAOParams = {
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

    const moduleFactoriesCalldata = [
      {
        factory: treasuryFactory.address,
        data: [abiCoder.encode(["address"], [treasuryImpl.address])],
        value: 0,
        newContractAddressesToPass: [1],
      },
      {
        factory: tokenFactory.address,
        data: [
          abiCoder.encode(["string"], ["DECENT"]),
          abiCoder.encode(["string"], ["DCNT"]),
          abiCoder.encode(["address[]"], [[]]),
          abiCoder.encode(["uint256[]"], [[]]),
          abiCoder.encode(["uint256"], [ethers.utils.parseUnits("1000", 18)]),
        ],
        value: 0,
        newContractAddressesToPass: [2],
      },
    ];

    const moduleActionCalldata = {
      contractIndexes: [2, 2, 2, 2, 2, 2],
      functionDescs: [
        "withdrawEth(address[],uint256[])",
        "depositERC20Tokens(address[],address[],uint256[])",
        "withdrawERC20Tokens(address[],address[],uint256[])",
        "depositERC721Tokens(address[],address[],uint256[])",
        "withdrawERC721Tokens(address[],address[],uint256[])",
        "upgradeTo(address)",
      ],
      roles: [
        ["WITHDRAWER_ROLE"],
        ["WITHDRAWER_ROLE"],
        ["WITHDRAWER_ROLE"],
        ["WITHDRAWER_ROLE"],
        ["WITHDRAWER_ROLE"],
        ["UPGRADE_ROLE"],
      ],
    };

    [daoAddress, accessControlAddress, treasuryAddress, tokenAddress] =
      await metaFactory.callStatic.createDAOAndModules(
        daoFactory.address,
        0,
        createDAOParams,
        moduleFactoriesCalldata,
        moduleActionCalldata
      );

    createTx = await metaFactory
      .connect(deployer)
      .createDAOAndModules(
        daoFactory.address,
        0,
        createDAOParams,
        moduleFactoriesCalldata,
        moduleActionCalldata
      );

    // eslint-disable-next-line camelcase
    dao = DAO__factory.connect(daoAddress, deployer);

    // eslint-disable-next-line camelcase
    accessControl = AccessControl__factory.connect(
      accessControlAddress,
      deployer
    );

    // eslint-disable-next-line camelcase
    treasuryModule = TreasuryModule__factory.connect(treasuryAddress, deployer);

    // eslint-disable-next-line camelcase
    token = VotesTokenWithSupply__factory.connect(tokenAddress, deployer);
  });

  it("Emitted the correct events", async () => {
    expect(createTx)
      .to.emit(metaFactory, "DAOAndModulesCreated")
      .withArgs(dao.address, accessControl.address, [
        treasuryModule.address,
        token.address,
      ]);

    expect(createTx)
      .to.emit(daoFactory, "DAOCreated")
      .withArgs(
        daoAddress,
        accessControlAddress,
        metaFactory.address,
        deployer.address
      );

    expect(createTx)
      .to.emit(treasuryFactory, "TreasuryCreated")
      .withArgs(treasuryModule.address, accessControl.address);
  });

  it("Setup the correct roles", async () => {
    expect(await accessControl.hasRole("DAO_ROLE", dao.address)).to.eq(true);

    expect(await accessControl.hasRole("DAO_ROLE", metaFactory.address)).to.eq(
      false
    );

    expect(
      await accessControl.hasRole("EXECUTE_ROLE", executor1.address)
    ).to.eq(true);

    expect(
      await accessControl.hasRole("EXECUTE_ROLE", metaFactory.address)
    ).to.eq(false);

    expect(await accessControl.hasRole("EXECUTE_ROLE", upgrader.address)).to.eq(
      false
    );

    expect(await accessControl.hasRole("UPGRADE_ROLE", upgrader.address)).to.eq(
      true
    );

    expect(
      await accessControl.hasRole("UPGRADE_ROLE", executor1.address)
    ).to.eq(false);
  });

  it("Setup the correct action authorization", async () => {
    // "execute(address[],uint256[],bytes[])",
    // "upgradeTo(address)",

    expect(
      await accessControl.isRoleAuthorized(
        "EXECUTE_ROLE",
        dao.address,
        "execute(address[],uint256[],bytes[])"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        dao.address,
        "execute(address[],uint256[],bytes[])"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "RANDOM_ROLE",
        dao.address,
        "execute(address[],uint256[],bytes[])"
      )
    ).to.eq(false);

    expect(
      await accessControl.isRoleAuthorized(
        "EXECUTE_ROLE",
        dao.address,
        "upgradeTo(address)"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "UPGRADE_ROLE",
        dao.address,
        "upgradeTo(address)"
      )
    ).to.eq(true);

    expect(
      await accessControl.isRoleAuthorized(
        "RANDOM_ROLE",
        dao.address,
        "upgradeTo(address)"
      )
    ).to.eq(false);
  });
});
